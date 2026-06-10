<!--
    ========================================================================
    data-d3 应用整合图主页面
    ========================================================================

    功能总览：
      - 用 D3 v7 绘制"教育局应用体系"树形图
      - 支持节点拖拽、缩放平移、右键菜单
      - 支持多选节点进行"整合应用"操作
      - 支持点击节点打开右侧 Drawer 详情

    布局结构（flex 横排）：
      ┌──────────────┬──────────────────────────────┐
      │  SidebarLeft │         GraphCanvas         │
      │   (图例)     │       (D3 树形画布)          │
      │              │                              │
      │              │  节点点击 → 右侧 a-drawer 打开│
      └──────────────┴──────────────────────────────┘

    数据流：
      1. initialTreeData → deepClone → 响应式 treeData
      2. treeData (props) → GraphCanvas → d3Tree.initD3()
      3. 节点操作回调 → 修改 treeData → watch → renderTree()

    模态框列表（见 Modals.vue）：
      showAddModal          新增子节点
      showAddModuleModal    新增功能模块
      showEditModal         编辑属性
      showBindRelationModal 绑定关系
      showIntegrationModal  标注整合方式
      showIntegrateModal    整合选中模块

    ========================================================================
-->
<template>
    <div class="irs-tree-container">
        <div class="main-container">
            <!-- 左侧边栏 -->
            <SidebarLeft
                :selected-nodes="selectedNodes"
                :selected-count="selectedNodes.length"
                @reset-tree="handleResetTree"
                @fit-view="handleFitView"
                @show-integrate-modal="showIntegrateModal = true"
                @remove-selected="removeSelected"
            />

            <!-- 中间画布 -->
            <GraphCanvas
                ref="graphCanvasRef"
                :tree-data="treeData"
                :selected-nodes="selectedNodes"
                :selected-count="selectedNodes.length"
                @zoom-in="handleZoomIn"
                @zoom-out="handleZoomOut"
                @fit-view="handleFitView"
                @clear-selection="clearSelection"
                @select-node="selectNode"
                @toggle-select="toggleSelect"
                @show-add-node-modal="showAddModal = true"
                @show-add-module-modal="showAddModuleModal = true"
                @show-bind-relation-modal="showBindRelationModal = true"
                @show-edit-node-modal="showEditModal = true"
                @show-integration-modal="showIntegrationModal = true"
                @delete-node="deleteNode"
                @drop-to-target="handleDropToTarget"
            />
        </div>

        <!-- 右侧详情 Drawer -->
        <a-drawer
            v-model:open="showDrawer"
            title="节点详情"
            placement="right"
            :width="320"
            @close="closeDrawer"
        >
            <SidebarRight
                :selected-node="selectedNodeData"
                :selected-module-ids="selectedNodes.map((n) => n.id)"
                @update-owner="updateOwner"
                @toggle-select-module="toggleSelectModule"
                @edit-relation="editRelation"
                @delete-relation="deleteRelation"
            />
        </a-drawer>

        <!-- 模态框 -->
        <Modals
            :show-add-modal="showAddModal"
            :show-add-module-modal="showAddModuleModal"
            :show-integrate-modal="showIntegrateModal"
            :show-edit-modal="showEditModal"
            :show-bind-relation-modal="showBindRelationModal"
            :show-integration-modal="showIntegrationModal"
            :show-merge-nodes-modal="showMergeNodesModal"
            :selected-nodes="selectedNodes"
            :available-apps="availableApps"
            :context-menu-node-id="contextMenuNodeId"
            :tree-data="treeData"
            :merge-source-id="mergeSourceId"
            :merge-target-id="mergeTargetId"
            :merge-source-label="mergeSourceLabel"
            :merge-target-label="mergeTargetLabel"
            @close-add-modal="showAddModal = false"
            @close-add-module-modal="showAddModuleModal = false"
            @close-integrate-modal="showIntegrateModal = false"
            @close-edit-modal="showEditModal = false"
            @close-bind-relation-modal="showBindRelationModal = false"
            @close-integration-modal="showIntegrationModal = false"
            @close-merge-nodes-modal="showMergeNodesModal = false"
            @confirm-add-node="confirmAddNode"
            @confirm-add-module="confirmAddModule"
            @confirm-integrate-module="confirmIntegrateModule"
            @confirm-edit-node="confirmEditNode"
            @confirm-bind-relation="confirmBindRelation"
            @confirm-integration="confirmIntegration"
            @confirm-merge-nodes="confirmMergeNodes"
        />
    </div>
