<template>
    <v-chart ref="chartRef" :option="option" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import echarts, { ECOption } from '@/components/echarts/base';
const chartRef = ref<HTMLElement | null>(null);
// ref<ECOption>
const option = ref<ECOption>({
    title: {
        text: '用户访问量趋势'
    },
    tooltip: {
        trigger: 'axis'
    },
    xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
        type: 'value'
    },
    series: [
        {
            data: [120, 200, 150, 80, 70, 110],
            type: 'line',
            smooth: true,
            itemStyle: {
                color: '#409EFF'
            },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    {
                        offset: 0,
                        color: 'rgba(64, 158, 255, 0.8)'
                    },
                    {
                        offset: 1,
                        color: 'rgba(64, 158, 255, 0.1)'
                    }
                ])
            }
        }
    ]
});
</script>

<style scoped lang="scss"></style>
