<template>
    <main class="fixed-list-page">
        <!-- 步骤 1：展示当前数据量、实际 DOM 数量和缓冲数量，方便观察虚拟列表效果。 -->
        <header class="page-header">
            <div>
                <h2>高性能长列表</h2>
                <p>固定高度虚拟化 · 动态缓冲 · 每帧最多更新一次</p>
            </div>
            <div class="metrics" aria-label="列表状态">
                <span
                    ><strong>{{ totalCount.toLocaleString() }}</strong> 条数据</span
                >
                <span
                    ><strong>{{ renderedItems.length }}</strong> 个 DOM 节点</span
                >
                <span
                    ><strong>{{ overscan }}</strong> 条缓冲</span
                >
                <span v-if="scrollScale > 1"
                    ><strong>{{ scrollScale.toFixed(1) }}x</strong> 滚动压缩</span
                >
            </div>
        </header>

        <!-- 步骤 2：切换测试数据规模，并提供列表交互入口。 -->
        <section class="toolbar" aria-label="列表工具栏">
            <DataSizeSelect
                v-model="selectedSize"
                input-id="fixed-data-size"
                @change="changeDataSize"
            />
            <button type="button" title="回到列表顶部" @click="scrollToTop">回到顶部</button>
            <span class="selection-count">已选择 {{ selectedIds.size }} 条</span>
        </section>

        <!-- 步骤 3：建立唯一的滚动容器；passive 表示滚动处理器不会阻止浏览器滚动。 -->
        <section
            ref="viewportRef"
            class="list-viewport"
            aria-label="虚拟长列表"
            @scroll.passive="handleScroll"
        >
            <!-- 步骤 4：用浏览器安全高度撑开滚动条，超长列表通过坐标压缩映射。 -->
            <div class="list-spacer" :style="{ height: `${physicalTotalHeight}px` }">
                <!-- 步骤 5：把少量可见节点移动到其在完整列表中的实际位置。 -->
                <div class="visible-list" :style="{ transform: `translate3d(0, ${renderOffsetY}px, 0)` }">
                    <!-- 步骤 6：只渲染视口附近的数据，DOM 数量不会随总数据量线性增长。 -->
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
                        <span class="row-status">{{
                            selectedIds.has(item.id) ? '已选择' : '选择'
                        }}</span>
                    </button>
                </div>
            </div>
        </section>
    </main>
</template>

<script setup lang="ts" name="longListKadun">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue';
import { FixedHeightVirtualizer } from '../core/fixed-height-virtualizer';
import DataSizeSelect from '../shared/data-size-select.vue';
import { createFixedItem, DEFAULT_DATA_SIZE } from '../shared/demo-data';

// 步骤 1：固定行高后，可以直接通过除法计算索引，不需要逐项测量 DOM。
const ITEM_HEIGHT = 72;
// 视口前后至少额外渲染的条数，用于避免慢速滚动时露出空白。
const MIN_OVERSCAN = 6;
// 视口前后最多额外渲染的条数，用于限制高速滚动时创建的 DOM 数量。
const MAX_OVERSCAN = 28;
// 单个占位元素保持在浏览器可靠布局范围内，逻辑高度通过比例映射。
const MAX_PHYSICAL_SCROLL_HEIGHT = 8_000_000;
// 固定高度算法实例；页面只负责提供滚动状态和渲染计算结果。
const virtualizer = new FixedHeightVirtualizer(ITEM_HEIGHT);

// 步骤 3：总数据量只保存为数字，当前窗口的数据对象按需生成。
const selectedSize = ref(DEFAULT_DATA_SIZE);
const itemCount = ref(DEFAULT_DATA_SIZE);

// 步骤 4：记录滚动容器尺寸和当前位置，它们决定需要渲染哪一段数据。
// 滚动容器的 DOM 引用，用于读取尺寸和主动修改滚动位置。
const viewportRef = ref<HTMLElement>();
// 滚动容器当前可视高度，用于计算一屏最多能显示多少行。
const viewportHeight = ref(0);
// 浏览器滚动容器中的实际位置，受安全占位高度限制。
const physicalScrollTop = ref(0);
// 已提交给 Vue 的逻辑滚动距离，用于计算当前可见索引。
const scrollTop = ref(0);
// 当前额外预渲染的行数，会根据每帧滚动距离动态变化。
const overscan = ref(MIN_OVERSCAN);

// 已选择项目的 id 集合；状态独立于 DOM，项目滚出视口后不会丢失。
const selectedIds = ref(new Set<number>());

// 步骤 5：保存滚动调度状态，保证同一帧内最多提交一次 Vue 响应式更新。
// 当前待执行的 requestAnimationFrame 编号；0 表示当前没有待执行任务。
let frameId = 0;
// 高频 scroll 事件记录的最新物理位置，等待下一动画帧统一提交。
let latestPhysicalScrollTop = 0;
// 由物理位置映射出的最新逻辑位置。
let latestScrollTop = 0;
// 上一动画帧的滚动位置，用于计算本帧滚动距离。
let previousScrollTop = 0;
// 视口尺寸观察器实例，组件卸载时需要断开连接。
let resizeObserver: ResizeObserver | undefined;

// 步骤 6：把页面状态交给固定高度模型，一次得到渲染区间、偏移和总高度。
const virtualRange = computed(() =>
    virtualizer.getRange({
        scrollTop: scrollTop.value,
        viewportHeight: viewportHeight.value,
        itemCount: itemCount.value,
        overscan: overscan.value
    })
);

