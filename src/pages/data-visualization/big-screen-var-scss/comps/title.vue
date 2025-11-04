<template>
    <h3 class="big-screen-title">
        <slot>
            {{ title }}
        </slot>
    </h3>
</template>

<script setup lang="ts">
defineProps({
    title: String
});
</script>

<style lang="scss" scoped>
.big-screen-title {
    position: relative;
    padding-left: var(--big-gap-small);
    &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: var(--big-border-width);
        height: 100%;
        background-color: var(--big-screen-text-color);
    }
}
</style>
