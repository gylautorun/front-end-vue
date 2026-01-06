import type { PipelineType } from '@xenova/transformers';

// 定义 Worker 消息类型
export interface WorkerMessage<T = any> {
    type: 'load-model' | 'run-inference' | 'progress' | 'result' | 'error';
    data: T;
    id?: string;
}

// 模型选项接口
export interface ModelOptions {
    /**
     * 是否使用量化模型
     */
    quantized?: boolean;

    /**
     * 进度回调函数
     */
    progress_callback?: (progress: any) => void;

    /**
     * 模型配置
     */
    config?: any;

    /**
     * 缓存目录
     */
    cache_dir?: string;

    /**
     * 是否仅使用本地文件
     */
    local_files_only?: boolean;

    /**
     * 模型版本
     */
    revision?: string;

    /**
     * 模型文件名
     */
    model_file_name?: string;

    /**
     * 其他自定义选项
     */
    [key: string]: any;
}

// 加载模型的参数接口
export interface LoadModelParams {
    task: PipelineType;
    model?: string;
    options?: ModelOptions;
}

// 运行推理的参数接口
export interface RunInferenceParams {
    task: PipelineType;
    inputs: any;
    options?: ModelOptions;
}

// 初始化变量
let pipelineInstance: any = null;
let currentTask: PipelineType | null = null;

// 监听主线程消息
self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
    const { type, data, id } = event.data;

    try {
        switch (type) {
            case 'load-model':
                await handleLoadModel(data as LoadModelParams, id);
                break;
            case 'run-inference':
                await handleRunInference(data as RunInferenceParams, id);
                break;
            default:
                throw new Error(`Unknown message type: ${type}`);
        }
    } catch (error) {
        self.postMessage({
            type: 'error',
            data: error instanceof Error ? error.message : String(error),
            id
        });
    }
});

// 加载模型
async function handleLoadModel(params: LoadModelParams, id?: string) {
    const { task, model = 'Xenova/yolov8n', options = {} } = params;

    // 如果模型已经加载且任务相同，直接返回
    if (pipelineInstance && currentTask === task) {
        self.postMessage({
            type: 'result',
            data: 'Model already loaded',
            id
        });
        return;
    }

    currentTask = task;

    try {
        // 动态导入 transformers
        self.postMessage({
            type: 'progress',
            data: { stage: 'loading', message: '正在加载 transformers 库...', progress: 10 },
            id
        });

        // 只导入必要的模块
        const { pipeline, env } = await import('@xenova/transformers');

        // 重置所有环境变量为默认值
        Object.assign(env, {
            // 核心配置，禁用从本地文件系统加载模型，Transformers.js 将 只从网络加载模型 （默认是 Hugging Face Hub 或配置的镜像站）
            /**
             * 当调用 pipeline() 或 from_pretrained() 方法时，Transformers.js 会：
                1. 首先检查 allowLocalModels 配置
                2. 如果为 false ，直接从网络下载模型
                3. 如果为 true ，会先检查本地缓存目录是否存在模型文件，存在则使用本地文件，否则从网络下载
               使用建议：
                - 在开发和测试阶段，可以设置为 true 并预下载模型到本地，提高加载速度
                - 在生产环境，如果需要确保使用最新模型，可以设置为 false
                - 当网络环境不稳定时，可以设置为 true 并提供本地模型文件作为备选
             */
            allowLocalModels: true,
            debug: true,
            backend: 'onnx',

            // 国内镜像配置
            remoteHost: 'https://hf-mirror.com',
            hub: {
                url: 'https://hf-mirror.com',
                api_url: 'https://hf-mirror.com/api/models'
            },

            // ONNX运行时配置
            backends: {
                onnx: {
                    wasm: {
                        wasmPaths: 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/',
                        proxy: false
                    }
                }
            },

            // 缓存配置
            cacheDir: options.cache_dir || '/tmp/transformers'
        });

        console.log('环境配置:', env);

        // 添加进度回调
        const onProgress = (data: any) => {
            // 计算总体进度
            const totalProgress = 30 + (data.progress || 0) * 0.7;

            self.postMessage({
                type: 'progress',
                data: {
                    ...data,
                    stage: 'model-loading',
                    message: data.file ? `正在下载: ${data.file}...` : '正在加载模型...',
                    progress: totalProgress
                },
                id
            });
        };

        const modelToUse = 'Xenova/yolov8n';

        self.postMessage({
            type: 'progress',
            data: { stage: 'loading', message: `正在准备加载模型: ${modelToUse}...`, progress: 30 },
            id
        });

        // 使用最基本的配置加载模型
        pipelineInstance = await pipeline(task, modelToUse, {
            progress_callback: onProgress,
            quantized: true,
            local_files_only: false,
            // 使用最小模型配置
            config: {
                // 确保使用较小的批处理大小
                batch_size: 1,
                // 减少内存使用
                low_cpu_mem_usage: true
            }
        });

        self.postMessage({
            type: 'result',
            data: 'Model loaded successfully',
            id
        });
    } catch (error) {
        console.error('加载模型时发生错误:', error);

        // 尝试使用本地模型作为最后的 fallback
        try {
            self.postMessage({
                type: 'progress',
                data: { stage: 'loading', message: '尝试使用本地模型...', progress: 50 },
                id
            });

            const { pipeline } = await import('@xenova/transformers');
            pipelineInstance = await pipeline(task, model, {
                quantized: true,
                local_files_only: true
            });

            self.postMessage({
                type: 'result',
                data: 'Model loaded successfully (local)',
                id
            });
            return;
        } catch (localError) {
            console.error('使用本地模型也失败了:', localError);
        }

        // 返回详细的错误信息
        self.postMessage({
            type: 'error',
            data: `加载模型失败: ${error instanceof Error ? error.message : String(error)}\n\n可能的解决方案:\n1. 检查网络连接\n2. 确保浏览器支持Web Worker\n3. 尝试使用更小的模型\n4. 检查防火墙设置\n\n详细错误: ${JSON.stringify(error)}`,
            id
        });
    }
}

// 运行推理
async function handleRunInference(params: RunInferenceParams, id?: string) {
    const { task, inputs, options = {} } = params;

    if (!pipelineInstance) {
        throw new Error('Model not loaded. Please load a model first.');
    }

    if (currentTask !== task) {
        throw new Error(
            `Current model is for task "${currentTask}", but got "${task}". Please load the correct model.`
        );
    }

    // 运行推理
    const result = await pipelineInstance(inputs, options);

    self.postMessage({
        type: 'result',
        data: result,
        id
    });
}
