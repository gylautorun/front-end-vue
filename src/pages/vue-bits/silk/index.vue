<template>
    <div class="silk">
        <h1>欢迎使用 Vue Bits</h1>
        <SplashCursor
            :colors="['#ff4d6d', '#06b6d4', '#a855f7']"
            size="large"
            fadeDuration="1200"
            spreadSpeed="0.8"
        />
    </div>
</template>
<script setup lang="ts" name="silk">
import { ref } from 'vue';
import SplashCursor from '@/vue-bits/Backgrounds/Silk/Silk.vue';
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
