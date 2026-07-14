<template>
    <main class="dynamic-list-page">
        <header class="page-header">
            <div>
                <h2>不定高度虚拟列表</h2>
                <p>预估高度 · ResizeObserver 实测 · Fenwick Tree 动态修正</p>
            </div>
            <div class="metrics">
                <span><strong>{{ items.length.toLocaleString() }}</strong> 条数据</span>
                <span><strong>{{ renderedItems.length }}</strong> 个 DOM 节点</span>
                <span><strong>{{ measuredCount }}</strong> 条已测量</span>
                <span v-if="scrollScale > 1"><strong>{{ scrollScale.toFixed(1) }}x</strong> 滚动压缩</span>
            </div>
        </header>

        <section class="toolbar" aria-label="列表工具栏">
            <DataSizeSelect
                v-model="selectedSize"
                input-id="dynamic-data-size"
                @change="changeDataSize"
            />
            <span>每条记录包含 3 到 10 行内容，行高由实际 DOM 测量决定</span>
            <button type="button" @click="scrollToTop">回到顶部</button>
        </section>

        <section
            ref="viewportRef"
            class="list-viewport"
            aria-label="不定高度虚拟长列表"
            @scroll.passive="handleScroll"
            @wheel="handleWheel"
        >
            <!-- 占位高度限制在浏览器安全范围，超长列表通过滚动坐标压缩映射。 -->
            <div class="list-spacer" :style="{ height: `${physicalTotalHeight}px` }">
                <!-- 只把当前虚拟区间移动到其在完整列表中的真实累计偏移位置。 -->
                <div
                    class="visible-list"
                    :style="{ transform: `translate3d(0, ${renderOffsetY}px, 0)` }"
                >
                    <article
                        v-for="entry in renderedItems"
                        :key="entry.item.id"
                        :ref="(node) => setRowRef(entry.index, node)"
                        class="list-row"
                    >
                        <span class="row-index">#{{ entry.item.id.toLocaleString() }}</span>
                        <div>
                            <h3>{{ entry.item.title }} · {{ entry.item.lineCount }} 行</h3>
                            <p>
                                <span v-for="line in entry.item.lineCount" :key="line">
                                    第 {{ line }} 行：{{ CONTENT_UNIT }}
                                </span>
                            </p>
                        </div>
                    </article>
                </div>
            </div>
        </section>
    </main>
</template>

<script setup lang="ts" name="dynamicHeightLongList">
import {
    computed,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
    type ComponentPublicInstance
} from 'vue';
import { DynamicHeightVirtualizer } from '../core';
import DataSizeSelect from '../shared/data-size-select.vue';
import { createDynamicData, DEFAULT_DATA_SIZE } from '../shared/demo-data';
// 未测量项目使用的统一预估高度。
// 3 到 10 行的平均值约为 6.5 行，按行高、标题和上下内边距给出中位预估。
const ESTIMATED_ITEM_HEIGHT = 205;
// 使用像素缓冲而不是条数缓冲，适配高度差异非常大的项目。
const OVERSCAN_PX = 600;
// Chromium 单元素高度约有 33,554,432px 上限；使用更保守的值兼容不同浏览器。
const MAX_PHYSICAL_SCROLL_HEIGHT = 8_000_000;
// 每一行正文复用的演示文本，数据源只保存行数以减少内存。
const CONTENT_UNIT = '这是一段用于验证不定高度虚拟列表的业务描述。';

// 数据规模选择框当前值。
const selectedSize = ref(DEFAULT_DATA_SIZE);
// 完整演示数据使用 shallowRef，避免递归代理几十万个只读对象。
const items = shallowRef(createDynamicData(selectedSize.value));