</template>

<script setup lang="ts" name="IRSTreeMindMap">
/**
 * ========================================================================
 * data-d3 页面主组件（index.vue）的 script 部分
 * ========================================================================
 *
 * 状态管理：
 *   - treeData             响应式树数据（深拷贝自 initialTreeData）
 *   - selectedNodes        多选模式下被选中的节点列表
 *   - selectedNodeData     当前打开 Drawer 的节点详情
 *   - contextMenuNodeId    右键菜单触发的节点 ID
 *   - graphCanvasRef       GraphCanvas 组件引用（用于调用 renderTree/zoomIn 等）
 *   - 6 个 showXxxModal    控制各业务模态框的显隐
 *   - showDrawer           控制右侧详情 Drawer 显隐
 *
 * D3 集成：
 *   - root = d3.hierarchy(treeData) 在 onMounted 时构建层级结构
 *   - 任何修改 treeData 的操作后都会重新 d3.hierarchy + renderTree
 *
 * 主要业务方法：
 *   1. 选择相关：selectNode / toggleSelect / toggleSelectModule / clearSelection
 *   2. 工具栏：handleZoomIn / handleZoomOut / handleFitView / handleResetTree
 *   3. 节点操作：confirmAddNode / confirmAddModule / confirmEditNode / deleteNode
 *   4. 关系操作：confirmBindRelation / deleteRelation / editRelation
 *   5. 整合操作：confirmIntegrateModule / confirmIntegration
 *
 * ========================================================================
 */
import { ref, computed, onMounted } from 'vue';
import * as d3 from 'd3';
import SidebarLeft from './components/SidebarLeft.vue';
import SidebarRight from './components/SidebarRight.vue';
import GraphCanvas from './components/GraphCanvas.vue';
import Modals from './components/Modals.vue';
import type { TreeData, SelectedNode, IntegrationTypeKey } from './types';
import { INTEGRATION_TYPE_NAME } from './types';
import { initialTreeData } from './data/mockData';

// 响应式状态
const graphCanvasRef = ref<InstanceType<typeof GraphCanvas> | null>(null);
const showAddModal = ref(false);
const showAddModuleModal = ref(false);
const showIntegrateModal = ref(false);
const showEditModal = ref(false);
const showBindRelationModal = ref(false);
const showIntegrationModal = ref(false);
const showDrawer = ref(false);
/** 拖拽合并节点弹框显隐（由 GraphCanvas 的 drop-to-target 事件打开） */
const showMergeNodesModal = ref(false);

const treeData = ref<TreeData>(JSON.parse(JSON.stringify(initialTreeData)));
const selectedNodes = ref<SelectedNode[]>([]);
const selectedNodeData = ref<TreeData | null>(null);
const contextMenuNodeId = ref<string | null>(null);
/** 拖拽合并弹框内：源/目标节点信息 */
const mergeSourceId = ref<string | null>(null);
const mergeTargetId = ref<string | null>(null);
const mergeSourceLabel = ref('');
const mergeTargetLabel = ref('');

// D3 变量
let root: d3.HierarchyNode<TreeData>;

/**
 * 可用于"绑定关系"的目标节点列表
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 深度优先遍历整棵树
 *   2. 收集除根节点 (id='edu') 外的所有节点
 *   3. 用作 Modals 中"绑定关系"下拉框的选项
 */
const availableApps = computed(() => {
    const apps: TreeData[] = [];
    const collectApps = (node: TreeData) => {
        if (node.id !== 'edu') apps.push(node);
        if (node.children) node.children.forEach(collectApps);
    };
    collectApps(treeData.value);
    return apps;
});

