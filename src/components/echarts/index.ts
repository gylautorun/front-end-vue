import BaseChart from '@/components/echarts/base-chart.vue';
import { App } from 'vue';

export const install = (app: App) => {
    app.component('v-chart', BaseChart);
};

export default { install };
