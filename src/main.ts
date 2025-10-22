import { createApp } from 'vue';
// pinia store
import { setupPiniaStore, pinia } from '@/stores/index';

// antd icons
import * as Icons from '@ant-design/icons-vue';
// vue i18n
import I18n from '@/i18n/index';

import router from '@/router/index';
import App from './app.vue';
// custom directives
import directives from '@/directives/index';

import * as EChart from '@/components/echarts';

import { registerGlobComp } from './register';

import { registerVendor } from './register-vendor';

import './style.scss';

// svg icons
import 'virtual:svg-icons-register';

// iconfont css
// import '@/assets/iconfont/iconfont.scss';
// font css
// import '@/assets/fonts/font.scss';

const app = createApp(App);
// 全局注册 自定义指令(directive)
// setupDirective(app);
// 全局注册 状态管理(store)
// xxx

// 注册antd Icons组件
Object.keys(Icons).forEach((key) => {
    app.component(key, Icons[key as keyof typeof Icons]);
});
// 注册全局组件
registerGlobComp(app);

// 注册pinia store, 处理了 app.use(pinia);
setupPiniaStore(app);

// 注册 第三方插件
registerVendor(app);

app.use(EChart)
    .use(directives)
    .use(router)
    .use(I18n)
    // .use(pinia)
    .mount('#app');
