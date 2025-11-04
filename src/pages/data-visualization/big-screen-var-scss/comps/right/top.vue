<template>
    <div class="big-block">
        <Title>商品的占比</Title>
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
import allData from '../../assets/data/hot.json';
import { getFontSize, getChartSize } from '../../utils/calculate';

const currentIndex = ref(0);
const option = ref<ECOption>({
    grid: {
        containLabel: false
    },
    legend: {
        bottom: '0%',
        icon: 'circle',
        data: allData[currentIndex.value].children.map((item) => {
            return item.name;
        }),
        textStyle: {
            color: '#aaa',
            fontSize: getFontSize()
        }
    },
    tooltip: {
        show: true,
        formatter: (arg: any) => {
            // console.log(arg);
            const thirdCategory = arg.data.children || [];
            // 计算出所有三级分类的数值总和
            let total = 0;
            thirdCategory.forEach((item: { value: number }) => {
                total += item.value;
            });
            let retStr = '';
            thirdCategory.forEach((item: { name: any; value: number }) => {
                retStr += `
				${item.name}:${Number((item.value / total) * 100).toFixed(2) + '%'}
				<br/>
				`;
            });
            return retStr;
        },
        textStyle: {
            fontSize: getFontSize(14),
            // fontWeight: 'bold', // 字体粗细
            color: '#333' // 字体颜色
        }
    },
    series: [
        {
            type: 'pie',
            label: {
                show: false,
                fontSize: getFontSize(), // 字体大小
                color: '#FFF', // 字体颜色
                fontWeight: 'bold'
            },
            emphasis: {
                label: {
                    show: true
                },
                labelLine: {
                    show: false
                }
            },
            data: allData[currentIndex.value].children.map((item) => {
                return {
                    name: item.name,
                    value: item.value,
                    children: item.children // 新增加children的原因是为了在tooltip中的formatter的回调函数中,来拿到这个二级分类下的三级分类数据
                };
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
