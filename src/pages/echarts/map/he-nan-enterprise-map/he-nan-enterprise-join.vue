<template>
    <div class="he-nan-enterprise-map">
        <base-chart ref="chartRef" class="chart-container" :option="options" />
    </div>
</template>

<script setup lang="ts" name="HeNanEnterpriseJoin">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import echarts, { ECOption } from '@/components/echarts/base';
import { EChartsType } from 'echarts/core';
import { BaseChart } from '@/components/echarts';
import { apiMockPromise } from '@/utils/promise/mock-promise';
// 导入河南地图数据
import heNanGeoJson from '../geo-json/henan.json';

const chartRef = ref<InstanceType<typeof BaseChart> | null>(null);
const options = ref<ECOption>({});

// 城市坐标映射
const chinaGeoCoordMap: Record<string, [number, number]> = {
    三门峡市: [111.181262093, 34.7833199411],
    信阳市: [114.085490993, 32.1285823075],
    南阳市: [112.542841901, 33.0114195691],
    周口市: [114.654101942, 33.6237408181],
    商丘市: [115.641885688, 34.4385886402],
    安阳市: [114.351806508, 36.1102667222],
    平顶山市: [113.300848978, 33.7453014565],
    开封市: [114.351642118, 34.8018541758],
    新乡市: [113.912690161, 35.3072575577],
    洛阳市: [112.147524769, 34.2873678177],
    漯河市: [114.0460614, 33.5762786885],
    濮阳市: [115.026627441, 35.7532978882],
    焦作市: [113.211835885, 35.234607555],
    许昌市: [113.83531246, 34.0267395887],
    驻马店市: [114.049153547, 32.9831581541],
    鹤壁市: [114.297769838, 35.7554258742],
    郑州市: [113.64964385, 34.7566100641]
};

// 企业分布数据
const chinaDatas = [
    [{ name: '郑州市', value: 0 }],
    [{ name: '鹤壁市', value: 0 }],
    [{ name: '驻马店市', value: 0 }],
    [{ name: '许昌市', value: 0 }],
    [{ name: '焦作市', value: 0 }],
    [{ name: '濮阳市', value: 0 }],
    [{ name: '漯河市', value: 1 }],
    [{ name: '洛阳市', value: 0 }],
    [{ name: '新乡市', value: 0 }],
    [{ name: '开封市', value: 0 }],
    [{ name: '平顶山市', value: 0 }],
    [{ name: '安阳市', value: 0 }],
    [{ name: '商丘市', value: 0 }],
    [{ name: '周口市', value: 0 }],
    [{ name: '南阳市', value: 0 }],
    [{ name: '信阳市', value: 0 }],
    [{ name: '三门峡市', value: 20 }]
];

// 数据转换函数
const convertData = (data: any[]) => {
    const res = [];
    for (let i = 0; i < data.length; i++) {
        const dataItem = data[i];
        const fromCoord = chinaGeoCoordMap[dataItem[0].name];
        const toCoord = [113.64964385, 34.7566100641]; // 郑州市坐标
        if (fromCoord && toCoord) {
            res.push([{ coord: fromCoord, value: dataItem[0].value }, { coord: toCoord }]);
        }
    }
    return res;
};

// 模拟接口获取地图数据
const fetchMapData = () => {
    return apiMockPromise(
        {
            geoJson: heNanGeoJson,
            cityData: chinaDatas
        },
        0.5
    );
};

