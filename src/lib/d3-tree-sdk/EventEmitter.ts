/**
 * EventEmitter.ts - 轻量事件总线
 * =============================================================================
 * 本文件负责：提供基于发布/订阅模式的事件系统。
 *
 * 核心概念：
 * - EventHandler：事件处理器类型 `(...args: unknown[]) => void`
 * - listeners：事件名 → 处理器集合的 Map
 * - on()：注册事件监听，返回取消订阅函数
 * - emit()：触发事件，传递参数给所有监听器
 *
 * 为什么需要 EventEmitter？
 * SDK 需要与任何前端框架（Vue/React/原生 JS）配合使用。
 * 通过事件总线，SDK 内部可以触发事件（如 node:click），前端框架监听并响应。
 *
 * 使用示例：
 * ```ts
 * const emitter = new EventEmitter();
 *
 * // 注册监听
 * const unsubscribe = emitter.on('node:click', (node) => {
 *   console.log('节点被点击', node);
 * });
 *
 * // 触发事件
 * emitter.emit('node:click', { id: '1', label: '测试节点' });
 *
 * // 取消监听
 * unsubscribe();
 *
 * // 清空所有监听
 * emitter.clear();
 * ```
 */

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 事件处理器类型
 * @description 接收任意数量的参数，返回 void
 */
type EventHandler = (...args: unknown[]) => void;

// ============================================================================
// EventEmitter 类
// ============================================================================

/**
 * 轻量事件总线
 * ----------------------------------------------------------------------------
 * 特点：
 * - 框架无关：纯 TypeScript 实现，可用于任何 JS 环境
 * - 自动清理：on() 返回取消订阅函数，避免内存泄漏
 * - 按事件名管理：同一事件可注册多个处理器
 *
 * @example
 * // 基础用法
 * const events = new EventEmitter();
 * events.on('data:change', (data) => console.log(data));
 * events.emit('data:change', { id: 1 });
 *
 * @example
 * // 取消订阅
 * const unsub = events.on('node:click', handler);
 * // 稍后...
 * unsub(); // 取消监听
 *
 * @example
 * // TypeScript 泛型用法（在 D3TreeGraph 中使用）
 * type MyEventMap = {
 *   'node:click': { id: string; label: string };
 *   'data:change': TreeData;
 * };
 * function on<K extends keyof MyEventMap>(
 *   event: K,
 *   handler: (payload: MyEventMap[K]) => void
 * ): () => void { ... }
 */
export class EventEmitter {
    /**
     * 事件监听器存储
     * @description Map 结构：事件名 → 处理器 Set
     * @example
     * {
     *   'node:click' => Set([handler1, handler2]),
     *   'data:change' => Set([handler3])
     * }
     */
    private listeners = new Map<string, Set<EventHandler>>();

    /**
     * 注册事件监听
     * ----------------------------------------------------------------------------
     * @param event - 事件名称
     * @param handler - 事件触发时的回调函数
     * @returns 取消订阅函数，调用后移除该监听
     *
     * @example
     * const unsubscribe = emitter.on('node:click', (node) => {
     *   console.log('点击了', node.label);
     * });
     *
     * // 后续调用 unsubscribe() 可移除该监听
     */
    on(event: string, handler: EventHandler): () => void {
        // 初始化该事件的监听器 Set
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        // 添加处理器
        this.listeners.get(event)!.add(handler);

        // 返回取消订阅函数
        return () => this.off(event, handler);
    }

    /**
     * 移除指定事件监听
     * ----------------------------------------------------------------------------
     * @param event - 事件名称
     * @param handler - 要移除的回调函数
     *
     * @description
     * 从该事件的处理器集合中删除指定 handler。
     * 通常不需要直接调用，建议使用 on() 返回的取消订阅函数。
     */
    off(event: string, handler: EventHandler): void {
        this.listeners.get(event)?.delete(handler);
    }

    /**
     * 触发事件
     * ----------------------------------------------------------------------------
     * @param event - 事件名称
     * @param args - 传递给监听器的参数（可选）
     *
     * @description
     * 遍历该事件的所有处理器并依次调用，传递相同的参数。
     * 处理器中的异常不会阻断其他处理器。
     *
     * @example
     * emitter.emit('node:click', { id: '1', label: '测试' });
     * // 所有注册在 'node:click' 上的 handler 都会被调用
     * // handler({ id: '1', label: '测试' })
     */
    emit(event: string, ...args: unknown[]): void {
        this.listeners.get(event)?.forEach((handler) => handler(...args));
    }

    /**
     * 清空所有事件监听
     * ----------------------------------------------------------------------------
     * @description
     * 移除所有事件的所有监听器。
     * 通常在组件销毁或 SDK destroy 时调用，防止内存泄漏。
     *
     * @example
     * // 销毁时清理
     * graph.destroy();
     * function destroy() {
     *   emitter.clear(); // 清空所有监听
     * }
     */
    clear(): void {
        this.listeners.clear();
    }
}
