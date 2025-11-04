<template>
    <div :class="['big-screen-container', store.theme]">
        <div ref="screenRef" class="big-screen">
            <Header />
            <div class="big-screen-main">
                <div class="big-screen-left">
                    <Left />
                </div>
                <div class="big-screen-center">
                    <Center />
                </div>
                <div class="big-screen-right">
                    <Right />
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts" name="bigScreen">
import { ref } from 'vue';
import { BASE_WIDTH, BASE_HEIGHT } from './hooks/use-resize';
import { useScreenStore } from '@/stores/data-visualization/screen';
import { useResize } from './hooks/use-resize';
import Header from './comps/header.vue';
import Left from './comps/left/index.vue';
import Right from './comps/right/index.vue';
import Center from './comps/center/index.vue';
import { getCurrentScale } from './utils/calculate';

const scale = getCurrentScale();
const store = useScreenStore();
// 使用基础尺寸，并让组件自动根据屏幕大小进行缩放
const { screenRef } = useResize({
    w: BASE_WIDTH * scale,
    h: BASE_HEIGHT * scale
});
const props = withDefaults(
    defineProps<{
        option: any;
        loading?: boolean;
    }>(),
    {
        option: () => ({}),
        loading: false
    }
);
</script>

<style lang="scss">
@import url('./index.scss');
</style>