// 不定高核心模型独立维护每项高度和累计高度树。
let virtualizer = new DynamicHeightVirtualizer(items.value.length, ESTIMATED_ITEM_HEIGHT);
// 滚动容器 DOM 引用。
const viewportRef = ref<HTMLElement>();
// 滚动容器当前可见高度。
const viewportHeight = ref(0);
// 浏览器滚动容器中的实际位置，受安全占位高度限制。
const physicalScrollTop = ref(0);
// 完整列表坐标系中的逻辑位置，可超过浏览器单元素高度上限。
const scrollTop = ref(0);
// 模型内部不是 Vue 响应式对象；版本号变化用于通知 computed 重新读取模型结果。
const layoutVersion = ref(0);
// 已得到真实 DOM 高度的项目索引集合。
const measuredIndexes = new Set<number>();
// 提供给模板状态栏展示的已测量数量。
const measuredCount = ref(0);
// 当前渲染索引与 DOM 节点的对应关系，用于管理 ResizeObserver。
const rowElements = new Map<number, HTMLElement>();

// 当前待执行的 requestAnimationFrame 编号，0 表示没有待执行帧。
let frameId = 0;
// 高频滚动事件记录的最新物理位置。
let latestPhysicalScrollTop = 0;
// 高频滚动事件映射出的最新逻辑位置。
let latestScrollTop = 0;
// 监听视口自身尺寸变化的观察器。
let viewportObserver: ResizeObserver | undefined;
// 监听当前渲染项目真实高度变化的观察器。
let rowObserver: ResizeObserver | undefined;

// 根据逻辑滚动位置查询当前应渲染的索引范围和累计高度。
const range = computed(() => {
    // 显式读取版本号，使非响应式 virtualizer 更新后触发重新计算。
    layoutVersion.value;
    return virtualizer.getRange({
        scrollTop: scrollTop.value,
        viewportHeight: viewportHeight.value,
        overscanPx: OVERSCAN_PX
    });
});

// 浏览器真正使用的占位高度，避免超过引擎的最大可布局尺寸。
const physicalTotalHeight = computed(() =>
    Math.min(range.value.totalHeight, MAX_PHYSICAL_SCROLL_HEIGHT)
);

// 让物理滚动条顶部、底部分别精确映射到逻辑列表顶部、底部。
const scrollScale = computed(() => {
    // 物理可滚动距离需要扣除视口本身高度。
    const physicalScrollable = physicalTotalHeight.value - viewportHeight.value;
    // 逻辑可滚动距离同样扣除视口高度，保证两套坐标底部精确对应。
    const logicalScrollable = range.value.totalHeight - viewportHeight.value;
    // 未超过物理高度上限时比例保持 1，不进行无意义压缩。
    return physicalScrollable > 0 ? Math.max(1, logicalScrollable / physicalScrollable) : 1;
});

// 保持首个渲染项在逻辑视口中的相对位置，同时把整体放进物理滚动坐标系。
const renderOffsetY = computed(
    () => physicalScrollTop.value - (scrollTop.value - range.value.offsetY)
);

const renderedItems = computed(() =>
    // 截取小段可见数据，并补回每项在完整数据源中的真实索引。
    items.value.slice(range.value.startIndex, range.value.endIndex).map((item, offset) => ({
        item,
        index: range.value.startIndex + offset
    }))
);

// 在下一绘制帧统一把最新滚动位置提交给 Vue 响应式系统。
const commitScroll = () => {
    frameId = 0;
    physicalScrollTop.value = latestPhysicalScrollTop;
    scrollTop.value = latestScrollTop;
};

// 接收高频原生 scroll 事件，并完成物理坐标到逻辑坐标的映射。
const handleScroll = (event: Event) => {
    // 当前事件所属的不定高列表滚动容器。
    const viewport = event.currentTarget as HTMLElement;
    // 浏览器实际允许滚动到的最大物理位置。
    const maxPhysicalScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    // 当前原生滚动位置。
    const nextPhysicalScrollTop = viewport.scrollTop;

    // 高压缩比例下，底部不足 1px 的浮点误差会被放大；边界直接映射到精确逻辑末端。
    if (maxPhysicalScrollTop - nextPhysicalScrollTop <= 1) {
        latestPhysicalScrollTop = maxPhysicalScrollTop;
        latestScrollTop = Math.max(0, range.value.totalHeight - viewportHeight.value);
    } else if (nextPhysicalScrollTop <= 1) {
        latestPhysicalScrollTop = 0;
        latestScrollTop = 0;
    } else {
        latestPhysicalScrollTop = nextPhysicalScrollTop;
        latestScrollTop = nextPhysicalScrollTop * scrollScale.value;
    }
    if (!frameId) frameId = requestAnimationFrame(commitScroll);
};

