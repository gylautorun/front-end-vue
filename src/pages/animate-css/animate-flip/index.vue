<template>
    <h2>FLIP动画</h2>
    <a-button type="primary" @click="changeElementPosition">改变元素的位置</a-button>
    <ul class="animate-flip" ref="flipRef">
        <li v-for="item of list" :key="item.type">
            <div class="item">
                {{ item.name }}
            </div>
        </li>
    </ul>
</template>
<script setup lang="ts" name="animate-flip">
import { ref } from 'vue';

/**
 * FLIP动画方案
 * First: 记录监控元素的位置
 * Last: 记录元素结构变化后的位置
 * Invert: 移动元素到First位置
 * Play: 播放动画
 */
const flipRef = ref<HTMLUListElement | null>(null);
const list = ref([
    {
        name: '框架',
        type: 'framework'
    },
    {
        name: '组件',
        type: 'component'
    },
    {
        name: '工程化',
        type: 'engineering'
    },
    {
        name: 'HTML + CSS',
        type: 'html-css'
    },
    {
        name: '移动端',
        type: 'mobile'
    },
    {
        name: '网络',
        type: 'network'
    },
    {
        name: 'JavaScript',
        type: 'javascript'
    },
    {
        name: 'NodeJs',
        type: 'nodejs'
    }
]);

function getElementPosition(element: HTMLElement) {
    const { left, top, width, height } = element.getBoundingClientRect();
    return {
        left,
        top,
        width,
        height
    };
}
function raf(callback: () => void) {
    requestAnimationFrame(() => {
        requestAnimationFrame(callback);
    });
}

const changeElementPosition = () => {
    if (!flipRef.value) {
        return;
    }

    // First: 记录所有元素的初始位置
    const elements = Array.from(flipRef.value.children) as HTMLElement[];
    const firstPositions = new Map();

    elements.forEach((element) => {
        firstPositions.set(element, getElementPosition(element));
    });

    // 随机排序数组 (Fisher-Yates洗牌算法)
    for (let i = list.value.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list.value[i], list.value[j]] = [list.value[j], list.value[i]];
    }

    raf(() => {
        if (!flipRef.value) return;

        // Last: 记录所有元素的新位置
        const newElements = Array.from(flipRef.value.children) as HTMLElement[];

        newElements.forEach((element) => {
            const lastPosition = getElementPosition(element);
            const firstPosition = firstPositions.get(element);

            if (firstPosition) {
                // Invert: 计算反向变换
                const invertX = firstPosition.left - lastPosition.left;
                const invertY = firstPosition.top - lastPosition.top;

                // 应用反向变换，使元素看起来还在原来的位置
                element.style.transition = 'none';
                element.style.transform = `translate(${invertX}px, ${invertY}px)`;
            }
        });

        // 触发重排
        flipRef.value.offsetHeight;

        // Play: 播放动画到新位置
        newElements.forEach((element) => {
            element.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
            element.style.transform = 'translate(0, 0)';
        });

        // 动画结束后清除样式
        newElements.forEach((element) => {
            const cleanUp = () => {
                element.style.transition = '';
                element.style.transform = '';
                element.removeEventListener('transitionend', cleanUp);
            };
            element.addEventListener('transitionend', cleanUp);
        });
    });
};
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
