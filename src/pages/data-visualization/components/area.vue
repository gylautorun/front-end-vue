<template>
    <v-chart ref="chartRef" :option="option" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import echarts, { ECOption } from '@/components/echarts/base';
const chartRef = ref<HTMLElement | null>(null);
const option = ref<ECOption>({
    title: {
        text: '地区销售分布'
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'cross',
            label: {
                backgroundColor: '#6a7985'
            }
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
            boundaryGap: false,
            data: ['北京', '上海', '深圳', '广州', '杭州', '南京', '武汉']
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
            type: 'line',
            stack: '总量',
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    {
                        offset: 0,
                        color: 'rgb(229, 243, 255)'
                    },
                    {
                        offset: 1,
                        color: 'rgb(191, 243, 255)'
                    }
                ])
            },
            itemStyle: {
                color: '#409EFF'
            },
            emphasis: {
                focus: 'series'
            },
            data: [140, 232, 101, 264, 90, 340, 250]
        },
        {
            name: '利润',
            type: 'line',
            stack: '总量',
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    {
                        offset: 0,
                        color: 'rgb(255, 243, 229)'
                    },
                    {
                        offset: 1,
                        color: 'rgb(255, 213, 191)'
                    }
                ])
            },
            itemStyle: {
                color: '#E6A23C'
            },
            emphasis: {
                focus: 'series'
            },
            data: [120, 182, 91, 234, 60, 290, 210]
        }
    ]
});
</script>

<style scoped lang="scss"></style>
