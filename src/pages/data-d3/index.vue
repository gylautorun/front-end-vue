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
                @show-add-node-modal="
                    (nodeId) => {
                        contextMenuNodeId = nodeId;
                        showAddModal = true;
                    }
                "
                @show-add-module-modal="
                    (nodeId) => {
                        contextMenuNodeId = nodeId;
                        showAddModuleModal = true;
                    }
                "
                @show-bind-relation-modal="
                    (nodeId) => {
                        contextMenuNodeId = nodeId;
                        showBindRelationModal = true;
                    }
                "
                @show-edit-node-modal="
                    (nodeId) => {
                        contextMenuNodeId = nodeId;
                        showEditModal = true;
                    }
                "
                @show-integration-modal="
                    (nodeId) => {
                        contextMenuNodeId = nodeId;
                        showIntegrationModal = true;
                    }
                "
                @delete-node="
                    (nodeId) => {
                        contextMenuNodeId = nodeId;
                        deleteNode();
                    }
                "
                @drop-to-target="handleDropToTarget"
                @undo="handleUndo"
                @redo="handleRedo"
                @refresh="handleRefresh"
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
                @update-owner="updateOwner"
                @show-module-detail="handleShowModuleDetail"
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
            :bind-relation-source-label="bindRelationSourceLabel"
            :show-module-detail-modal="showModuleDetailModal"
            :selected-module-detail="selectedModuleDetail"
            @close-add-modal="showAddModal = false"
            @close-add-module-modal="showAddModuleModal = false"
            @close-integrate-modal="showIntegrateModal = false"
            @close-edit-modal="showEditModal = false"
            @close-bind-relation-modal="showBindRelationModal = false"
            @close-integration-modal="showIntegrationModal = false"
            @close-merge-nodes-modal="showMergeNodesModal = false"
            @close-module-detail-modal="showModuleDetailModal = false"
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
import { ref, computed, onMounted, watch } from 'vue';
import * as d3 from 'd3';
import { cloneDeep } from 'lodash-es';
import SidebarLeft from './components/SidebarLeft.vue';
import SidebarRight from './components/SidebarRight.vue';
import GraphCanvas from './components/GraphCanvas.vue';
import Modals from './components/Modals.vue';
import type { TreeData, SelectedNode, IntegrationTypeKey, LevelKey } from './types';
import { INTEGRATION_TYPE_NAME, canSiblingMerge } from './types';
import { initialTreeData } from './data/mockData';
import { TreeLogger } from './utils/treeLogger';

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

const treeData = ref<TreeData>(cloneDeep(initialTreeData));
TreeLogger.log('initialTreeData', treeData.value);
const selectedNodes = ref<SelectedNode[]>([]);
const selectedNodeData = ref<TreeData | null>(null);
const contextMenuNodeId = ref<string | null>(null);
/** 拖拽合并弹框内：源/目标节点信息 */
const mergeSourceId = ref<string | null>(null);
const mergeTargetId = ref<string | null>(null);
const mergeSourceLabel = ref('');
const mergeTargetLabel = ref('');
/** 绑定关系弹框内：源节点名称 */
const bindRelationSourceLabel = ref('');
/** 模块详情弹框显隐 */
const showModuleDetailModal = ref(false);
/** 选中的模块详情数据 */
const selectedModuleDetail = ref<TreeData | null>(null);

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
 * 监听绑定关系弹框打开，设置源节点名称
 */