/**
 * 组件挂载后初始化 D3 层次结构
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 把 treeData 转为 d3.HierarchyNode 树（带 .x / .y / .depth）
 *   2. 延迟 100ms 调用 GraphCanvas 的 resetZoom()（等 SVG 渲染完）
 *   3. 100ms 延迟是为了避开 Vue 首次渲染未完成导致容器尺寸为 0 的问题
 */
onMounted(() => {
    root = d3.hierarchy(treeData.value);
    setTimeout(() => {
        // graphCanvasRef.value?.fitView();
        graphCanvasRef.value?.resetZoom();
    }, 100);
});

/**
 * 节点单击：打开 Drawer 显示详情
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 把节点数据存入 selectedNodeData
 *   2. showDrawer = true 显示右侧 Drawer
 *
 * @param data 节点数据
 */
function selectNode(data: TreeData) {
    selectedNodeData.value = data;
    showDrawer.value = true;
}

/**
 * 关闭 Drawer
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. showDrawer = false
 *   2. Drawer 关闭动画结束后会自动从 DOM 卸载
 */
function closeDrawer() {
    showDrawer.value = false;
}

/**
 * 双击节点：切换多选状态
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 在 selectedNodes 中查找该节点
 *   2. 如果已选中，从数组中移除
 *   3. 如果未选中，加入数组
 *
 * @param data 节点数据
 */
function toggleSelect(data: TreeData) {
    const index = selectedNodes.value.findIndex((n) => n.id === data.id);
    if (index > -1) {
        selectedNodes.value.splice(index, 1);
    } else {
        selectedNodes.value.push({ id: data.id, label: data.label, parentId: data.id });
    }
}

/**
 * Drawer 内部"切换模块选中"按钮处理
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 取 selectedNodeData.id 作为 parentId
 *   2. 在 selectedNodes 中查找模块
 *   3. 已选中则移除，未选中则加入
 *
 * @param module 模块节点
 */
function toggleSelectModule(module: TreeData) {
    const parentId = selectedNodeData.value?.id || '';
    const index = selectedNodes.value.findIndex((n) => n.id === module.id);
    if (index > -1) {
        selectedNodes.value.splice(index, 1);
    } else {
        selectedNodes.value.push({ id: module.id, label: module.label, parentId });
    }
}

/**
 * SidebarLeft 移除单个选中项
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 过滤掉指定 nodeId 的项
 *
 * @param nodeId 要移除的节点 ID
 */
function removeSelected(nodeId: string) {
    selectedNodes.value = selectedNodes.value.filter((n) => n.id !== nodeId);
}

/**
 * 清空所有选中项
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. selectedNodes.value = []
 *   2. 工具栏的"清除选择"按钮 v-if 变 false 自动隐藏
 */
function clearSelection() {
    selectedNodes.value = [];
}

// 工具栏功能
/**
 * 放大（GraphCanvas 内部已直接处理工具栏点击，这里保留作为父组件调用入口）
 * 步骤：调用 GraphCanvas 实例的 zoomIn() 方法
 */
function handleZoomIn() {
    graphCanvasRef.value?.zoomIn();
}

/**
 * 缩小（父组件调用入口）
 * 步骤：调用 GraphCanvas 实例的 zoomOut() 方法
 */
function handleZoomOut() {
    graphCanvasRef.value?.zoomOut();
}

/**
 * 适应屏幕（父组件调用入口）
 * 步骤：调用 GraphCanvas 实例的 fitView() 方法
 */
function handleFitView() {
    graphCanvasRef.value?.fitView();
}

/**
 * 重置整棵树（恢复初始数据）
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. treeData 重新指向 initialTreeData 的深拷贝
 *   2. 重建 d3.HierarchyNode 树
 *   3. 调用 GraphCanvas 的 renderTree() 重绘
 *   4. 调用 fitView() 重新居中
 *   5. 选中根节点 + 清空多选
 */
