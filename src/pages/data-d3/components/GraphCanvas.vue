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
                <div class="menu-item danger" @click="handleMenuClick('delete-node')">
                    🗑️ 删除节点
                </div>
            </div>
        </teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import type { TreeData, SelectedNode } from '../types';
import { initD3, renderTree, zoomIn, zoomOut, fitView, resetZoom } from '../utils/d3Tree';
import type { D3TreeInstance } from '../utils/d3Tree';

/**
 * 父组件传入的属性（只读）
 * ----------------------------------------------------------------------------
 * @property {TreeData}        treeData       - 当前要渲染的完整树数据
 * @property {SelectedNode[]}  selectedNodes  - 已被多选选中的节点列表（用于节点高亮）
 * @property {number}          selectedCount  - 已选节点数量（用于显示 "已选 N 项"）
 */
const props = defineProps<{
    treeData: TreeData;
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
    (e: 'show-add-node-modal'): void;
    (e: 'show-add-module-modal'): void;
    (e: 'show-bind-relation-modal'): void;
    (e: 'show-edit-node-modal'): void;
    (e: 'show-integration-modal'): void;
    (e: 'delete-node'): void;
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
}>();

/** D3 树实例引用，用于调用 renderTree / zoomIn / zoomOut / fitView */
let d3Instance: D3TreeInstance | null = null;

// ---------- 右键菜单状态 ----------

/** 右键菜单是否打开（控制 Teleport 后菜单的 v-if 渲染） */
const contextMenuOpen = ref<boolean>(false);

/** 右键菜单 X 坐标（鼠标 clientX，用于 position: fixed 定位） */
const contextMenuX = ref<number>(0);

/** 右键菜单 Y 坐标（鼠标 clientY，用于 position: fixed 定位） */
const contextMenuY = ref<number>(0);

/** 当前触发右键菜单的节点 ID（用于后续 emit 时传递给父组件） */
const contextMenuNodeId = ref<string>('');

/**
 * 处理菜单项点击事件
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 先关闭菜单（contextMenuOpen = false）
 *   2. 通过 emit 把事件名转发给父组件（如 'show-add-node-modal'）
 *
 * @param {string} event 事件名（对应 emit 中的事件）
 */
function handleMenuClick(event: string) {
    contextMenuOpen.value = false;
    emit(event as any);
}

/**
 * 打开右键菜单
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 记录鼠标位置 (event.clientX / clientY)
 *   2. 记录当前节点 ID
 *   3. 设置 contextMenuOpen = true，触发 Teleport 菜单显示
 *
 * @param {MouseEvent} event 鼠标点击事件
 * @param {string}     nodeId 触发菜单的节点 ID
 */
