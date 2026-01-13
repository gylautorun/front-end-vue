<template>
    <div class="multiple-window-3d-scene" ref="sceneContainerRef"></div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import RenderMore3DScene from './render';

const sceneContainerRef = ref<HTMLDivElement | null>(null);
let renderScene: RenderMore3DScene | null = null;

// 使用Vue生命周期钩子初始化和清理3D场景
onMounted(() => {
    // 初始化渲染场景
    renderScene = new RenderMore3DScene(sceneContainerRef.value!);
    renderScene.init();
});

onUnmounted(() => {
    // 清理资源
    renderScene = null;
});
</script>

<style scoped lang="scss">
.multiple-window-3d-scene {
    // width: 100%;
    // height: 100vh;
    // overflow: hidden;
    // position: relative;
}
</style>