function handleResetTree() {
    treeData.value = JSON.parse(JSON.stringify(initialTreeData));
    root = d3.hierarchy(treeData.value);
    graphCanvasRef.value?.renderTree();
    // fitView 居中适应屏幕
    // graphCanvasRef.value?.fitView();
    graphCanvasRef.value?.resetZoom();
    selectNode(treeData.value);
    clearSelection();
}

/**
 * 确认新增子节点
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 在 d3.HierarchyNode 树中找到右键触发的父节点
 *   2. 构造新节点对象（id = node_${Date.now()} 保证唯一）
 *   3. 把新节点 push 到父节点的 children 数组
 *   4. 重新构建 hierarchy + 触发 renderTree
 *   5. 关闭新增子节点模态框
 *
 * @param data 包含 name / level / integrationType 的表单数据
 *             其中 integrationType 是 IntegrationTypeKey 枚举（不是中文）
 */
function confirmAddNode(data: {
    name: string;
    level: string;
    integrationType: IntegrationTypeKey;
}) {
    const parentNode = root.descendants().find((d) => d.data.id === contextMenuNodeId.value);
    if (parentNode) {
        const newNode: TreeData = {
            id: `node_${Date.now()}`,
            label: data.name,
            level: data.level,
            dept: '教育局',
            owner: '',
            integrationType: data.integrationType,
            integrationTypeName: INTEGRATION_TYPE_NAME[data.integrationType],
            children: [],
            modules: []
        };
        if (!parentNode.data.children) parentNode.data.children = [];
        parentNode.data.children.push(newNode);
        root = d3.hierarchy(treeData.value);
        graphCanvasRef.value?.renderTree();
    }
    showAddModal.value = false;
}

/**
 * 确认新增功能模块
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 找到父节点
 *   2. 构造新模块（level 固定为"功能模块"）
 *   3. 推入父节点的 modules 数组
 *   4. 重新选中新模块的父节点（Drawer 自动打开）
 *   5. renderTree 重绘
 *   6. 关闭模态框
 *
 * @param data 包含 name / dept 的表单数据
 */
function confirmAddModule(data: { name: string; dept: string }) {
    const parentNode = root.descendants().find((d) => d.data.id === contextMenuNodeId.value);
    if (parentNode) {
        const newModule: TreeData = {
            id: `module_${Date.now()}`,
            label: data.name,
            level: '功能模块',
            dept: data.dept || parentNode.data.dept,
            owner: ''
        };
        if (!parentNode.data.modules) parentNode.data.modules = [];
        parentNode.data.modules.push(newModule);
        selectNode(parentNode.data);
        root = d3.hierarchy(treeData.value);
        graphCanvasRef.value?.renderTree();
    }
    showAddModuleModal.value = false;
}

/**
 * 整合多选模块 → 合并为新模块
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 确定整合后的新父节点（所有选中模块的 parentId 相同则用 parentId，否则用 'edu'）
 *   2. 构造新模块（带 integrationType）
 *   3. 把新模块 push 到父节点的 modules 数组
 *   4. **关键**：从原父节点移除所有被选中的模块
 *   5. renderTree 重绘
 *   6. 重新选中父节点 + 清空多选
 *   7. 关闭模态框
 *
 * @param data 包含 name / dept / type 的表单数据
 *             其中 type 是 IntegrationTypeKey 枚举
 */
function confirmIntegrateModule(data: { name: string; dept: string; type: IntegrationTypeKey }) {
    const parentIds = [...new Set(selectedNodes.value.map((n) => n.parentId))];
    const parentId = parentIds.length === 1 ? parentIds[0] : 'edu';

    const parentNode = root.descendants().find((d) => d.data.id === parentId);
    if (parentNode) {
        const newModule: TreeData = {
            id: `integrated_${Date.now()}`,
            label: data.name,
            level: '功能模块',
            dept: data.dept || parentNode.data.dept,
            owner: '',
            integrationType: data.type,
            integrationTypeName: INTEGRATION_TYPE_NAME[data.type]
        };

        if (!parentNode.data.modules) parentNode.data.modules = [];
        parentNode.data.modules.push(newModule);

        selectedNodes.value.forEach((selected) => {
            const ownerNode = root.descendants().find((d) => d.data.id === selected.parentId);
            if (ownerNode && ownerNode.data.modules) {
                ownerNode.data.modules = ownerNode.data.modules.filter((m) => m.id !== selected.id);
            }
        });

        root = d3.hierarchy(treeData.value);
        graphCanvasRef.value?.renderTree();
        selectNode(parentNode.data);
        clearSelection();
    }

    showIntegrateModal.value = false;
}

