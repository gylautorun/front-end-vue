import type { PipelineType } from '@xenova/transformers';
import type { WorkerMessage, LoadModelParams, RunInferenceParams } from './transformers.worker';

// 任务状态
type TaskStatus = 'pending' | 'processing' | 'completed' | 'error';

// 任务接口
interface Task {
    id: string;
    status: TaskStatus;
    resolve: (value: any) => void;
    reject: (reason?: any) => void;
    progressCallback?: (progress: any) => void;
}

/**
 * Transformers Web Worker 工具类
 * 封装了 @xenova/transformers 的加载和推理功能
 */
export class TransformersWorker {
    private worker: Worker | null = null;
    private tasks: Map<string, Task> = new Map();
    private isInitialized: boolean = false;

    /**
     * 构造函数
     * @param workerUrl worker 文件路径
     */
    constructor() {
        this.initWorker();
    }

    /**
     * 初始化 Worker
     */
    private initWorker(): void {
        // 创建 Worker
        this.worker = new Worker(new URL('./transformers.worker.ts', import.meta.url), {
            type: 'module'
        });

        // 监听 Worker 消息
        this.worker.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
            const { type, data, id } = event.data;

            if (!id) return;

            const task = this.tasks.get(id);
            if (!task) return;

            switch (type) {
                case 'progress':
                    // 处理进度更新
                    if (task.progressCallback) {
                        task.progressCallback(data);
                    }
                    break;

                case 'result':
                    // 处理成功结果
                    task.status = 'completed';
                    task.resolve(data);
                    this.tasks.delete(id);
                    break;

                case 'error':
                    // 处理错误
                    task.status = 'error';
                    task.reject(new Error(data as string));
                    this.tasks.delete(id);
                    break;

                default:
                    break;
            }
        });

        // 监听 Worker 错误
        this.worker.addEventListener('error', (error: ErrorEvent) => {
            console.error('Transformers Worker 错误:', error);
            // 失败所有任务
            for (const [id, task] of this.tasks) {
                task.status = 'error';
                task.reject(new Error(`Worker error: ${error.message}`));
            }
            this.tasks.clear();
        });

        this.isInitialized = true;
    }

    /**
     * 生成唯一任务 ID
     */
    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }

    /**
     * 加载模型
     * @param params 加载模型参数
     * @param progressCallback 进度回调
     */
    public loadModel(
        params: LoadModelParams,
        progressCallback?: (progress: any) => void
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.isInitialized || !this.worker) {
                reject(new Error('Worker 未初始化'));
                return;
            }

            const taskId = this.generateTaskId();

            // 创建任务
            const task: Task = {
                id: taskId,
                status: 'pending',
                resolve,
                reject,
                progressCallback
            };

            this.tasks.set(taskId, task);

            // 发送消息到 Worker
            this.worker.postMessage({
                type: 'load-model',
                data: params,
                id: taskId
            } as WorkerMessage<LoadModelParams>);
        });
    }

    /**
     * 运行推理
     * @param params 推理参数
     * @param progressCallback 进度回调
     */
    public runInference(
        params: RunInferenceParams,
        progressCallback?: (progress: any) => void
    ): Promise<any> {
        return new Promise((resolve, reject) => {
            if (!this.isInitialized || !this.worker) {
                reject(new Error('Worker 未初始化'));
                return;
            }

            const taskId = this.generateTaskId();

            // 创建任务
            const task: Task = {
                id: taskId,
                status: 'pending',
                resolve,
                reject,
                progressCallback
            };

            this.tasks.set(taskId, task);

            // 发送消息到 Worker
            this.worker.postMessage({
                type: 'run-inference',
                data: params,
                id: taskId
            } as WorkerMessage<RunInferenceParams>);
        });
    }

    /**
     * 销毁 Worker
     */
    public destroy(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.isInitialized = false;
        this.tasks.clear();
    }
}

// 创建单例实例
let transformersWorkerInstance: TransformersWorker | null = null;

/**
 * 获取 Transformers Worker 实例
 */
export function getTransformersWorker(): TransformersWorker {
    if (!transformersWorkerInstance) {
        transformersWorkerInstance = new TransformersWorker();
    }
    return transformersWorkerInstance;
}

/**
 * 销毁 Transformers Worker 实例
 */
export function destroyTransformersWorker(): void {
    if (transformersWorkerInstance) {
        transformersWorkerInstance.destroy();
        transformersWorkerInstance = null;
    }
}
