<template>
    <SeamlessScroll class="big-center-bottom">
        <div v-for="(item, index) in actions" class="big-bottom-item">
            <ElIcon size="32" :color="item.color">
                <component :is="iconObj[item.icon]" />
            </ElIcon>
            <Vue3Odometer
                :style="{ color: item.color }"
                class="big-item-text"
                :value="item.value"
            />
        </div>
    </SeamlessScroll>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElIcon } from 'element-plus';
import Vue3Odometer from 'vue3-odometer';
import 'odometer/themes/odometer-theme-default.css';
import { KnifeFork, IceTea, Coffee, IceCream, Dessert, GobletFull } from '@element-plus/icons-vue';
import SeamlessScroll from '../seamless-scroll.vue';
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
.big-center-bottom {
    position: relative;
    width: 100%;
    overflow: hidden;
    height: 150px;
    .big-bottom-item {
        position: absolute;
        top: 0;
        left: 0;
        width: 170px;
        height: 150px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        background-color: var(--big-block-bg);
        font-size: 22px;
        font-weight: 600;
        .big-item-text {
            margin-top: 16px;
        }
    }
}
</style>
