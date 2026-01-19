<template>
    <div class="relative flex h-full flex-col items-center justify-center falling-stars-bg">
        <FallingStarsBg class="bg-white dark:bg-black" :color="isDark ? '#FFF' : '#555'" />
        <div class="z-[1] flex items-center">
            <span class="text-6xl font-bold text-black dark:text-white">Inspira UI</span>
        </div>
    </div>
</template>
<script setup lang="ts">
import FallingStarsBg from '@/components/inspira-ui/falling-stars-bg.vue';
import { useColorMode } from '@vueuse/core';
import { computed } from 'vue';

const isDark = computed(() => useColorMode().value === 'dark');
</script>
<style lang="scss" scoped>
.falling-stars-bg {
    min-height: 100vh;
}
</style>
