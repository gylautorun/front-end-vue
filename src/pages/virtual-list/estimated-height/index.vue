<template>
    <div class="virtual-list-container">
        <div class="virtual-list-content" ref="contentRef" @scroll="handleScroll">
            <div
                class="virtual-list-placeholder"
                :style="{ height: `${state.listHeight}px` }"
            ></div>
            <div class="virtual-list-render" :style="scrollStyle">
                <!-- 渲染的列表项 -->
                <div
                    class="virtual-list-item"
                    v-for="item in renderList"
                    :key="item.id"
                    :id="item.id"
                >
                    <slot name="item" :item="item"></slot>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts" name="estimatedHeight">
import { type CSSProperties, computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import { IListItem, listData_default, listData_100 } from '../method';
import { useThrottle } from './tools';

// 不定高虚拟列表
interface IEstimatedListProps<T> {
    loading: boolean;
    // 预估高度（越小越好，尽量比实际渲染高度小）
    estimatedHeight: number;
    dataSource: T[];
}
const props = defineProps<IEstimatedListProps<IListItem>>();

// 加载更多触发的事件
const emit = defineEmits<{
    getMoreData: [];
}>();

defineSlots<{
    item(props: { item: IListItem }): any;
}>();

// 容器 ref
const contentRef = ref<HTMLDivElement>();
// 列表 ref
const listRef = ref<HTMLDivElement>();
// 记录 dataSource 数据的位置信息
interface IPosInfo {
    // 当前pos对应的元素索引
    index: number;
    // 元素顶部所处位置
    top: number;
    // 元素底部所处位置
    bottom: number;
    // 元素高度
    height: number;
    // 高度差：判断是否需要更新
    dHeight: number;
}
const positions = ref<IPosInfo[]>([]);

const state = reactive({
    // contentRef 容器高度
    viewHeight: 0,
    // 列表高度
    listHeight: 0,
    // 渲染列表开始下标
    startIndex: 0,
    // 可视区域最大渲染数量s
    maxCount: 0,
    // 存储“加载更多”前的数据长度
    preLen: 0
});

const init = () => {
    // 获取容器高度
    state.viewHeight = contentRef.value ? contentRef.value.offsetHeight : 0;
    // 获取可视区域最大渲染数量（+1是为了设置缓冲大小）
    state.maxCount = Math.ceil(state.viewHeight / props.estimatedHeight) + 1;
};

onMounted(() => {
    init();
});

// 渲染列表结束下标
const endIndex = computed(() =>
    Math.min(props.dataSource.length, state.startIndex + state.maxCount)
);

// 渲染列表，做截取
const renderList = computed(() => props.dataSource.slice(state.startIndex, endIndex.value));

// 列表偏移量（offset）
const offsetDis = computed(() =>
    state.startIndex > 0 ? positions.value[state.startIndex - 1].bottom : 0
);

// 列表偏移样式
const scrollStyle = computed(
    () =>
        ({
            transform: `translate3d(0, ${offsetDis.value}px, 0)`
        }) as CSSProperties
);

// 在数据初始化，数据源改变时会重新计算位置信息
watch(
    () => props.dataSource.length,
    () => {
        initPosition();
        // 确保在最新dom中，能获取到可视区域的元素，并调整位置信息
        nextTick(() => {
            setPosition();
        });
    }
);

// 初始化：只会计算新增的位置信息，通过estimatedHeight预设高度，进行默认配置
const initPosition = () => {
    // 计算加载更多的位置信息（默认为 estimatedHeight * 当前元素下标，需要累加）
    const pos: IPosInfo[] = [];
    // “加载更多”的数据长度，如果初次渲染，就是当前渲染的数据长度
    const disLen = props.dataSource.length - state.preLen;
    // 获取当前数据源的长度（加载更多之前的）
    const currentLen = positions.value.length;
    // 获取当前数据源最后一个元素的高度（加载更多之前的），第一次渲染时，为0
    const preBottom = positions.value[currentLen - 1] ? positions.value[currentLen - 1].bottom : 0;
    // 遍历当前加载数据源，对每个元素通过 estimatedHeight 预设高度，计算初始高度信息
    for (let i = 0; i < disLen; i++) {
        const item = props.dataSource[state.preLen + i];
        pos.push({
            index: item.id,
            // 预设高度
            height: props.estimatedHeight,
            top: preBottom
                ? preBottom + i * props.estimatedHeight
                : item.id * props.estimatedHeight,
            bottom: preBottom
                ? preBottom + (i + 1) * props.estimatedHeight
                : (item.id + 1) * props.estimatedHeight,
            // 预设高度与真实高度差：判断是否需要更新，默认为0
            dHeight: 0
        });
    }
    // 更新数据源位置信息
    positions.value = [...positions.value, ...pos];
    // 更新新的长度
    state.preLen = props.dataSource.length;
};

// 数据 item 渲染完成后，更新数据item的真实高度
// 但也只是计算可视区域中每一个渲染元素的高度，来重新计算后续未渲染的元素，但是在可视区域前的元素位置信息会被缓存记录
// 对于可视区域前的元素，其位置信息会被缓存记录，不会被重新计算，从而优化性能。
const setPosition = () => {
    // 渲染区域中的元素
    const nodes = listRef.value?.children;
    if (!nodes || !nodes.length) return;
    Array.from(nodes).forEach((node) => {
        // 获取每个元素高度
        const rect = node.getBoundingClientRect();
        // 在每个渲染元素上添加id标识，:id="String(i.id)"，用于滚动时定位
        // 获取当前元素
        const item = positions.value[Number(node.id)];
        // 判断是否需要更新，通过position之前计算的高度 - 当前渲染后的真实高度，来得到一个差值，如果差值不为0，则更新位置信息
        const dHeight = item.height - rect.height;
        // 更新当前元素的位置信息
        if (dHeight) {
            item.height = rect.height;
            item.bottom = item.bottom - dHeight;
            item.dHeight = dHeight;
        }
    });

    // 获取渲染区域中第一个元素的id
    const startId = Number(nodes[0].id);
    // 获取第一个元素的dHeight 差值信息
    let startDHeight = positions.value[startId].dHeight;
    const len = positions.value.length;
    // 第一个元素在上面的循环中，已经调整过了，虽然上面遍历了可视区域的其他元素，但是因为有这个dheight，导致高度不是很准确，需要重新计算
    positions.value[startId].dHeight = 0;
    // 遍历渲染区域中第二个元素到数据源最后一个数据，在可视区域的元素通过dheight进行校准，
    // 不在可视区域的根据estimatedHeight高度，来调整top、bottom
    for (let i = startId + 1; i < len; i++) {
        const item = positions.value[i];
        item.top = positions.value[i - 1].bottom;
        item.bottom = item.bottom - startDHeight;
        if (item.dHeight !== 0) {
            startDHeight += item.dHeight;
            item.dHeight = 0;
        }
    }

    // 更新列表高度
    state.listHeight = positions.value[len - 1].bottom;
};
const handleScroll = useThrottle(() => {
    const { scrollTop, clientHeight, scrollHeight } = contentRef.value!;
    // 根据二分查找更新开始下标
    state.startIndex = binarySearch(positions.value, scrollTop);
    // 如果滚动到底部，则触发加载更多，这里也可以通过 IntersactionObserver 来实现
    const bottom = scrollHeight - clientHeight - scrollTop;
    if (bottom <= 20) {
        !props.loading && emit('getMoreData');
    }
});

// 监听开始下标，更新位置信息
watch(
    () => state.startIndex,
    () => {
        setPosition();
    }
);

// 二分查找
const binarySearch = (list: IPosInfo[], value: number) => {
    let left = 0,
        right = list.length - 1,
        templateIndex = -1;
    while (left < right) {
        const midIndex = Math.floor((left + right) / 2);
        const midValue = list[midIndex].bottom;
        if (midValue === value) return midIndex + 1;
        else if (midValue < value) left = midIndex + 1;
        else if (midValue > value) {
            if (templateIndex === -1 || templateIndex > midIndex) templateIndex = midIndex;
            right = midIndex;
        }
    }
    return templateIndex;
};
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
