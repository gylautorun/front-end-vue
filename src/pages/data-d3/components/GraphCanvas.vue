<!--
    GraphCanvas - D3 树形图渲染画布
    ========================================================================

    职责：
      - 初始化 D3 SVG 容器（#graph-container）
      - 暴露工具栏（缩放、适应、清除选择）
      - 处理节点点击（emit select-node） / 双击（emit toggle-select）
      - 处理 more-btn 点击 → 弹出 Teleport 右键菜单
      - 监听 treeData 变化自动重渲染

    右键菜单实现（关键）：
      使用 <teleport to="body"> + position:fixed 手动控制菜单位置
      （避开 a-popover 必须有 trigger 元素导致 0x0 尺寸问题）

    ========================================================================
-->
<template>
    <div class="graph-area" ref="graphContainer">
        <!-- 工具栏（直接调用本组件方法，不通过 emit 循环依赖） -->
        <!-- @mousedown.stop 阻止 d3.zoom 捕获工具栏的 mousedown 事件 -->
        <div class="toolbar" @mousedown.stop @click.stop>
            <button @click="handleZoomOut" title="缩小">➖</button>
            <button @click="handleZoomIn" title="放大">➕</button>
            <button @click="handleResetZoom" title="重置缩放">🔍 100%</button>
            <button @click="handleFitView" title="适应屏幕">🎯 适应</button>
            <button
                @click="handleToggleLayout"
                :title="
                    layoutOrientation === 'horizontal'
                        ? '切换为上下布局（纵向）'
                        : '切换为左右布局（横向）'
                "
            >
                {{ layoutOrientation === 'horizontal' ? '↕️ 纵向' : '↔️ 横向' }}
            </button>
            <button @click="handleUndo" :disabled="!canUndo" title="上一步（撤销）">↩️</button>
            <button @click="handleRedo" :disabled="!canRedo" title="下一步（重做）">↪️</button>
            <button @click="handleRefresh" title="刷新（恢复初始状态）">🔄</button>
            <button @click="handleDownload" title="下载图片">📥 下载</button>
            <button v-if="selectedCount > 0" @click="handleClearSelection" title="清除选择">
                ✖️ 清除选择 ({{ selectedCount }})
            </button>
        </div>
        <div id="graph-container"></div>

        <!-- 右键菜单 Teleport 到 body，完全手动控制位置 -->
        <teleport to="body">
            <div
                v-if="contextMenuOpen"
                class="context-menu context-menu-portal"
                :style="{
                    position: 'fixed',
                    left: contextMenuX + 'px',
                    top: contextMenuY + 'px',
                    zIndex: 2000
                }"
                @click.stop
            >
                <div class="menu-item" @click="handleMenuClick('show-add-node-modal')">
                    ➕ 新增子节点
                </div>
                <div class="menu-item" @click="handleMenuClick('show-add-module-modal')">
                    📦 新增模块
                </div>
                <div class="menu-item" @click="handleMenuClick('show-bind-relation-modal')">
                    🔗 绑定关系
                </div>
                <div class="menu-item" @click="handleMenuClick('show-edit-node-modal')">
                    ✏️ 编辑属性
                </div>
                <div class="menu-item" @click="handleMenuClick('show-integration-modal')">
                    🏷️ 标注整合方式
                </div>
                <div class="menu-divider"></div>
                <div class="menu-item" @click="handleMenuClick('show-resize-modal')">
                    📐 调整节点尺寸
                </div>
                <div class="menu-item danger" @click="handleMenuClick('delete-node')">
                    🗑️ 删除节点
                </div>
            </div>
        </teleport>

        <!-- 调整节点尺寸模态框 -->
        <div
            class="modal-overlay"
            :class="{ show: showResizeModal }"
            @click.self="showResizeModal = false"
        >
            <div class="modal resize-modal">
                <h3>📐 调整节点尺寸</h3>
                <div class="form-group">
                    <label>宽度（像素）</label>
                    <input type="number" v-model.number="resizeWidth" min="50" max="500" />
                </div>
                <div class="form-group">
                    <label>高度（像素）</label>
                    <input type="number" v-model.number="resizeHeight" min="20" max="300" />
                </div>
                <div class="modal-actions">
                    <button @click="showResizeModal = false">取消</button>
                    <button @click="handleResizeNode">确定</button>
                </div>
            </div>
        </div>

        <!-- 下载格式选择模态框 -->
        <div
            class="modal-overlay"
            :class="{ show: showDownloadModal }"
            @click.self="showDownloadModal = false"
        >
            <div class="modal download-modal">
                <h3>📥 选择下载格式</h3>

                <!-- 文件名输入 -->
                <div class="form-group">
                    <label>文件名称</label>
                    <input type="text" v-model="downloadFileName" placeholder="请输入文件名" />
                </div>

                <div class="download-options">
                    <div class="download-option" @click="selectDownloadFormat('png')">
                        <div class="option-icon">🖼️</div>
                        <div class="option-info">
                            <div class="option-title">PNG 图片</div>
                            <div class="option-desc">适合分享和打印</div>
                        </div>
                    </div>
                    <div class="download-option" @click="selectDownloadFormat('svg')">
                        <div class="option-icon">📐</div>
                        <div class="option-info">
                            <div class="option-title">SVG 矢量图</div>
                            <div class="option-desc">适合编辑和缩放</div>
                        </div>
                    </div>
                </div>
                <div class="modal-actions">
                    <button @click="showDownloadModal = false">取消</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { cloneDeep } from 'lodash-es';
