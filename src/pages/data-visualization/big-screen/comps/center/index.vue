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
    position: relative;
    // width: 100%;
    height: 1000px;
    padding: 0 16px;
    animation: slideAndFade 1.5s;
    .big-center-top {
        height: calc(100% - 150px);
    }
}

@keyframes slideAndFade {
    0% {
        transform: translateY(218px);
        opacity: 0;
    }
    100% {
        transform: translateX(0);
        opacity: 1;
    }
}
</style>
