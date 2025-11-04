<template>
    <div class="big-block">
        <Title>地域分布</Title>
        <div style="width: 100%; height: 98%">
            <v-chart :option="option" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Title from '../title.vue';
import echarts, { ECOption } from '@/components/echarts/base';
import allData from '../../assets/data/map.json';
import chinaJson from '../../assets/data/china.json';
import { getChartSize, getFontSize } from '../../utils/calculate';

echarts.registerMap('china', chinaJson as any); // 注册地图
const option = ref<ECOption>({
    geo: {
        type: 'map',
        map: 'china', // 地图类型（china/province/市）
        top: '5%',
        bottom: '5%',
        // 地图区域样式（可选，避免名称与区域颜色冲突）
        itemStyle: {
            areaColor: '#2E72BF', // 地图背景色
            borderColor: '#333'
        },
        // roam: true, //是否允许缩放
        // 新增：省份名称样式配置
        label: {
            // show: true, // 显示省份名称（默认可能不显示）
            fontSize: getFontSize(12), // 省份名称字体大小（建议12-14）
            color: '#fff', // 字体颜色（与地图背景对比）
            // 可选：增加文字描边，避免与背景融合
            textBorderColor: '#000',
            textBorderWidth: 0.5
        },
        // 可选：鼠标悬停时放大字体
        emphasis: {
            label: {
                fontSize: getFontSize(14), // 悬停时放大
                color: '#fff',
                fontWeight: 'bold'
            }
        }
    },
    legend: {
        left: '5%',
        bottom: '5%',
        orient: 'vertical',
        symbol: 'circle',
        symbolSize: getChartSize(8),
        data: allData.map((item) => item.name),
        textStyle: {
            color: '#AAA',
            fontSize: getFontSize()
        }
    },
    color: ['#F6C95C', '#EF7D33', '#FF0000', '#184EA1', '#81C8EF', '#9270CA'],
    series: allData.map((item) => {
        // return的这个对象就代表的是一个类别下的所有散点数据
        // 如果想在地图中显示散点的数据, 我们需要给散点的图表增加一个配置, coordinateSystem:geo
        return {
            type: 'effectScatter',
            rippleEffect: {
                // scale: 5,
                scale: 8, // 增大涟漪范围（默认5）
                brushType: 'stroke',
                period: 4, // 涟漪动画周期
                rippleScale: 0.8 // 涟漪缩放比例
            },
            name: item.name,
            data: item.children,
            coordinateSystem: 'geo',
            symbol: 'circle', // 散点形状（circle, rect, roundRect等）
            symbolSize: getChartSize(8), // 统一设置所有散点的大小
            // data: item.children.map(child => ({
            //     ...child,
            //     symbolSize: child.value / 10 // 根据value值计算大小
            // })),
            emphasis: {
                scale: true, // 鼠标悬停时放大
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: '#fff'
                }
            }
        };
    })
});
</script>

<style lang="scss" scoped>
.big-block {
    width: 100%;
    height: 100%;
    padding: var(--big-padding-16);
    // background-color: var(--big-block-bg);
}
</style>
