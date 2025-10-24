<!-- 一次性加载 LayoutComponents -->
<template>
    <!-- 非 antd 看 _templates/vite-ts-vue -->
    <component :is="LayoutComponents[layout]">
        <!-- <router-view /> 在 main 里面 -->
    </component>
    <!-- 主题等设置 (联动) -->
    <ThemeDrawer />
    <!-- 全局悬浮布局控制器 -->
    <FloatingLayoutController />
</template>

<script setup lang="ts" name="layout">
import { computed, type Component } from 'vue';
import { useGlobalStore } from '@/stores/modules/global';
// 主题抽屉
import ThemeDrawer from './components/theme-drawer/index.vue';
// 全局悬浮布局控制器
import FloatingLayoutController from '@/components/floating-layout-controller/index.vue';
// 纵向布局
import LayoutVertical from './vertical/index.vue';
// 横向布局
import LayoutTransverse from './transverse/index.vue';
// antd
import LayoutAntd from './antd/index.vue';

const LayoutComponents: { [key: string]: Component } = {
    vertical: LayoutVertical,
    transverse: LayoutTransverse,
    antd: LayoutAntd
};

const globalStore = useGlobalStore();
const layout = computed(() => globalStore.layout);
</script>

<style scoped lang="scss"></style>
