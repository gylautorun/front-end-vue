<template>
    <div ref="containerRef">
        <component
            v-for="item in components"
            :key="item.name"
            :is="item.component"
            :class="'big-screen-left-item'"
            :name="item.name"
        >
            <Top />
        </component>
    </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';

import Top from './top.vue';
import Bottom from './bottom.vue';
import { useSortable } from '../../hooks/use-sortable';
const components = shallowRef([
    { name: 'top', component: Top },
    { name: 'bottom', component: Bottom }
]);

const { containerRef } = useSortable(components);
</script>

<style lang="scss" scoped>
.big-screen-left-item {
    --screen-left-height: 860px; // 430px * 2
    --screen-left--top-height: 1100px; // 550px * 2
    width: 100%;
    height: var(--screen-left-height);
    background-color: var(--big-block-bg);
    padding: var(--big-padding-16);
    animation-name: slide;

    & + & {
        margin-top: var(--big-margin-20);
    }
    &[name='top'] {
        height: var(--screen-left--top-height);
        animation-duration: 0.8s;
    }
    &[name='bottom'] {
        animation-duration: 1.5s;
    }
}

@keyframes slide {
    0% {
        transform: translateX(-100%);
    }
    80% {
        transform: translateX(var(--big-margin-20));
    }
    100% {
        transform: translateX(0);
    }
}
</style>