import type { TreeData, SelectedNode } from '../types';
import { D3TreeGraph, setDepthNodeDimensions } from '@/lib/d3-tree-sdk';
import type { TreeLayoutOrientation } from '@/lib/d3-tree-sdk';

/**
 * 父组件传入的属性（只读）
 * ----------------------------------------------------------------------------
 * @property {TreeData}        treeData       - 当前要渲染的完整树数据
 * @property {SelectedNode[]}  selectedNodes  - 已被多选选中的节点列表（用于节点高亮）
 * @property {number}          selectedCount  - 已选节点数量（用于显示 "已选 N 项"）
 */
const props = defineProps<{
    treeData: TreeData;
    /** 数据结构 schema，通过参数传入 SDK（fields / selection / styles / rootId） */
    schema: import('@/lib/d3-tree-sdk').TreeConfigInput;
    selectedNodes: SelectedNode[];
    selectedCount: number;
}>();

/**
 * 父组件监听的自定义事件列表
 * ----------------------------------------------------------------------------
 * @event zoom-in                  用户点击 ➕ 放大按钮
 * @event zoom-out                 用户点击 ➖ 缩小按钮
 * @event fit-view                 用户点击 🎯 适应屏幕按钮
 * @event clear-selection          用户点击 ✖️ 清除选择
 * @event select-node              单击节点（打开 Drawer 详情）
 * @event toggle-select            双击节点（加入/移除多选）
 * @event show-context-menu        请求父组件显示右键菜单
 * @event show-add-node-modal      请求打开"新增子节点"模态框
 * @event show-add-module-modal    请求打开"新增模块"模态框
 * @event show-bind-relation-modal 请求打开"绑定关系"模态框
 * @event show-edit-node-modal     请求打开"编辑属性"模态框
 * @event show-integration-modal   请求打开"标注整合方式"模态框
 * @event delete-node              请求删除当前节点
 */
const emit = defineEmits<{
    (e: 'zoom-in'): void;
    (e: 'zoom-out'): void;
    (e: 'fit-view'): void;
    (e: 'clear-selection'): void;
    (e: 'select-node', data: TreeData): void;
    (e: 'toggle-select', data: TreeData): void;
    (e: 'show-context-menu', event: MouseEvent, nodeId: string): void;
    (e: 'show-add-node-modal', nodeId: string): void;
    (e: 'show-add-module-modal', nodeId: string): void;
    (e: 'show-bind-relation-modal', nodeId: string): void;
    (e: 'show-edit-node-modal', nodeId: string): void;
    (e: 'show-integration-modal', nodeId: string): void;
    (e: 'delete-node', nodeId: string): void;
    /**
     * 拖拽到同级节点时触发
     * @param sourceId 源节点 ID
     * @param targetId 目标节点 ID
     * @param sourceData 源节点 TreeData
     * @param targetData 目标节点 TreeData
     */
    (
        e: 'drop-to-target',
        sourceId: string,
        targetId: string,
        sourceData: TreeData,
        targetData: TreeData
    ): void;
    /**
     * 撤销操作
     * @param data 上一个状态的树数据
     */
    (e: 'undo', data: TreeData): void;
    /**
     * 重做操作
     * @param data 下一个状态的树数据
     */
    (e: 'redo', data: TreeData): void;
    /**
     * 刷新（恢复初始状态）
     * @param data 初始状态的树数据
     */
    (e: 'refresh', data: TreeData): void;
}>();

