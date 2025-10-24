<template>
    <div class="data-visualization-container">
        <div class="header">
            <h1>数据可视化展示</h1>
            <p>响应式图表展示不同屏幕尺寸下的自适应效果</p>
            <a-button type="primary" @click="toggleSider()">切换显示侧边栏</a-button>
        </div>

        <div class="charts-container">
            <div class="chart-wrapper" v-for="item in chartList" :key="item.id">
                <component :is="item.component" class="chart"></component>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { IndexChart, BarChart, PieChart, LineChart, AreaChart } from '../components';
import { useRoute } from 'vue-router';
import { RouteItem } from '@/router/type';

const route = useRoute();

const chartList = [
    {
        id: 'indexChart',
        component: IndexChart
    },
    {
        id: 'barChart',
        component: BarChart
    },
    {
        id: 'lineChart',
        component: LineChart
    },
    {
        id: 'pieChart',
        component: PieChart
    },
    {
        id: 'areaChart',
        component: AreaChart
    }
];

function toggleSider() {
    const visible = route.meta.showSider;
    console.log('visible', route.meta);
    route.meta?.setValue('showSider', !visible);
}
</script>

<style scoped lang="scss">
.data-visualization-container {
    padding: 20px;
    background-color: #f5f5f5;
    min-height: 100%;

    .header {
        text-align: center;
        margin-bottom: 30px;

        h1 {
            font-size: 28px;
            color: #333;
            margin-bottom: 10px;
        }

        p {
            font-size: 16px;
            color: #666;
        }
    }

    .charts-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
        gap: 20px;

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
        }

        @media (min-width: 769px) and (max-width: 1200px) {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    .chart-wrapper {
        background: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
        padding: 20px;
        transition: all 0.3s ease;

        &:hover {
            box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.15);
            transform: translateY(-2px);
        }

        .chart {
            width: 100%;
            height: 400px;
        }
    }
}
</style>