function openContextMenu(event: MouseEvent, nodeId: string) {
    contextMenuX.value = event.clientX;
    contextMenuY.value = event.clientY;
    contextMenuNodeId.value = nodeId;
    contextMenuOpen.value = true;
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
 * 判断节点是否被选中（用于节点高亮）
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 在 selectedNodes 数组中查找匹配 nodeId 的项
 *   2. 返回是否存在
 *
 * @param   {string} nodeId 节点 ID
 * @returns {boolean}       是否被选中
 */
function isSelected(nodeId: string): boolean {
    return props.selectedNodes.some((n) => n.id === nodeId);
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
 * 组件挂载时初始化 D3 树并注册全局事件监听
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 监听 'd3-svg-click' 自定义事件（点击 SVG 关闭菜单）
 *   2. 监听 document click（点击页面其他位置关闭菜单）
 *   3. 调用 initD3 初始化 D3 树（创建 SVG + 布局 + 节点）
 *   4. 启动窗口 resize 监听 → handleResize
 */
onMounted(() => {
    document.addEventListener('d3-svg-click', handleSvgClick);
    document.addEventListener('click', handleGlobalClick);
    d3Instance = initD3(
        'graph-container',
        props.treeData,
        handleNodeClick,
        handleNodeDoubleClick,
        handleMoreClick,
        isSelected,
        // 拖拽到同级节点时 → emit 给父组件 → 父组件弹"合并节点"模态框
        (sourceId, targetId, sourceData, targetData) => {
            emit('drop-to-target', sourceId, targetId, sourceData, targetData);
        }
    );
});

/**
 * 组件卸载时清理所有全局监听器，避免内存泄漏
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 移除 'd3-svg-click' 监听
 *   2. 移除全局 click 监听
 *   3. 移除 window resize 监听
 */
onBeforeUnmount(() => {
    document.removeEventListener('d3-svg-click', handleSvgClick);
    document.removeEventListener('click', handleGlobalClick);
    window.removeEventListener('resize', handleResize);
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
function handleResize() {
    const container = document.getElementById('graph-container');
    if (!container || !d3Instance) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    d3Instance.svg.attr('width', width).attr('height', height);
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
    try {
        console.log('[handleZoomIn] d3Instance =', !!d3Instance);
        if (!d3Instance) {
            console.warn('[handleZoomIn] d3Instance is null!');
            return;
        }
        zoomIn(d3Instance.svg, d3Instance.zoom);
        console.log(
            '[handleZoomIn] done, current transform:',
            d3Instance.svg.node()?.getAttribute('viewBox')
        );
    } catch (e) {
        console.error('[handleZoomIn] error:', e);
    }
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
    try {
        console.log('[handleZoomOut] d3Instance =', !!d3Instance);
        if (!d3Instance) {
            console.warn('[handleZoomOut] d3Instance is null!');
            return;
        }
        zoomOut(d3Instance.svg, d3Instance.zoom);
        console.log(
            '[handleZoomOut] done, current transform:',
            d3Instance.svg.node()?.getAttribute('viewBox')
        );
    } catch (e) {
        console.error('[handleZoomOut] error:', e);
    }
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
function handleFitView() {
    try {
        console.log('[handleFitView] d3Instance =', !!d3Instance);
        if (!d3Instance) {
            console.warn('[handleFitView] d3Instance is null!');
            return;
        }
        const container = document.getElementById('graph-container');
        if (!container) {
            console.warn('[handleFitView] container is null!');
            return;
        }
        fitView(
            d3Instance.svg,
            d3Instance.g,
            container.clientWidth,
            container.clientHeight,
            d3Instance.zoom // 传入已绑定的 zoom 行为
        );
    } catch (e) {
        console.error('[handleFitView] error:', e);
    }
}

/**
 * 重置缩放：将缩放比例重置为 1，并居中显示
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 检查 d3Instance 和容器是否存在
 *   2. 调用 resetZoom 工具函数，将 scale 设置为 1 并居中
 */
function handleResetZoom() {
    try {
        console.log('[handleResetZoom] d3Instance =', !!d3Instance);
        if (!d3Instance) {
            console.warn('[handleResetZoom] d3Instance is null!');
            return;
        }
        const container = document.getElementById('graph-container');
        if (!container) {
            console.warn('[handleResetZoom] container is null!');
            return;
        }
        resetZoom(
            d3Instance.svg,
            d3Instance.g,
            container.clientWidth,
            container.clientHeight,
            d3Instance.zoom // 传入已绑定的 zoom 行为
        );
    } catch (e) {
        console.error('[handleResetZoom] error:', e);
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
function handleRenderTree() {
    if (!d3Instance) return;
    renderTree(
        d3Instance,
        props.treeData,
        handleNodeClick,
        handleNodeDoubleClick,
        handleMoreClick,
        isSelected
    );
}

/**
 * 暴露给父组件的方法（通过 ref 访问）
 * ----------------------------------------------------------------------------
 * @property {Function} renderTree - 重渲染 D3 树
 * @property {Function} zoomIn     - 放大
 * @property {Function} zoomOut    - 缩小
 * @property {Function} fitView    - 适应屏幕
 */
defineExpose({
    renderTree: handleRenderTree,
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    fitView: handleFitView,
    resetZoom: handleResetZoom
});
</script>