// 到达边界后拦截继续向外的滚轮输入，避免 macOS 回弹和小数 scrollTop 反复触发虚拟区间。
const handleWheel = (event: WheelEvent) => {
    // wheel 事件所属滚动容器。
    const viewport = event.currentTarget as HTMLElement;
    // 当前滚动容器的物理底部位置。
    const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    // 位于顶部且用户继续向上滚动。
    const isLeavingTop = event.deltaY < 0 && viewport.scrollTop <= 1;
    // 位于底部且用户继续向下滚动。
    const isLeavingBottom = event.deltaY > 0 && maxScrollTop - viewport.scrollTop <= 1;
    if (isLeavingTop || isLeavingBottom) event.preventDefault();
};

// Vue 在节点复用或销毁时会传入 null，这里同步解除旧节点观察，避免引用泄漏。
const setRowRef = (index: number, node: Element | ComponentPublicInstance | null) => {
    // 查找该索引之前注册的 DOM，Vue 节点复用时可能与新节点不同。
    const previous = rowElements.get(index);
    if (previous && previous !== node) {
        rowObserver?.unobserve(previous);
        rowElements.delete(index);
    }
    // 组件实例或 null 不能交给 ResizeObserver。
    if (!(node instanceof HTMLElement)) return;

    // 把完整数据索引写入 DOM，测量回调可据此更新正确的高度项。
    node.dataset.index = String(index);
    // 保存节点供卸载、切换规模和重新观察时使用。
    rowElements.set(index, node);
    // 观察器已初始化时立即开始测量该节点。
    rowObserver?.observe(node);
};

// 批量处理一次 ResizeObserver 回调中的所有项目高度变化。
const measureRows = (entries: ResizeObserverEntry[]) => {
    // 当前滚动容器可能在异步回调前已经卸载。
    const viewport = viewportRef.value;
    // 先记录测量前是否已到物理底部；后续总高度变化时继续锁定底部，而不是反算旧锚点。
    const wasPinnedToBottom = viewport
        ? viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop <= 2
        : false;
    // 保存所有位于视口上方项目产生的滚动补偿总量。
    let scrollCompensation = 0;
    // 标记本批次是否真的更新过高度树。
    let changed = false;

    for (const entry of entries) {
        // 从 DOM data 属性恢复项目在完整数据源中的索引。
        const index = Number((entry.target as HTMLElement).dataset.index);
        // 更新前的项目底部用于判断项目是否完全位于视口上方。
        const bottomBeforeUpdate = virtualizer.getOffset(index + 1);
        // 优先使用包含 padding 和 border 的 borderBoxSize，旧浏览器回退 contentRect。
        const delta = virtualizer.updateItemHeight(index, entry.borderBoxSize[0]?.blockSize ?? entry.contentRect.height);
        if (!delta) continue;

        // 至少一个项目发生有效变化，稍后需要刷新虚拟区间。
        changed = true;
        // 首次得到该索引真实高度时更新测量计数。
        if (!measuredIndexes.has(index)) {
            measuredIndexes.add(index);
            measuredCount.value = measuredIndexes.size;
        }
        // 视口上方项目高度改变时补偿 scrollTop，使用户正在看的内容保持原位。
        if (bottomBeforeUpdate <= latestScrollTop) scrollCompensation += delta;
    }

    // 整批测量没有有效高度差时不触发任何响应式更新。
    if (!changed) return;
    // 通知依赖非响应式 virtualizer 的 computed 重新求值。
    layoutVersion.value += 1;
    // 视口上方累计高度变化需要同步移动逻辑滚动锚点。
    if (scrollCompensation) latestScrollTop += scrollCompensation;

    if (viewport) {
        if (wasPinnedToBottom) {
            // 底部项目修正高度后，以新的两套坐标底部为准，避免浏览器钳制引发来回抖动。
            latestScrollTop = Math.max(0, range.value.totalHeight - viewportHeight.value);
            latestPhysicalScrollTop = Math.max(
                0,
                physicalTotalHeight.value - viewportHeight.value
            );
        } else {
            // 非底部保持原来的逻辑内容锚点。
            latestPhysicalScrollTop = latestScrollTop / scrollScale.value;
        }
        physicalScrollTop.value = latestPhysicalScrollTop;
        scrollTop.value = latestScrollTop;
        // 只有目标位置实际变化时才写 DOM，减少无意义的 scroll 事件。
        if (Math.abs(viewport.scrollTop - latestPhysicalScrollTop) > 0.5) {
            viewport.scrollTop = latestPhysicalScrollTop;
        }
    }
};