// 初始化图表
const initChart = async () => {
    try {
        const res = await apiMockPromise(heNanGeoJson);
        // 注册地图
        echarts.registerMap('河南', res as any);

        const series: any[] = [];
        [['郑州市', chinaDatas]].forEach((item, i) => {
            series.push(
                {
                    type: 'lines',
                    zlevel: 2,
                    effect: {
                        show: true,
                        period: 4, // 箭头指向速度，值越小速度越快
                        trailLength: 0.02, // 特效尾迹长度[0,1]值越大，尾迹越长重
                        symbol: 'arrow', // 箭头图标
                        symbolSize: 5 // 图标大小
                    },
                    lineStyle: {
                        normal: {
                            color: '#EE5652',
                            width: 1, // 尾迹线条宽度
                            opacity: 1, // 尾迹线条透明度
                            curveness: 0.3 // 尾迹线条曲直度
                        }
                    },
                    data: convertData(item[1]),
                    progressive: 0 // 禁用渐进渲染
                },
                {
                    type: 'effectScatter',
                    coordinateSystem: 'geo',
                    zlevel: 2,
                    progressive: 0, // 禁用渐进渲染
                    rippleEffect: {
                        // 涟漪特效
                        period: 4, // 动画时间，值越小速度越快
                        brushType: 'stroke', // 波纹绘制方式 stroke, fill
                        scale: 4 // 波纹圆环最大限制，值越大波纹越大
                    },
                    label: {
                        normal: {
                            show: true,
                            position: 'right', // 显示位置
                            offset: [5, 0], // 偏移设置
                            formatter: (params: any) => {
                                // 圆环显示文字
                                return params.data.name;
                            },
                            color: '#FFD200',
                            fontSize: 16
                        },
                        emphasis: {
                            show: true
                        }
                    },
                    symbol: 'circle',
                    itemStyle: {
                        normal: {
                            show: true,
                            color: '#ffffff'
                        }
                    },
                    data: item[1]
                        .map((dataItem: any) => {
                            const coord = chinaGeoCoordMap[dataItem[0].name];
                            if (!coord) return null;
                            return {
                                name: dataItem[0].name,
                                value: coord.concat([dataItem[0].value])
                            };
                        })
                        .filter(Boolean)
                }
            );
        });

        options.value = {
            backgroundColor: '#013954',
            progressive: 0, // 全局禁用渐进渲染
            progressiveThreshold: 0,
            geo: [
                {
                    map: '河南',
                    aspectScale: 0.9,
                    roam: false, // 是否允许缩放
                    zoom: 1.2, // 默认显示级别
                    layoutSize: '95%',
                    layoutCenter: ['55%', '50%'],
                    itemStyle: {
                        // normal: {
                        areaColor: {
                            type: 'linear-gradient',
                            x: 0,
                            y: 400,
                            x2: 0,
                            y2: 0,
                            colorStops: [
                                {
                                    offset: 0,
                                    color: 'rgba(37,108,190,0.3)' // 0% 处的颜色
                                },
                                {
                                    offset: 1,
                                    color: 'rgba(15,169,195,0.3)' // 50% 处的颜色
                                }
                            ]
                        },
                        borderColor: '#4ecee6',
                        borderWidth: 1,
                        // },
                        emphasis: {
                            areaColor: {
                                type: 'linear-gradient',
                                x: 0,
                                y: 300,
                                x2: 0,
                                y2: 0,
                                colorStops: [
                                    {
                                        offset: 0,
                                        color: 'rgba(37,108,190,1)' // 0% 处的颜色
                                    },
                                    {
                                        offset: 1,
                                        color: 'rgba(15,169,195,1)' // 50% 处的颜色
                                    }
                                ]
                            }
                        }
                    },
                    emphasis: {
                        itemStyle: {
                            areaColor: '#0160AD'
                        },
                        label: {
                            show: true,
                            color: 'transparent'
                        }
                    },
                    zlevel: 3
                },
                {
                    map: '河南',
                    aspectScale: 0.9,
                    roam: false, // 是否允许缩放
                    zoom: 1.2, // 默认显示级别
                    layoutSize: '95%',
                    layoutCenter: ['55%', '50%'],
                    itemStyle: {
                        // normal: {
                        borderColor: 'rgba(192,245,249,.6)',
                        borderWidth: 2,
                        shadowColor: '#2C99F6',
                        shadowOffsetY: 0,
                        shadowBlur: 120,
                        areaColor: 'rgba(29,85,139,.2)'
                        // }
                    },
                    zlevel: 2,
                    silent: true
                },
                {
                    map: '河南',
                    aspectScale: 0.9,
                    roam: false, // 是否允许缩放
                    zoom: 1.2, // 默认显示级别
                    layoutSize: '95%',
                    layoutCenter: ['55%', '51.5%'],
                    itemStyle: {
                        areaColor: 'rgba(0,27,95,0.4)',
                        borderColor: '#004db5',
                        borderWidth: 1
                    },
                    zlevel: 1,
                    silent: true
                }
            ],
            series: series
        };
    } catch (error) {
        console.error('初始化图表失败:', error);
    }
};

onMounted(async () => {
    // 初始化图表
    await initChart();
});

onUnmounted(() => {
    // 清理资源
});
</script>

<style lang="scss" scoped>
.he-nan-enterprise-map {
    padding: 20px;

    .chart-container {
        width: 100%;
        height: 600px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
    }
}
</style>
