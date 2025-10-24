<template>
    <el-upload
        class="upload-demo"
        ref="upload"
        :http-request="uploadFile"
        :on-change="handleChange"
        :auto-upload="false"
        :before-upload="beforeUpload"
        :multiple="false"
    >
        <el-button slot="trigger" type="primary">选取文件</el-button>
        <el-button @click="submitUpload">上传</el-button>
    </el-upload>
    <div class="control-buttons">
        <h3>布局控制</h3>
        <div class="button-group">
            <h4>单独控制</h4>
            <a-button type="primary" @click="toggleSider()">切换侧边栏</a-button>
            <a-button type="primary" @click="toggleHeader()">切换顶部导航</a-button>
            <a-button type="primary" @click="toggleFooter()">切换底部信息</a-button>
        </div>
        <div class="button-group">
            <h4>预设模式</h4>
            <a-button type="default" @click="setFullscreen()">全屏模式</a-button>
            <a-button type="default" @click="setNoSider()">无侧边栏</a-button>
            <a-button type="default" @click="resetLayout()">标准模式</a-button>
        </div>
    </div>
</template>

<script setup lang="ts">
import MD5 from 'crypto-js/md5';
import { useHome } from '@/stores/home';
import { storeToRefs } from 'pinia';
import { ref, reactive } from 'vue';
import CryptoJS from 'crypto-js';
import { useGlobalStore } from '@/stores/modules/global';
import { setLayoutPreset, setLayoutState } from '@/router/guards/layout';

interface RawFile {
    raw: File;
}
const state = reactive<{
    file: RawFile['raw'] | null;
    chunkSize: number;
    uploadedChunks: number[];
    fileHash: string;
}>({
    file: null,
    chunkSize: 2 * 1024 * 1024, // 2MB
    uploadedChunks: [],
    fileHash: ''
});

const calculateHash = (file: RawFile['raw']) => {
    const chunkSize = state.chunkSize;
    const chunks = Math.ceil(file.size / chunkSize);
    const spark = CryptoJS.algo.SHA256.create(); // 正确初始化哈希实例
    let currentChunk = 0;

    const fileReader: FileReader = new FileReader();
    fileReader.onload = (e: ProgressEvent<FileReader>) => {
        if (!e.target?.result) {
            console.error('读取文件块失败');
            return;
        }
        // 将 ArrayBuffer 转换为 WordArray
        const arrayBuffer = e.target.result as ArrayBuffer;
        const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(arrayBuffer));
        spark.update(wordArray); // 使用 update 方法更新哈希

        currentChunk++;

        if (currentChunk < chunks) {
            loadNext();
        } else {
            // 计算最终哈希并转换为十六进制字符串
            state.fileHash = spark.finalize().toString(CryptoJS.enc.Hex);
            console.log('文件哈希值:', state.fileHash);
        }
    };

    fileReader.onerror = () => {
        console.error('文件读取错误:', fileReader.error);
    };
    const loadNext = () => {
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        fileReader.readAsArrayBuffer(file.slice(start, end));
    };

    loadNext();
};
const uploadFile = async () => {
    const response = await fetch(`http://localhost:3000/check-file?hash=${state.fileHash}`);
    const { exists } = await response.json();

    if (exists) {
        console.log('文件已存在，秒传成功');
        return;
    }
    if (!state.file) return;
    const chunkCount = Math.ceil(state.file.size / state.chunkSize);
    const uploadedChunksResponse = await fetch(
        `http://localhost:3000/uploaded-chunks?fileName=${state.file.name}`
    );
    state.uploadedChunks = await uploadedChunksResponse.json();

    for (let i = 0; i < chunkCount; i++) {
        if (state.uploadedChunks.includes(i)) continue;

        const chunk = state.file.slice(i * state.chunkSize, (i + 1) * state.chunkSize);
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('index', `${i}`);
        formData.append('fileName', state.file.name);
        formData.append('hash', state.fileHash);
        await uploadChunk(formData);
    }
};
const uploadChunk = async (formData: FormData) => {
    try {
        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        state.uploadedChunks.push(result.index);
        console.log(result);
    } catch (error) {
        console.error('上传失败:', error);
    }
};
const submitUpload = () => {
    uploadFile();
};
const handleChange = (file: RawFile) => {
    state.file = file.raw;
};
const beforeUpload = (file: RawFile['raw']) => {
    state.file = file;
    calculateHash(file);
    return false;
};

// 控制全局
const globalStore = useGlobalStore();

// 切换侧边栏显示
function toggleSider() {
    setLayoutState({ showSider: !globalStore.showSider });
    console.log('侧边栏状态:', globalStore.showSider);
}

// 切换顶部导航显示
function toggleHeader() {
    setLayoutState({ showHeader: !globalStore.showHeader });
    console.log('顶部导航状态:', globalStore.showHeader);
}

// 切换底部信息显示
function toggleFooter() {
    setLayoutState({ showFooter: !globalStore.showFooter });
    console.log('底部信息状态:', globalStore.showFooter);
}

// 重置布局到默认状态
function resetLayout() {
    setLayoutPreset('standard');
    console.log('布局已重置为标准模式');
}

// 设置为全屏模式
function setFullscreen() {
    setLayoutPreset('fullscreen');
    console.log('已设置为全屏模式');
}

// 设置为无侧边栏模式
function setNoSider() {
    setLayoutPreset('noSider');
    console.log('已设置为无侧边栏模式');
}
</script>

<style scoped lang="scss">
.control-buttons {
    margin-top: 20px;

    h3 {
        text-align: center;
        margin-bottom: 20px;
        color: #333;
        font-size: 18px;
    }

    .button-group {
        margin-bottom: 20px;

        h4 {
            text-align: center;
            margin-bottom: 10px;
            color: #666;
            font-size: 14px;
            font-weight: normal;
        }

        display: flex;
        justify-content: center;
        gap: 12px;
        flex-wrap: wrap;

        .ant-btn {
            margin: 0 4px;
        }
    }
}
</style>
