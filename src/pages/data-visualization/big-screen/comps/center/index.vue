<template>
    <div class="big-center">
        <div class="big-center-top">
            <Map />
        </div>
        <Bottom />
        <!-- <AMap /> -->
    </div>
</template>

<script setup lang="ts">
import Map from './map.vue';
// import AMap from './a-map.vue';
import Bottom from './bottom.vue';
</script>

<style lang="scss" scoped>
.big-center {
    // 使用screen.scale-size函数计算缩放后的尺寸
    --center-height: #{screen.scale-size(1000px)};
    --center-top-height: #{screen.scale-size(150px)};
    --center-animate-translate-y: #{screen.scale-size(218px)};
    position: relative;
    // width: 100%;
    height: var(--center-height);
    padding: 0 var(--big-padding-16);
    animation: slideAndFade 1.5s;
    .big-center-top {
        height: calc(100% - var(--center-top-height));
    }
    @keyframes slideAndFade {
        0% {
            transform: translateY(var(--center-animate-translate-y));
            opacity: 0;
        }
        100% {
            transform: translateX(0);
            opacity: 1;
        }
    }
}
</style>
