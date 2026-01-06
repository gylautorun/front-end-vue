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
        </div>
    </div>
</template>
<script setup lang="ts" name="imageRecognition">
// 导入vue的响应式API
import { ref, reactive } from 'vue';

const statusObj = reactive<{
    statusImg: string;
    isAnalysis: boolean;
}>({
    statusImg: '',
    isAnalysis: false
});
// 获取文件上传和图片容器元素
const imageContainerRef = ref<HTMLDivElement | null>(null);
// 获取文件上传元素
// const fileUploadRef = ref<HTMLInputElement | null>(null);

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
        detect(result);
    };
    reader.readAsDataURL(file);
}

// 检测图片的AI任务
async function detect(image: string) {
    if (!image) return;
    statusObj.isAnalysis = true;
    
    try {
        // 动态导入transformers库
        const { pipeline, env } = await import('@xenova/transformers');
        
        // 设置环境配置
        env.allowLocalModels = false;
        
        // 创建目标检测pipeline，添加详细配置和日志
        console.log('正在创建pipeline...');
        const detector = await pipeline('object-detection', 'Xenova/detr-resnet-50', {
            quantized: true, // 使用量化模型以提高性能
            progress_callback: (progress: any) => {
                console.log('模型加载进度:', progress);
            }
        });
        console.log('pipeline创建成功:', detector);
        
        // 执行检测
        console.log('正在执行检测...');
        const output = await detector(image, {
            threshold: 0.1,
            percentage: true
        });
        
        // 渲染检测结果
        console.log('检测结果:', output);
        
        // 处理检测结果，根据实际返回类型进行调整
        const results = Array.isArray(output) ? output : [output];
        
        results.forEach((item, index) => {
            console.log(`结果 ${index}:`, item);
            // 根据实际返回结构调整属性访问
            if (item && 'xmin' in item && 'xmax' in item && 'ymin' in item && 'ymax' in item && 'label' in item) {
                // 直接使用检测结果中的属性创建DetectionResult对象
                const detectionResult: DetectionResult = {
                    box: {
                        xmin: item.xmin as number,
                        xmax: item.xmax as number,
                        ymin: item.ymin as number,
                        ymax: item.ymax as number
                    },
                    label: item.label as string,
                    score: item.score as number
                };
                renderBox(detectionResult);
            } else if (item && 'box' in item && item.box && 'label' in item) {
                // 兼容包含box属性的格式
                renderBox(item as DetectionResult);
            } else {
                console.warn('结果格式不符合预期:', item);
            }
        });
    } catch (error) {
        console.error('检测失败:', error);
    } finally {
        statusObj.isAnalysis = false;
    }
}

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
// 渲染检测结果的边界框
function renderBox({ box, label, score }: DetectionResult) {
    // 检查必要的参数
    if (!box || typeof box.xmin === 'undefined' || typeof box.xmax === 'undefined' || typeof box.ymin === 'undefined' || typeof box.ymax === 'undefined' || !label) {
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

// 方式1: 泛型语法配合 withDefaults（推荐）
// 优点：提供默认值, 类型更简洁, 编译时检验
// const props = withDefaults(
//     defineProps<{
//         option: any;
//         loading?: boolean;
//     }>(),
//     {
//         option: () => ({}),
//         loading: false
//     }
// );

// 方式2: 纯泛型语法（简洁但无默认值）
// 缺点：无法提供默认值, option 必须提供
// 优点：代码简洁
// const props = defineProps<{
//     option: ECOption
//     loading?: boolean
// }>()

// 方式3: 运行时声明方式（完整类型声明）
// 缺点：无法提供默认值, 类型更复杂, 编译时检验
//     - required: true 和 default: () => ({}) 不能同时使用
// 优点：代码较长
// const props = defineProps({
//     option: {
//         type: Object as PropType<ECOption>,
//         required: false,
//         default: () => ({})
//     },
//     loading: {
//         type: Boolean,
//         default: false
//     }
// })
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
