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
    --center-height: 2000px; // 1000px * 2
    --center-top-height: 300px; // 150px * 2
    --center-animate-translate-y: 436px; // 218px * 2
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
