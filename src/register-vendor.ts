import type { App } from 'vue';

import VXETable from 'vxe-table';
import 'vxe-table/lib/style.css';

import vue3TreeOrg from 'vue3-tree-org'
import 'vue3-tree-org/lib/vue3-tree-org.css';

import ElementPlus from 'element-plus';
// 需要注意的是，样式文件需要单独引入
import 'element-plus/dist/index.css';
import 'virtual:uno.css';

import { VueQueryPlugin } from 'vue-query';


export function registerVendor(app: App) {
	app.use(VXETable);
	app.use(vue3TreeOrg);
	app.use(ElementPlus);
	app.use(VueQueryPlugin);
}
