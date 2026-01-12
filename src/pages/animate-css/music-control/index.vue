<template>
    <div class="music-control"></div>
</template>
<script setup lang="ts" name="music-control">
import { ref } from 'vue';

// 方式1: 泛型语法配合 withDefaults（推荐）
// 优点：提供默认值, 类型更简洁, 编译时检验
const props = withDefaults(
    defineProps<{
        option: any;
        loading?: boolean;
    }>(),
    {
        option: () => ({}),
        loading: false
    }
);

// 方式2: 纯泛型语法（简洁但无默认值）
// 缺点：无法提供默认值, option 必须提供
// 优点：代码简洁
// const props = defineProps<{
//     option: ECOption
//     loading?: boolean
// }>()

// 方式3: 运行时声明方式（完整类型声明）
// 缺点：无法提供默认值, 类型更复杂, 编译时检验
//     - required: true 和 default: () => ({}) 不能同时使用
// 优点：代码较长
// const props = defineProps({
//     option: {
//         type: Object as PropType<ECOption>,
//         required: false,
//         default: () => ({})
//     },
//     loading: {
//         type: Boolean,
//         default: false
//     }
// })
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
