# 连续请求取消

`ConsecutiveRequestManager` 只取消连续出现的同类请求：

- `AAB`：第二个 A 取消第一个 A，最终保留 A、B。
- `ABA`：两个 A 不连续，三个请求都保留。
- `abortAll()`：取消当前作用域中所有尚未结束的请求。

## Vue 组件中使用

`useConsecutiveRequests` 会在组件卸载时自动执行 `abortAll()`。

```ts
import axios from 'axios';
import {useConsecutiveRequests} from '@/utils/ajax';

const {createRequest, abortAll} = useConsecutiveRequests<string>();

async function loadUser() {
    // key 用于标识请求类型；只有连续且 key 相同的请求才会互相取消。
    const request = createRequest('load-user');

    try {
        return await axios.get('/api/user', {signal: request.signal});
    } catch (error) {
        if (axios.isCancel(error)) return;
        throw error;
    } finally {
        // 成功、失败和取消后都要释放活动记录。
        request.release();
    }
}

// 页面切换、条件重置等场景可以手动批量取消。
function cancelPageRequests() {
    abortAll('Page query reset');
}
```

## 非组件环境中使用

```ts
import {ConsecutiveRequestManager} from '@/utils/ajax';

const manager = new ConsecutiveRequestManager<string>();

const userRequest = manager.create('user');
const orderRequest = manager.create('order');

fetch('/api/user', {signal: userRequest.signal}).finally(userRequest.release);
fetch('/api/order', {signal: orderRequest.signal}).finally(orderRequest.release);

// 同时取消 user 和 order 请求。
manager.abortAll('Scope disposed');
```

不要在多个组件之间共享同一个 manager，否则一个组件调用 `abortAll()` 会取消其他组件的请求。
