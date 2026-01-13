<template>
    <div class="sass-star-sky">
        <div class="star-sky1"></div>
        <div class="star-sky2"></div>
        <div class="star-sky3"></div>
        <div class="star-sky4"></div>
        <div class="star-sky5"></div>
        <!-- <div class="star-sky-content">Sass 星空</div> -->
        <div class="star-sky-content">
            <svg viewBox="0 0 300 80" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="strokeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <!-- <stop offset="0%" stop-color="#ff0000" />
                        <stop offset="25%" stop-color="#ff7f00" />
                        <stop offset="50%" stop-color="#ffff00" />
                        <stop offset="75%" stop-color="#00ff00" />
                        <stop offset="100%" stop-color="#0000ff" /> -->
                        <stop offset="0%" stop-color="#8b5cf6" />
                        <!-- 紫色 -->
                        <stop offset="50%" stop-color="#06b6d4" />
                        <!-- 青色 -->
                        <stop offset="100%" stop-color="#60a5fa" />
                        <!-- 蓝色 -->
                    </linearGradient>
                </defs>
                <text x="150" y="50" text-anchor="middle" dy=".3em">Sass 星空</text>
            </svg>
        </div>
    </div>
</template>
<script setup lang="ts" name="sass-star-sky">
import { ref } from 'vue';
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
