<!--
    Modals - 业务模态框集合
    ========================================================================

    包含 7 个模态框（均通过 v-if/v-show 控制显隐）：
      1. add-node-modal       新增子节点
      2. add-module-modal     新增功能模块（挂到当前选中节点下）
      3. integrate-modal      整合选中模块（把多选节点整合为新模块）
      4. edit-node-modal      编辑属性（名称/层级/部门/负责人）
      5. bind-relation-modal  绑定节点间关系
      6. integration-modal    标注整合方式（合并/迁移/接口对接/停用下线）
      7. merge-nodes-modal    拖拽合并节点（拖到同级节点时弹出）

    Props 形式受控（每个 :show-* 双向控制 + 关闭事件 + 确认事件）：
      :show-add-modal="showAddModal"     @close-add-modal="..."
      @confirm-add-node="confirmAddNode" 提交后由父组件修改 treeData

    ========================================================================
-->
<template>
    <!-- 新增子节点 -->
    <div class="modal-overlay" id="add-node-modal" :class="{ show: showAddModal }">
        <div class="modal">
            <h3>➕ 新增子节点</h3>
            <div class="form-group">
                <label>节点名称</label><input type="text" v-model="newNodeName" />
            </div>
            <div class="form-group">
                <label>应用层级</label>
                <select v-model="newNodeLevel">
                    <option value="domain">领域级应用</option>
                    <option value="dept_composite">部门级综合应用</option>
                    <option value="dept_single">部门级单点应用</option>
                    <option value="office_single">处室级单点应用</option>
                </select>
            </div>
            <div class="form-group">
                <label>整合方式</label>
                <select v-model="newNodeIntegrationType">
                    <option v-for="opt in INTEGRATION_TYPE_OPTIONS" :key="opt.key" :value="opt.key">
                        {{ opt.name }}
                    </option>
                </select>
            </div>
            <div class="modal-actions">
                <button @click="$emit('close-add-modal')">取消</button>
                <button class="primary" @click="handleConfirmAddNode">确定</button>
            </div>
        </div>
    </div>

    <!-- 新增模块 -->
    <div class="modal-overlay" id="add-module-modal" :class="{ show: showAddModuleModal }">
        <div class="modal">
            <h3>📦 新增功能模块</h3>
            <div class="form-group">
                <label>模块名称</label><input type="text" v-model="newModuleName" />
            </div>
            <div class="form-group">
                <label>所属部门</label><input type="text" v-model="newModuleDept" />
            </div>
            <div class="modal-actions">
                <button @click="$emit('close-add-module-modal')">取消</button>
                <button class="primary" @click="handleConfirmAddModule">确定</button>
            </div>
        </div>
    </div>

    <!-- 整合模块 -->
    <div class="modal-overlay" id="integrate-module-modal" :class="{ show: showIntegrateModal }">
        <div class="modal" style="min-width: 450px">
            <h3>🔗 整合选中模块</h3>
            <div class="form-group">
                <label>已选择的模块</label>
                <div class="selected-modules">
                    <div v-for="node in selectedNodes" :key="node.id" class="selected-tag">
                        {{ node.label }}
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label>新模块名称</label>
                <input type="text" v-model="newIntegratedModuleName" placeholder="输入新模块名称" />
            </div>
            <div class="form-group">
                <label>所属部门</label>
                <input type="text" v-model="newIntegratedModuleDept" placeholder="输入所属部门" />
            </div>
            <div class="form-group">
                <label>整合方式</label>
                <select v-model="integrateType">
                    <option v-for="opt in INTEGRATION_TYPE_OPTIONS" :key="opt.key" :value="opt.key">
                        {{ opt.name }}
                    </option>
                </select>
            </div>
            <div class="modal-actions">
                <button @click="$emit('close-integrate-modal')">取消</button>
                <button class="primary" @click="handleConfirmIntegrateModule">确定整合</button>
            </div>
        </div>
    </div>

    <!-- 编辑节点属性 -->
    <div class="modal-overlay" id="edit-node-modal" :class="{ show: showEditModal }">
        <div class="modal">
            <h3>✏️ 编辑属性</h3>
            <div class="form-group">
                <label>名称</label><input type="text" v-model="editNodeName" />
            </div>
            <div class="form-group">
                <label>所属部门</label><input type="text" v-model="editNodeDept" />
            </div>
            <div class="form-group">
                <label>层级/类型</label>
                <select v-model="editNodeLevel">
                    <option value="domain">领域级应用</option>
                    <option value="dept_composite">部门级综合应用</option>
                    <option value="dept_single">部门级单点应用</option>
                    <option value="office_single">处室级单点应用</option>
                    <option value="module">功能模块</option>
                </select>
            </div>
            <div class="form-group">
                <label>负责人</label><input type="text" v-model="editNodeOwner" />
            </div>
            <div class="modal-actions">
                <button @click="$emit('close-edit-modal')">取消</button>
                <button class="primary" @click="handleConfirmEditNode">保存</button>
            </div>
        </div>
    </div>

    <!-- 绑定关联关系 -->
    <div class="modal-overlay" id="bind-relation-modal" :class="{ show: showBindRelationModal }">
        <div class="modal">
            <h3>🔗 绑定关联关系</h3>
            <p style="color: #666; font-size: 12px; margin-bottom: 12px">
                为节点
                <b>{{ bindRelationSourceLabel }}</b>
                绑定新的关联关系
            </p>
            <div class="form-group">
                <label>关联对象</label>
                <select v-model="relationTarget">
                    <option v-for="app in availableApps" :key="app.id" :value="app.id">
                        {{ app.label }}
                    </option>
                </select>
            </div>
            <div class="form-group">
                <label>整合方式</label>
                <select v-model="relationType">
                    <option v-for="opt in INTEGRATION_TYPE_OPTIONS" :key="opt.key" :value="opt.key">
                        {{ opt.name }}
                    </option>
                </select>
            </div>
            <div class="form-group">
                <label>整合名称 <span style="color: red">*</span></label>
                <input
                    v-model="relationName"
                    type="text"
                    placeholder="请输入整合名称"
                    @keyup.enter="handleConfirmBindRelation"
                />
            </div>
            <div class="modal-actions">
                <button @click="$emit('close-bind-relation-modal')">取消</button>
                <button class="primary" @click="handleConfirmBindRelation">确定</button>
            </div>
        </div>
    </div>

    <!-- 标注整合方式 -->
    <div class="modal-overlay" id="integration-modal" :class="{ show: showIntegrationModal }">
        <div class="modal">
            <h3>🏷️ 标注整合方式</h3>
            <div class="form-group">
                <label>整合方式</label>
                <select v-model="integrationType">
                    <option v-for="opt in INTEGRATION_TYPE_OPTIONS" :key="opt.key" :value="opt.key">
                        {{ opt.name }}
                    </option>
                </select>
            </div>
            <div class="modal-actions">
                <button @click="$emit('close-integration-modal')">取消</button>
                <button class="primary" @click="handleConfirmIntegration">确定</button>
            </div>
        </div>
    </div>

    <!--
        拖拽合并节点弹框（v6 7）弹框时由拖拽的 dragend 触发
        - 显隐：showMergeNodesModal
        - 表单：mergeNodeName（必填）+ mergeNodeIntegrationType（默认 "merge"）
        - 确定 → emit('confirm-merge-nodes', { name, integrationType, sourceId, targetId })
    -->
    <div class="modal-overlay" id="merge-nodes-modal" :class="{ show: showMergeNodesModal }">
        <div class="modal">
            <h3>🔗 拖拽合并节点</h3>
            <p style="color: #666; font-size: 12px; margin-bottom: 12px">
                将节点
                <b>{{ mergeSourceLabel }}</b>
                与
                <b>{{ mergeTargetLabel }}</b>
                合并为新节点，新节点将自动包含两个节点的全部子节点
            </p>
            <div class="form-group">
                <label>新节点名称 <span style="color: red">*</span></label>
                <input
                    v-model="mergeNodeName"
                    type="text"
                    placeholder="请输入新节点名称"
                    @keyup.enter="handleConfirmMergeNodes"
                />
            </div>
            <div class="form-group">
                <label>整合方式</label>
                <select v-model="mergeNodeIntegrationType">
                    <option v-for="opt in INTEGRATION_TYPE_OPTIONS" :key="opt.key" :value="opt.key">
                        {{ opt.name }}
                    </option>
                </select>
            </div>
            <div class="modal-actions">
                <button @click="$emit('close-merge-nodes-modal')">取消</button>
                <button class="primary" @click="handleConfirmMergeNodes">确定合并</button>
            </div>
        </div>
    </div>

    <!-- 模块详情弹框 -->
    <div class="modal-overlay" id="module-detail-modal" :class="{ show: showModuleDetailModal }">
        <div class="modal">
            <h3>📦 模块详情</h3>
            <div class="detail-info" v-if="selectedModuleDetail">
                <div class="form-group">
                    <label>模块名称</label>
                    <div class="detail-value">{{ selectedModuleDetail.label }}</div>
                </div>
                <div class="form-group">
                    <label>所属部门</label>
                    <div class="detail-value">{{ selectedModuleDetail.dept || '-' }}</div>
                </div>
                <div class="form-group">
                    <label>负责人</label>
                    <div class="detail-value">{{ selectedModuleDetail.owner || '-' }}</div>
                </div>
                <div class="form-group">
                    <label>层级</label>
                    <div class="detail-value">
                        {{
                            LEVEL_CONFIG[selectedModuleDetail.level]?.name ||
                            selectedModuleDetail.level
                        }}
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button @click="$emit('close-module-detail-modal')">关闭</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * ========================================================================
 * Modals.vue 业务模态框组件
 * ========================================================================
 *
 * 包含 7 个模态框，对应 7 个 showXxxModal ref：
 *   1. add-node-modal       新增子节点
 *   2. add-module-modal     新增功能模块
 *   3. integrate-modal      整合选中模块
 *   4. edit-node-modal      编辑属性
 *   5. bind-relation-modal  绑定关联关系
 *   6. integration-modal    标注整合方式
 *   7. merge-nodes-modal    拖拽合并节点
 *
 * 数据流：
 *   - Props 传入 showXxxModal（控制显隐）+ treeData / contextMenuNodeId 等
 *   - watch 监听 show* 变化时初始化表单字段（清空/预填充）
 *   - 用户点击"确定" → handleConfirm* 校验 → emit('confirm-*')
 *   - 父组件 index.vue 收到事件后修改 treeData → 重新 d3.hierarchy + renderTree
 *
 * D3 关联：
 *   - 此组件本身不直接操作 D3，仅作为"表单数据 → 父组件"的中转
 *   - 修改 treeData 后由 index.vue 触发 renderTree
 *
 * 整合方式统一为枚举（IntegrationTypeKey）：
 *   - 表单使用 INTEGRATION_TYPE_OPTIONS 生成下拉选项
 *   - 提交时 emit 的 integrationType / type 是枚举 key
 *   - 中文名称由父组件通过 INTEGRATION_TYPE_NAME[key] 映射到 integrationTypeName
 *
 * ========================================================================
 */
