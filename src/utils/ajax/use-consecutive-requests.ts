import {onBeforeUnmount} from 'vue';
import {ConsecutiveRequestManager} from './consecutive-request-manager';

export function useConsecutiveRequests<Key = unknown>() {
    // 步骤 1：每个组件实例创建自己的请求作用域，组件之间互不影响。
    const manager = new ConsecutiveRequestManager<Key>();

    // 步骤 2：组件卸载时统一取消该组件尚未结束的全部请求。
    onBeforeUnmount(() => manager.abortAll('Component unmounted'));

    // 步骤 3：组件通过 createRequest 创建请求，也可以按需提前批量取消。
    return {
        createRequest: (key: Key) => manager.create(key),
        abortAll: (reason?: unknown) => manager.abortAll(reason),
    };
}
