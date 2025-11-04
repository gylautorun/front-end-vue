<template>
    <div class="big-block">
        <Title>地区地铁营运趋势</Title>
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
import allData from '../../assets/data/trend.json';
import { getFontSize, getChartSize } from '../../utils/calculate';

const choiceType = 'map';
const option = ref<ECOption>({
    grid: {
        left: '3%',
        top: '25%',
        right: '4%',
        bottom: '1%',
        containLabel: true
    },
    legend: {
        left: 20,
        top: '8%',
        icon: 'circle',
        data: allData[choiceType].data,
        textStyle: {
            color: '#aaa',
            fontSize: getFontSize()
        }
    },
    xAxis: {
        type: 'category',
        boundaryGap: false,
        data: allData.common.month,
        axisLabel: {
            fontSize: getFontSize(12),
            rotate: 45, // 旋转45度
            interval: 0 // 显示所有标签
        }
    },
    yAxis: {
        type: 'value',
        axisLabel: {
            fontSize: getFontSize()
        }
    },
    tooltip: {
        trigger: 'axis',
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
    series: getSeries()
});

function getSeries(): ECOption['series'] {
    // 半透明的颜色值
    const colorArr1 = [
        'rgba(11, 168, 44, 0.5)',
        'rgba(44, 110, 255, 0.5)',
        'rgba(22, 242, 217, 0.5)',
        'rgba(254, 33, 30, 0.5)',
        'rgba(250, 105, 0, 0.5)'
    ];
    // 全透明的颜色值
    const colorArr2 = [
        'rgba(11, 168, 44, 0)',
        'rgba(44, 110, 255, 0)',
        'rgba(22, 242, 217, 0)',
        'rgba(254, 33, 30, 0)',
        'rgba(250, 105, 0, 0)'
    ];
    // y轴的数据 series下的数据
    const valueArr = allData[choiceType].data;
    const seriesArr = valueArr.map((item, index) => {
        return {
            name: item.name,
            type: 'line' as const,
            data: item.data.map((val: string) => parseFloat(val)),
            stack: choiceType as string,
            itemStyle: {
                borderWidth: 4
            },
            lineStyle: {
                width: 3
            },
            symbolSize: 0,
            symbol: 'circle',
            smooth: true,
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    {
                        offset: 0,
                        color: colorArr1[index]
                    }, // %0的颜色值
                    {
                        offset: 1,
                        color: colorArr2[index]
                    } // 100%的颜色值
                ])
            }
        };
    });

    return seriesArr;
}
</script>

<style lang="scss" scoped>
.big-block {
    width: 100%;
    height: 100%;
}
</style>
