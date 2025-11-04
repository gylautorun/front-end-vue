<template>
    <div class="big-block">
        <Title>地区销售排行</Title>
        <div style="width: 100%; height: 90%">
            <Chart :option="option" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Title from '../title.vue';
import Chart from '@/components/echarts/base-chart.vue';
import echarts, { ECOption } from '@/components/echarts/base';
import allData from '../../assets/data/rank.json';
import { getFontSize } from '../../utils/calculate';

const colorArr = [
    ['#0BA82C', '#4FF778'],
    ['#2E72BF', '#23E5E5'],
    ['#5052EE', '#AB6EE5']
];
const startValue = ref(0);
const endValue = ref(9);
const barWidth = 12;
const option = ref<ECOption>({
    grid: {
        top: '10%',
        left: '5%',
        right: '5%',
        bottom: '5%',
        containLabel: true
    },
    tooltip: {
        show: true,
        textStyle: {
            fontSize: getFontSize(14),
            // fontWeight: 'bold', // 字体粗细
            color: '#FFF' // 字体颜色
        }
    },
    xAxis: {
        type: 'category',
        axisTick: { show: false }
    },
    yAxis: {
        type: 'value',
        splitLine: { show: false },
        axisLine: { show: true }
    },
    dataZoom: {
        show: false,
        startValue: startValue.value,
        endValue: endValue.value
    },
    series: [
        {
            type: 'bar',
            data: allData.map((item) => item.value),
            barWidth: barWidth,
            itemStyle: {
                borderRadius: [barWidth / 2, barWidth / 2, 0, 0],
                color: (arg: any) => {
                    let targetColorArr: string[] | null = null;
                    if (arg.value > 300) {
                        targetColorArr = colorArr[0];
                    } else if (arg.value > 200) {
                        targetColorArr = colorArr[1];
                    } else {
                        targetColorArr = colorArr[2];
                    }
                    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        {
                            offset: 0,
                            color: targetColorArr[0]
                        },
                        {
                            offset: 1,
                            color: targetColorArr[1]
                        }
                    ]);
                }
            }
        }
    ]
});
</script>

<style lang="scss" scoped>
.big-block {
    width: 100%;
    height: 100%;
}
</style>
