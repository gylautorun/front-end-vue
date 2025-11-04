<template>
    <div class="big-block">
        <Title>销售统计</Title>
        <div style="width: 100%; height: 90%">
            <Chart :option="option" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Title from '../title.vue';
import Chart from '@/components/echarts/base-chart.vue';
import allData from '../../assets/data/seller.json';
import echarts, { ECOption } from '@/components/echarts/base';
import { getFontSize, getChartSize } from '../../utils/calculate';

const barWidth = getChartSize(22);
const option = ref<ECOption>({
    grid: {
        top: '10%',
        left: '5%',
        right: '10%',
        bottom: '5%',
        containLabel: true // 距离是包含坐标轴上的文字
    },
    xAxis: {
        type: 'value', // 数值轴  横坐标轴类型：value、category
        show: true,
        splitLine: { show: true },
        axisLine: {
            show: true,
            lineStyle: {
                width: getChartSize(1),
                type: 'solid'
            }
        },
        axisLabel: {
            fontSize: getFontSize()
        }
    },
    yAxis: {
        type: 'category', // 类目轴  纵坐标轴类型：value、category
        show: true,
        axisTick: { show: true },
        axisLine: {
            show: true,
            lineStyle: {
                width: getChartSize(1),
                type: 'solid'
            }
        },
        axisLabel: {
            fontSize: getFontSize()
        },
        data: allData.slice(0, 5).map((item) => {
            return item.name;
        })
    },
    tooltip: {
        trigger: 'axis',
        axisPointer: {
            type: 'line',
            z: 0,
            lineStyle: {
                color: '#2D3443'
            }
        },
        textStyle: {
            fontSize: getFontSize(14),
            // fontWeight: 'bold', // 字体粗细
            color: '#333' // 字体颜色
        },
        backgroundColor: '#FFF', // 背景颜色
        borderColor: '#CCC', // 边框颜色
        borderWidth: getChartSize(1), // 边框宽度
        padding: getChartSize(10)
    },
    series: [
        {
            type: 'bar',
            label: {
                show: true,
                position: 'right',
                fontSize: getFontSize(), // 字体大小
                color: '#FFF', // 字体颜色
                fontWeight: 'bold'
            },
            barWidth: barWidth,
            roundCap: true,
            itemStyle: {
                borderWidth: 0,
                borderRadius: [0, barWidth / 2, barWidth / 2, 0],
                color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                    {
                        offset: 0,
                        color: '#5052EE'
                    },
                    {
                        offset: 1,
                        color: '#AB6EE5'
                    }
                ])
            },
            data: allData.slice(0, 5).map((item) => {
                return item.value;
            })
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
