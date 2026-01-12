<template>
    <div class="xi-an-enterprise-map">
        <h2>西安市16家企业分布图</h2>
        <div ref="chartRef" class="chart-container"></div>
    </div>
</template>

<script setup lang="ts" name="XiAnEnterpriseMap">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { echarts } from '@/components/echarts';
import { EChartsType } from 'echarts/core';
import { debounce } from 'lodash-es';
// 导入西安地图数据
import xiAnJson from '../geo-json/xi-an.json';

// 模拟 16 家西安企业坐标（真实数据需替换）
const enterprises = [
    { name: '企业A', coord: [108.94, 34.26], industry: '科技', value: 120 },
    { name: '企业B', coord: [108.95, 34.27], industry: '制造', value: 80 },
    { name: '企业C', coord: [108.93, 34.25], industry: '金融', value: 150 },
    { name: '企业D', coord: [108.96, 34.28], industry: '科技', value: 90 },
    { name: '企业E', coord: [108.92, 34.24], industry: '教育', value: 60 },
    { name: '企业F', coord: [108.97, 34.29], industry: '制造', value: 110 },
    { name: '企业G', coord: [108.91, 34.23], industry: '科技', value: 130 },
    { name: '企业H', coord: [108.98, 34.3], industry: '金融', value: 70 },
    { name: '企业I', coord: [108.9, 34.22], industry: '教育', value: 50 },
    { name: '企业J', coord: [108.99, 34.31], industry: '制造', value: 100 },
    { name: '企业K', coord: [108.89, 34.21], industry: '科技', value: 140 },
    { name: '企业L', coord: [109.0, 34.32], industry: '金融', value: 85 },
    { name: '企业M', coord: [108.88, 34.2], industry: '教育', value: 65 },
    { name: '企业N', coord: [109.01, 34.33], industry: '制造', value: 95 },
    { name: '企业O', coord: [108.87, 34.19], industry: '科技', value: 115 },
    { name: '企业P', coord: [109.02, 34.34], industry: '金融', value: 75 }
];

const chartRef = ref<HTMLElement | null>(null);
const chart = ref<EChartsType | null>(null);

// 初始化图表
const initChart = () => {
    if (!chartRef.value) return;

    // 创建图表实例
    chart.value = echarts.init(chartRef.value);

    // 注册西安地图数据
    echarts.registerMap('xi-an', xiAnJson as any);

    // 图表配置
    const option = {
        title: {
            text: '西安市16家企业分布图',
            left: 'center',
            textStyle: {
                fontSize: 18,
                fontWeight: 'bold'
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: function (params: any) {
                if (params.seriesType === 'effectScatter') {
                    return `${params.name}<br/>坐标: ${params.value.slice(0, 2).join(', ')}<br/>行业: ${params.data.industry}<br/>规模: ${params.data.value}`;
                }
                return params.name;
            }
        },
        // 地图配置
        geo: {
            map: 'xi-an', // 使用西安地图
            roam: true,
            zoom: 12,
            center: [108.94, 34.26], // 聚焦西安市中心
            label: {
                show: true,
                fontSize: 14,
                color: '#333'
            },
            itemStyle: {
                areaColor: '#f0f9ff',
                borderColor: '#99d2dd'
            },
            emphasis: {
                itemStyle: {
                    areaColor: '#e0f2fe'
                },
                label: {
                    show: true,
                    color: '#0369a1'
                }
            }
        },
        // 图例
        legend: {
            data: ['科技', '制造', '金融', '教育'],
            top: 30,
            left: 'left'
        },
        // 系列数据
        series: [
            {
                name: '企业分布',
                type: 'effectScatter',
                coordinateSystem: 'geo',
                data: enterprises.map((item) => ({
                    name: item.name,
                    value: [...item.coord, item.value],
                    industry: item.industry,
                    itemStyle: {
                        color: getIndustryColor(item.industry)
                    }
                })),
                symbolSize: function (val: any) {
                    // 根据企业规模动态调整点的大小
                    return Math.max(8, Math.min(val[2] / 10, 15));
                },
                rippleEffect: {
                    brushType: 'stroke',
                    scale: 2.5,
                    period: 4
                },
                label: {
                    show: true,
                    position: 'right',
                    formatter: '{b}',
                    fontSize: 10,
                    distance: 5
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 12
                    }
                }
            }
        ],
        // 视觉映射
        visualMap: {
            type: 'continuous',
            min: 50,
            max: 150,
            left: 'right',
            top: 'center',
            text: ['规模大', '规模小'],
            calculable: true,
            inRange: {
                color: ['#f0f9ff', '#0369a1']
            }
        }
    };

    // 设置图表配置
    chart.value.setOption(option);
};

// 根据行业获取颜色
const getIndustryColor = (industry: string) => {
    const colorMap: Record<string, string> = {
        科技: '#3b82f6',
        制造: '#10b981',
        金融: '#f59e0b',
        教育: '#ef4444'
    };
    return colorMap[industry] || '#6b7280';
};

// 响应式调整图表大小
const resizeChart = debounce(() => {
    chart.value?.resize();
}, 100);

// 添加实时更新效果
const updateRealTimeData = () => {
    if (!chart.value) return;

    // 模拟实时数据更新 - 随机更新部分企业的位置或规模
    const updatedEnterprises = [...enterprises];
    const randomIndex = Math.floor(Math.random() * updatedEnterprises.length);

    // 随机微调企业位置
    updatedEnterprises[randomIndex].coord[0] += (Math.random() - 0.5) * 0.01;
    updatedEnterprises[randomIndex].coord[1] += (Math.random() - 0.5) * 0.01;

    // 随机更新企业规模
    updatedEnterprises[randomIndex].value += (Math.random() - 0.5) * 10;
    updatedEnterprises[randomIndex].value = Math.max(
        50,
        Math.min(updatedEnterprises[randomIndex].value, 150)
    );

    // 更新图表
    chart.value.setOption({
        series: [
            {
                data: updatedEnterprises.map((item) => ({
                    name: item.name,
                    value: [...item.coord, item.value],
                    industry: item.industry,
                    itemStyle: {
                        color: getIndustryColor(item.industry)
                    }
                }))
            }
        ]
    });
};

// 定时器
let updateTimer: number | null = null;

onMounted(() => {
    // 初始化图表
    initChart();

    // 添加窗口大小变化监听
    window.addEventListener('resize', resizeChart);

    // 启动实时更新（每5秒更新一次）
    updateTimer = window.setInterval(updateRealTimeData, 5000);
});

onUnmounted(() => {
    // 清除事件监听
    window.removeEventListener('resize', resizeChart);

    // 清除定时器
    if (updateTimer) {
        clearInterval(updateTimer);
    }

    // 销毁图表实例
    chart.value?.dispose();
});
</script>

<style lang="scss" scoped>
.xi-an-enterprise-map {
    padding: 20px;
    h2 {
        text-align: center;
        margin-bottom: 20px;
        color: #333;
        font-size: 20px;
        font-weight: bold;
    }

    .chart-container {
        width: 100%;
        height: 600px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
    }
}
</style>