/** D3TreeGraph SDK 实例 */
let graph: D3TreeGraph | null = null;

/** 树布局方向：horizontal 左右 / vertical 上下 */
const layoutOrientation = ref<TreeLayoutOrientation>('horizontal');

/** 初始数据备份（用于刷新恢复） */
const initialTreeData = ref<TreeData | null>(null);

/** 是否可以撤销 */
const canUndo = ref<boolean>(false);

/** 是否可以重做 */
const canRedo = ref<boolean>(false);

// ---------- 右键菜单状态 ----------

/** 右键菜单是否打开（控制 Teleport 后菜单的 v-if 渲染） */
const contextMenuOpen = ref<boolean>(false);

/** 右键菜单 X 坐标（鼠标 clientX，用于 position: fixed 定位） */
const contextMenuX = ref<number>(0);

/** 右键菜单 Y 坐标（鼠标 clientY，用于 position: fixed 定位） */
const contextMenuY = ref<number>(0);

// ---------- 下载模态框状态 ----------

/** 下载格式选择模态框是否打开 */
const showDownloadModal = ref<boolean>(false);

/** 下载文件名（有默认值，可修改） */
const downloadFileName = ref<string>('tree-diagram');

/** 当前触发右键菜单的节点 ID（用于后续 emit 时传递给父组件） */
const contextMenuNodeId = ref<string>('');

// ---------- 调整节点尺寸模态框状态 ----------

/** 调整节点尺寸模态框是否打开 */
const showResizeModal = ref<boolean>(false);

/** 调整尺寸的宽度 */
const resizeWidth = ref<number>(200);

/** 调整尺寸的高度 */
const resizeHeight = ref<number>(50);

/**
 * 处理菜单项点击事件
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 先关闭菜单（contextMenuOpen = false）
 *   2. 通过 emit 把事件名和节点 ID 转发给父组件
 *
 * @param {string} event 事件名（对应 emit 中的事件）
 */
function handleMenuClick(event: string) {
    contextMenuOpen.value = false;
    const nodeId = contextMenuNodeId.value;
    const emitMap: Record<string, (id: string) => void> = {
        'show-add-node-modal': (id) => emit('show-add-node-modal', id),
        'show-add-module-modal': (id) => emit('show-add-module-modal', id),
        'show-bind-relation-modal': (id) => emit('show-bind-relation-modal', id),
        'show-edit-node-modal': (id) => emit('show-edit-node-modal', id),
        'show-integration-modal': (id) => emit('show-integration-modal', id),
        'delete-node': (id) => emit('delete-node', id),
        'show-resize-modal': (id) => {
            // 打开调整节点尺寸模态框
            showResizeModal.value = true;
        }
    };
    if (emitMap[event]) {
        emitMap[event](nodeId);
    }
}

/**
 * 打开右键菜单
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 获取节点 DOM 元素位置
 *   2. 计算边界位置（确保菜单在视口内）
 *   3. 记录当前节点 ID
 *   4. 设置 contextMenuOpen = true，触发 Teleport 菜单显示
 *
 * @param {MouseEvent} event 鼠标点击事件
 * @param {string}     nodeId 触发菜单的节点 ID
 */
function openContextMenu(event: MouseEvent, nodeId: string) {
    // 获取节点 DOM 元素（通过 data-id 属性查找）
    const nodeEl = document.querySelector(`[data-id="${nodeId}"]`);
    const menuWidth = 180; // 菜单宽度
    const menuHeight = 200; // 菜单高度估计值

    if (nodeEl) {
        // 获取节点元素在视口中的位置
        const rect = nodeEl.getBoundingClientRect();
        // 计算菜单位置（显示在节点下方居中）
        let x = rect.left + rect.width / 2 - menuWidth / 2;
        let y = rect.bottom + 8;

        // 边界检测：确保菜单不会超出浏览器窗口
        x = Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8));
        // 如果下方空间不够，显示在节点上方
        if (y + menuHeight > window.innerHeight - 8) {
            y = rect.top - menuHeight - 8;
        }
        y = Math.max(8, y);

        contextMenuX.value = x;
        contextMenuY.value = y;
    } else {
        // fallback：使用事件坐标
        let x = event.clientX;
        let y = event.clientY;

        // 边界检测
        x = Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8));
        y = Math.max(8, Math.min(y, window.innerHeight - menuHeight - 8));

        contextMenuX.value = x;
        contextMenuY.value = y;
    }
    contextMenuNodeId.value = nodeId;
    contextMenuOpen.value = true;
}