// 平滑滚动由原生 scroll 事件继续驱动同一套虚拟化逻辑。
const scrollToTop = () => viewportRef.value?.scrollTo({ top: 0, behavior: 'smooth' });

// 切换数据规模后完整重建数据、高度模型、观察状态和两套滚动坐标。
const changeDataSize = async (size: number) => {
    // 停止观察旧节点，避免数据替换期间把旧高度写进新模型。
    rowObserver?.disconnect();
    // 清空上一批数据的 DOM 索引映射。
    rowElements.clear();
    // 清空上一批数据的已测量索引。
    measuredIndexes.clear();
    // 同步清零页面展示的测量数量。
    measuredCount.value = 0;

    // 按新规模生成轻量数据对象。
    items.value = createDynamicData(size);
    // 新模型从统一预估高度开始，不继承旧数据的真实高度。
    virtualizer = new DynamicHeightVirtualizer(size, ESTIMATED_ITEM_HEIGHT);
    // 重置最近一次物理滚动位置。
    latestPhysicalScrollTop = 0;
    // 重置响应式物理滚动位置。
    physicalScrollTop.value = 0;
    // 重置最近一次逻辑滚动位置。
    latestScrollTop = 0;
    // 重置响应式逻辑滚动位置。
    scrollTop.value = 0;
    // 触发范围、总高度和压缩比例重新计算。
    layoutVersion.value += 1;

    // 等待 Vue 用新数据完成首屏 DOM 更新。
    await nextTick();
    // 将浏览器滚动容器同步回顶部。
    viewportRef.value?.scrollTo({ top: 0 });
    // 为新首屏节点重新注册高度观察。
    rowElements.forEach((element) => rowObserver?.observe(element));
};

// 组件挂载后创建两个 ResizeObserver，并补登记首屏已有节点。
onMounted(() => {
    if (!viewportRef.value) return;

    rowObserver = new ResizeObserver(measureRows);
    // 首屏节点的模板 ref 早于 onMounted 执行，需要在观察器创建后补登记一次。
    rowElements.forEach((element) => rowObserver?.observe(element));
    viewportObserver = new ResizeObserver(([entry]) => {
        // contentRect.height 是滚动容器当前可用于展示项目的高度。
        viewportHeight.value = entry.contentRect.height;
    });
    // 开始监听布局变化引起的视口尺寸更新。
    viewportObserver.observe(viewportRef.value);
});

// 组件卸载时停止动画帧与观察器，释放所有 DOM 强引用。
onBeforeUnmount(() => {
    // 取消尚未提交的滚动动画帧。
    if (frameId) cancelAnimationFrame(frameId);
    // 停止所有列表项高度观察。
    rowObserver?.disconnect();
    // 停止滚动容器尺寸观察。
    viewportObserver?.disconnect();
    // 释放 Map 对 DOM 节点的强引用。
    rowElements.clear();
});
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
