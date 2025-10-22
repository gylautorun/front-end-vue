<template>
    <v-chart ref="chartRef" :option="option" />
</template>
<script setup lang="ts">
import echarts, { ECOption } from '@/components/echarts/base';
import { ref } from 'vue';
const chartRef = ref<HTMLElement | null>(null);
const option = ref<ECOption>({
    title: {
        text: '销售额统计'
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'shadow'
        }
    },
    grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        containLabel: true
    },
    xAxis: [
        {
            type: 'category',
            data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
            axisTick: {
                alignWithLabel: true
            }
        }
    ],
    yAxis: [
        {
            type: 'value'
        }
    ],
    series: [
        {
            name: '销售额',
            type: 'bar',
            barWidth: '60%',
            data: [100, 200, 150, 300, 250, 180, 220],
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#83bff6' },
                    { offset: 0.5, color: '#188df0' },
                    { offset: 1, color: '#188df0' }
                ])
            }
        }
    ]
});
</script>

<style scoped lang="scss"></style>
