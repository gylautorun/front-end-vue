<template>
    <div class="shadow-text">
        <div
            class="shadow-text-item"
            v-for="item in list"
            :key="item.template"
            :class="item.template"
        >
            <h2>{{ item.title }}</h2>
            <div class="value">
                <p v-if="Array.isArray(item.value)">
                    <span
                        v-for="(char, index) in item.value"
                        :key="index"
                        :class="[`neon-light-text-item-${index}`]"
                    >
                        {{ char }}
                    </span>
                </p>
                <!-- 普通文本直接渲染 -->
                <span v-else>{{ item.value }}</span>
            </div>
        </div>
        <div class="shadow-text-item color-list">
            <h2>颜色</h2>
            <div class="value">
                <span v-for="color in colorList" :key="color">
                    {{ color }}
                </span>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts" name="shadow-text">
import { ref } from 'vue';

const list = ref([
    {
        title: '长阴影文字效果',
        template: 'long-shadow-text',
        value: '长阴影文字效果 (Long Shadow Text)'
    },
    {
        title: '立体阴影文字效果',
        template: 'deep-shadow-text',
        value: '立体阴影文字效果 (Deep Shadow Text)'
    },
    {
        title: '内嵌阴影文字效果',
        template: 'inset-shadow-text',
        value: '内嵌阴影文字效果 (Inset Shadow Text)'
    },
    {
        title: '多级阴影文字效果',
        template: 'multi-level-shadow-text',
        value: '多级阴影文字效果 (Multilevel Shadow Text)'
    },
    {
        title: '复古阴影文字效果',
        template: 'retro-shadow-text',
        value: '复古阴影文字效果 (Retro Shadow Text)'
    },
    {
        title: '氖光效果',
        template: 'neon-text',
        value: '氖光效果 (Neon)'
    },
    {
        title: '氖光悬停效果',
        template: 'neon-hover-text',
        value: '氖光悬停效果 (Neon Hover Text)'
    },
    {
        title: '渐进的亮灯效果',
        template: 'neon-light-text',
        value: ['渐', '进', '的', '亮', '灯', '效', '果', ' (', 'Neon', ')']
    }
]);

const colorList = ref(['RED', 'BLUE', 'YELLOW', 'GREEN', 'ORANGE', 'VIOLET']);
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
