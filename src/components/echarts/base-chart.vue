<template>
    <div ref="chartRef" class="es-chart"></div>
</template>

<script setup lang="ts" name="BaseChart">
import { onMounted, onUnmounted, PropType, shallowRef, watch } from 'vue';
import echarts, { ECOption } from './base';
import { EChartsType } from 'echarts/core';

import { debounce } from 'lodash-es';

const props = defineProps({
    option: {
        type: Object as PropType<ECOption>,
        required: true,
        default: () => ({})
    },
    loading: Boolean
});

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
        if (val) {
            chart.value!.showLoading();
        } else {
            chart.value!.hideLoading();
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
.es-chart {
    width: 100%;
    height: 100%;
}
</style>
