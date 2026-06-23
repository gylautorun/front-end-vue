<!-- 一次性加载 LayoutComponents -->
<template>
    <div :class="{ 'fullscreen-mode': isFullscreenMode }">
        <!-- 非 antd 看 _templates/vite-ts-vue -->
        <component :is="LayoutComponents[layout]">
            <!-- <router-view /> 在 main 里面 -->
        </component>
        <!-- 主题等设置 (联动) -->
        <ThemeDrawer />
        <!-- 全局悬浮布局控制器 -->
        <FloatingLayoutController />
        <!-- 全屏模式悬浮导航栏 -->
        <FloatingNavBar />
    </div>
</template>

<script setup lang="ts" name="layout">
import { computed, type Component } from 'vue';
import { useGlobalStore } from '@/stores/modules/global';
import { useRoute } from 'vue-router';
// 主题抽屉
import ThemeDrawer from './components/theme-drawer/index.vue';
// 全局悬浮布局控制器
import FloatingLayoutController from '@/components/floating-layout-controller/index.vue';
// 全屏模式悬浮导航栏
import FloatingNavBar from '@/components/floating-layout-controller/FloatingNavBar.vue';
// 纵向布局
import LayoutVertical from './vertical/index.vue';
// 横向布局
import LayoutTransverse from './transverse/index.vue';
// antd
import LayoutAntd from './antd/index.vue';

const route = useRoute();
const globalStore = useGlobalStore();

const LayoutComponents: { [key: string]: Component } = {
    vertical: LayoutVertical,
    transverse: LayoutTransverse,
    antd: LayoutAntd
};

const layout = computed(() => globalStore.layout);

// 判断是否全屏模式
const isFullscreenMode = computed(() => {
    if (globalStore.layoutModified) {
        return !globalStore.showSider && !globalStore.showHeader && !globalStore.showFooter;
    }
    const showSider = route.meta?.showSider !== undefined ? route.meta.showSider : globalStore.showSider;
    const showHeader = route.meta?.showHeader !== undefined ? route.meta.showHeader : globalStore.showHeader;
    const showFooter = route.meta?.showFooter !== undefined ? route.meta.showFooter : globalStore.showFooter;
    return !showSider && !showHeader && !showFooter;
});
</script>

<style scoped lang="scss"></style>
