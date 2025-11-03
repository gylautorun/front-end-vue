<template>
    <div ref="chartRef" class="base-chart"></div>
</template>

<script setup lang="ts" name="BaseChart">
import { onMounted, onUnmounted, PropType, shallowRef, watch, withDefaults } from 'vue';
import echarts, { ECOption } from './base';
import { EChartsType } from 'echarts/core';

import { debounce } from 'lodash-es';

// 方式1: 泛型语法配合 withDefaults（推荐）
// 优点：提供默认值, 类型更简洁, 编译时检验
const props = withDefaults(
    defineProps<{
        option: ECOption;
        loading?: boolean;
    }>(),
    {
        option: () => ({}),
        loading: false
    }
);

// 方式2: 纯泛型语法（简洁但无默认值）
// 缺点：无法提供默认值, option 必须提供
// 优点：代码简洁
// const props = defineProps<{
//     option: ECOption
//     loading?: boolean
// }>()

// 方式3: 运行时声明方式（完整类型声明）
// 缺点：无法提供默认值, 类型更复杂, 编译时检验
//     - required: true 和 default: () => ({}) 不能同时使用
// 优点：代码较长
// const props = defineProps({
//     option: {
//         type: Object as PropType<ECOption>,
//         required: false,
//         default: () => ({})
//     },
//     loading: {
//         type: Boolean,
//         default: false
//     }
// })

const chartRef = shallowRef<HTMLElement | null>(null);
const chart = shallowRef<EChartsType | null>(null);

function init() {
    if (props.option) {
        chart.value = echarts.init(chartRef.value!);
        setOption(props.option);
    }
}

function setOption(option: ECOption, notMerge?: boolean, lazyUpdate?: boolean) {
    chart.value!.setOption(option, notMerge, lazyUpdate);
}

const resize = debounce(() => {
    chart.value!.resize();
}, 100);

watch(
    () => props.option,
    () => {
        setOption(props.option);
    }
);

// show loading
watch(
    () => props.loading,
    (val) => {
        if (!chart.value) return;
        // 方式1: 使用 ! 非空断言（当前方式）
        // if (val) {
        //     chart.value!.showLoading();
        // } else {
        //     chart.value!.hideLoading();
        // }

        // 方式2: 使用可选链 + 类型收窄（更安全）
        const chartInstance = chart.value;
        if (chartInstance) {
            if (val) {
                // chartInstance.showLoading({
                //     text: '正在获取数据，请稍候...',
                //     color: '#4ad2ff',
                //     maskColor: 'rgba(0, 0, 0, 0.3)'
                // });
                chartInstance.showLoading();
            } else {
                chartInstance.hideLoading();
            }
        }
    }
);

onMounted(() => {
    init();
    window.addEventListener('resize', resize);
});

// 组件销毁前清除事件监听器
onUnmounted(() => {
    window.removeEventListener('resize', resize);
    chart.value?.dispose();
});

defineExpose({
    chart,
    setOption,
    resize
});
</script>

<style lang="scss" scoped>
.base-chart {
    width: 100%;
    height: 100%;
}
</style>
