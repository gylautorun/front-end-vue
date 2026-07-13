import {AxiosHeaders, type InternalAxiosRequestConfig} from 'axios';
import {createCancellableApi} from './createCancellableApi';
import {addPending, cancelAllRequests, getPendingRequestCount, removePending} from './pending';
import type {ConsecutiveRequestConfig} from './types';

type TestConfig = InternalAxiosRequestConfig & ConsecutiveRequestConfig;

function assert(condition: unknown, message: string): asserts condition {
    if (!condition) throw new Error(message);
}

function isAborted(config: TestConfig): boolean {
    return config.signal?.aborted === true;
}

function createConfig(url: string, consecutiveRequestKey?: string, signal?: AbortSignal): TestConfig {
    return {
        url,
        method: 'get',
        headers: new AxiosHeaders(),
        consecutiveRequestKey,
        signal,
    };
}

// 场景 1：AAB 只取消第一个 A。
{
    const firstA = createConfig('/a', 'A');
    const secondA = createConfig('/a?page=2', 'A');
    const requestB = createConfig('/b', 'B');

    addPending(firstA);
    addPending(secondA);
    addPending(requestB);

    assert(isAborted(firstA), 'AAB 应取消第一个 A');
    assert(!isAborted(secondA), 'AAB 应保留第二个 A');
    assert(!isAborted(requestB), 'AAB 应保留 B');
    cancelAllRequests();
}

// 场景 2：ABA 不取消较早的 A，批量取消后全部 signal 都终止。
{
    const firstA = createConfig('/a', 'A');
    const requestB = createConfig('/b', 'B');
    const secondA = createConfig('/a?page=2', 'A');

    addPending(firstA);
    addPending(requestB);
    addPending(secondA);

    assert(!isAborted(firstA), 'ABA 应保留第一个 A');
    assert(!isAborted(requestB), 'ABA 应保留 B');
    assert(!isAborted(secondA), 'ABA 应保留第二个 A');

    cancelAllRequests();
    assert(isAborted(firstA), 'abortAll 应取消第一个 A');
    assert(isAborted(requestB), 'abortAll 应取消 B');
    assert(isAborted(secondA), 'abortAll 应取消第二个 A');
    assert(getPendingRequestCount() === 0, 'abortAll 后活动请求数应为 0');
}

// 场景 3：旧请求结束时按 signal 精确删除，不会误删新的同类请求。
{
    const firstA = createConfig('/a', 'A');
    const secondA = createConfig('/a?page=2', 'A');

    addPending(firstA);
    addPending(secondA);
    removePending(firstA);

    assert(getPendingRequestCount() === 1, '旧请求结束不应删除新请求');
    cancelAllRequests();
    assert(isAborted(secondA), '新请求仍应被 abortAll 取消');
}

// 场景 4：保留调用方传入的 signal，外部取消仍能终止最终请求 signal。
{
    const externalController = new AbortController();
    const request = createConfig('/external-signal', undefined, externalController.signal);

    addPending(request);
    externalController.abort('Caller cancelled');

    assert(isAborted(request), '外部 signal 应能取消请求');
    removePending(request);
    assert(getPendingRequestCount() === 0, '外部取消后的请求应可正常清理');
}

// 场景 5：包装函数保留参数和返回值类型，并为同一 API 注入稳定分组。
{
    const search = createCancellableApi((config, keyword: string) =>
        Promise.resolve({keyword, requestKey: config.consecutiveRequestKey}),
    );

    const first = await search('a');
    const second = await search('ab');

    assert(first.keyword === 'a', '包装后应原样传递业务参数');
    assert(first.requestKey === second.requestKey, '同一 API 的请求分组应保持稳定');
}

console.log('request pending tests passed.');
