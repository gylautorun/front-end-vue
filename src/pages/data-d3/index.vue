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
      1. initialTreeData → treeData（Vue 响应式，供 Modals/Drawer）
      2. GraphCanvas mount → D3TreeGraph 持有同一份数据的深拷贝
      3. 业务操作 → applyTreeChange* → tree-operations → graph.commit()
      4. syncFromGraph() 回写 treeData；撤销/重做由 graph 历史栈驱动

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
                :schema="DATA_D3_TREE_SCHEMA"
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
 * D3 集成（SDK）：
 *   - GraphCanvas 内 D3TreeGraph 负责渲染、缩放、历史、布局方向
 *   - index.vue 通过 getGraph() + applyTreeChange* 调用 tree-operations
 *   - mutateData() 取得可写根节点 → 纯函数变更 → commit() 重绘+入栈
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
import { cloneDeep } from 'lodash-es';
import { message } from 'ant-design-vue';
import SidebarLeft from './components/SidebarLeft.vue';
import SidebarRight from './components/SidebarRight.vue';
import GraphCanvas from './components/GraphCanvas.vue';
import Modals from './components/Modals.vue';
import {
    D3TreeGraph,
    TreeLogger,
    TreeContext,
    // initialTreeData,
    type TreeData,
    type SelectedNode,
    type IntegrationTypeKey,
    type LevelKey
} from '@/lib/d3-tree-sdk';
import { initialTreeData } from './data/mockData';
import { DATA_D3_TREE_SCHEMA, DATA_D3_ROOT_ID } from './config/treeConfig';

/** 与 GraphCanvas 内 D3TreeGraph 使用同一套 schema */
const pageTreeCtx = new TreeContext(DATA_D3_TREE_SCHEMA);

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

/** 从 GraphCanvas 内的 D3TreeGraph 实例同步 treeData */
function getGraph(): D3TreeGraph | null {
    return graphCanvasRef.value?.getGraph() ?? null;
}

/** 优先使用 graph 内 context（与渲染一致），否则用页面级 pageTreeCtx */
function getCtx(): TreeContext {
    return getGraph()?.getContext() ?? pageTreeCtx;
}

/**
 * 将 SDK 内部树数据同步到页面响应式 treeData
 * ----------------------------------------------------------------------------
 * GraphCanvas 内 D3TreeGraph 是渲染与历史的真实数据源；
 * index.vue 的 treeData 供 Modals / Drawer / computed 使用，需在每次 commit 后同步。
 */
function syncFromGraph(): void {
    const graph = getGraph();
    if (graph) treeData.value = graph.getData();
}

/**
 * 执行树变更（无返回值）
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. graph.mutateData() 取得可写根节点引用
 *   2. 调用 tree-operations 纯函数完成变更
 *   3. graph.commit() 重绘 + 写入历史栈
 *   4. syncFromGraph() 回写 Vue 响应式 treeData
 */
function applyTreeChange(mutator: (root: TreeData, ctx: TreeContext) => boolean): boolean {
    const graph = getGraph();
    if (!graph) return false;
    const ctx = graph.getContext();
    const ok = mutator(graph.mutateData(), ctx);
    if (!ok) return false;
    graph.commit({ recordHistory: true });
    syncFromGraph();
    return true;
}

function applyTreeChangeWithResult<T>(
    mutator: (root: TreeData, ctx: TreeContext) => T | null
): T | null {
    const graph = getGraph();
    if (!graph) return null;
    const ctx = graph.getContext();
    const result = mutator(graph.mutateData(), ctx);
    if (result === null) return null;
    graph.commit({ recordHistory: true });
    syncFromGraph();
    return result;
}

/**
 * 可用于"绑定关系"的目标节点列表
 * ----------------------------------------------------------------------------
 * 旧的逻辑已废弃
 * 1. 深度优先遍历整棵树
 * 2. 收集除根节点 (id='edu') 外的所有节点
 * 3. 用作 Modals 中"绑定关系"下拉框的选项
 * 步骤：
 *   1. 获取当前右键点击节点的上下文信息（通过 contextMenuNodeId）
 *   2. 找到当前节点的父节点，获取所有子节点（即兄弟节点）
 *   3. 排除当前节点本身
 *   4. 返回结果作为"绑定关系"下拉框的选项（仅显示同级节点）
 */
const availableApps = computed(() => {
    // 旧的逻辑已废弃
    // return getCtx().collectDescendantApps(treeData.value, getCtx().getRootId(treeData.value));
    if (!contextMenuNodeId.value) return [];

    const meta = getCtx().findNodeInTree(treeData.value, contextMenuNodeId.value);
    if (!meta || !meta.parent) return [];

    const parentChildren = getCtx().accessors.getChildren(meta.parent);
    return parentChildren.filter(
        (child) => getCtx().accessors.getId(child) !== contextMenuNodeId.value
    );
});