// 提供模板状态栏需要的列表总数。
const totalCount = computed(() => itemCount.value);
// 完整列表理论高度，仅用于逻辑坐标计算。
const totalHeight = computed(() => virtualRange.value.totalHeight);
// 浏览器真正使用的占位高度，避免超过引擎最大可布局尺寸。
const physicalTotalHeight = computed(() =>
    Math.min(totalHeight.value, MAX_PHYSICAL_SCROLL_HEIGHT)
);
// 让物理滚动条顶部和底部分别精确对应逻辑列表顶部和底部。
const scrollScale = computed(() => {
    const physicalScrollable = physicalTotalHeight.value - viewportHeight.value;
    const logicalScrollable = totalHeight.value - viewportHeight.value;
    return physicalScrollable > 0 ? Math.max(1, logicalScrollable / physicalScrollable) : 1;
});

// 步骤 7：直接读取核心模型算出的起止索引。
// 实际渲染起始索引：从首条可见数据向前加入缓冲，并保证不小于 0。
const startIndex = computed(() => virtualRange.value.startIndex);
// 实际渲染结束索引：包含可见行和尾部缓冲，并保证不超过数据总数。
const endIndex = computed(() => virtualRange.value.endIndex);
// 步骤 8：只为可见窗口生成记录，内存不会随总数据量增长。
const renderedItems = computed(() =>
    Array.from({ length: endIndex.value - startIndex.value }, (_, offset) =>
        createFixedItem(startIndex.value + offset)
    )
);
// 保持渲染块在逻辑视口内的相对位置，并将其放入物理滚动坐标系。
const renderOffsetY = computed(
    () => physicalScrollTop.value - (scrollTop.value - virtualRange.value.offsetY)
);

// 步骤 9：在浏览器准备绘制下一帧前提交最新滚动位置。
const commitScroll = () => {
    // 当前动画帧已经执行完，允许下一次 scroll 再申请新帧。
    frameId = 0;

    // 用两帧之间的滚动距离近似滚动速度：滚得越快，预渲染的内容越多。
    // 当前帧与上一帧之间的绝对滚动距离，单位为像素。
    const distance = Math.abs(latestScrollTop - previousScrollTop);
    previousScrollTop = latestScrollTop;
    overscan.value = Math.min(MAX_OVERSCAN, MIN_OVERSCAN + Math.ceil(distance / ITEM_HEIGHT));

    // 最后更新响应式位置，统一触发可见区间和渲染数据重新计算。
    physicalScrollTop.value = latestPhysicalScrollTop;
    scrollTop.value = latestScrollTop;
};

// 步骤 10：scroll 高频触发时只记录最新值，不在事件回调中反复更新页面。
const handleScroll = (event: Event) => {
    const viewport = event.currentTarget as HTMLElement;
    const maxPhysicalScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    const nextPhysicalScrollTop = viewport.scrollTop;

    if (maxPhysicalScrollTop - nextPhysicalScrollTop <= 1) {
        latestPhysicalScrollTop = maxPhysicalScrollTop;
        latestScrollTop = Math.max(0, totalHeight.value - viewportHeight.value);
    } else if (nextPhysicalScrollTop <= 1) {
        latestPhysicalScrollTop = 0;
        latestScrollTop = 0;
    } else {
        latestPhysicalScrollTop = nextPhysicalScrollTop;
        latestScrollTop = nextPhysicalScrollTop * scrollScale.value;
    }
    if (!frameId) frameId = requestAnimationFrame(commitScroll);
};

// 步骤 11：用新 Set 替换旧 Set，确保 Vue 能检测到选择状态变化。
const toggleSelected = (id: number) => {
    // 创建新集合以改变 ref 的引用，确保模板重新计算选择样式。
    const next = new Set(selectedIds.value);
    next.has(id) ? next.delete(id) : next.add(id);
    selectedIds.value = next;
};

// 步骤 12：通过滚动容器自身的 API 平滑返回顶部，滚动过程仍由同一套虚拟化逻辑处理。
const scrollToTop = () => viewportRef.value?.scrollTo({ top: 0, behavior: 'smooth' });

// 步骤 13：切换规模时重建数据、清空状态，并把 DOM 和内部滚动状态一起复位。
const changeDataSize = async (size: number) => {
    itemCount.value = size;
    selectedIds.value = new Set();

    // 等待占位层按新总高度完成更新后，再设置滚动位置。
    await nextTick();
    viewportRef.value?.scrollTo({ top: 0 });
    latestPhysicalScrollTop = 0;
    physicalScrollTop.value = 0;
    latestScrollTop = 0;
    previousScrollTop = 0;
    scrollTop.value = 0;
};

// 步骤 14：监听容器尺寸变化，让窗口缩放或布局变化后重新计算可见数量。
onMounted(() => {
    if (!viewportRef.value) return;
    resizeObserver = new ResizeObserver(([entry]) => {
        viewportHeight.value = entry.contentRect.height;
    });
    resizeObserver.observe(viewportRef.value);
});

// 步骤 15：组件卸载时清理动画帧和观察器，避免后台任务与内存泄漏。
onBeforeUnmount(() => {
    if (frameId) cancelAnimationFrame(frameId);
    resizeObserver?.disconnect();
});
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