import { ref, watch } from 'vue';
import type { TreeData, SelectedNode, LevelKey } from '../types';
import { INTEGRATION_TYPE_OPTIONS, IntegrationTypeKey, LEVEL_CONFIG } from '../types';

/** 父组件传入的 props：模态框显隐 + 选中状态 + 树数据 */
const props = defineProps<{
    showAddModal: boolean;
    showAddModuleModal: boolean;
    showIntegrateModal: boolean;
    showEditModal: boolean;
    showBindRelationModal: boolean;
    showIntegrationModal: boolean;
    /** 拖拽合并节点弹框显隐（由 d3 dragend 命中同级节点时打开） */
    showMergeNodesModal: boolean;
    selectedNodes: SelectedNode[];
    availableApps: TreeData[];
    contextMenuNodeId: string | null;
    treeData: TreeData;
    /** 拖拽合并弹框内：源节点 ID / 目标节点 ID / 源名称 / 目标名称 */
    mergeSourceId: string | null;
    mergeTargetId: string | null;
    mergeSourceLabel: string;
    mergeTargetLabel: string;
    /** 绑定关系弹框内：源节点名称（用于显示） */
    bindRelationSourceLabel: string;
    /** 模块详情弹框显隐 */
    showModuleDetailModal: boolean;
    /** 选中的模块详情数据 */
    selectedModuleDetail: TreeData | null;
}>();