/**
 * 监听绑定关系弹框打开，设置源节点名称
 */
watch(showBindRelationModal, (val) => {
    if (val && contextMenuNodeId.value) {
        const meta = getCtx().findNodeInTree(treeData.value, contextMenuNodeId.value);
        bindRelationSourceLabel.value = meta ? getCtx().accessors.getLabel(meta.node) : '';
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
    setTimeout(() => {
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
 * 单击节点：切换多选状态
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 检查节点是否可以被整合（根节点和不符合合并条件的节点不能选中）
 *   2. 在 selectedNodes 中查找该节点
 *   3. 如果已选中，从数组中移除
 *   4. 如果未选中且可以整合，加入数组
 *
 * @param data 节点数据
 */
function toggleSelect(data: TreeData) {
    const ctx = getCtx();

    // 检查节点是否可以被整合
    const canIntegrate = ctx.canMergeNodesInTree(treeData.value, data.id);
    const isRoot = data.id === ctx.getRootId(treeData.value);

    const index = selectedNodes.value.findIndex((n) => n.id === data.id);
    if (index > -1) {
        // 已选中，移除
        selectedNodes.value.splice(index, 1);
    } else {
        // 未选中，检查是否可以整合
        if (isRoot) {
            message.warning('根节点不能被整合');
            return;
        }
        if (!canIntegrate) {
            message.warning('该节点不符合整合条件，请先完成上一层级节点的整合');
            return;
        }
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
 *   1. graph.resetToInitialData(initialTreeData) 恢复 SDK 内部数据并重绘
 *   2. syncFromGraph() 同步到 Vue treeData
 *   3. resetZoom() 重置视口缩放
 *   4. 选中根节点 + 清空多选
 */
function handleResetTree() {
    const graph = getGraph();
    if (!graph) return;
    graph.resetToInitialData(cloneDeep(initialTreeData));
    syncFromGraph();
    graphCanvasRef.value?.resetZoom();
    selectNode(treeData.value);
    clearSelection();
    TreeLogger.log('重置整棵树', treeData.value, { action: 'reset' });
}

/**
 * 撤销操作（GraphCanvas 内 graph.undo() 已完成渲染，此处同步 Vue 状态）
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 接收 GraphCanvas emit 的历史快照 data
 *   2. 深拷贝写入 treeData
 *   3. 重新选中根节点刷新 Drawer
 */
function handleUndo(data: TreeData) {
    treeData.value = cloneDeep(data);
    selectNode(treeData.value);
    TreeLogger.log('撤销操作', treeData.value, { action: 'undo' });
}

/**
 * 重做操作（GraphCanvas 内 graph.redo() 已完成渲染）
 * ----------------------------------------------------------------------------
 * 步骤同 handleUndo
 */
function handleRedo(data: TreeData) {
    treeData.value = cloneDeep(data);
    selectNode(treeData.value);
    TreeLogger.log('重做操作', treeData.value, { action: 'redo' });
}

/**
 * 刷新操作（恢复 GraphCanvas mount 时的 initialTreeData）
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 接收 graph.refresh() 后的快照
 *   2. 同步 treeData + 选中根节点 + 清空多选
 */
function handleRefresh(data: TreeData) {
    treeData.value = cloneDeep(data);
    selectNode(treeData.value);
    clearSelection();
    TreeLogger.log('刷新操作', treeData.value, { action: 'refresh' });
}

/**
 * 确认新增子节点
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. applyTreeChangeWithResult + SDK addChildNode()
 *   2. addChildNode 内部：找父节点 → 构造节点 → push 到 children
 *   3. graph.commit() 重绘并记录历史
 *   4. 关闭新增子节点模态框
 *
 * @param data 包含 name / level / integrationType 的表单数据
 *             其中 integrationType 是 IntegrationTypeKey 枚举（不是中文）
 */
function confirmAddNode(data: {
    name: string;
    level: LevelKey;
    integrationType: IntegrationTypeKey;
}) {
    const parentId = contextMenuNodeId.value;
    if (!parentId) {
        showAddModal.value = false;
        return;
    }
    const newNode = applyTreeChangeWithResult((root, ctx) =>
        ctx.addChildNode(root, {
            parentId,
            name: data.name,
            level: data.level,
            integrationType: data.integrationType
        })
    );
    if (newNode) {
        TreeLogger.log('新增子节点', treeData.value, {
            parentId,
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
 *   1. applyTreeChangeWithResult + SDK addModule()
 *   2. 重新选中父节点（Drawer 自动打开）
 *   3. 关闭模态框
 *
 * @param data 包含 name / dept 的表单数据
 */
function confirmAddModule(data: { name: string; dept: string }) {
    const parentId = contextMenuNodeId.value;
    if (!parentId) {
        showAddModuleModal.value = false;
        return;
    }
    const newModule = applyTreeChangeWithResult((root, ctx) =>
        ctx.addModule(root, { parentId, name: data.name, dept: data.dept })
    );
    if (newModule) {
        const parent = getCtx().findNodeInTree(treeData.value, parentId);
        if (parent) selectNode(parent.node);
        TreeLogger.log('新增功能模块', treeData.value, {
            parentId,
            newModuleId: newModule.id,
            newModuleLabel: newModule.label
        });
    }
    showAddModuleModal.value = false;
}

/**
 * 整合选中节点 → 合并为新节点
 * ----------------------------------------------------------------------------
 * 支持多个同级节点合并为一个新节点
 *
 * 步骤：
 *   1. applyTreeChangeWithResult + SDK mergeMultipleNodes()
 *   2. 合并所有选中节点的 children / modules / relations
 *   3. 创建新节点（继承优先级最高的层级）
 *   4. 选中新节点 + 清空多选
 *   5. 关闭模态框
 *
 * @param data 包含 name / dept / type 的表单数据
 *             其中 type 是 IntegrationTypeKey 枚举
 */
function confirmIntegrateModule(data: { name: string; dept: string; type: IntegrationTypeKey }) {
    const selectedNodeIds = selectedNodes.value.map((n) => n.id);
    const mergedNode = applyTreeChangeWithResult((root, ctx) => {
        const result = ctx.mergeMultipleNodes(root, {
            name: data.name,
            integrationType: data.type,
            nodeIds: selectedNodeIds
        });
        if (!result.ok) {
            message.error(result.message ?? '整合失败');
            return null;
        }
        return result.node ?? null;
    });

    if (mergedNode) {
        selectNode(mergedNode);
        clearSelection();
        TreeLogger.log('整合选中节点', treeData.value, {
            newNodeId: mergedNode.id,
            newNodeLabel: mergedNode.label,
            selectedCount: selectedNodeIds.length,
            integratedFrom: mergedNode.integratedFrom
        });
    }
    showIntegrateModal.value = false;
}

/**
 * 确认编辑节点属性
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. applyTreeChange + SDK editNode()
 *   2. 修改 label / dept / level / owner
 *   3. 重新选中该节点（Drawer 刷新）
 *   4. 关闭模态框
 *
 * @param data 包含 name / dept / level / owner 的表单数据
 */
function confirmEditNode(data: {
    name: string;
    dept: string;
    level: LevelKey | '';
    owner: string;
}) {
    const nodeId = contextMenuNodeId.value;
    if (!nodeId) {
        showEditModal.value = false;
        return;
    }
    applyTreeChange((root, ctx) => {
        ctx.editNode(root, {
            nodeId,
            name: data.name,
            dept: data.dept,
            level: data.level || undefined,
            owner: data.owner
        });
        return true;
    });
    const updated = getCtx().findNodeInTree(treeData.value, nodeId);
    if (updated) selectNode(updated.node);
    TreeLogger.log('编辑节点属性', treeData.value, {
        nodeId,
        newName: data.name,
        newLevel: data.level,
        newDept: data.dept,
        newOwner: data.owner
    });
    showEditModal.value = false;
}

/**
 * 确认绑定关联关系
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. applyTreeChange + SDK bindRelation()
 *   2. 在源节点 relations 追加 { targetId, targetName, type, name }
 *   3. 重新选中源节点 + 关闭模态框
 *
 * @param data 包含 targetId / type / name 的表单数据
 *             其中 type 是 IntegrationTypeKey 枚举，name 是整合名称
 */
function confirmBindRelation(data: { targetId: string; type: IntegrationTypeKey; name: string }) {
    const sourceId = contextMenuNodeId.value;
    if (!sourceId) {
        showBindRelationModal.value = false;
        return;
    }
    applyTreeChange((root, ctx) =>
        ctx.bindRelation(root, {
            sourceId,
            targetId: data.targetId,
            type: data.type,
            name: data.name
        })
    );
    const source = getCtx().findNodeInTree(treeData.value, sourceId);
    if (source) selectNode(source.node);
    TreeLogger.log('绑定关联关系', treeData.value, {
        sourceId,
        targetId: data.targetId,
        relationType: data.type,
        relationName: data.name
    });
    showBindRelationModal.value = false;
}

/**
 * 确认标注整合方式
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. applyTreeChange + SDK setNodeIntegration()
 *   2. 设置 integrationType / integrationTypeName
 *   3. graph.commit() 重绘（连线样式随类型变化）
 *   4. 关闭模态框
 *
 * @param data 包含 type 的表单数据
 *             其中 type 是 IntegrationTypeKey 枚举
 */
function confirmIntegration(data: { type: IntegrationTypeKey }) {
    const nodeId = contextMenuNodeId.value;
    if (!nodeId) {
        showIntegrationModal.value = false;
        return;
    }
    applyTreeChange((root, ctx) => ctx.setNodeIntegration(root, nodeId, data.type));
    TreeLogger.log('标注整合方式', treeData.value, {
        nodeId,
        integrationType: data.type
    });
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
 * 步骤详解（实现见 SDK mergeSiblingNodes）：
 *   1. 校验同级、合并层级规则 canSiblingMerge
 *   2. 合并 children / modules / relations（深拷贝去重）
 *   3. 取更高优先级 level，构造新节点 integratedFrom: [sourceId, targetId]
 *   4. 替换父节点 children 中的 source/target
 *   5. 全树更新 relations 中对旧 id 的引用
 *   6. graph.commit() + syncFromGraph() + 选中新节点
 */
function confirmMergeNodes(data: {
    name: string;
    integrationType: IntegrationTypeKey;
    sourceId: string;
    targetId: string;
}) {
    const mergedNode = applyTreeChangeWithResult((root, ctx) => {
        const result = ctx.mergeSiblingNodes(root, {
            name: data.name,
            integrationType: data.integrationType,
            sourceId: data.sourceId,
            targetId: data.targetId
        });
        if (!result.ok) {
            message.error(result.message ?? '合并失败');
            return null;
        }
        return result.node ?? null;
    });

    if (!mergedNode) {
        showMergeNodesModal.value = false;
        return;
    }

    selectNode(mergedNode);
    showMergeNodesModal.value = false;
    mergeSourceId.value = null;
    mergeTargetId.value = null;
    mergeSourceLabel.value = '';
    mergeTargetLabel.value = '';

    TreeLogger.log('拖拽合并节点', treeData.value, {
        sourceId: data.sourceId,
        targetId: data.targetId,
        newNodeId: mergedNode.id,
        newNodeLabel: mergedNode.label,
        newNodeLevel: mergedNode.level,
        integratedFrom: mergedNode.integratedFrom
    });
}

/**
 * 删除节点
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 阻止删除根节点（id='edu'）
 *   2. confirm 确认
 *   3. applyTreeChange + SDK deleteNodeFromTree()（含 removeRelationsToNode）
 *   4. 重新选中根节点
 *   5. 隐藏右键菜单
 */
function deleteNode() {
    const nodeId = contextMenuNodeId.value;
    if (!nodeId) return;
    const protectedRootId = getGraph()?.getProtectedRootId() ?? DATA_D3_ROOT_ID;
    if (nodeId === protectedRootId) return message.warning('不能删除根节点');
    if (!confirm('确定删除该节点及其所有子节点和模块吗？')) return;

    const deleted = getCtx().findNodeInTree(treeData.value, nodeId);
    applyTreeChange((root, ctx) => {
        ctx.deleteNodeFromTree(root, nodeId);
        return true;
    });
    if (deleted) {
        TreeLogger.log('删除节点', treeData.value, {
            deletedNodeId: nodeId,
            deletedNodeLabel: getCtx().accessors.getLabel(deleted.node),
            parentId: deleted.parent ? getCtx().accessors.getId(deleted.parent) : undefined
        });
    }
    selectNode(treeData.value);

    const contextMenu = document.getElementById('context-menu');
    if (contextMenu) contextMenu.style.display = 'none';
}

/**
 * Drawer 内"修改负责人"输入框更新
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 修改 selectedNodeData.owner
 *   2. graph.commit({ recordHistory: true }) 写入历史并重绘
 *   3. syncFromGraph() 保持 treeData 一致
 *
 * @param value 新的负责人
 */
function updateOwner(value: string) {
    if (!selectedNodeData.value) return;
    selectedNodeData.value.owner = value;
    getGraph()?.commit({ recordHistory: true });
    syncFromGraph();
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
    message.info(`编辑关系: ${relation.targetName}`);
}

/**
 * Drawer 内"删除关系"操作
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 过滤 selectedNodeData.relations
 *   2. graph.commit() + syncFromGraph()
 *
 * @param relation 要删除的关系
 */
function deleteRelation(relation: { targetId: string; targetName: string; type: string }) {
    if (!selectedNodeData.value?.relations) return;
    selectedNodeData.value.relations = selectedNodeData.value.relations.filter(
        (r) => r.targetId !== relation.targetId
    );
    getGraph()?.commit({ recordHistory: true });
    syncFromGraph();
}
</script>

<style lang="scss">
@import url('./index.scss');
</style>
