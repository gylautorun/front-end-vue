<template>
    <a-drawer v-model:open="open" title="节点详情" placement="right" :width="320">
        <SidebarRight
            :selected-node="selectedNode"
            @update-owner="emit('update-owner', $event)"
            @show-module-detail="emit('show-module-detail', $event)"
            @edit-relation="emit('edit-relation', $event)"
            @delete-relation="emit('delete-relation', $event)"
        />
    </a-drawer>
</template>

<script setup lang="ts">
import SidebarRight from './SidebarRight.vue';
import type { TreeData } from '../types';

type Relation = {
    targetId: string;
    targetName: string;
    type: string;
};

const open = defineModel<boolean>('open', { required: true });

defineProps<{
    selectedNode: TreeData | null;
}>();

const emit = defineEmits<{
    (e: 'update-owner', value: string): void;
    (e: 'show-module-detail', module: TreeData): void;
    (e: 'edit-relation', relation: Relation): void;
    (e: 'delete-relation', relation: Relation): void;
}>();
</script>
