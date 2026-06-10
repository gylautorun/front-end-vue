<!--
    SidebarRight - 节点详情面板（已弃用）
    ========================================================================

    旧版本：作为固定右侧栏显示当前选中节点详情
    新版本：详情改用 <a-drawer> 弹框，点击节点时弹出
           （详见 index.vue 的 <a-drawer> 标签）

    保留原因：作为组件备份，方便对比固定栏 vs 弹框两种方案

    ========================================================================
-->
<template>
    <div class="sidebar-right">
        <h3>应用详情</h3>
        <div class="detail-form" id="node-detail">
            <div class="form-item">
                <label>名称</label>
                <div class="value" id="detail-name">{{ selectedNode?.label || '-' }}</div>
            </div>
            <div class="form-item">
                <label>类型</label>
                <div class="value" id="detail-type">{{ selectedNode?.level || '-' }}</div>
            </div>
            <div class="form-item">
                <label>所属部门</label>
                <div class="value" id="detail-dept">{{ selectedNode?.dept || '-' }}</div>
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
                :class="{ selected: isSelected(module.id) }"
                @click="$emit('toggle-select-module', module)"
            >
                <div class="module-name">{{ module.label }}</div>
                <div class="module-type" :style="{ color: NODE_COLORS[module.level] }">
                    {{ module.level }}
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
import { NODE_COLORS, EDGE_STYLES } from '../types';

const props = defineProps<{
    selectedNode: TreeData | null;
    selectedModuleIds: string[];
}>();

const emit = defineEmits<{
    (e: 'update-owner', value: string): void;
    (e: 'toggle-select-module', module: TreeData): void;
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

function isSelected(moduleId: string): boolean {
    return props.selectedModuleIds.includes(moduleId);
}

function handleOwnerChange(event: Event) {
    const target = event.target as HTMLInputElement;
    emit('update-owner', target.value);
}
</script>
