<template>
    <div class="split-text">
        <h1>欢迎使用 Vue Bits</h1>
        <SplitText
            text="Hello, GSAP!"
            class-name="text-2xl font-semibold text-center"
            :delay="100"
            :duration="0.6"
            ease="power3.out"
            split-type="chars"
            :from="{ opacity: 0, y: 40 }"
            :to="{ opacity: 1, y: 0 }"
            :threshold="0.1"
            root-margin="-100px"
            text-align="center"
            @animation-complete="handleAnimationComplete"
        />
    </div>
</template>
<script setup lang="ts" name="silk">
import { ref } from 'vue';
import SplitText from '@/vue-bits/TextAnimations/SplitText/SplitText.vue';
const handleAnimationComplete = () => {
    console.log('All letters have animated!');
};
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
