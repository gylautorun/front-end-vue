<template>
    <div ref="containerRef">
        <component
            v-for="item in components"
            :key="item.name"
            :is="item.component"
            :class="'big-screen-right-item'"
        >
            {{ item.name }}
        </component>
    </div>
</template>

<script setup lang="ts">
import { shallowRef } from 'vue';
import { useSortable } from '../../hooks/use-sortable';
import Top from './top.vue';
import Center from './center.vue';
import Bottom from './bottom.vue';
import Bottom2 from './bottom-2.vue';
const components = shallowRef([
    { name: 'top', component: Top },
    { name: 'center', component: Center },
    // { name: 'bottom', component: Bottom }
    { name: 'bottom', component: Bottom2 }
]);

const { containerRef } = useSortable(components);
</script>

<style lang="scss" scoped>
.big-screen-right-item {
    --screen-right-height: 640px; // 320px * 2
    width: 100%;
    height: var(--screen-right-height);
    background-color: var(--big-block-bg);
    padding: var(--big-padding-16);
    animation-name: slide;
    &:nth-child(1) {
        animation-duration: 0.5s;
    }
    &:nth-child(2) {
        animation-duration: 1s;
    }
    &:nth-child(3) {
        animation-duration: 1.5s;
    }
    & + & {
        margin-top: var(--big-margin-20);
    }
}

@keyframes slide {
    0% {
        transform: translateX(100%);
    }
    80% {
        transform: translateX(calc(-1 * var(--big-margin-20)));
    }
    100% {
        transform: translateX(0);
    }
}
</style>