/**
 * 确认编辑节点属性
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 在 d3.HierarchyNode 树中找到目标节点
 *   2. 直接修改其 data 字段（label / dept / level / owner）
 *   3. renderTree 重绘
 *   4. 重新选中该节点（Drawer 刷新显示）
 *   5. 关闭模态框
 *
 * @param data 包含 name / dept / level / owner 的表单数据
 */
function confirmEditNode(data: { name: string; dept: string; level: string; owner: string }) {
    const nodeData = root.descendants().find((d) => d.data.id === contextMenuNodeId.value);
    if (nodeData) {
        nodeData.data.label = data.name;
        nodeData.data.dept = data.dept;
        nodeData.data.level = data.level;
        nodeData.data.owner = data.owner;
        root = d3.hierarchy(treeData.value);
        graphCanvasRef.value?.renderTree();
        selectNode(nodeData.data);
    }
    showEditModal.value = false;
}

/**
 * 确认绑定关联关系
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 找到源节点和目标节点
 *   2. 在源节点的 relations 数组中追加 { targetId / targetName / type }
 *   3. 重新选中源节点（Drawer 刷新）
 *   4. 关闭模态框
 *
 * @param data 包含 targetId / type 的表单数据
 *             其中 type 是 IntegrationTypeKey 枚举
 */
function confirmBindRelation(data: { targetId: string; type: IntegrationTypeKey }) {
    const nodeData = root.descendants().find((d) => d.data.id === contextMenuNodeId.value);
    const targetData = root.descendants().find((d) => d.data.id === data.targetId);

    if (nodeData && targetData) {
        if (!nodeData.data.relations) nodeData.data.relations = [];
        nodeData.data.relations.push({
            targetId: targetData.data.id,
            targetName: targetData.data.label,
            type: data.type
        });
        selectNode(nodeData.data);
    }

    showBindRelationModal.value = false;
}

/**
 * 确认标注整合方式
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 找到目标节点
 *   2. 设置其 integrationType
 *   3. renderTree 重绘（连线颜色会跟着变）
 *   4. 关闭模态框
 *
 * @param data 包含 type 的表单数据
 *             其中 type 是 IntegrationTypeKey 枚举
 */
function confirmIntegration(data: { type: IntegrationTypeKey }) {
    const nodeData = root.descendants().find((d) => d.data.id === contextMenuNodeId.value);
    if (nodeData) {
        nodeData.data.integrationType = data.type;
        nodeData.data.integrationTypeName = INTEGRATION_TYPE_NAME[data.type];
        root = d3.hierarchy(treeData.value);
        graphCanvasRef.value?.renderTree();
    }
    showIntegrationModal.value = false;
}

/**
 * 拖拽命中同级节点 → 打开"合并节点"弹框
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 记录源/目标节点的 ID 与 label（弹框需要展示）
 *   2. showMergeNodesModal = true
 *   3. 实际合并操作在 confirmMergeNodes 中执行
 *
 * @param sourceId   源节点 ID
 * @param targetId   目标节点 ID
 * @param sourceData 源节点 TreeData
 * @param targetData 目标节点 TreeData
 */
function handleDropToTarget(
    sourceId: string,
    targetId: string,
    sourceData: TreeData,
    targetData: TreeData
) {
    mergeSourceId.value = sourceId;
    mergeTargetId.value = targetId;
    mergeSourceLabel.value = sourceData.label;
    mergeTargetLabel.value = targetData.label;
    showMergeNodesModal.value = true;
}

