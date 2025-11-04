<template>
    <div class="big-center-bottom-wrapper">
        <SeamlessScroll ref="scrollRef" class="big-center-bottom">
            <div v-for="(item, index) in actions" class="big-bottom-item">
                <!-- 32 -->
                <ElIcon size="64" :color="item.color">
                    <component :is="iconObj[item.icon]" />
                </ElIcon>
                <Vue3Odometer
                    :style="{ color: item.color }"
                    class="big-item-text"
                    :value="item.value"
                />
            </div>
        </SeamlessScroll>
        <div class="control-buttons">
            <button @click="handlePause" class="control-btn">暂停</button>
            <button @click="handlePlay" class="control-btn">开始</button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, DefineComponent } from 'vue';
import { ElIcon } from 'element-plus';
import Vue3Odometer from 'vue3-odometer';
import 'odometer/themes/odometer-theme-default.css';
import { KnifeFork, IceTea, Coffee, IceCream, Dessert, GobletFull } from '@element-plus/icons-vue';
import SeamlessScroll from '../seamless-scroll.vue';

const scrollRef = ref<InstanceType<typeof SeamlessScroll> | null>(null);

const handlePause = () => {
    scrollRef.value?.pause();
};

const handlePlay = () => {
    scrollRef.value?.play();
};
const iconObj: Record<string, DefineComponent> = {
    KnifeFork,
    IceTea,
    Coffee,
    IceCream,
    Dessert,
    GobletFull
};
const actions = ref<{ color: string; icon: string; value: number }[]>([
    { color: 'rgb(24, 144, 255)', icon: 'KnifeFork', value: 0 },
    { color: 'rgb(255, 192, 105)', icon: 'IceTea', value: 0 },
    { color: 'rgb(92, 219, 211)', icon: 'Coffee', value: 0 },
    { color: 'rgb(179, 127, 235)', icon: 'IceCream', value: 0 },
    { color: 'rgb(255, 133, 192)', icon: 'Dessert', value: 0 },
    { color: 'rgb(255, 214, 102)', icon: 'GobletFull', value: 0 },
    { color: 'rgb(24, 144, 255)', icon: 'KnifeFork', value: 0 },
    { color: 'rgb(255, 192, 105)', icon: 'IceTea', value: 0 },
    { color: 'rgb(92, 219, 211)', icon: 'Coffee', value: 0 },
    { color: 'rgb(179, 127, 235)', icon: 'IceCream', value: 0 },
    { color: 'rgb(255, 133, 192)', icon: 'Dessert', value: 0 }
]);

onMounted(() => {
    actions.value.forEach((item) => {
        item.value = Math.floor(Math.random() * 999) + 1;
    });
});
</script>

<style lang="scss" scoped>
.big-center-bottom-wrapper {
    --center-bottom-height: 300px; // 150px * 2
    --center-bottom-width: 340px; // 170px * 2
    --bottom-font-size: 44px; // 22px * 2

    --bottom-control-buttons-top: 20px; // 10px * 2
    --bottom-control-buttons-gap: 16px; // 8px * 2

    --bottom-control-btn-padding: 8px 24px; // 4px * 2, 12px * 2
    --bottom-control-btn-font-size: 24px; // 12px * 2
    --bottom-control-btn-radius: 8px; // 4px * 2

    position: relative;
    width: 100%;
    height: var(--center-bottom-height);

    .big-center-bottom {
        position: relative;
        width: 100%;
        overflow: hidden;
        height: var(--center-bottom-height);
    }

    .big-bottom-item {
        position: absolute;
        top: 0;
        left: 0;
        width: var(--center-bottom-width);
        height: var(--center-bottom-height);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: var(--big-block-bg);
        font-size: var(--bottom-font-size);
        font-weight: 600;
        .big-item-text {
            margin-top: var(--big-margin-20);
        }
    }

    .control-buttons {
        position: absolute;
        top: var(--bottom-control-buttons-top);
        right: var(--bottom-control-buttons-top);
        display: flex;
        gap: var(--bottom-control-buttons-gap);
        z-index: 10;
    }

    .control-btn {
        padding: var(--bottom-control-btn-padding);
        background-color: rgba(0, 0, 0, 0.6);
        color: #fff;
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: var(--bottom-control-btn-radius);
        cursor: pointer;
        font-size: var(--bottom-control-btn-font-size);
        transition: all 0.3s;

        &:hover {
            background-color: rgba(0, 0, 0, 0.8);
            border-color: rgba(255, 255, 255, 0.5);
        }

        &:active {
            transform: scale(0.95);
        }
    }
}
</style>
