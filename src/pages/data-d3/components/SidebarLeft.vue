<!--
    SidebarLeft - 左侧图例栏
    ========================================================================

    内容：
      1. 应用目录树标题（教育局根节点）
      2. 整合方式图例（合并/迁移/接口对接/停用下线）颜色对照
      3. 节点层级图例（领域级/部门级综合/部门级单点/处室级/功能模块）
      4. 多选状态下显示"已选 N 项" + 整合应用 / 清除选择 按钮

    事件：
      @reset-tree          重置整棵树（重新加载 mock 数据）
      @fit-view            适应屏幕
      @show-integrate-modal 打开"整合选中模块"模态框
      @remove-selected     清除所有已选节点

    ========================================================================
-->
<template>
    <div class="sidebar-left">
        <div class="filter-section">
            <label>📁 应用整合目录树</label>
            <div class="tree-root">教育局 (根节点)</div>
        </div>

        <div class="legend-section">
            <label>🔗 整合方式</label>
            <div class="legend-item">
                <div class="legend-line solid" :style="{ background: EDGE_STYLES.merge }"></div>
                {{ INTEGRATION_TYPE_NAME.merge }}
            </div>
            <div class="legend-item">
                <div class="legend-line solid" :style="{ background: EDGE_STYLES.migrate }"></div>
                {{ INTEGRATION_TYPE_NAME.migrate }}
            </div>
            <div class="legend-item">
                <div
                    class="legend-line solid"
                    :style="{ background: EDGE_STYLES.integration }"
                ></div>
                {{ INTEGRATION_TYPE_NAME.integration }}
            </div>
            <div class="legend-item">
                <div
                    class="legend-line dashed"
                    :style="{ background: EDGE_STYLES.deprecate }"
                ></div>
                {{ INTEGRATION_TYPE_NAME.deprecate }}
            </div>
            <div class="legend-item">
                <div
                    class="legend-line solid"
                    :style="{ background: EDGE_STYLES.module_merge }"
                ></div>
                {{ INTEGRATION_TYPE_NAME.module_merge }}
            </div>
        </div>

        <div class="legend-section">
            <label>🏷️ 层级类型</label>
            <div class="legend-item">
                <div class="legend-color" :style="{ background: LEVEL_CONFIG.domain.color }"></div>
                {{ LEVEL_CONFIG.domain.name }}
            </div>
            <div class="legend-item">
                <div
                    class="legend-color"
                    :style="{ background: LEVEL_CONFIG.dept_composite.color }"
                ></div>
                {{ LEVEL_CONFIG.dept_composite.name }}
            </div>
            <div class="legend-item">
                <div
                    class="legend-color"
                    :style="{ background: LEVEL_CONFIG.dept_single.color }"
                ></div>
                {{ LEVEL_CONFIG.dept_single.name }}
            </div>
            <div class="legend-item">
                <div
                    class="legend-color"
                    :style="{ background: LEVEL_CONFIG.office_single.color }"
                ></div>
                {{ LEVEL_CONFIG.office_single.name }}
            </div>
            <div class="legend-item">
                <div class="legend-color" :style="{ background: LEVEL_CONFIG.module.color }"></div>
                {{ LEVEL_CONFIG.module.name }}
            </div>
        </div>

        <div class="quick-actions">
            <button class="primary" @click="$emit('reset-tree')">🔄 重置布局</button>
            <button @click="$emit('fit-view')">🎯 适应屏幕</button>
            <button @click="$emit('show-integrate-modal')" :disabled="selectedCount < 2">
                🔗 整合选中节点
            </button>
        </div>

        <div class="selected-info" v-if="selectedCount > 0">
            <label>📋 已选择 {{ selectedCount }} 个节点</label>
            <div class="selected-list">
                <div v-for="node in selectedNodes" :key="node.id" class="selected-item">
                    {{ node.label }}
                    <span class="remove" @click="$emit('remove-selected', node.id)">×</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
/**
 * ========================================================================
 * SidebarLeft.vue 左侧图例栏
 * ========================================================================
 *
 * 功能：
 *   - 展示树根标题
 *   - 展示整合方式图例（合并/迁移/接口对接/停用下线/模块整合 的颜色）
 *   - 展示层级图例（领域级/部门级综合/部门级单点/处室级/功能模块）
 *   - 快速操作按钮：重置布局、适应屏幕、整合选中模块
 *   - 显示已选节点列表 + 单独移除某项
 *
 * D3 关联：
 *   - 此组件不直接操作 D3，仅做"图例展示 + 事件触发"
 *   - 发出 reset-tree / fit-view / show-integrate-modal / remove-selected 事件
 *   - 由父组件 index.vue 调用 GraphCanvas 的 renderTree / fitView 完成 D3 重绘
 *
 * ========================================================================
 */
import type { SelectedNode } from '../types';
import { EDGE_STYLES, INTEGRATION_TYPE_NAME, LEVEL_CONFIG } from '../types';

/** 父组件传入的 props：已选节点 + 数量 */
defineProps<{
    selectedNodes: SelectedNode[];
    selectedCount: number;
}>();

/** 父组件监听的事件：重置 / 适应屏幕 / 打开整合模态框 / 移除单个选中 */
defineEmits<{
    (e: 'reset-tree'): void;
    (e: 'fit-view'): void;
    (e: 'show-integrate-modal'): void;
    (e: 'remove-selected', nodeId: string): void;
}>();
</script>