/** 父组件监听的事件：关闭模态框 + 确认提交表单数据 */
const emit = defineEmits<{
    (e: 'close-add-modal'): void;
    (e: 'close-add-module-modal'): void;
    (e: 'close-integrate-modal'): void;
    (e: 'close-module-detail-modal'): void;
    (e: 'close-edit-modal'): void;
    (e: 'close-bind-relation-modal'): void;
    (e: 'close-integration-modal'): void;
    (e: 'close-merge-nodes-modal'): void;
    (
        e: 'confirm-add-node',
        data: { name: string; level: LevelKey; integrationType: IntegrationTypeKey }
    ): void;
    (e: 'confirm-add-module', data: { name: string; dept: string }): void;
    (
        e: 'confirm-integrate-module',
        data: { name: string; dept: string; type: IntegrationTypeKey }
    ): void;
    (
        e: 'confirm-edit-node',
        data: { name: string; dept: string; level: LevelKey | ''; owner: string }
    ): void;
    (
        e: 'confirm-bind-relation',
        data: { targetId: string; type: IntegrationTypeKey; name: string }
    ): void;
    (e: 'confirm-integration', data: { type: IntegrationTypeKey }): void;
    (
        e: 'confirm-merge-nodes',
        data: {
            name: string;
            integrationType: IntegrationTypeKey;
            sourceId: string;
            targetId: string;
        }
    ): void;
}>();

