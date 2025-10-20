<template>
    <slot :x="x" :y="y"/>
</template>

<script setup lang="ts">
    import { ref, onMounted, onUnmounted } from 'vue'
    const x = ref(0)
    const y = ref(0)

    const update = (e: MouseEvent) => {
        x.value = e.pageX
        y.value = e.pageY
    };

    onMounted(() => window.addEventListener('mousemove', update));
    onUnmounted(() => window.removeEventListener('mousemove', update));
</script>

<style scoped lang="scss">

</style>