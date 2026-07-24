<template>
    <div class="modal-overlay" :class="{ show: resizeOpen }" @click.self="resizeOpen = false">
        <div class="modal resize-modal">
            <h3>📐 调整节点尺寸</h3>
            <div class="form-group">
                <label>宽度（像素）</label>
                <input v-model.number="resizeWidth" type="number" min="50" max="500" />
            </div>
            <div class="form-group">
                <label>高度（像素）</label>
                <input v-model.number="resizeHeight" type="number" min="20" max="300" />
            </div>
            <div class="modal-actions">
                <button type="button" @click="resizeOpen = false">取消</button>
                <button type="button" @click="emit('confirm-resize')">确定</button>
            </div>
        </div>
    </div>

    <div class="modal-overlay" :class="{ show: downloadOpen }" @click.self="downloadOpen = false">
        <div class="modal download-modal">
            <h3>📥 选择下载格式</h3>
            <div class="form-group">
                <label>文件名称</label>
                <input v-model="downloadFileName" type="text" placeholder="请输入文件名" />
            </div>

            <div class="download-options">
                <button
                    type="button"
                    class="download-option"
                    @click="emit('select-download-format', 'png')"
                >
                    <span class="option-icon">🖼️</span>
                    <span class="option-info">
                        <span class="option-title">PNG 图片</span>
                        <span class="option-desc">适合分享和打印</span>
                    </span>
                </button>
                <button
                    type="button"
                    class="download-option"
                    @click="emit('select-download-format', 'svg')"
                >
                    <span class="option-icon">📐</span>
                    <span class="option-info">
                        <span class="option-title">SVG 矢量图</span>
                        <span class="option-desc">适合编辑和缩放</span>
                    </span>
                </button>
            </div>

            <div class="modal-actions">
                <button type="button" @click="downloadOpen = false">取消</button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const resizeOpen = defineModel<boolean>('resizeOpen', { required: true });
const resizeWidth = defineModel<number>('resizeWidth', { required: true });
const resizeHeight = defineModel<number>('resizeHeight', { required: true });
const downloadOpen = defineModel<boolean>('downloadOpen', { required: true });
const downloadFileName = defineModel<string>('downloadFileName', { required: true });

const emit = defineEmits<{
    (e: 'confirm-resize'): void;
    (e: 'select-download-format', format: 'png' | 'svg'): void;
}>();
</script>

<style src="../styles/graph-dialogs.scss" lang="scss" scoped></style>
