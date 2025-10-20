<template>
    <MouseTracker v-slot="{ x, y }">
        Mouse is at: 
        <span class="x">{{ x }}</span>
        <span class="y">{{ y }}</span>
	</MouseTracker>
</template>

<script setup lang="ts">
    import MouseTracker from './mouse-tracker.vue';
</script>

<style scoped lang="scss">
.x {
    color: red;
}
.y {
    color: blue;
}
</style>