<!--
    SidebarRight - 节点详情面板（已弃用）
    ========================================================================

    旧版本：作为固定右侧栏显示当前选中节点详情
    新版本：详情由 NodeDetailDrawer 包装为抽屉，点击节点时弹出

    保留原因：作为组件备份，方便对比固定栏 vs 弹框两种方案

    ========================================================================
-->
<template>
    <div class="sidebar-right">
        <h3>应用详情</h3>
        <div class="detail-form" id="node-detail">
            <div class="form-item">
                <label>名称</label>
                <input
                    type="text"
                    id="detail-name"
                    :value="selectedNode?.label || ''"
                    @change="handleNameChange"
                />
            </div>
            <div class="form-item">
                <label>所属部门</label>
                <input
                    type="text"
                    id="detail-dept"
                    :value="selectedNode?.dept || ''"
                    @change="handleDeptChange"
                />
            </div>
            <div class="form-item">
                <label>应用层级</label>
                <a-select
                    id="detail-level"
                    :value="selectedNode?.level"
                    @change="handleLevelChange"
                    style="width: 100%"
                >
                    <a-select-option :value="LevelKey.Domain">领域级应用</a-select-option>
                    <a-select-option :value="LevelKey.DeptComposite"
                        >部门级综合应用</a-select-option
                    >
                    <a-select-option :value="LevelKey.DeptSingle">部门级单点应用</a-select-option>
                    <a-select-option :value="LevelKey.OfficeSingle">处室级单点应用</a-select-option>
                    <a-select-option :value="LevelKey.Module">功能模块</a-select-option>
                    <a-select-option :value="LevelKey.Base">基础</a-select-option>
                </a-select>
            </div>
            <div class="form-item">
                <label>负责人</label>
                <input
                    type="text"
                    id="detail-owner"
                    :value="selectedNode?.owner || ''"
                    @change="handleOwnerChange"
                />
            </div>
        </div>

        <h3>子模块列表</h3>
        <div class="module-list" id="module-list">
            <div v-if="modules.length === 0" class="empty">暂无子模块</div>
            <div
                v-for="module in modules"
                :key="module.id"
                class="module-item"
                @click="$emit('show-module-detail', module)"
            >
                <div class="module-name">{{ module.label }}</div>
                <div class="module-type" :style="{ color: LEVEL_CONFIG[module.level]?.color }">
                    {{ LEVEL_CONFIG[module.level]?.name || module.level }}
                </div>
            </div>
        </div>

        <h3>整合关系列表</h3>
        <table class="relation-table">
            <thead>
                <tr>
                    <th>关联对象</th>
                    <th>整合方式</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(relation, index) in relations" :key="index">
                    <td>{{ relation.targetName }}</td>
                    <td :style="{ color: EDGE_STYLES[relation.type] }">
                        {{ relation.type }}
                    </td>
                    <td>
                        <span class="action-link" @click="$emit('edit-relation', relation)"
                            >编辑</span
                        >
                        <span class="action-link danger" @click="$emit('delete-relation', relation)"
                            >删除</span
                        >
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TreeData } from '../types';
import { LEVEL_CONFIG, EDGE_STYLES, LevelKey } from '../types';

const props = defineProps<{
    selectedNode: TreeData | null;
}>();

const emit = defineEmits<{
    (e: 'update-name', value: string): void;
    (e: 'update-dept', value: string): void;
    (e: 'update-level', value: string): void;
    (e: 'update-owner', value: string): void;
    (e: 'show-module-detail', module: TreeData): void;
    (e: 'edit-relation', relation: { targetId: string; targetName: string; type: string }): void;
    (e: 'delete-relation', relation: { targetId: string; targetName: string; type: string }): void;
}>();

const modules = computed(() => {
    if (!props.selectedNode?.modules) return [];
    return props.selectedNode.modules;
});

const relations = computed(() => {
    if (!props.selectedNode?.relations) return [];
    return props.selectedNode.relations;
});

function handleNameChange(event: Event) {
    const target = event.target as HTMLInputElement;
    emit('update-name', target.value);
}

function handleDeptChange(event: Event) {
    const target = event.target as HTMLInputElement;
    emit('update-dept', target.value);
}

function handleLevelChange(value: string) {
    emit('update-level', value);
}

function handleOwnerChange(event: Event) {
    const target = event.target as HTMLInputElement;
    emit('update-owner', target.value);
}
</script>

<style lang="scss" scoped>
.sidebar-right {
    h3 {
        font-size: 14px;
        color: #333;
        margin-bottom: 16px;
        padding-bottom: 8px;
        border-bottom: 1px solid #e8e8e8;
    }

    .detail-form .form-item {
        margin-bottom: 12px;
    }

    .detail-form label {
        display: block;
        font-size: 12px;
        color: #999;
        margin-bottom: 4px;
    }

    .detail-form .value {
        font-size: 13px;
        color: #333;
        padding: 6px 0;
    }

    .detail-form select,
    .detail-form input {
        width: 100%;
        padding: 6px 8px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        font-size: 13px;
    }

    .relation-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
    }

    .relation-table th,
    .relation-table td {
        padding: 8px;
        text-align: left;
        border-bottom: 1px solid #e8e8e8;
    }

    .relation-table th {
        background: #fafafa;
        color: #666;
        font-weight: normal;
    }

    .relation-table .action-link {
        color: #1890ff;
        cursor: pointer;
        margin-right: 8px;
    }

    .relation-table .action-link.danger {
        color: #f5222d;
    }
}
</style>