/**
 * 更新右键菜单位置到指定节点的位置
 * ----------------------------------------------------------------------------
 * 当画布缩放/平移后，调用此函数将菜单移动到节点的新位置
 *
 * @param {string} nodeId 节点 ID
 */
function updateContextMenuPosition(nodeId: string) {
    const nodeEl = document.querySelector(`[data-id="${nodeId}"]`);
    const menuWidth = 180;
    const menuHeight = 200;

    if (nodeEl) {
        const rect = nodeEl.getBoundingClientRect();
        let x = rect.left + rect.width / 2 - menuWidth / 2;
        let y = rect.bottom + 8;

        // 边界检测
        x = Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8));
        if (y + menuHeight > window.innerHeight - 8) {
            y = rect.top - menuHeight - 8;
        }
        y = Math.max(8, y);

        contextMenuX.value = x;
        contextMenuY.value = y;
    }
}

/**
 * 关闭右键菜单
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 设置 contextMenuOpen = false
 *   2. Teleport 菜单自动从 body 卸载
 */
function closeContextMenu() {
    contextMenuOpen.value = false;
}

/**
 * 节点单击事件处理
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 把节点数据转发给父组件（父组件决定是否打开 Drawer）
 *
 * @param {TreeData} data 节点数据
 */
function handleNodeClick(data: TreeData) {
    emit('select-node', data);
}

/**
 * 节点双击事件处理（多选切换）
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 通知父组件切换节点的选中状态（加入或移出 selectedNodes）
 *
 * @param {TreeData} data 节点数据
 */
function handleNodeDoubleClick(data: TreeData) {
    emit('toggle-select', data);
}

/**
 * 节点 "⋮" 更多按钮点击事件处理
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 阻止事件冒泡到 SVG（避免触发 SVG 的 click 关闭菜单）
 *   2. 阻止浏览器默认行为
 *   3. 调用 openContextMenu 在鼠标位置显示右键菜单
 *
 * @param {MouseEvent} event 鼠标事件
 * @param {string}     nodeId 节点 ID
 */
function handleMoreClick(event: MouseEvent, nodeId: string) {
    // 阻止事件冒泡到 SVG（避免触发 SVG 的 click 关闭菜单）
    event.stopPropagation();
    event.preventDefault();
    // event 可能是 SVG 事件，需要转为客户端坐标
    const mouseEvent = event as MouseEvent;
    openContextMenu(mouseEvent, nodeId);
}

/**
 * 监听 D3 SVG 点击事件
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. d3Tree.ts 在 svg.click 时派发 'd3-svg-click' 事件
 *   2. 这里监听后调用 closeContextMenu 关闭菜单
 */
function handleSvgClick() {
    closeContextMenu();
}

/**
 * 处理调整节点尺寸
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 获取当前数据并查找节点
 *   2. 获取节点深度（depth）
 *   3. 使用 setDepthNodeDimensions 设置该深度的节点尺寸
 *   4. 重新渲染树
 *   5. 关闭模态框
 */
function handleResizeNode() {
    const nodeId = contextMenuNodeId.value;
    if (!nodeId || !graph) return;

    // 获取当前数据
    const data = graph.getData();

    // 递归查找节点并计算深度
    function findNodeWithDepth(node: any, currentDepth = 0): { node: any; depth: number } | null {
        if (node.id === nodeId) return { node, depth: currentDepth };
        if (node.children) {
            for (const child of node.children) {
                const found = findNodeWithDepth(child, currentDepth + 1);
                if (found) return found;
            }
        }
        return null;
    }

    // 获取节点数据和深度
    const result = findNodeWithDepth(data);
    if (!result) return;

    const { depth } = result;

    // 设置该深度的节点尺寸
    setDepthNodeDimensions(depth, resizeWidth.value, resizeHeight.value);

    // 重新渲染树
    graph.render();

    // 关闭模态框
    showResizeModal.value = false;
}