/**
 * 确认拖拽合并节点（核心业务逻辑）
 * ----------------------------------------------------------------------------
 * 业务规则（用户需求）：
 *   1. 弹框输入新节点名称 + 选整合方式
 *   2. 整合后生成一个"新节点"代替原两个节点
 *   3. 新节点要"携带两个节点的所有子节点"
 *   4. 拖拽合并弹框关闭
 *   5. 重新 d3.hierarchy + renderTree
 *
 * 步骤详解：
 *   1. 在 d3.HierarchyNode 树中找到源/目标节点以及它们共同的父节点
 *   2. 合并 children：
 *      - newChildren = [source.children, target.children].flat()
 *      - 合并后可能存在 ID 重复，去重（按 ID 用 Map 去重）
 *   3. 合并 modules：同理
 *   4. 取 source 与 target 中"更高级"那个 level（部门级 > 处室级 等），用 level 优先级表判断
 *      - 如果两个 level 都是"部门级综合应用"则用"部门级综合应用"
 *      - 否则取 level 优先级更高的
 *   5. 取 dept / owner：默认取 source，target 里有值则补上（任一非空即用）
 *   6. 构造新节点（id = merge_<ts>）
 *   7. 从父节点 children 中删除 source 和 target，加入新节点
 *   8. 重新 d3.hierarchy + renderTree
 *   9. 重新选中新节点（Drawer 打开）
 *
 * @param data 来自 Modals 的表单数据 { name, integrationType, sourceId, targetId }
 */
function confirmMergeNodes(data: {
    name: string;
    integrationType: IntegrationTypeKey;
    sourceId: string;
    targetId: string;
}) {
    // 1. 在 d3.hierarchy 中找到源/目标节点及其父节点
    const sourceNode = root.descendants().find((d) => d.data.id === data.sourceId);
    const targetNode = root.descendants().find((d) => d.data.id === data.targetId);

    if (!sourceNode || !targetNode || !sourceNode.parent || !targetNode.parent) {
        showMergeNodesModal.value = false;
        return alert('合并失败：源/目标节点未找到');
    }
    // 必须同父节点（d3Tree.ts 中已经校验过，这里防御一下）
    if (sourceNode.parent.data.id !== targetNode.parent.data.id) {
        showMergeNodesModal.value = false;
        return alert('合并失败：源/目标不是同级节点');
    }

    const parentNode = sourceNode.parent;

    // 2. 合并 children（去重）
    const childrenMap = new Map<string, TreeData>();
    (sourceNode.data.children ?? []).forEach((c) => childrenMap.set(c.id, c));
    (targetNode.data.children ?? []).forEach((c) => childrenMap.set(c.id, c));
    const mergedChildren: TreeData[] = Array.from(childrenMap.values());

    // 3. 合并 modules（去重）
    const modulesMap = new Map<string, TreeData>();
    (sourceNode.data.modules ?? []).forEach((m) => modulesMap.set(m.id, m));
    (targetNode.data.modules ?? []).forEach((m) => modulesMap.set(m.id, m));
    const mergedModules: TreeData[] = Array.from(modulesMap.values());

    // 4. 合并 relations（去重）
    const relationsMap = new Map<
        string,
        { targetId: string; targetName: string; type: IntegrationTypeKey }
    >();
    (sourceNode.data.relations ?? []).forEach((r) =>
        relationsMap.set(`${r.targetId}__${r.type}`, r)
    );
    (targetNode.data.relations ?? []).forEach((r) =>
        relationsMap.set(`${r.targetId}__${r.type}`, r)
    );
    const mergedRelations = Array.from(relationsMap.values());

    // 5. level 取更"高级"的那个（业务规则：领域级 > 部门级综合 > 部门级单点 > 处室级单点 > 功能模块）
    const levelPriority: Record<string, number> = {
        领域级应用: 5,
        部门级综合应用: 4,
        部门级单点应用: 3,
        处室级单点应用: 2,
        功能模块: 1
    };
    const sourceLevelScore = levelPriority[sourceNode.data.level] ?? 0;
    const targetLevelScore = levelPriority[targetNode.data.level] ?? 0;
    const mergedLevel =
        sourceLevelScore >= targetLevelScore ? sourceNode.data.level : targetNode.data.level;

    // 6. 构造新节点
    const newNode: TreeData = {
        id: `merge_${Date.now()}`,
        label: data.name,
        level: mergedLevel,
        dept: sourceNode.data.dept || targetNode.data.dept,
        owner: sourceNode.data.owner || targetNode.data.owner,
        integrationType: data.integrationType,
        integrationTypeName: INTEGRATION_TYPE_NAME[data.integrationType],
        children: mergedChildren,
        modules: mergedModules,
        relations: mergedRelations
    };

    // 7. 在父节点的 children 中删除源/目标，插入新节点（保留顺序：在 source 原来的位置）
    const parentChildren = parentNode.data.children ?? [];
    const newParentChildren: TreeData[] = [];
    for (const child of parentChildren) {
        if (child.id === sourceNode.data.id) {
            newParentChildren.push(newNode);
        } else if (child.id === targetNode.data.id) {
            // 跳过 target（target 已被替换）
            continue;
        } else {
            newParentChildren.push(child);
        }
    }
    parentNode.data.children = newParentChildren;

    // 8. 重新 d3.hierarchy + 触发 renderTree 重绘
    root = d3.hierarchy(treeData.value);
    graphCanvasRef.value?.renderTree();

    // 9. 重新选中新节点（Drawer 自动打开显示详情）
    selectNode(newNode);

    // 10. 关闭弹框 + 清空合并信息
    showMergeNodesModal.value = false;
    mergeSourceId.value = null;
    mergeTargetId.value = null;
    mergeSourceLabel.value = '';
    mergeTargetLabel.value = '';
}

