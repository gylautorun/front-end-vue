import type { PipelineType } from '@xenova/transformers';

// 定义 Worker 消息类型
export interface WorkerMessage<T = any> {
    type: 'load-model' | 'run-inference' | 'progress' | 'result' | 'error' | 'ping' | 'pong';
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
    console.log('Worker 收到消息:', event.data);
    const { type, data, id } = event.data;

    try {
        switch (type) {
            case 'ping':
                // 响应 ping 消息，确认 Worker 已准备就绪
                console.log('Worker 收到 ping，发送 pong');
                self.postMessage({ type: 'pong', data: 'ready' });
                break;
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
        console.error('Worker 处理消息出错:', error);
        self.postMessage({
            type: 'error',
            data: error instanceof Error ? error.message : String(error),
            id
        });
    }
});

// 加载模型
async function handleLoadModel(params: LoadModelParams, id?: string) {
    const { task, model = 'Xenova/ssd-mobilenet-v1', options = {} } = params;

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
            // 核心配置，使用极简设置
            allowLocalModels: false,
            debug: true,
            backend: 'onnx',

            // 使用默认的Hugging Face Hub
            remoteHost: 'https://huggingface.co',
            hub: {
                url: 'https://huggingface.co',
                api_url: 'https://huggingface.co/api/models'
            },

            // ONNX运行时配置
            backends: {
                onnx: {
                    wasm: {
                        // 使用稳定版本的CDN路径
                        wasmPaths: 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2/dist/',
                        proxy: false
                    }
                }
            },

            // 缓存配置
            // cacheDir: options.cache_dir || '/tmp/transformers'
            // 禁用缓存
            cacheDir: null
        });

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

        // 使用页面组件传递的模型参数
        self.postMessage({
            type: 'progress',
            data: { stage: 'loading', message: `正在准备加载模型: ${model}...`, progress: 30 },
            id
        });

        // 使用最基本的配置加载模型
        pipelineInstance = await pipeline(task, model, {
            progress_callback: onProgress,
            quantized: true,
            local_files_only: false
        });

        self.postMessage({
            type: 'result',
            data: 'Model loaded successfully',
            id
        });
    } catch (error) {
        console.error('加载模型时发生错误:', error);

        // 返回详细的错误信息和解决方案
        self.postMessage({
            type: 'error',
            data: {
                message: `加载模型失败: ${error instanceof Error ? error.message : String(error)}`,
                details: '这通常是由于网络问题导致的，请检查网络连接并尝试以下解决方案:',
                solutions: [
                    '1. 确保您的网络连接正常',
                    '2. 检查防火墙设置，确保允许访问 huggingface.co',
                    '3. 如果您在中国大陆，建议使用 VPN 或代理',
                    '4. 尝试使用更轻量级的模型'
                ],
                rawError: JSON.stringify(error)
            },
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

    // 发送开始推理的进度
    self.postMessage({
        type: 'progress',
        data: { stage: 'inference', message: '正在进行推理...', progress: 0 },
        id
    });

    // 添加进度回调到推理选项
    const inferenceOptions = {
        ...options,
        onProgress: (step: number, total: number) => {
            const progress = Math.round((step / total) * 100);
            self.postMessage({
                type: 'progress',
                data: { stage: 'inference', message: '正在进行推理...', progress },
                id
            });
        }
    };

    // 运行推理
    const result = await pipelineInstance(inputs, inferenceOptions);

    // 发送推理完成的进度
    self.postMessage({
        type: 'progress',
        data: { stage: 'inference', message: '推理完成', progress: 100 },
        id
    });

    self.postMessage({
        type: 'result',
        data: result,
        id
    });
}
