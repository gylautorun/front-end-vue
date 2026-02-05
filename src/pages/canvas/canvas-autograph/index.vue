<template>
    <div class="canvas-autograph-container">
        <h1>Canvas 签名工具</h1>

        <div class="signature-area">
            <div id="signature-pad" ref="signaturePadRef"></div>
        </div>

        <div class="controls">
            <button class="btn reset-btn" @click="resetSignature">重置</button>
            <button class="btn save-btn" @click="saveSignature">保存签名</button>
            <button class="btn save-btn" @click="getBlobSignature">获取Blob对象</button>
            <button class="btn save-btn" @click="getFileSignature">获取File对象</button>
        </div>

        <div class="preview-area" v-if="signatureImage">
            <h2>签名预览</h2>
            <img :src="signatureImage" alt="签名预览" class="signature-preview" />
            <button class="btn download-btn" @click="downloadSignature">下载签名</button>
        </div>
    </div>
</template>

<script setup lang="ts" name="canvas-autograph">
import { ref, onMounted, onUnmounted } from 'vue';
import { CanvasAutograph } from './autograph';

// 导入工具函数
import { base64ToBlobOrFile } from './utils';

const signaturePadRef = ref<HTMLElement | null>(null);
const signatureImage = ref<string>('');
let autographInstance: CanvasAutograph | null = null;

onMounted(() => {
    if (signaturePadRef.value) {
        // 初始化签名工具
        autographInstance = new CanvasAutograph({
            el: signaturePadRef.value,
            lineSize: 4,
            lineColor: '#000000',
            backgroundColor: '#ffffff',
            ratio: window.devicePixelRatio
        });
    }
});

onUnmounted(() => {
    // 清理资源
    autographInstance = null;
});

// 重置签名
const resetSignature = () => {
    if (autographInstance) {
        autographInstance.reset();
        signatureImage.value = '';
    }
};

// 保存签名
const saveSignature = () => {
    if (autographInstance) {
        const base64 = autographInstance.getBase64('image/png');
        if (base64) {
            signatureImage.value = base64;
            console.log('签名保存成功:', base64);
        } else {
            alert('请先签名');
        }
    }
};

// 获取Blob对象
const getBlobSignature = () => {
    if (autographInstance) {
        const blob = autographInstance.getBlob('image/png');
        console.log('获取Blob对象成功:', blob);
        alert('Blob对象已生成，可在控制台查看');
    }
};

// 获取File对象
const getFileSignature = () => {
    if (autographInstance) {
        const file = autographInstance.getFile('image/png', 'my-signature');
        console.log('获取File对象成功:', file);
        alert('File对象已生成，可在控制台查看');
    }
};

// 下载签名
const downloadSignature = () => {
    if (signatureImage.value) {
        // 使用iframe方式下载，避免Safari中a标签下载终止后续请求的问题
        const filename = `signature-${new Date().getTime()}.png`;
        const base64 = signatureImage.value;

        // 创建iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.name = filename;
        iframe.src = base64;
        document.body.appendChild(iframe);

        // // 使用工具函数转换base64为Blob
        // const blob = base64ToBlobOrFile(base64, 'blob', filename);
        // const url = URL.createObjectURL(blob);
        // // 设置iframe的src并添加到文档
        // iframe.src = url;
        // document.body.appendChild(iframe);
        // // 释放URL对象
        // setTimeout(() => {
        //     URL.revokeObjectURL(url);
        // }, 100);

        iframe.click();

        setTimeout(() => {
            iframe.remove();
        }, 5000); // 下载完成后移除iframe
    }
};
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