/** 各模态框表单的双向绑定状态（整合方式使用 IntegrationTypeKey 枚举 key） */
const newNodeName = ref('');
const newNodeLevel = ref<LevelKey>('office_single');
const newNodeIntegrationType = ref<IntegrationTypeKey>(IntegrationTypeKey.base);
const newModuleName = ref('');
const newModuleDept = ref('');
const newIntegratedModuleName = ref('');
const newIntegratedModuleDept = ref('');
const integrateType = ref<IntegrationTypeKey>(IntegrationTypeKey.merge);
const editNodeName = ref('');
const editNodeDept = ref('');
const editNodeLevel = ref<LevelKey | ''>('');
const editNodeOwner = ref('');
const relationTarget = ref('');
const relationType = ref<IntegrationTypeKey>(IntegrationTypeKey.integration);
const relationName = ref('');
const integrationType = ref<IntegrationTypeKey>(IntegrationTypeKey.integration);
/** 拖拽合并弹框的表单状态 */
const mergeNodeName = ref('');
const mergeNodeIntegrationType = ref<IntegrationTypeKey>(IntegrationTypeKey.merge);

/**
 * 监听"新增子节点"模态框打开
 * 步骤：
 *   1. 清空所有表单字段
 *   2. 把默认值重置（level / integrationType）
 */
watch(
    () => props.showAddModal,
    (val) => {
        if (val) {
            newNodeName.value = '';
            newNodeLevel.value = 'office_single';
            newNodeIntegrationType.value = IntegrationTypeKey.base;
        }
    }
);

/**
 * 监听"新增模块"模态框打开
 * 步骤：清空名称和部门
 */
watch(
    () => props.showAddModuleModal,
    (val) => {
        if (val) {
            newModuleName.value = '';
            newModuleDept.value = '';
        }
    }
);

/**
 * 监听"整合模块"模态框打开
 * 步骤：清空新名称/部门 + 整合方式默认"合并"
 */
watch(
    () => props.showIntegrateModal,
    (val) => {
        if (val) {
            newIntegratedModuleName.value = '';
            newIntegratedModuleDept.value = '';
            integrateType.value = IntegrationTypeKey.merge;
        }
    }
);

/**
 * 监听"编辑属性"模态框打开
 * 步骤：
 *   1. 根据 contextMenuNodeId 在 treeData 中找到目标节点
 *   2. 把节点现有值预填到表单
 */
watch(
    () => props.showEditModal,
    (val) => {
        if (val && props.contextMenuNodeId) {
            const node = findNodeById(props.treeData, props.contextMenuNodeId);
            if (node) {
                editNodeName.value = node.label;
                editNodeDept.value = node.dept;
                editNodeLevel.value = node.level;
                editNodeOwner.value = node.owner;
            }
        }
    }
);

/**
 * 监听"绑定关系"模态框打开
 * 步骤：清空目标 + 重置关系类型 + 清空整合名称
 */
watch(
    () => props.showBindRelationModal,
    (val) => {
        if (val) {
            relationTarget.value = '';
            relationType.value = IntegrationTypeKey.integration;
            relationName.value = '';
        }
    }
);

/**
 * 监听"标注整合方式"模态框打开
 * 步骤：
 *   1. 找到目标节点
 *   2. 预填当前的 integrationType
 */
watch(
    () => props.showIntegrationModal,
    (val) => {
        if (val && props.contextMenuNodeId) {
            const node = findNodeById(props.treeData, props.contextMenuNodeId);
            if (node?.integrationType) {
                integrationType.value = node.integrationType;
            }
        }
    }
);

