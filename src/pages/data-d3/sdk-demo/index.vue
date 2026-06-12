<!--
  D3TreeGraph SDK 演示页（框架无关 SDK + 薄 Vue 壳）
  展示如何在任意框架中通过 D3TreeGraph 类使用树图能力
-->
<template>
    <div class="sdk-demo-page">
        <header class="sdk-demo-header">
            <h1>D3 Tree SDK 演示</h1>
            <p>基于 <code>D3TreeGraph</code> 类，不依赖 Vue 业务组件，可直接用于 React / Vue2 / 原生 JS。</p>
        </header>

        <div class="sdk-demo-toolbar" @mousedown.stop @click.stop>
            <button @click="zoomOut" title="缩小">➖</button>
            <button @click="zoomIn" title="放大">➕</button>
            <button @click="resetZoom" title="100%">🔍 100%</button>
            <button @click="fitView" title="适应">🎯 适应</button>
            <button @click="toggleLayout" :title="layoutLabel">
                {{ layoutOrientation === 'horizontal' ? '↕️ 纵向' : '↔️ 横向' }}
            </button>
            <button @click="undo" :disabled="!canUndo">↩️ 撤销</button>
            <button @click="redo" :disabled="!canRedo">↪️ 重做</button>
            <button @click="refresh">🔄 刷新</button>
            <button @click="downloadPng">📥 PNG</button>
        </div>

        <div ref="containerRef" class="sdk-demo-canvas"></div>

        <footer class="sdk-demo-footer">
            <span>最近事件：{{ lastEvent || '（点击节点试试）' }}</span>
        </footer>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import {
    D3TreeGraph,
    initialTreeData,
    type TreeLayoutOrientation
} from '@/lib/d3-tree-sdk';
import { DATA_D3_TREE_SCHEMA } from '../config/treeConfig';

const containerRef = ref<HTMLElement | null>(null);
let graph: D3TreeGraph | null = null;

const lastEvent = ref('');
const canUndo = ref(false);
const canRedo = ref(false);
const layoutOrientation = ref<TreeLayoutOrientation>('horizontal');

const layoutLabel = computed(() =>
    layoutOrientation.value === 'horizontal' ? '切换为上下布局' : '切换为左右布局'
);

function bindGraphEvents(instance: D3TreeGraph) {
    instance.on('node:click', (node) => {
        lastEvent.value = `node:click → ${node.label}`;
    });
    instance.on('node:dblclick', (node) => {
        lastEvent.value = `node:dblclick → ${node.label}`;
    });
    instance.on('node:drop-target', (payload) => {
        lastEvent.value = `node:drop-target → ${payload.sourceData.label} → ${payload.targetData.label}`;
    });
    instance.on('history:change', (state) => {
        canUndo.value = state.canUndo;
        canRedo.value = state.canRedo;
    });
    instance.on('orientation:change', (orientation) => {
        layoutOrientation.value = orientation;
        lastEvent.value = `orientation:change → ${orientation}`;
    });
}

onMounted(() => {
    if (!containerRef.value) return;

    graph = new D3TreeGraph({
        container: containerRef.value,
        data: initialTreeData,
        schema: DATA_D3_TREE_SCHEMA
    });

    bindGraphEvents(graph);
    graph.mount();
    graph.recordHistory();
    layoutOrientation.value = graph.getOrientation();
});

onBeforeUnmount(() => {
    graph?.destroy();
    graph = null;
});

function zoomIn() {
    graph?.zoomIn();
}
function zoomOut() {
    graph?.zoomOut();
}
function resetZoom() {
    graph?.resetZoom();
}
function fitView() {
    graph?.fitView();
}
function toggleLayout() {
    if (!graph) return;
    layoutOrientation.value = graph.toggleOrientation();
}
function undo() {
    graph?.undo();
}
function redo() {
    graph?.redo();
}
function refresh() {
    graph?.refresh();
    lastEvent.value = 'refresh';
}
async function downloadPng() {
    await graph?.download(`tree-sdk-${Date.now()}`, 'png');
    lastEvent.value = 'download:png';
}
</script>

<style lang="scss" scoped>
@import '../index.scss';

.sdk-demo-page {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #f5f7fa;
}

.sdk-demo-header {
    padding: 12px 20px;
    background: #fff;
    border-bottom: 1px solid #e8e8e8;

    h1 {
        margin: 0 0 4px;
        font-size: 18px;
    }

    p {
        margin: 0;
        color: #666;
        font-size: 13px;
    }
}

.sdk-demo-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    padding: 10px 20px;
    background: #fff;
    border-bottom: 1px solid #eee;

    button {
        padding: 6px 10px;
        border: 1px solid #d9d9d9;
        border-radius: 4px;
        background: #fff;
        cursor: pointer;

        &:disabled {
            opacity: 0.45;
            cursor: not-allowed;
        }
    }
}

.sdk-demo-canvas {
    flex: 1;
    min-height: 0;
    margin: 12px;
    background: #fff;
    border-radius: 8px;
    border: 1px solid #e8e8e8;
    overflow: hidden;
}

.sdk-demo-footer {
    padding: 8px 20px 12px;
    font-size: 12px;
    color: #888;
    background: #fff;
    border-top: 1px solid #eee;
}
</style>
