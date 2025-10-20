
export interface IWorkerEvent<T> {
    data: T;
    port?: MessagePort;
}
