import type {CancellableAxiosConfig} from './types';

type RequestFunction<Args extends unknown[], Result> = (
    config: CancellableAxiosConfig,
    ...args: Args
) => Promise<Result>;

let groupSequence = 0;

/**
 * 标记“同一接口、参数可连续变化”的请求。相邻取消由全局请求拦截器统一完成。
 */
export function createCancellableApi<Args extends unknown[], Result>(
    requestFn: RequestFunction<Args, Result>,
): (...args: Args) => Promise<Result> {
    // 步骤 1：每个包装后的 API 获得稳定且互不冲突的分组 key。
    const consecutiveRequestKey = `cancellable-api-${++groupSequence}`;

    return (...args: Args) => {
        // 步骤 2：先注入 Axios config，再原样传递任意数量的业务参数。
        return requestFn({consecutiveRequestKey}, ...args);
    };
}
