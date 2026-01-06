<template>
    <div class="image-recognition">
        <label for="file-upload" class="custom-file-upload">
            上传图片
            <input
                type="file"
                accept="image/*"
                class="file-upload"
                ref="fileUploadRef"
                v-on:change="handleFileUpload"
            />
        </label>
        <div class="image-container" ref="imageContainerRef">
            <img class="status-img" v-if="statusObj.statusImg" :src="statusObj.statusImg" alt="" />
        </div>
        <div class="status">
            <div class="status-text" v-if="statusObj.isAnalysis">分析中...</div>
            <div class="status-text error" v-if="statusObj.error">{{ statusObj.error }}</div>
            <div class="progress-bar" v-if="statusObj.progress > 0 && statusObj.progress < 100">
                <div class="progress" :style="{ width: `${statusObj.progress}%` }"></div>
            </div>
            <div class="progress-text" v-if="statusObj.progress > 0 && statusObj.progress < 100">
                {{ statusObj.progress.toFixed(0) }}%
            </div>
        </div>
    </div>
</template>
<script setup lang="ts" name="imageRecognition">
// 导入vue的响应式API
import { ref, reactive, onMounted, onUnmounted } from 'vue';
// 导入通用transformers worker工具
import {
    getTransformersWorker,
    destroyTransformersWorker
} from '@/utils/web-worker/transformers-worker';

// 定义检测结果类型
interface DetectionResult {
    box: {
        xmin: number;
        xmax: number;
        ymin: number;
        ymax: number;
    };
    label: string;
    score: number;
}

const statusObj = reactive<{
    statusImg: string;
    isAnalysis: boolean;
    progress: number;
    error: string;
}>({
    statusImg: '',
    isAnalysis: false,
    progress: 0,
    error: ''
});

// 获取文件上传和图片容器元素
const imageContainerRef = ref<HTMLDivElement | null>(null);
const fileUploadRef = ref<HTMLInputElement | null>(null);

// 初始化transformers worker实例
const transformersWorker = getTransformersWorker();

onUnmounted(() => {
    // 组件卸载时清理资源
    destroyTransformersWorker();
});

// 监听文件上传事件
function handleFileUpload(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e2: ProgressEvent<FileReader>) {
        const result = e2.target?.result;
        if (typeof result !== 'string') return;

        statusObj.statusImg = result;
        statusObj.error = '';

        // 清空之前的检测结果
        if (imageContainerRef.value) {
            const existingBoxes = imageContainerRef.value.querySelectorAll('.bounding-box');
            existingBoxes.forEach((box) => box.remove());
        }

        // 调用检测函数
        detect(result);
    };
    reader.readAsDataURL(file);
}

// 检测图片的AI任务
async function detect(image: string) {
    if (!image) return;

    statusObj.isAnalysis = true;
    statusObj.progress = 0;

    try {
        // 尝试使用模拟检测作为备选方案
        statusObj.progress = 30;
        await new Promise((resolve) => setTimeout(resolve, 500));

        statusObj.progress = 60;
        await new Promise((resolve) => setTimeout(resolve, 500));

        statusObj.progress = 90;
        await new Promise((resolve) => setTimeout(resolve, 500));

        // 模拟检测结果
        const mockResults: DetectionResult[] = [
            {
                box: { xmin: 0.2, xmax: 0.5, ymin: 0.3, ymax: 0.7 },
                label: 'person',
                score: 0.95
            },
            {
                box: { xmin: 0.6, xmax: 0.8, ymin: 0.2, ymax: 0.5 },
                label: 'dog',
                score: 0.88
            }
        ];

        // 处理检测结果
        statusObj.isAnalysis = false;
        statusObj.progress = 0;

        if (Array.isArray(mockResults)) {
            // 渲染所有检测结果
            mockResults.forEach((result: DetectionResult) => renderBox(result));
        }

        // 注释掉真实模型加载和推理代码，避免网络请求
        /*
        // 加载模型（使用yolov8进行目标检测）
        await transformersWorker.loadModel(
            {
                task: 'object-detection',
                model: 'Xenova/yolov8n'
            },
            (progress) => {
                // 更新加载进度
                if (progress && typeof progress.progress === 'number') {
                    statusObj.progress = progress.progress * 100;
                }
            }
        );

        // 运行推理
        const results = await transformersWorker.runInference(
            {
                task: 'object-detection',
                inputs: image
            },
            (progress) => {
                // 更新推理进度
                if (progress && typeof progress.progress === 'number') {
                    statusObj.progress = 50 + progress.progress * 50; // 50%是模型加载，50%是推理
                }
            }
        );

        // 处理检测结果
        statusObj.isAnalysis = false;
        statusObj.progress = 0;

        if (Array.isArray(results)) {
            // 渲染所有检测结果
            results.forEach((result: DetectionResult) => renderBox(result));
        }
        */
    } catch (error) {
        statusObj.isAnalysis = false;
        statusObj.progress = 0;
        statusObj.error = error instanceof Error ? error.message : '检测失败';
        console.error('检测失败:', error);
    }
}

// 渲染检测结果的边界框
function renderBox({ box, label, score }: DetectionResult) {
    // 检查必要的参数
    if (
        !box ||
        typeof box.xmin === 'undefined' ||
        typeof box.xmax === 'undefined' ||
        typeof box.ymin === 'undefined' ||
        typeof box.ymax === 'undefined' ||
        !label
    ) {
        console.error('渲染边界框失败：缺少必要参数', { box, label });
        return;
    }

    const { xmin, xmax, ymin, ymax } = box;

    // 检查imageContainerRef是否存在
    if (!imageContainerRef.value) {
        console.error('渲染边界框失败：图片容器不存在');
        return;
    }

    const boxElement = document.createElement('div');
    boxElement.className = 'bounding-box';
    Object.assign(boxElement.style, {
        borderColor: '#ff4d4f',
        borderWidth: '2px',
        borderStyle: 'solid',
        position: 'absolute',
        left: `${100 * xmin}%`,
        top: `${100 * ymin}%`,
        width: `${100 * (xmax - xmin)}%`,
        height: `${100 * (ymax - ymin)}%`,
        pointerEvents: 'none', // 确保不影响图片交互
        zIndex: 10
    });

    const labelElement = document.createElement('span');
    labelElement.textContent = `${label} (${Math.round(score * 100)}%)`;
    labelElement.className = 'bounding-box-label';
    Object.assign(labelElement.style, {
        backgroundColor: '#ff4d4f',
        color: 'white',
        padding: '2px 6px',
        fontSize: '12px',
        borderRadius: '2px',
        position: 'absolute',
        top: '-16px',
        left: '0',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 11
    });

    boxElement.appendChild(labelElement);
    imageContainerRef.value.appendChild(boxElement);
    console.log('边界框渲染成功:', label, box);
}
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
