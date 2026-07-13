import type { GenericAbortSignal, InternalAxiosRequestConfig } from 'axios';
import { getRequestKey } from './helpers';
import type { ConsecutiveRequestConfig } from './types';

interface PendingEntry {
    key: string;
    controller: AbortController;
    signal: AbortSignal;
    detachExternalSignal?: () => void;
}

const pendingEntries = new Set<PendingEntry>();
let lastEntry: PendingEntry | undefined;

function forwardExternalAbort(
    controller: AbortController,
    externalSignal?: GenericAbortSignal
): (() => void) | undefined {
    if (!externalSignal) return undefined;

    // 兼容未提供 AbortSignal.any 的浏览器：把外部取消转发给内部 controller。
    const abort = () => controller.abort('Cancelled by caller');
    if (externalSignal.aborted) {
        abort();
        return undefined;
    }

    const addEventListener = externalSignal.addEventListener;
    if (!addEventListener) return undefined;

    addEventListener.call(externalSignal, 'abort', abort);

    const removeEventListener = externalSignal.removeEventListener;
    return removeEventListener
        ? () => removeEventListener.call(externalSignal, 'abort', abort)
        : undefined;
}

/** 添加请求；只有它和紧邻的上一个活动请求 key 相同时，才取消上一个请求。 */
export function addPending(config: InternalAxiosRequestConfig & ConsecutiveRequestConfig): void {
    // 步骤 1：生成请求身份并读取调用方原本传入的 signal。
    const key = getRequestKey(config);
    const externalSignal = config.signal;

    // 步骤 2：只检查紧邻请求，因此 AAB 会取消第一个 A，ABA 不会误取消。
    if (lastEntry?.key === key && pendingEntries.has(lastEntry)) {
        lastEntry.detachExternalSignal?.();
        lastEntry.controller.abort('Replaced by a consecutive request');
        pendingEntries.delete(lastEntry);
    }

    // 步骤 3：创建内部 controller，并与调用方 signal 合并。
    const controller = new AbortController();
    const detachExternalSignal = forwardExternalAbort(controller, externalSignal);
    const signal = controller.signal;
    const entry = { key, controller, signal, detachExternalSignal };

    // 步骤 4：登记活动请求，并把合并后的 signal 交给 Axios。
    config.signal = signal;
    pendingEntries.add(entry);
    lastEntry = entry;
}

/** 根据 signal 精确移除已结束请求，避免旧响应误删较新的同类请求。 */
export function removePending(config: InternalAxiosRequestConfig): void {
    for (const entry of pendingEntries) {
        if (entry.signal === config.signal) {
            entry.detachExternalSignal?.();
            pendingEntries.delete(entry);
            return;
        }
    }
}

/** 路由切换、登出或作用域销毁时，批量取消所有活动请求。 */
export function cancelAllRequests(reason: unknown = 'All requests cancelled'): void {
    // 步骤 1：取消集合中的所有请求。
    for (const entry of pendingEntries) {
        entry.detachExternalSignal?.();
        entry.controller.abort(reason);
    }

    // 步骤 2：清空活动记录和相邻请求记录，后续请求可重新开始一条序列。
    pendingEntries.clear();
    lastEntry = undefined;
}

/** 仅供测试和诊断使用。 */
export function getPendingRequestCount(): number {
    return pendingEntries.size;
}
