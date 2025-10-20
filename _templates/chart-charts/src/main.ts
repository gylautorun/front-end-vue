import { createApp } from "vue";
import router from "./router";
import cp from "/@/components/globals";

import Element from "element-plus";
import "/@/assets/style/element-variables.scss";

// import './style.css'
import App from "./App.vue";

const app = createApp(App);
app.use(router);

// 自动注册全局组件
app.use(Element);
app.use(cp);

const mount = async () => {
  await router.isReady();
  app.mount("#app");
};

mount();
