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
import { useScreenStore } from '@/stores/data-visualization/screen';
import { useResize } from '@/hooks/use-resize';
import Header from './comps/header.vue';
import Left from './comps/left/index.vue';
import Right from './comps/right/index.vue';
import Center from './comps/center/index.vue';

const store = useScreenStore();
const { screenRef } = useResize();
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

<style scoped lang="scss">
@import url('./index.scss');
</style>
