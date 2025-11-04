import BaseChart from '@/components/echarts/base-chart.vue';
import echarts from './base';
import { App } from 'vue';

export const install = (app: App) => {
    app.component('v-chart', BaseChart);
};

export { echarts };
export default { install };
