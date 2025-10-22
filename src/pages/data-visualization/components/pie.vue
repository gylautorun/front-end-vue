<template>
    <v-chart ref="chartRef" :option="option" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
// import { ECOption } from '@/components/echarts/base';
const chartRef = ref<HTMLElement | null>(null);
// ref<ECOption>
const option = ref<echarts.EChartsOption>({
    title: {
        text: '产品销售比例',
        left: 'center'
    },
    tooltip: {
        trigger: 'item'
    },
    legend: {
        orient: 'horizontal',
        bottom: 'bottom'
    },
    series: [
        {
            name: '销售额',
            type: 'pie',
            radius: ['40%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
                borderRadius: 10,
                borderColor: '#fff',
                borderWidth: 2
            },
            label: {
                show: false,
                position: 'center'
            },
            emphasis: {
                label: {
                    show: true,
                    fontSize: '18',
                    fontWeight: 'bold'
                }
            },
            labelLine: {
                show: false
            },
            data: [
                { value: 1048, name: '产品A' },
                { value: 735, name: '产品B' },
                { value: 580, name: '产品C' },
                { value: 484, name: '产品D' },
                { value: 300, name: '产品E' }
            ]
        }
    ]
});
</script>

<style scoped lang="scss"></style>
