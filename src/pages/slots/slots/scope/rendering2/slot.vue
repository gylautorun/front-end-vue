<template>
    <Comp v-slot="slotProps">
        <span class="text">{{ slotProps.text }}</span>
        <span class="count">{{ slotProps.count }}</span>
    </Comp>
    <Comp v-slot="{text, count}">
        <span class="text">{{ text }}</span>
        <span class="count">{{ count }}</span>
    </Comp>
</template>

<script setup lang="ts">
    import Comp from './comp.vue';
</script>

<style scoped lang="scss">
.text {
    color: red;
}
.count {
    color: blue;
}
</style>