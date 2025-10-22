<template>
    <v-chart ref="chartRef" :option="option" />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { ECOption } from '@/components/echarts/base';
const chartRef = ref<HTMLElement | null>(null);
// ref<ECOption>
const option = ref<ECOption>({
    xAxis: {
        type: 'category',
        data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    },
    yAxis: {
        type: 'value'
    },
    series: [
        {
            data: [120, 200, 150, 80, 70, 110, 130],
            type: 'bar',
            showBackground: true,
            backgroundStyle: {
                color: 'rgba(180, 180, 180, 0.2)'
            }
        }
    ]
});
</script>

<style scoped lang="scss"></style>
