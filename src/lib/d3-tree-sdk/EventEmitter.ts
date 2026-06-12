type EventHandler = (...args: unknown[]) => void;

/** 轻量事件总线，框架无关 */
export class EventEmitter {
    private listeners = new Map<string, Set<EventHandler>>();

    on(event: string, handler: EventHandler): () => void {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)!.add(handler);
        return () => this.off(event, handler);
    }

    off(event: string, handler: EventHandler): void {
        this.listeners.get(event)?.delete(handler);
    }

    emit(event: string, ...args: unknown[]): void {
        this.listeners.get(event)?.forEach((handler) => handler(...args));
    }

    clear(): void {
        this.listeners.clear();
    }
}
