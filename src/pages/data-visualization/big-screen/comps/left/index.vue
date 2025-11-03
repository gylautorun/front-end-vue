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
    width: 100%;
    height: 430px;
    background-color: var(--big-block-bg);
    padding: 16px;
    animation-name: slide;

    & + & {
        margin-top: 20px;
    }
    &[name='top'] {
        height: 550px;
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
        transform: translateX(20px);
    }
    100% {
        transform: translateX(0);
    }
}
</style>