watch(showBindRelationModal, (val) => {
    if (val && contextMenuNodeId.value) {
        const node = root.descendants().find((d) => d.data.id === contextMenuNodeId.value);
        bindRelationSourceLabel.value = node?.data.label || '';
    }
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
 * 显示模块详情弹框
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 把模块数据存入 selectedModuleDetail
 *   2. showModuleDetailModal = true 显示弹框
 *
 * @param module 模块节点
 */
function handleShowModuleDetail(module: TreeData) {
    selectedModuleDetail.value = module;
    showModuleDetailModal.value = true;
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
    treeData.value = cloneDeep(initialTreeData);
    root = d3.hierarchy(treeData.value);
    // 传入新的树数据，确保立即渲染
    graphCanvasRef.value?.renderTree(treeData.value);
    // fitView 居中适应屏幕
    // graphCanvasRef.value?.fitView();
    graphCanvasRef.value?.resetZoom();
    selectNode(treeData.value);
    clearSelection();
    TreeLogger.log('重置整棵树', treeData.value, {
        action: 'reset'
    });
}

/**
 * 更新树数据但不记录到历史（用于撤销/重做操作）
 * ----------------------------------------------------------------------------
 * 统一处理：更新 treeData + 重新构建 hierarchy + 重绘
 * @param {TreeData} newData 新的树数据
 */
function updateTreeDataWithoutHistory(newData: TreeData) {
    treeData.value = cloneDeep(newData);
    // 调用 renderTree，它会计算节点位置并返回带有位置数据的 root
    const renderedRoot = graphCanvasRef.value?.renderTree(treeData.value);
    // 更新 root 变量，确保后续操作使用最新的层级结构
    root = renderedRoot || d3.hierarchy(treeData.value);
}

/**
 * 更新树数据并记录到历史
 * ----------------------------------------------------------------------------
 * 统一处理：更新 treeData + 重新构建 hierarchy + 重绘 + 记录历史
 * @param {TreeData} newData 新的树数据
 */
function updateTreeData(newData: TreeData) {
    treeData.value = cloneDeep(newData);
    // 调用 renderTree，它会计算节点位置并返回带有位置数据的 root
    const renderedRoot = graphCanvasRef.value?.renderTree(treeData.value);
    // 记录操作到历史
    graphCanvasRef.value?.recordOperation(treeData.value);
    // 使用 renderTree 返回的带有正确位置数据的 root
    root = renderedRoot || d3.hierarchy(treeData.value);
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
    level: LevelKey;
    integrationType: IntegrationTypeKey;
}) {
    // 在原始数据中找到父节点
    const parentResult = findNodeInTreeData(treeData.value, contextMenuNodeId.value || '');
    if (parentResult) {
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
        if (!parentResult.node.children) parentResult.node.children = [];
        parentResult.node.children.push(newNode);
        updateTreeData(treeData.value);
        TreeLogger.log('新增子节点', treeData.value, {
            parentId: contextMenuNodeId.value,
            newNodeId: newNode.id,
            newNodeLabel: newNode.label,
            newNodeLevel: newNode.level
        });
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
    // 在原始数据中找到父节点
    const parentResult = findNodeInTreeData(treeData.value, contextMenuNodeId.value || '');
    if (parentResult) {
        const newModule: TreeData = {
            id: `module_${Date.now()}`,
            label: data.name,
            level: 'module',
            dept: data.dept || parentResult.node.dept,
            owner: ''
        };
        if (!parentResult.node.modules) parentResult.node.modules = [];
        parentResult.node.modules.push(newModule);
        selectNode(parentResult.node);
        updateTreeData(treeData.value);
        TreeLogger.log('新增功能模块', treeData.value, {
            parentId: contextMenuNodeId.value,
            newModuleId: newModule.id,
            newModuleLabel: newModule.label
        });
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

    const parentResult = findNodeInTreeData(treeData.value, parentId);
    if (parentResult) {
        const newModule: TreeData = {
            id: `integrated_${Date.now()}`,
            label: data.name,
            level: 'module',
            dept: data.dept || parentResult.node.dept,
            owner: '',
            integrationType: data.type,
            integrationTypeName: INTEGRATION_TYPE_NAME[data.type]
        };

        if (!parentResult.node.modules) parentResult.node.modules = [];
        parentResult.node.modules.push(newModule);

        selectedNodes.value.forEach((selected) => {
            const ownerResult = findNodeInTreeData(treeData.value, selected.parentId);
            if (ownerResult && ownerResult.node.modules) {
                ownerResult.node.modules = ownerResult.node.modules.filter(
                    (m) => m.id !== selected.id
                );
            }
        });

        updateTreeData(treeData.value);
        selectNode(parentResult.node);
        clearSelection();
        TreeLogger.log('整合多选模块', treeData.value, {
            parentId,
            newModuleId: newModule.id,
            newModuleLabel: newModule.label,
            selectedCount: selectedNodes.value.length
        });
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
function confirmEditNode(data: {
    name: string;
    dept: string;
    level: LevelKey | '';
    owner: string;
}) {
    // 在原始数据中找到节点
    const nodeResult = findNodeInTreeData(treeData.value, contextMenuNodeId.value || '');
    if (nodeResult) {
        nodeResult.node.label = data.name;
        nodeResult.node.dept = data.dept;
        if (data.level) {
            nodeResult.node.level = data.level;
        }
        nodeResult.node.owner = data.owner;
        updateTreeData(treeData.value);
        selectNode(nodeResult.node);
        TreeLogger.log('编辑节点属性', treeData.value, {
            nodeId: contextMenuNodeId.value,
            newName: data.name,
            newLevel: data.level,
            newDept: data.dept,
            newOwner: data.owner
        });
    }
    showEditModal.value = false;
}

/**
 * 确认绑定关联关系
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 找到源节点和目标节点
 *   2. 在源节点的 relations 数组中追加 { targetId / targetName / type / name }
 *   3. 重新选中源节点（Drawer 刷新）
 *   4. 关闭模态框
 *
 * @param data 包含 targetId / type / name 的表单数据
 *             其中 type 是 IntegrationTypeKey 枚举，name 是整合名称
 */
function confirmBindRelation(data: { targetId: string; type: IntegrationTypeKey; name: string }) {
    // 在原始数据中找到源节点和目标节点
    const nodeResult = findNodeInTreeData(treeData.value, contextMenuNodeId.value || '');
    const targetResult = findNodeInTreeData(treeData.value, data.targetId);

    if (nodeResult && targetResult) {
        if (!nodeResult.node.relations) nodeResult.node.relations = [];
        nodeResult.node.relations.push({
            targetId: targetResult.node.id,
            targetName: targetResult.node.label,
            type: data.type,
            name: data.name
        });
        selectNode(nodeResult.node);
        updateTreeData(treeData.value);
        TreeLogger.log('绑定关联关系', treeData.value, {
            sourceId: contextMenuNodeId.value,
            targetId: data.targetId,
            relationType: data.type,
            relationName: data.name
        });
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
    // 在原始数据中找到节点
    const nodeResult = findNodeInTreeData(treeData.value, contextMenuNodeId.value || '');
    if (nodeResult) {
        nodeResult.node.integrationType = data.type;
        nodeResult.node.integrationTypeName = INTEGRATION_TYPE_NAME[data.type];
        updateTreeData(treeData.value);
        TreeLogger.log('标注整合方式', treeData.value, {
            nodeId: contextMenuNodeId.value,
            integrationType: data.type,
            integrationTypeName: INTEGRATION_TYPE_NAME[data.type]
        });
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
 */

/**
 * 在原始数据中递归查找节点
 * @param node 当前节点
 * @param nodeId 要查找的节点ID
 * @returns 找到的节点及其父节点
 */
function findNodeInTreeData(
    node: TreeData,
    nodeId: string,
    parent: TreeData | null = null,
    depth = 0
): { node: TreeData; parent: TreeData | null; depth: number } | null {
    if (node.id === nodeId) {
        return { node, parent, depth };
    }
    if (node.children) {
        for (const child of node.children) {
            const result = findNodeInTreeData(child, nodeId, node, depth + 1);
            if (result) return result;
        }
    }
    return null;
}

function canMergeNodesInTree(nodeId: string): boolean {
    const meta = findNodeInTreeData(treeData.value, nodeId);
    if (!meta) return false;
    return canSiblingMerge({
        depth: meta.depth,
        parent: meta.parent ? { depth: meta.depth - 1, data: meta.parent } : null
    });
}

/**
 * 在原始数据中递归查找并更新关系引用
 * @param node 当前节点
 * @param oldIds 旧的节点ID列表
 * @param newId 新的节点ID
 * @param newLabel 新的节点名称
 */
function updateRelationsInTreeData(
    node: TreeData,
    oldIds: string[],
    newId: string,
    newLabel: string
) {
    if (node.relations) {
        for (const relation of node.relations) {
            if (oldIds.includes(relation.targetId)) {
                relation.targetId = newId;
                relation.targetName = newLabel;
            }
        }
    }
    if (node.children) {
        for (const child of node.children) {
            updateRelationsInTreeData(child, oldIds, newId, newLabel);
        }
    }
}

/**
 * 通用深拷贝合并函数
 * ----------------------------------------------------------------------------
 * 功能：将两个数组合并去重，使用深拷贝避免引用问题
 * @param source 源数组
 * @param target 目标数组
 * @param getKeyFn 获取元素唯一 key 的函数，默认使用 id 字段
 * @returns 合并去重后的数组（新对象）
 */
function mergeById<T>(
    source: T[] = [],
    target: T[] = [],
    getKeyFn: (item: T) => string = (item: any) => item.id
): T[] {
    const map = new Map<string, T>();
    // 使用 lodash 的 cloneDeep 进行深拷贝，支持循环引用和特殊类型
    (source ?? []).forEach((item) => map.set(getKeyFn(item), cloneDeep(item)));
    (target ?? []).forEach((item) => map.set(getKeyFn(item), cloneDeep(item)));
    return Array.from(map.values());
}

function confirmMergeNodes(data: {
    name: string;
    integrationType: IntegrationTypeKey;
    sourceId: string;
    targetId: string;
}) {
    // 1. 在原始数据中找到源/目标节点及其父节点
    const sourceResult = findNodeInTreeData(treeData.value, data.sourceId);
    const targetResult = findNodeInTreeData(treeData.value, data.targetId);

    if (!sourceResult || !targetResult) {
        showMergeNodesModal.value = false;
        return alert('合并失败：源/目标节点未找到');
    }

    if (!canMergeNodesInTree(data.sourceId)) {
        showMergeNodesModal.value = false;
        return alert('合并失败：需先完成上一层级节点合并后，当前层级才可合并');
    }

    const sourceNode = sourceResult.node;
    const targetNode = targetResult.node;
    const sourceParent = sourceResult.parent;
    const targetParent = targetResult.parent;

    if (!sourceParent || !targetParent) {
        showMergeNodesModal.value = false;
        return alert('合并失败：源/目标节点没有父节点');
    }

    // 必须同父节点
    if (sourceParent.id !== targetParent.id) {
        showMergeNodesModal.value = false;
        return alert('合并失败：源/目标不是同级节点');
    }

    // 2-4. 合并 children、modules、relations（使用通用函数进行深拷贝去重）
    const mergedChildren = mergeById(sourceNode.children, targetNode.children);
    const mergedModules = mergeById(sourceNode.modules, targetNode.modules);
    const mergedRelations = mergeById(
        sourceNode.relations,
        targetNode.relations,
        (r) => `${r.targetId}__${r.type}` // relations 的 key 是复合键
    );

    // 5. level 取更"高级"的那个（业务规则：领域级 > 部门级综合 > 部门级单点 > 处室级单点 > 功能模块）
    const levelPriority: Record<string, number> = {
        domain: 5,
        dept_composite: 4,
        dept_single: 3,
        office_single: 2,
        module: 1
    };
    const sourceLevelScore = levelPriority[sourceNode.level] ?? 0;
    const targetLevelScore = levelPriority[targetNode.level] ?? 0;
    const mergedLevel = sourceLevelScore >= targetLevelScore ? sourceNode.level : targetNode.level;

    // 6. 构造新节点
    const newNode: TreeData = {
        id: `merge_${Date.now()}`,
        label: data.name,
        level: mergedLevel,
        dept: sourceNode.dept || targetNode.dept,
        owner: sourceNode.owner || targetNode.owner,
        integrationType: data.integrationType,
        integrationTypeName: INTEGRATION_TYPE_NAME[data.integrationType],
        children: mergedChildren,
        modules: mergedModules,
        relations: mergedRelations,
        // 标记此节点是由哪些节点整合而成
        integratedFrom: [sourceNode.id, targetNode.id]
    };

    // 7. 在父节点的 children 中删除源/目标，插入新节点（保留顺序：在 source 原来的位置）
    const newParentChildren: TreeData[] = [];
    for (const child of sourceParent.children ?? []) {
        if (child.id === sourceNode.id) {
            newParentChildren.push(newNode);
        } else if (child.id === targetNode.id) {
            // 跳过 target（target 已被替换）
            continue;
        } else {
            newParentChildren.push(child);
        }
    }
    sourceParent.children = newParentChildren;

    // 8. 更新其他节点对源/目标节点的关系引用（改为引用新节点）
    updateRelationsInTreeData(
        treeData.value,
        [sourceNode.id, targetNode.id],
        newNode.id,
        newNode.label
    );

    // 9. 重新 d3.hierarchy + 触发 renderTree 重绘
    // 关键修复：必须更新 treeData.value 后再重新构建 hierarchy
    updateTreeData(treeData.value);

    // 10. 重新选中新节点（Drawer 自动打开显示详情）
    selectNode(newNode);

    // 11. 关闭弹框 + 清空合并信息
    showMergeNodesModal.value = false;
    mergeSourceId.value = null;
    mergeTargetId.value = null;
    mergeSourceLabel.value = '';
    mergeTargetLabel.value = '';

    TreeLogger.log('拖拽合并节点', treeData.value, {
        sourceId: data.sourceId,
        targetId: data.targetId,
        newNodeId: newNode.id,
        newNodeLabel: newNode.label,
        newNodeLevel: newNode.level,
        mergedChildrenCount: mergedChildren.length,
        mergedModulesCount: mergedModules.length,
        integratedFrom: newNode.integratedFrom
    });
}

/**
 * 删除节点
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 阻止删除根节点（id='edu'）
 *   2. 弹窗确认
 *   3. 在原始数据中找到目标节点及其父节点
 *   4. 从父节点的 children 数组中过滤掉目标节点
 *   5. renderTree 重绘
 *   6. 重新选中根节点
 *   7. 隐藏右键菜单
 */
/**
 * 删除节点时更新关系引用（移除对被删除节点的引用）
 * @param node 当前节点
 * @param deletedId 被删除节点的ID
 */
function removeRelationsToNode(node: TreeData, deletedId: string) {
    if (node.relations) {
        node.relations = node.relations.filter((relation) => relation.targetId !== deletedId);
    }
    if (node.children) {
        for (const child of node.children) {
            removeRelationsToNode(child, deletedId);
        }
    }
}

function deleteNode() {
    if (contextMenuNodeId.value === 'edu') return alert('不能删除根节点');
    if (confirm('确定删除该节点及其所有子节点和模块吗？')) {
        const nodeResult = findNodeInTreeData(treeData.value, contextMenuNodeId.value || '');
        if (nodeResult && nodeResult.parent) {
            nodeResult.parent.children = nodeResult.parent.children!.filter(
                (c) => c.id !== contextMenuNodeId.value
            );
            // 删除节点时更新其他节点对该节点的关系引用
            removeRelationsToNode(treeData.value, contextMenuNodeId.value || '');
            updateTreeData(treeData.value);
            selectNode(treeData.value);
            TreeLogger.log('删除节点', treeData.value, {
                deletedNodeId: contextMenuNodeId.value,
                deletedNodeLabel: nodeResult.node.label,
                parentId: nodeResult.parent.id
            });
        }
    }
    const contextMenu = document.getElementById('context-menu');
    if (contextMenu) {
        contextMenu.style.display = 'none';
    }
}

/**
 * 撤销操作处理
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 接收子组件传递的历史数据
 *   2. 更新 treeData
 *   3. 重新构建 hierarchy 并渲染
 */
function handleUndo(data: TreeData) {
    console.log('[handleUndo] restoring previous state');
    updateTreeDataWithoutHistory(data);
    selectNode(treeData.value);
    TreeLogger.log('撤销操作', treeData.value, {
        action: 'undo'
    });
}

/**
 * 重做操作处理
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 接收子组件传递的历史数据
 *   2. 更新 treeData
 *   3. 重新构建 hierarchy 并渲染
 */
function handleRedo(data: TreeData) {
    console.log('[handleRedo] restoring next state');
    updateTreeDataWithoutHistory(data);
    selectNode(treeData.value);
    TreeLogger.log('重做操作', treeData.value, {
        action: 'redo'
    });
}

/**
 * 刷新操作处理（恢复初始状态）
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 接收子组件传递的初始数据
 *   2. 更新 treeData
 *   3. 重新构建 hierarchy 并渲染
 *   4. 清空选中状态
 */
function handleRefresh(data: TreeData) {
    console.log('[handleRefresh] restoring initial state');
    updateTreeDataWithoutHistory(data);
    selectNode(treeData.value);
    clearSelection();
    TreeLogger.log('刷新操作', treeData.value, {
        action: 'refresh'
    });
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
