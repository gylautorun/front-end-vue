# Transformers Web Worker 工具

## 介绍

这是一个封装了 `@xenova/transformers` 库的通用 Web Worker 工具，用于在后台线程中加载模型和执行推理任务，避免阻塞主线程，提高应用性能和用户体验。

## 功能特性

-   ✅ 在 Web Worker 中加载和运行 `@xenova/transformers` 模型
-   ✅ 支持多种任务类型（目标检测、图像分类、文本生成等）
-   ✅ 提供进度回调，实时显示模型加载和推理进度
-   ✅ 支持错误处理和任务管理
-   ✅ 提供单例模式，避免重复创建 Worker
-   ✅ 支持国内镜像，提高模型加载速度

## 使用方法

### 1. 导入工具

```typescript
import {
    getTransformersWorker,
    destroyTransformersWorker
} from '@/utils/web-worker/transformers-worker';
```

### 2. 初始化 Worker

```typescript
// 获取单例实例
const worker = getTransformersWorker();
```

### 3. 加载模型

```typescript
// 加载目标检测模型
await worker.loadModel(
    {
        task: 'object-detection', // 任务类型
        model: 'Xenova/yolov8n', // 模型名称
        options: {
            // 可选的模型加载选项
            quantized: true, // 使用量化模型
            cache_dir: '/tmp/transformers' // 缓存目录
        }
    },
    (progress) => {
        // 进度回调
        console.log(`模型加载进度: ${(progress.progress * 100).toFixed(0)}%`);
    }
);
```

### 4. 运行推理

```typescript
// 运行目标检测
const results = await worker.runInference(
    {
        task: 'object-detection', // 任务类型，必须与加载的模型匹配
        inputs: imageData, // 输入数据（根据任务类型不同而不同）
        options: {
            // 可选的推理选项
            threshold: 0.5 // 置信度阈值
        }
    },
    (progress) => {
        // 进度回调
        console.log(`推理进度: ${(progress.progress * 100).toFixed(0)}%`);
    }
);

// 处理结果
console.log('推理结果:', results);
```

### 5. 清理资源

```typescript
// 组件卸载或不再使用时清理资源
destroyTransformersWorker();
```

## 支持的任务类型

`@xenova/transformers` 支持多种任务类型，常见的包括：

-   `object-detection` - 目标检测
-   `image-classification` - 图像分类
-   `text-generation` - 文本生成
-   `translation` - 翻译
-   `summarization` - 文本摘要
-   `question-answering` - 问答系统

更多任务类型请参考 [@xenova/transformers 文档](https://huggingface.co/docs/transformers.js/index)(https://huggingface.co/docs/transformers.js/index)

## 示例代码

### 目标检测示例

```typescript
import { ref, onUnmounted } from 'vue';
import {
    getTransformersWorker,
    destroyTransformersWorker
} from '@/utils/web-worker/transformers-worker';

const worker = getTransformersWorker();
const progress = ref(0);

async function detectObjects(image: string) {
    try {
        // 加载模型
        await worker.loadModel(
            {
                task: 'object-detection',
                model: 'Xenova/yolov8n'
            },
            (p) => {
                progress.value = p.progress * 50; // 模型加载占50%
            }
        );

        // 运行推理
        const results = await worker.runInference(
            {
                task: 'object-detection',
                inputs: image
            },
            (p) => {
                progress.value = 50 + p.progress * 50; // 推理占50%
            }
        );

        return results;
    } catch (error) {
        console.error('检测失败:', error);
        throw error;
    }
}

onUnmounted(() => {
    destroyTransformersWorker();
});
```

## 注意事项

1. **模型加载时间**：首次加载模型可能需要较长时间，请耐心等待并显示加载进度。
2. **浏览器兼容性**：确保浏览器支持 Web Worker 和 ES 模块。
3. **资源占用**：大模型可能占用较多内存，建议在不需要时及时清理资源。
4. **任务匹配**：运行推理时的任务类型必须与加载模型时的任务类型匹配。
5. **跨域问题**：确保模型文件的加载路径没有跨域限制。

## 配置说明

在 `transformers.worker.ts` 中可以配置：

-   `env.allowLocalModels` - 是否允许本地模型
-   `env.backends.onnx.wasm.wasmPaths` - WASM 文件路径
-   `env.backends.onnx.wasm.proxy` - 是否使用代理
-   `env.cacheDir` - 模型缓存目录

## 开发与维护

-   **Worker 文件**：`transformers.worker.ts` - Web Worker 实现
-   **工具类**：`transformers-worker.ts` - 主线程工具类
-   **类型定义**：内置在对应的文件中

## 依赖

-   `@xenova/transformers` - Transformers JavaScript 库
-   `vite` - 构建工具，支持 Web Worker
-   `typescript` - 类型支持
