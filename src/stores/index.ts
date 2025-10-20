import type { App } from 'vue';
import {createPinia} from 'pinia';
import piniaPluginPersistedState from 'pinia-plugin-persistedstate';

const pinia = createPinia();

// piniaPersist(持久化)
pinia.use(piniaPluginPersistedState);
// 全局注册 store
export function setupPiniaStore(app: App<Element>) {
    app.use(pinia);
}

export {pinia};