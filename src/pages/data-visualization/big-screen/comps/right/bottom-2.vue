<template>
    <div class="big-block">
        <Title>年度降雨量统计</Title>
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
import { getFontSize, getChartSize } from '../../utils/calculate';

const option = ref<ECOption>({
    // backgroundColor: 'rgba(0,0,0,.6)',
    grid: {
        top: '16%',
        left: '0%',
        right: '7%',
        bottom: '0%',
        containLabel: true
    },
    legend: {
        itemGap: 30,
        data: ['雨量', '累计雨量'],
        textStyle: {
            color: '#fff',
            borderColor: '#fff',
            fontSize: getFontSize(12)
        }
    },
    tooltip: {
        trigger: 'axis',
        padding: [5, 10, 5, 10],
        backgroundColor: 'rgba(0,0,0,.6)',
        borderColor: 'transparent',
        textStyle: {
            fontSize: getFontSize(14),
            // fontWeight: 'bold', // 字体粗细
            color: '#FFF' // 字体颜色
        },
        formatter: (p: any) => {
            let str = '';
            p.forEach((val: any) => {
                str += `
                  <p class="item">
                      <i class="icon" style="background-color:${val.color || 'red'}"></i>
                      <span class="name">${val.seriesName}</span>
                      <span class="value"><b>${val.value}</b></span>
                  </p>`;
            });
            return `
          <div class="averageRainfallForecastChart-popup">
            <p class="top">
                <span>${p[0].axisValue} </span>
            </p>
            ${str}
          </div>
        `;
        }
    },
    xAxis: [
        {
            nameGap: 5,
            type: 'category',
            axisLine: {
                show: true,
                lineStyle: {
                    color: '#999'
                }
            },
            axisLabel: {
                color: '#9eaaba',
                fontSize: getFontSize(12)
            },
            axisTick: {
                show: false
            },
            data: ['2017', '2018', '2019', '2020', '2021', '2022', '2023']
        }
    ],
    yAxis: [
        {
            offset: 0,
            name: '单位 mm',
            nameGap: 40, // 关键属性：调整名称与轴线的距离（数值越大距离越远）
            nameLocation: 'end', // 名称位置（end/start/middle，默认end）
            nameTextStyle: {
                color: '#9eaaba',
                fontSize: getFontSize(12),
                padding: [0, 0, 0, 10] // 额外内边距（上右下左）
            },
            type: 'value',
            // 轴线样式
            axisTick: {
                show: false
            },
            // 标签样式
            axisLabel: {
                show: true,
                color: '#9eaaba',
                fontSize: getFontSize(12)
            },
            // 轴线样式
            axisLine: {
                show: true
            },
            splitLine: {
                show: true,
                lineStyle: {
                    width: getChartSize(1),
                    color: 'rgba(49,105,129,0.4)',
                    type: 'dashed'
                }
            }
        }
    ],
    series: [
        {
            name: '雨量',
            type: 'bar',
            barWidth: 15,
            label: {
                show: false,
                position: 'top',
                color: '#fff',
                fontSize: getFontSize(12)
            },
            itemStyle: {
                color: new echarts.graphic.LinearGradient(
                    0,
                    0,
                    0,
                    1,
                    [
                        {
                            offset: 0,
                            color: '#32ACF0'
                        },
                        {
                            offset: 1,
                            color: 'rgba(124,248,255,1)'
                        }
                    ],
                    false
                ),
                borderRadius: [30, 30, 0, 0]
            },
            data: [393, 438, 485, 631, 689, 524, 687]
        },
        {
            name: '累计雨量',
            type: 'line',
            smooth: true,
            showAllSymbol: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
                color: 'rgba(44, 244, 255, 1)'
            },
            label: {
                show: false,
                position: 'top',
                color: '#fff',
                fontSize: getFontSize(12)
            },
            itemStyle: {
                color: '#2CF2FD'
            },

            areaStyle: {
                color: new echarts.graphic.LinearGradient(
                    0,
                    0,
                    0,
                    1,
                    [
                        {
                            offset: 0,
                            color: '#2CF4FF'
                        },
                        {
                            offset: 1,
                            color: 'rgba(124,248,255,0.1)'
                        }
                    ],
                    false
                ),
                shadowColor: 'rgba(124,248,255, 0)',
                shadowBlur: 20
            },
            data: [393, 438, 485, 631, 389, 224, 287]
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
