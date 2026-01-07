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
    private initializationPromise: Promise<void> | null = null;

    /**
     * 构造函数
     * @param workerUrl worker 文件路径
     */
    constructor() {
        this.initializationPromise = this.initWorker();
    }

    /**
     * 初始化 Worker
     */
    private async initWorker(): Promise<void> {
        // 最多重试3次
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
            try {
                console.log(`尝试初始化 Worker (第 ${retryCount + 1} 次)`);

                // 创建 Worker
                if (this.worker) {
                    console.log('Worker 已存在，先销毁');
                    this.worker.terminate();
                    this.worker = null;
                }

                this.worker = new Worker(new URL('./transformers.worker.ts', import.meta.url), {
                    type: 'module'
                });

                console.log('Worker 创建成功');

                // 等待 Worker 准备就绪，设置超时时间为10秒
                await new Promise<void>((resolve, reject) => {
                    if (!this.worker) {
                        reject(new Error('Failed to create worker'));
                        return;
                    }

                    // 设置超时
                    const timeoutId = setTimeout(() => {
                        this.worker?.removeEventListener('error', errorHandler);
                        this.worker?.removeEventListener('message', messageHandler);
                        reject(new Error('Worker initialization timed out after 10 seconds'));
                    }, 10000);

                    // 监听 Worker 错误
                    const errorHandler = (error: ErrorEvent) => {
                        console.error('Transformers Worker 初始化错误:', error);
                        clearTimeout(timeoutId);
                        reject(new Error(`Worker 初始化失败: ${error.message}`));
                    };

                    // 监听 Worker 消息，确保它能正常通信
                    const messageHandler = (event: MessageEvent) => {
                        console.log('Worker 消息:', event.data);
                        if (event.data.type === 'pong') {
                            this.worker?.removeEventListener('error', errorHandler);
                            clearTimeout(timeoutId);
                            resolve();
                        }
                    };

                    this.worker.addEventListener('error', errorHandler);
                    this.worker.addEventListener('message', messageHandler);

                    // 发送测试消息
                    console.log('发送 ping 消息到 Worker');
                    this.worker.postMessage({ type: 'ping', data: 'hello' });
                });

                // 监听 Worker 消息
                this.worker.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
                    console.log('Worker 消息:', event.data);
                    const { type, data, id } = event.data;

                    if (type === 'pong') {
                        // 忽略 pong 消息，这是初始化时的测试消息
                        return;
                    }

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

                // 重新监听 Worker 错误
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
                console.log('Worker 初始化成功');
                return;
            } catch (error) {
                retryCount++;
                console.error(`Worker 初始化失败 (第 ${retryCount} 次):`, error);

                if (retryCount >= maxRetries) {
                    this.isInitialized = false;
                    throw new Error(
                        `Worker 初始化失败，已重试 ${maxRetries} 次: ${error instanceof Error ? error.message : String(error)}`
                    );
                }

                // 重试前等待一段时间
                console.log(`等待 ${retryCount * 1000}ms 后重试`);
                await new Promise((resolve) => setTimeout(resolve, retryCount * 1000));
            }
        }
    }

    /**
     * 生成唯一任务 ID
     */
    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }

    /**
     * 确保 Worker 已初始化
     */
    private async ensureInitialized(): Promise<void> {
        // 如果没有初始化Promise，或者初始化失败，重新初始化
        if (!this.initializationPromise) {
            this.initializationPromise = this.initWorker().catch((error) => {
                // 初始化失败，清除Promise，以便下次可以重试
                this.initializationPromise = null;
                throw error;
            });
        }

        await this.initializationPromise;
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
        return new Promise(async (resolve, reject) => {
            try {
                // 确保 Worker 已初始化
                await this.ensureInitialized();

                if (!this.worker) {
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
            } catch (error) {
                reject(error instanceof Error ? error : new Error('Worker 初始化失败'));
            }
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
        return new Promise(async (resolve, reject) => {
            try {
                // 确保 Worker 已初始化
                await this.ensureInitialized();

                if (!this.worker) {
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
            } catch (error) {
                reject(error instanceof Error ? error : new Error('Worker 未初始化'));
            }
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
