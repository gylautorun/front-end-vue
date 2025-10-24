<template>
    <div class="data-visualization-container">
        <div class="header">
            <h1>数据可视化展示</h1>
            <p>响应式图表展示不同屏幕尺寸下的自适应效果</p>
            <div class="control-buttons">
                <h3>布局控制</h3>
                <div class="button-group">
                    <h4>单独控制</h4>
                    <a-button type="primary" @click="toggleSider()">切换侧边栏</a-button>
                    <a-button type="primary" @click="toggleHeader()">切换顶部导航</a-button>
                    <a-button type="primary" @click="toggleFooter()">切换底部信息</a-button>
                </div>
                <div class="button-group">
                    <h4>预设模式</h4>
                    <a-button type="default" @click="setFullscreen()">全屏模式</a-button>
                    <a-button type="default" @click="setNoSider()">无侧边栏</a-button>
                    <a-button type="default" @click="resetLayout()">标准模式</a-button>
                </div>
            </div>
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
// import { useRoute } from 'vue-router';
import { useGlobalStore } from '@/stores/modules/global';
import { setLayoutPreset, setLayoutState, LAYOUT_PRESETS } from '@/router/guards/layout';

// const route = useRoute();
const globalStore = useGlobalStore();

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

// 切换侧边栏显示
function toggleSider() {
    setLayoutState({ showSider: !globalStore.showSider });
    console.log('侧边栏状态:', globalStore.showSider);
}

// 切换顶部导航显示
function toggleHeader() {
    setLayoutState({ showHeader: !globalStore.showHeader });
    console.log('顶部导航状态:', globalStore.showHeader);
}

// 切换底部信息显示
function toggleFooter() {
    setLayoutState({ showFooter: !globalStore.showFooter });
    console.log('底部信息状态:', globalStore.showFooter);
}

// 重置布局到默认状态
function resetLayout() {
    setLayoutPreset('standard');
    console.log('布局已重置为标准模式');
}

// 设置为全屏模式
function setFullscreen() {
    setLayoutPreset('fullscreen');
    console.log('已设置为全屏模式');
}

// 设置为无侧边栏模式
function setNoSider() {
    setLayoutPreset('noSider');
    console.log('已设置为无侧边栏模式');
}

// 页面挂载时设置初始状态
onMounted(() => {
    // 使用布局预设设置初始状态
    setLayoutPreset('fullscreen');
});

// 页面卸载时恢复默认状态（可选）
onBeforeUnmount(() => {
    // 恢复默认显示状态
    setLayoutPreset('standard');
});
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
            margin-bottom: 20px;
        }

        .control-buttons {
            margin-top: 20px;

            h3 {
                text-align: center;
                margin-bottom: 20px;
                color: #333;
                font-size: 18px;
            }

            .button-group {
                margin-bottom: 20px;

                h4 {
                    text-align: center;
                    margin-bottom: 10px;
                    color: #666;
                    font-size: 14px;
                    font-weight: normal;
                }

                display: flex;
                justify-content: center;
                gap: 12px;
                flex-wrap: wrap;

                .ant-btn {
                    margin: 0 4px;
                }
            }
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
