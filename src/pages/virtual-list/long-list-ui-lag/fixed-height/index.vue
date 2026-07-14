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
            <!-- 步骤 4：用完整列表总高度撑开滚动条，但不创建全部列表项。 -->
            <div class="list-spacer" :style="{ height: `${totalHeight}px` }">
                <!-- 步骤 5：把少量可见节点移动到其在完整列表中的实际位置。 -->
                <div class="visible-list" :style="{ transform: `translate3d(0, ${offsetY}px, 0)` }">
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue';
import { FixedHeightVirtualizer } from '../core/fixed-height-virtualizer';
import DataSizeSelect from '../shared/data-size-select.vue';
import { createFixedData, DEFAULT_DATA_SIZE } from '../shared/demo-data';

// 步骤 1：固定行高后，可以直接通过除法计算索引，不需要逐项测量 DOM。
const ITEM_HEIGHT = 72;
// 视口前后至少额外渲染的条数，用于避免慢速滚动时露出空白。
const MIN_OVERSCAN = 6;
// 视口前后最多额外渲染的条数，用于限制高速滚动时创建的 DOM 数量。
const MAX_OVERSCAN = 28;
// 固定高度算法实例；页面只负责提供滚动状态和渲染计算结果。
const virtualizer = new FixedHeightVirtualizer(ITEM_HEIGHT);

// 步骤 3：初始化数据源。shallowRef 不会把几十万个对象递归转换为响应式代理。
// 下拉框当前选择的数据规模，默认生成 100,000 条。
const selectedSize = ref(DEFAULT_DATA_SIZE);
// 完整列表数据源，只监听数组引用是否被替换，不深度代理内部对象。
const listData = shallowRef(createFixedData(selectedSize.value));

// 步骤 4：记录滚动容器尺寸和当前位置，它们决定需要渲染哪一段数据。
// 滚动容器的 DOM 引用，用于读取尺寸和主动修改滚动位置。
const viewportRef = ref<HTMLElement>();
// 滚动容器当前可视高度，用于计算一屏最多能显示多少行。
const viewportHeight = ref(0);
// 已提交给 Vue 的纵向滚动距离，用于计算当前可见索引。
const scrollTop = ref(0);
// 当前额外预渲染的行数，会根据每帧滚动距离动态变化。
const overscan = ref(MIN_OVERSCAN);

// 已选择项目的 id 集合；状态独立于 DOM，项目滚出视口后不会丢失。
const selectedIds = ref(new Set<number>());

// 步骤 5：保存滚动调度状态，保证同一帧内最多提交一次 Vue 响应式更新。
// 当前待执行的 requestAnimationFrame 编号；0 表示当前没有待执行任务。
let frameId = 0;
// 高频 scroll 事件记录的最新位置，等待下一动画帧统一提交。
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
        itemCount: listData.value.length,
        overscan: overscan.value
    })
);

// 从数据源提供模板状态栏需要的列表总数。
const totalCount = computed(() => listData.value.length);
// 完整列表理论高度，用于撑开滚动容器的滚动条。
const totalHeight = computed(() => virtualRange.value.totalHeight);

// 步骤 7：直接读取核心模型算出的起止索引。
// 实际渲染起始索引：从首条可见数据向前加入缓冲，并保证不小于 0。
const startIndex = computed(() => virtualRange.value.startIndex);
// 实际渲染结束索引：包含可见行和尾部缓冲，并保证不超过数据总数。
const endIndex = computed(() => virtualRange.value.endIndex);
// 步骤 8：截取真正要创建 DOM 的数据，并计算这一段内容相对列表顶部的偏移量。
// 当前真正交给 v-for 创建 DOM 的小段数据。
const renderedItems = computed(() => listData.value.slice(startIndex.value, endIndex.value));
// 已渲染数据块距离完整列表顶部的像素值，用于 translate3d 定位。
const offsetY = computed(() => virtualRange.value.offsetY);

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
    scrollTop.value = latestScrollTop;
};

// 步骤 10：scroll 高频触发时只记录最新值，不在事件回调中反复更新页面。
const handleScroll = (event: Event) => {
    latestScrollTop = (event.currentTarget as HTMLElement).scrollTop;
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
    listData.value = createFixedData(size);
    selectedIds.value = new Set();

    // 等待占位层按新总高度完成更新后，再设置滚动位置。
    await nextTick();
    viewportRef.value?.scrollTo({ top: 0 });
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
