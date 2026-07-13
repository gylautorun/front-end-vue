# Request 请求封装

这套封装提供三种能力：

1. 普通的完全重复请求只有在连续出现时才取消旧请求。
2. `createCancellableApi` 将参数不断变化的同一接口标记为一组。
3. `cancelAllRequests` 在路由切换、退出登录等场景批量取消全部活动请求。

取消规则是 `AAB -> AB`，而不是全局去重：`ABA` 中间出现了 B，因此不会取消较早的 A。

## 普通接口

```ts
import request from '@/utils/request';

export interface User {
    id: number;
    name: string;
}

export const getUser = (id: number) => request.get<unknown, User>(`/users/${id}`);
export const submitOrder = (data: unknown) => request.post('/orders', data);
```

连续发起两次完全相同的 `submitOrder` 时，第二次会取消第一次。如果两个请求中间发起了其他接口，则两次提交都会保留。

## 连续变化参数接口

搜索和快速翻页的参数不同，不能按完整请求内容判断。使用 `createCancellableApi` 给同一 API 添加稳定分组：

```ts
import request, {createCancellableApi} from '@/utils/request';

interface SearchResult {
    items: unknown[];
}

export const searchSuggest = createCancellableApi(
    (config, keyword: string) =>
        request.get<unknown, SearchResult>('/search/suggest', {
            ...config,
            params: {keyword},
        }),
);
```

调用顺序为 `search('a') -> search('ab')` 时，第二次调用取消第一次。调用顺序为 `search('a') -> getUser() -> search('ab')` 时，请求不连续，不会取消第一次搜索。

## 处理取消错误

取消请求会正常 reject，不能返回一个永远 pending 的 Promise，否则调用方的 `finally` 永远不会执行并可能长期保留组件状态。

```ts
import axios from 'axios';

try {
    const result = await searchSuggest(keyword);
    renderList(result.items);
} catch (error) {
    if (axios.isCancel(error)) return;
    throw error;
} finally {
    loading.value = false;
}
```

## 批量取消

```ts
import {onBeforeUnmount} from 'vue';
import {cancelAllRequests} from '@/utils/request';

onBeforeUnmount(() => {
    cancelAllRequests('Component unmounted');
});
```

`cancelAllRequests` 是当前 Axios 实例的全局操作。普通组件卸载不建议随意调用，否则会取消其他组件的请求；更适合路由切换、退出登录或页面级请求作用域。组件局部批量取消可使用 `src/utils/ajax/use-consecutive-requests.ts`。

## 文件职责

- `config.ts`：Axios 配置、忽略参数和关键请求头。
- `helpers.ts`：请求数据标准化和请求 key 生成。
- `pending.ts`：活动请求登记、相邻取消和批量取消。
- `createCancellableApi.ts`：给参数变化的接口添加稳定分组。
- `interceptors.ts`：连接 Axios 生命周期与 pending 管理器。
- `types.ts`：扩展请求配置类型。
