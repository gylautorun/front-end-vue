/**
 * 事件记录器
 * ----------------------------------------------------------------------------
 * 用于记录和管理树形图的操作事件，支持记录事件类型、数据、时间戳。
 *
 * 功能：
 *   - 记录事件（类型、数据、时间戳）
 *   - 获取最近的事件
 *   - 获取事件历史
 *   - 可配置最大记录数量
 *   - 支持事件过滤
 *   - 支持事件订阅（用于 Vue 响应式更新）
 *
 * @example
 * ```ts
 * const logger = new EventLogger({ maxEvents: 50 });
 *
 * // 记录事件
 * logger.log('node:click', { id: 'node1', label: '节点1' });
 * logger.log('node:dblclick', { id: 'node2', label: '节点2' });
 *
 * // 获取最近事件
 * const lastEvent = logger.getLastEvent();
 * console.log(lastEvent); // { type: 'node:dblclick', data: {...}, timestamp: 1234567890 }
 *
 * // 获取所有事件
 * const allEvents = logger.getEvents();
 *
 * // 过滤事件
 * const clickEvents = logger.getEventsByType('node:click');
 *
 * // 清空事件
 * logger.clear();
 *
 * // 订阅事件变化（用于 Vue 响应式更新）
 * logger.subscribe((events) => {
 *   console.log('事件变化:', events);
 * });
 * ```
 */

import dayjs from 'dayjs';

export interface EventLogEntry<T = any> {
    /** 事件类型 */
    type: string;
    /** 事件数据 */
    data: T;
    /** 时间戳 */
    timestamp: number;
    /** 格式化的时间字符串 */
    timeString: string;
}

export interface EventLoggerOptions {
    /** 最大记录数量（默认 100） */
    maxEvents?: number;
    /** 是否启用时间戳（默认 true） */
    enableTimestamp?: boolean;
    /** 是否启用控制台日志（默认 false） */
    enableConsoleLog?: boolean;
}

/** 事件订阅回调类型 */
export type EventLoggerCallback = (events: EventLogEntry[]) => void;

export class EventLogger {
    /** 事件记录数组 */
    private events: EventLogEntry[] = [];

    /** 最大记录数量 */
    private maxEvents: number;

    /** 是否启用时间戳 */
    private enableTimestamp: boolean;

    /** 是否启用控制台日志 */
    private enableConsoleLog: boolean;

    /** 事件订阅者列表 */
    private subscribers: EventLoggerCallback[] = [];

    constructor(options: EventLoggerOptions = {}) {
        this.maxEvents = options.maxEvents ?? 100;
        this.enableTimestamp = options.enableTimestamp ?? true;
        this.enableConsoleLog = options.enableConsoleLog ?? false;
    }

    /**
     * 订阅事件变化
     * @param callback - 回调函数，当事件变化时触发
     * @returns 取消订阅函数
     */
    subscribe(callback: EventLoggerCallback): () => void {
        this.subscribers.push(callback);
        return () => {
            const index = this.subscribers.indexOf(callback);
            if (index > -1) {
                this.subscribers.splice(index, 1);
            }
        };
    }

    /**
     * 通知所有订阅者事件变化
     */
    private notifySubscribers(): void {
        const events = this.getEvents();
        this.subscribers.forEach((callback) => callback(events));
    }

    /**
     * 记录事件
     * @param type - 事件类型
     * @param data - 事件数据
     */
    log<T = any>(type: string, data: T): void {
        const timestamp = Date.now();
        const entry: EventLogEntry<T> = {
            type,
            data,
            timestamp,
            timeString: this.formatTime(timestamp)
        };

        // 添加到事件数组
        this.events.push(entry);

        // 如果超过最大数量，移除最旧的事件
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        // 控制台日志
        if (this.enableConsoleLog) {
            console.log(`[EventLogger] ${type}`, data);
        }

        // 通知订阅者
        this.notifySubscribers();
    }

    /**
     * 获取最近的事件
     * @returns 最近的事件，如果没有则返回 null
     */
    getLastEvent(): EventLogEntry | null {
        return this.events.length > 0 ? this.events[this.events.length - 1] : null;
    }

    /**
     * 获取所有事件
     * @returns 所有事件数组
     */
    getEvents(): EventLogEntry[] {
        return [...this.events];
    }

    /**
     * 根据类型获取事件
     * @param type - 事件类型
     * @returns 匹配的事件数组
     */
    getEventsByType(type: string): EventLogEntry[] {
        return this.events.filter((event) => event.type === type);
    }

    /**
     * 获取最近 N 个事件
     * @param count - 事件数量
     * @returns 最近 N 个事件数组
     */
    getRecentEvents(count: number): EventLogEntry[] {
        return this.events.slice(-count);
    }

    /**
     * 获取事件数量
     * @returns 事件总数
     */
    getEventCount(): number {
        return this.events.length;
    }

    /**
     * 清空所有事件
     */
    clear(): void {
        this.events = [];
        this.notifySubscribers();
    }

    /**
     * 格式化时间戳
     * @param timestamp - 时间戳
     * @returns 格式化的时间字符串（年月日时分秒）
     */
    private formatTime(timestamp: number): string {
        return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
    }

    /**
     * 导出事件为 JSON
     * @returns JSON 字符串
     */
    exportToJSON(): string {
        return JSON.stringify(this.events, null, 2);
    }

    /**
     * 从 JSON 导入事件
     * @param json - JSON 字符串
     */
    importFromJSON(json: string): void {
        try {
            const events = JSON.parse(json);
            if (Array.isArray(events)) {
                this.events = events;
            }
        } catch (error) {
            console.error('[EventLogger] 导入事件失败:', error);
        }
    }
}