/**
 * 删除节点
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 阻止删除根节点（id='edu'）
 *   2. 弹窗确认
 *   3. 在 hierarchy 树中找到目标节点及其父节点
 *   4. 从父节点的 children 数组中过滤掉目标节点
 *   5. renderTree 重绘
 *   6. 重新选中根节点
 *   7. 隐藏右键菜单
 */
function deleteNode() {
    if (contextMenuNodeId.value === 'edu') return alert('不能删除根节点');
    if (confirm('确定删除该节点及其所有子节点和模块吗？')) {
        const nodeData = root.descendants().find((d) => d.data.id === contextMenuNodeId.value);
        if (nodeData && nodeData.parent) {
            nodeData.parent.data.children = nodeData.parent.data.children!.filter(
                (c) => c.id !== contextMenuNodeId.value
            );
            root = d3.hierarchy(treeData.value);
            graphCanvasRef.value?.renderTree();
            selectNode(treeData.value);
        }
    }
    document.getElementById('context-menu')!.style.display = 'none';
}

/**
 * Drawer 内"修改负责人"输入框更新
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 直接修改 selectedNodeData 的 owner 字段
 *   2. 由于 selectedNodeData 是引用，treeData 也跟着变
 *   3. 下次 renderTree 会把最新值绘出来
 *
 * @param value 新的负责人
 */
function updateOwner(value: string) {
    if (selectedNodeData.value) {
        selectedNodeData.value.owner = value;
    }
}

/**
 * Drawer 内"编辑关系"操作
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 弹出 alert（当前仅占位，可扩展为模态框编辑）
 *
 * @param relation 关系对象
 */
function editRelation(relation: { targetId: string; targetName: string; type: string }) {
    // 这里可以添加编辑关系的逻辑
    alert(`编辑关系: ${relation.targetName}`);
}

/**
 * Drawer 内"删除关系"操作
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 过滤掉 targetId 匹配的关系
 *   2. selectedNodeData.relations 减少一项
 *
 * @param relation 要删除的关系
 */
function deleteRelation(relation: { targetId: string; targetName: string; type: string }) {
    if (selectedNodeData.value && selectedNodeData.value.relations) {
        selectedNodeData.value.relations = selectedNodeData.value.relations.filter(
            (r) => r.targetId !== relation.targetId
        );
    }
}
</script>

<style lang="scss">
@import url('./index.scss');
</style>
