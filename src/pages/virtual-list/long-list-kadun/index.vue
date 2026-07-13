<template>
    <main class="long-list-page">
        <header class="page-header">
            <div>
                <h2>高性能长列表</h2>
                <p>固定高度虚拟化 · 动态缓冲 · 每帧最多更新一次</p>
            </div>
            <div class="metrics" aria-label="列表状态">
                <span><strong>{{ totalCount.toLocaleString() }}</strong> 条数据</span>
                <span><strong>{{ renderedItems.length }}</strong> 个 DOM 节点</span>
                <span><strong>{{ overscan }}</strong> 条缓冲</span>
            </div>
        </header>

        <section class="toolbar" aria-label="列表工具栏">
            <label for="data-size">数据规模</label>
            <select id="data-size" v-model.number="selectedSize" @change="changeDataSize">
                <option :value="10_000">10,000</option>
                <option :value="100_000">100,000</option>
                <option :value="500_000">500,000</option>
            </select>
            <button type="button" title="回到列表顶部" @click="scrollToTop">回到顶部</button>
            <span class="selection-count">已选择 {{ selectedIds.size }} 条</span>
        </section>

        <section
            ref="viewportRef"
            class="list-viewport"
            aria-label="虚拟长列表"
            @scroll.passive="handleScroll"
        >
            <div class="list-spacer" :style="{ height: `${totalHeight}px` }">
                <div
                    class="visible-list"
                    :style="{ transform: `translate3d(0, ${offsetY}px, 0)` }"
                >
                    <button
                        v-for="item in renderedItems"
                        :key="item.id"
                        type="button"
                        class="list-row"
                        :class="{ selected: selectedIds.has(item.id) }"
                        :aria-pressed="selectedIds.has(item.id)"
                        @click="toggleSelected(item.id)"
                    >
                        <span class="row-index">#{{ item.id.toLocaleString() }}</span>
                        <span class="row-content">
                            <strong>{{ item.title }}</strong>
                            <small>{{ item.summary }}</small>
                        </span>
                        <span class="row-status">{{ selectedIds.has(item.id) ? '已选择' : '选择' }}</span>
                    </button>
                </div>
            </div>
        </section>
    </main>
</template>

<script setup lang="ts" name="longListKadun">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';

interface ListItem {
    id: number;
    title: string;
    summary: string;
}

const ITEM_HEIGHT = 72;
const MIN_OVERSCAN = 6;
const MAX_OVERSCAN = 28;

const createData = (count: number): ListItem[] =>
    Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        title: `业务记录 ${String(index + 1).padStart(6, '0')}`,
        summary: `稳定行高与按需渲染，当前数据索引为 ${index}`
    }));

const selectedSize = ref(100_000);
const listData = shallowRef(createData(selectedSize.value));
const viewportRef = ref<HTMLElement>();
const viewportHeight = ref(0);
const scrollTop = ref(0);
const overscan = ref(MIN_OVERSCAN);
const selectedIds = ref(new Set<number>());

let frameId = 0;
let latestScrollTop = 0;
let previousScrollTop = 0;
let resizeObserver: ResizeObserver | undefined;

const totalCount = computed(() => listData.value.length);
const totalHeight = computed(() => totalCount.value * ITEM_HEIGHT);
const visibleCount = computed(() => Math.ceil(viewportHeight.value / ITEM_HEIGHT));
const firstVisibleIndex = computed(() => Math.floor(scrollTop.value / ITEM_HEIGHT));
const startIndex = computed(() => Math.max(0, firstVisibleIndex.value - overscan.value));
const endIndex = computed(() =>
    Math.min(totalCount.value, firstVisibleIndex.value + visibleCount.value + overscan.value)
);
const renderedItems = computed(() => listData.value.slice(startIndex.value, endIndex.value));
const offsetY = computed(() => startIndex.value * ITEM_HEIGHT);

const commitScroll = () => {
    frameId = 0;
    const distance = Math.abs(latestScrollTop - previousScrollTop);
    previousScrollTop = latestScrollTop;
    overscan.value = Math.min(MAX_OVERSCAN, MIN_OVERSCAN + Math.ceil(distance / ITEM_HEIGHT));
    scrollTop.value = latestScrollTop;
};

const handleScroll = (event: Event) => {
    latestScrollTop = (event.currentTarget as HTMLElement).scrollTop;
    if (!frameId) frameId = requestAnimationFrame(commitScroll);
};

const toggleSelected = (id: number) => {
    const next = new Set(selectedIds.value);
    next.has(id) ? next.delete(id) : next.add(id);
    selectedIds.value = next;
};

const scrollToTop = () => viewportRef.value?.scrollTo({ top: 0, behavior: 'smooth' });

const changeDataSize = async () => {
    listData.value = createData(selectedSize.value);
    selectedIds.value = new Set();
    await nextTick();
    viewportRef.value?.scrollTo({ top: 0 });
    latestScrollTop = 0;
    previousScrollTop = 0;
    scrollTop.value = 0;
};

onMounted(() => {
    if (!viewportRef.value) return;
    resizeObserver = new ResizeObserver(([entry]) => {
        viewportHeight.value = entry.contentRect.height;
    });
    resizeObserver.observe(viewportRef.value);
});

onBeforeUnmount(() => {
    if (frameId) cancelAnimationFrame(frameId);
    resizeObserver?.disconnect();
});
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
