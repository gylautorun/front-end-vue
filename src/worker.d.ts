// worker.d.ts
declare module '*.worker.ts' {
    // class WebWorker extends Worker {
    //     constructor();
    // }
    // export default WebWorker;
    import { Worker } from 'worker_threads';
    const worker: Worker;
    export default worker;
}

