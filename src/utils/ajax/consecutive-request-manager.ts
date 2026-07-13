export interface ManagedRequest {
    // 步骤 5：调用接口时传入 signal；请求结束后必须调用 release 清理记录。
    signal: AbortSignal;
    abort(reason?: unknown): void;
    release(): void;
}

interface RequestEntry<Key> {
    key: Key;
    controller: AbortController;
}

/**
 * 管理同一作用域内的请求，只取消连续出现的同类请求。
 *
 * AAB: 第二个 A 取消第一个 A；ABA: 不取消任何请求。
 */
export class ConsecutiveRequestManager<Key = unknown> {
    // 保存当前仍未结束的请求，供单个清理和 abortAll 批量取消使用。
    private readonly activeControllers = new Set<AbortController>();
    // 只记录调用顺序中的最后一个请求，用于判断两个 key 是否连续。
    private lastRequest: RequestEntry<Key> | undefined;

    create(key: Key): ManagedRequest {
        // 步骤 1：读取紧邻的上一个请求；不向前查找，所以 ABA 不会互相取消。
        const previous = this.lastRequest;

        // 步骤 2：只有上一个请求 key 相同且仍在执行时，才取消上一个请求。
        if (previous?.key === key && this.activeControllers.has(previous.controller)) {
            previous.controller.abort('Replaced by a consecutive request');
            this.activeControllers.delete(previous.controller);
        }

        // 步骤 3：为本次请求创建独立 controller，并登记为当前最后一个请求。
        const controller = new AbortController();
        this.activeControllers.add(controller);
        this.lastRequest = {key, controller};

        // 步骤 4：请求完成或失败后释放 controller，避免已结束请求留在活动集合中。
        let released = false;
        const release = () => {
            if (released) return;

            released = true;
            this.activeControllers.delete(controller);
        };

        return {
            signal: controller.signal,
            // 主动取消单个请求时，同时完成活动记录清理。
            abort: (reason?: unknown) => {
                controller.abort(reason);
                release();
            },
            release,
        };
    }

    abortAll(reason: unknown = 'Request scope disposed'): void {
        // 步骤 1：取消当前作用域内所有仍未结束的请求。
        for (const controller of this.activeControllers) {
            controller.abort(reason);
        }

        // 步骤 2：清空活动集合和连续性记录，manager 后续仍可重新使用。
        this.activeControllers.clear();
        this.lastRequest = undefined;
    }
}