/**
 * 监听"拖拽合并节点"模态框打开
 * 步骤：
 *   1. 清空新节点名称输入
 *   2. 重置整合方式默认值 = "merge"（合并）
 *   3. （源/目标节点信息由父组件传 props 提供，模板直接展示）
 */
watch(
    () => props.showMergeNodesModal,
    (val) => {
        if (val) {
            mergeNodeName.value = `${props.mergeSourceLabel} 与 ${props.mergeTargetLabel}`;
            mergeNodeIntegrationType.value = IntegrationTypeKey.merge;
        }
    }
);

/**
 * 在树中根据 ID 查找节点
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 当前节点匹配 → 返回
 *   2. 递归查找 children
 *   3. 找不到返回 null
 *
 * @param   node 当前遍历到的节点
 * @param   id   要查找的节点 ID
 * @returns      找到的节点 / null
 */
function findNodeById(node: TreeData, id: string): TreeData | null {
    if (node.id === id) return node;
    if (node.children) {
        for (const child of node.children) {
            const found = findNodeById(child, id);
            if (found) return found;
        }
    }
    return null;
}

/** 提交"新增子节点"表单 → emit 给父组件（integrationType 是枚举 key） */
function handleConfirmAddNode() {
    if (!newNodeName.value) return alert('请输入名称');
    emit('confirm-add-node', {
        name: newNodeName.value,
        level: newNodeLevel.value,
        integrationType: newNodeIntegrationType.value
    });
}

/** 提交"新增模块"表单 → emit 给父组件 */
function handleConfirmAddModule() {
    if (!newModuleName.value) return alert('请输入模块名称');
    emit('confirm-add-module', {
        name: newModuleName.value,
        dept: newModuleDept.value
    });
}

/** 提交"整合模块"表单 → emit 给父组件（type 是枚举 key） */
function handleConfirmIntegrateModule() {
    if (!newIntegratedModuleName.value) return alert('请输入新模块名称');
    if (props.selectedNodes.length < 2) return alert('请至少选择2个模块进行整合');
    emit('confirm-integrate-module', {
        name: newIntegratedModuleName.value,
        dept: newIntegratedModuleDept.value,
        type: integrateType.value
    });
}

/** 提交"编辑属性"表单 → emit 给父组件 */
function handleConfirmEditNode() {
    emit('confirm-edit-node', {
        name: editNodeName.value,
        dept: editNodeDept.value,
        level: editNodeLevel.value,
        owner: editNodeOwner.value
    });
}

/** 提交"绑定关系"表单 → emit 给父组件（type 是枚举 key） */
function handleConfirmBindRelation() {
    if (!relationTarget.value) return alert('请选择关联对象');
    if (!relationName.value.trim()) return alert('请输入整合名称');
    emit('confirm-bind-relation', {
        targetId: relationTarget.value,
        type: relationType.value,
        name: relationName.value.trim()
    });
}

/** 提交"标注整合方式"表单 → emit 给父组件（type 是枚举 key） */
function handleConfirmIntegration() {
    emit('confirm-integration', { type: integrationType.value });
}

/**
 * 提交"拖拽合并节点"表单 → emit 给父组件（integrationType 是枚举 key）
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 校验新名称非空
 *   2. 校验源/目标 ID 必传
 *   3. emit('confirm-merge-nodes', { name, integrationType, sourceId, targetId })
 *      让父组件执行真正的"替换原节点 + 合并子节点"逻辑 + 重新 d3.hierarchy
 */
function handleConfirmMergeNodes() {
    if (!mergeNodeName.value.trim()) return alert('请输入新节点名称');
    if (!props.mergeSourceId || !props.mergeTargetId) {
        return alert('合并信息丢失，请重新拖拽');
    }
    emit('confirm-merge-nodes', {
        name: mergeNodeName.value.trim(),
        integrationType: mergeNodeIntegrationType.value,
        sourceId: props.mergeSourceId,
        targetId: props.mergeTargetId
    });
}
</script>

<style scoped>
.selected-modules {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.selected-tag {
    padding: 4px 12px;
    background: #e6f7ff;
    color: #1890ff;
    border-radius: 4px;
}

.detail-info .form-group {
    margin-bottom: 12px;
}

.detail-info label {
    font-weight: 500;
    color: #666;
    margin-bottom: 4px;
    display: block;
}

.detail-value {
    color: #333;
    padding: 6px 0;
}
</style>