/**
 * 组件挂载时初始化 D3 树并注册全局事件监听
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 监听 'd3-svg-click' 自定义事件（点击 SVG 关闭菜单）
 *   2. 监听 document click（点击页面其他位置关闭菜单）
 *   3. 调用 initD3 初始化 D3 树（创建 SVG + 布局 + 节点）
 *   4. 启动窗口 resize 监听 → handleResize
 */
watch(
    () => props.selectedNodes,
    (val) => {
        graph?.setSelectedNodes(val);
    },
    { deep: true }
);

// 保存 unsubscribe 函数以便清理
let unsubscribeZoom: (() => void) | null = null;

onMounted(() => {
    document.addEventListener('d3-svg-click', handleSvgClick);
    document.addEventListener('click', handleGlobalClick);

    initialTreeData.value = cloneDeep(props.treeData);

    graph = new D3TreeGraph({
        container: 'graph-container',
        data: props.treeData,
        schema: props.schema
    });

    graph.on('node:click', handleNodeClick);
    graph.on('node:dblclick', handleNodeDoubleClick);
    graph.on('node:more', ({ event, nodeId }) => handleMoreClick(event, nodeId));
    graph.on('node:drop-target', (payload) => {
        emit(
            'drop-to-target',
            payload.sourceId,
            payload.targetId,
            payload.sourceData,
            payload.targetData
        );
    });
    graph.on('history:change', (state) => {
        canUndo.value = state.canUndo;
        canRedo.value = state.canRedo;
    });

    // 监听画布缩放/平移事件，当菜单打开时更新菜单位置
    unsubscribeZoom = graph.onZoom(() => {
        if (contextMenuOpen.value && contextMenuNodeId.value) {
            updateContextMenuPosition(contextMenuNodeId.value);
        }
    });

    graph.mount();
    graph.recordHistory();
    layoutOrientation.value = graph.getOrientation();
});

/**
 * 组件卸载时清理所有全局监听器，避免内存泄漏
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 移除 'd3-svg-click' 监听
 *   2. 移除全局 click 监听
 *   3. 移除 zoom 监听
 *   4. 销毁 graph 实例
 */
onBeforeUnmount(() => {
    document.removeEventListener('d3-svg-click', handleSvgClick);
    document.removeEventListener('click', handleGlobalClick);
    unsubscribeZoom?.();
    graph?.destroy();
    graph = null;
});

/**
 * 全局点击事件处理：点击页面非菜单区域时关闭右键菜单
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 检查菜单当前是否打开
 *   2. 如果打开则关闭
 *
 * 注意：菜单内部 @click.stop 阻止冒泡，所以点击菜单项不会触发这里
 */
function handleGlobalClick() {
    if (contextMenuOpen.value) {
        contextMenuOpen.value = false;
    }
}

/**
 * 窗口尺寸变化时调整 SVG 尺寸
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 获取 #graph-container 当前尺寸
 *   2. 更新 SVG 的 width / height
 *
 * 注：当前 initD3 中已使用 100% 自适应，此函数作为额外保险
 */
function handleUndo() {
    if (!graph?.undo()) return;
    emit('undo', graph.getData());
}

function handleRedo() {
    if (!graph?.redo()) return;
    emit('redo', graph.getData());
}

function handleRefresh() {
    if (!initialTreeData.value || !graph) return;
    graph.resetToInitialData(initialTreeData.value);
    emit('refresh', graph.getData());
}

function recordOperation(data: TreeData) {
    graph?.setData(data, { recordHistory: false });
    graph?.recordHistory();
}

/**
 * 放大按钮处理：调用 d3.zoom.scaleBy 放大 1.25 倍
 * ----------------------------------------------------------------------------
 * 关键修复：传入 d3Instance.zoom，确保使用已绑定的 zoom 行为
 *           （新创建 zoom 实例会导致 transition.call 时拿不到 __zoom）
 *
 * 步骤：
 *   1. 检查 d3Instance 是否存在
 *   2. 调用 zoomIn 工具函数（传入 zoom 行为）
 *   3. zoom.scaleBy 内部读 svg 的 __zoom，计算新 transform
 *   4. 触发 zoom 监听器，自动更新 g 元素的 transform
 */
