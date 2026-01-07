<template>
    <h3>对象检测</h3>
    <el-row
        :gutter="20"
        v-for="progressItem in tempProgressList"
        :key="progressItem.name"
        style="height: 44px"
    >
        <el-col :span="4" style="line-height: 44px; text-align: left"
            ><span>{{ progressItem.name }}</span></el-col
        >
        <el-col :span="20">
            <div class="progress-bar">
                <el-progress
                    size
                    :percentage="Number(progressItem.progress)"
                    :stroke-width="10"
                    :status="
                        progressItem.status === 'done' || progressItem.status === 'ready'
                            ? 'success'
                            : ''
                    "
                    :format="format"
                />
            </div>
        </el-col>
    </el-row>
    <el-row :gutter="20" style="margin-top: 24px">
        <el-col :span="12">
            <div class="left-area">
                <img ref="img" src="./img.png" alt="" />
                <svg
                    @mousemove="mousemoveHandle"
                    ref="svg"
                    preserveAspectRatio="none"
                    viewBox="0 0 240 160"
                    xmlns="http://www.w3.org/2000/svg"
                ></svg>
            </div>
        </el-col>
        <el-col :span="12">
            <canvas ref="canvas" style="height: 350px"></canvas>
        </el-col>
    </el-row>
    <el-row style="margin-top: 140px; width: 100%"
        ><el-button
            type="primary"
            @click="parseImgByModel"
            :loading="checkLoading"
            :disabled="!isCanChecked"
            >检测结果</el-button
        ></el-row
    >
    <vue-json-pretty :data="checkResult" v-show="isChecked" />
</template>

<script setup name="objectCheck">
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import { computed, onMounted, ref } from 'vue';
import { pipeline } from '@xenova/transformers';
import { Chart, registerables } from 'chart.js';
import { getImageDataFromImage } from '../utils';
import { cloneDeep } from 'lodash-es';

Chart.register(...registerables);

const format = (percentage) => (percentage === 100 ? 'Done' : `${percentage}%`);

const detector = ref();
const img = ref();
const svg = ref();
const canvas = ref();
const chartCanvas = ref();
const downloadProgressMap = ref({});
const checkLoading = ref(false);
const checkResult = ref({});
const isChecked = ref(false);

const tempProgressList = computed(() => {
    return Object.keys(downloadProgressMap.value).map((key) => downloadProgressMap.value[key]);
});
const isCanChecked = computed(() => {
    const list = Object.keys(downloadProgressMap.value).map(
        (key) => downloadProgressMap.value[key]
    );
    // 检查下载进度是否全部完成，并且detector.value是一个函数
    return list.every((item) => item.status === 'done') && typeof detector.value === 'function';
});

const COLOURS = [
    '255, 99, 132',
    '54, 162, 235',
    '255, 206, 86',
    '75, 192, 192',
    '153, 102, 255',
    '255, 159, 64'
];

const CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    scales: {
        y: {
            beginAtZero: true
        },
        x: {
            min: 0,
            max: 1
        }
    },
    plugins: {
        legend: {
            display: false
        }
    },
    layout: {
        padding: {
            bottom: -5
        }
    }
};

const downloadProgress = (progressData) => {
    const tempProgressMap = cloneDeep(downloadProgressMap.value);
    const name = progressData.file;

    if (progressData.status === 'initiate') {
        tempProgressMap[name] = {
            progress: 0,
            status: progressData.status,
            name
        };
    } else if (progressData.status === 'download') {
        tempProgressMap[name] = {
            progress: 0,
            status: progressData.status,
            name
        };
    } else if (progressData.status === 'progress') {
        tempProgressMap[name] = {
            status: progressData.status,
            progress: Number(progressData.progress).toFixed(2) || 0,
            name
        };
    } else if (progressData.status === 'done') {
        tempProgressMap[name] = {
            status: progressData.status,
            progress: progressData.progress || 100,
            name
        };
    }

    downloadProgressMap.value = tempProgressMap;
};

const downloadModel = async () => {
    try {
        detector.value = await pipeline('object-detection', 'Xenova/detr-resnet-50', {
            progress_callback: downloadProgress
        });
        console.log('模型下载成功，detector类型:', typeof detector.value);
    } catch (error) {
        console.error('模型下载失败:', error);
        // 设置一个错误状态，以便UI可以显示错误信息
        downloadProgressMap.value.modelError = {
            name: '模型下载失败',
            progress: 0,
            status: 'error'
        };
        // 抛出错误，让调用者知道下载失败
        throw error;
    }
};

const generatorSvgRect = (items = []) => {
    svg.value.innerHTML = '';
    chartCanvas.value?.destroy();

    let viewbox = svg.value.viewBox.baseVal;

    let colours = [];
    let borderColours = [];

    for (let i = 0; i < items.length; ++i) {
        const box = items[i].box;

        let svgns = 'http://www.w3.org/2000/svg';
        let rect = document.createElementNS(svgns, 'rect');

        rect.setAttribute('x', viewbox.width * box.xmin);
        rect.setAttribute('y', viewbox.height * box.ymin);
        rect.setAttribute('width', viewbox.width * (box.xmax - box.xmin));
        rect.setAttribute('height', viewbox.height * (box.ymax - box.ymin));

        const colour = COLOURS[i % COLOURS.length];
        rect.style.stroke = `rgba(${colour}, 1)`;
        rect.style.fill = `rgba(${colour}, 0.1)`;

        colours.push(`rgba(${colour}, 0.5)`);
        borderColours.push(`rgba(${colour}, 1)`);
        svg.value?.appendChild(rect);
    }

    const chartData = {
        labels: items.map((x) => x.label),
        datasets: [
            {
                data: items.map((x) => x.score),
                backgroundColor: colours,
                borderColor: borderColours
            }
        ]
    };

    chartCanvas.value = new Chart(canvas.value, {
        type: 'bar',
        data: structuredClone(chartData),
        options: CHART_OPTIONS
    });
    checkLoading.value = false;
};

const mousemoveHandle = (e) => {
    let rects = svg.value.querySelectorAll('rect');
    let colours = [];
    let borderColours = [];

    if (!rects.length) return;

    rects.forEach((rect, i) => {
        let colour = COLOURS[i % COLOURS.length];

        let toDisplay = e.target.tagName !== 'rect';
        if (!toDisplay) {
            let bb = rect.getBoundingClientRect();
            toDisplay =
                e.clientX >= bb.left &&
                e.clientX <= bb.right &&
                e.clientY >= bb.top &&
                e.clientY <= bb.bottom;
        }

        if (toDisplay) {
            // Set back to original
            rect.style.fillOpacity = 0.1;
            rect.style.opacity = 1;
            colours.push(`rgba(${colour}, 0.5)`);
            borderColours.push(`rgba(${colour}, 1)`);
        } else {
            rect.style.fillOpacity = 0;
            rect.style.opacity = 0;
            colours.push(`rgba(${colour}, 0.05)`);
            borderColours.push(`rgba(${colour}, 0.5)`);
        }
    });

    chartCanvas.value.data.datasets[0].backgroundColor = colours;
    chartCanvas.value.data.datasets[0].borderColor = borderColours;
};

// 添加错误信息变量
const errorMessage = ref('');

const parseImgByModel = async () => {
    checkLoading.value = true;
    isChecked.value = false;
    errorMessage.value = '';
    try {
        // 检查detector.value是否为函数
        if (typeof detector.value !== 'function') {
            throw new Error('检测器未正确初始化，请等待模型下载完成');
        }

        const items = await detector.value(getImageDataFromImage(img.value), {
            threshold: 0.9,
            percentage: true
        });
        checkResult.value = items;
        generatorSvgRect(items);
        isChecked.value = true;
    } catch (e) {
        console.log('error:', e);
        errorMessage.value = e instanceof Error ? e.message : '检测失败';
        checkLoading.value = false;
        isChecked.value = false;
    }
};

onMounted(async () => {
    // 同时下载模型和等待图像加载
    await Promise.all([downloadModel(), waitForImageLoad(img.value)]);
});
</script>

<style lang="scss" scoped>
.progress-bar {
    width: 100%;
    box-sizing: border-box;
    padding: 16px 24px;
    margin-bottom: 30px;
}
.left-area {
    position: relative;

    img,
    svg {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        width: 702px;
        height: 468px;
    }
    svg {
        z-index: 10;
    }
}
</style>