function handleZoomIn() {
    graph?.zoomIn();
}

/**
 * 缩小按钮处理：调用 d3.zoom.scaleBy 缩小 0.83 倍
 * ----------------------------------------------------------------------------
 * 关键修复：传入 d3Instance.zoom，确保使用已绑定的 zoom 行为
 *
 * 步骤：
 *   1. 检查 d3Instance 是否存在
 *   2. 调用 zoomOut 工具函数（传入 zoom 行为）
 */
function handleZoomOut() {
    graph?.zoomOut();
}

/**
 * 适应屏幕按钮处理：根据容器尺寸计算合适的缩放和平移
 * ----------------------------------------------------------------------------
 * 关键修复：传入 d3Instance.zoom，确保 fitView 触发已绑定的 zoom 监听器
 *
 * 步骤：
 *   1. 检查 d3Instance 和容器是否存在
 *   2. 调用 fitView 工具函数，自动调整 viewBox
 */
/**
 * 切换树布局方向（左右 ↔ 上下）
 */
function handleToggleLayout() {
    if (!graph) return;
    layoutOrientation.value = graph.toggleOrientation();
}

function handleFitView() {
    graph?.fitView();
}

/**
 * 重置缩放：将缩放比例重置为 1，并居中显示
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 检查 d3Instance 和容器是否存在
 *   2. 调用 resetZoom 工具函数，将 scale 设置为 1 并居中
 */
function handleResetZoom() {
    graph?.resetZoom();
}

/**
 * 下载图片按钮处理：显示下载格式选择模态框
 * ----------------------------------------------------------------------------
 * 借鉴 org-tree-lib 的实现，支持正确的布局和样式
 * 支持选择下载 PNG 或 SVG 格式
 */
async function handleDownload() {
    if (!graph) return;
    showDownloadModal.value = true;
}

/**
 * 选择下载格式并执行下载
 * ----------------------------------------------------------------------------
 * @param format - 下载格式：'png' 或 'svg'
 */
async function selectDownloadFormat(format: 'png' | 'svg') {
    if (!graph) return;
    const inputFileName = downloadFileName.value.trim();
    const fileName =
        inputFileName === 'tree-diagram'
            ? `tree-diagram-${Date.now()}`
            : inputFileName || 'tree-diagram';
    showDownloadModal.value = false;
    try {
        await graph.download(fileName, format);
    } catch {
        showDownloadModal.value = false;
    }
}

/**
 * 清除选择按钮处理：向父组件 emit 事件
 * ----------------------------------------------------------------------------
 * 关键修复：使用 emit 而非 $emit（保证类型安全）
 *
 * 步骤：
 *   1. 调用 emit('clear-selection') 通知父组件
 *   2. 父组件 index.vue 的 clearSelection() 会清空 selectedNodes
 *   3. selectedCount 变为 0，按钮自动隐藏（v-if）
 */
function handleClearSelection() {
    console.log('[handleClearSelection] emit clear-selection');
    emit('clear-selection');
}

/**
 * 重渲染 D3 树（当父组件 treeData 变化时调用）
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 检查 d3Instance 是否存在
 *   2. 调用 renderTree 工具函数重新构建 hierarchy + 重绘节点和连线
 *   3. 保持原有的事件回调（handleNodeClick 等）
 */
function handleRenderTree(newTreeData?: TreeData) {
    if (!graph) return null;
    const dataToRender = newTreeData || props.treeData;
    graph.setData(dataToRender, { recordHistory: false });
    graph.setSelectedNodes(props.selectedNodes);
    return graph.getInstance()?.root ?? null;
}

/**
 * 暴露给父组件的方法（通过 ref 访问）
 * ----------------------------------------------------------------------------
 * @property {Function} renderTree      - 重渲染 D3 树
 * @property {Function} zoomIn          - 放大
 * @property {Function} zoomOut         - 缩小
 * @property {Function} fitView         - 适应屏幕
 * @property {Function} resetZoom       - 重置缩放
 * @property {Function} recordOperation - 记录操作到历史
 */
defineExpose({
    getGraph: () => graph,
    renderTree: handleRenderTree,
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    fitView: handleFitView,
    resetZoom: handleResetZoom,
    recordOperation: recordOperation
});
</script>
