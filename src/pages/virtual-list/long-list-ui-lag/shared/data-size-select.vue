<template>
    <!-- 将文字和 select 关联，点击“数据规模”也能聚焦选择框。 -->
    <label class="data-size-control" :for="inputId">
        <!-- 控件的可访问名称。 -->
        <span>数据规模</span>
        <!-- 使用受控 value，变化时同时更新 v-model 并通知页面重建数据。 -->
        <select :id="inputId" :value="modelValue" @change="handleChange">
            <!-- 两个演示页面使用同一组规模选项，避免配置漂移。 -->
            <option v-for="size in DATA_SIZE_OPTIONS" :key="size" :value="size">
                {{ size.toLocaleString() }}
            </option>
        </select>
    </label>
</template>

<script setup lang="ts">
import { DATA_SIZE_OPTIONS } from './demo-data';

defineProps<{
    /** select 的 DOM id，保证同一页面存在多个控件时仍然唯一。 */
    inputId: string;
    /** 父组件通过 v-model 传入的当前数据规模。 */
    modelValue: number;
}>();

const emit = defineEmits<{
    /** v-model 标准更新事件。 */
    'update:modelValue': [value: number];
    /** 让页面执行数据和虚拟模型重建的业务事件。 */
    change: [value: number];
}>();

/** 把原生 select 字符串值转换成数字，再依次发出状态和业务事件。 */
const handleChange = (event: Event) => {
    // HTMLSelectElement.value 永远是字符串，因此显式转换为 number。
    const value = Number((event.currentTarget as HTMLSelectElement).value);
    // 先同步 v-model，保证父页面 selectedSize 与事件参数一致。
    emit('update:modelValue', value);
    // 再通知父页面按新规模重新生成数据。
    emit('change', value);
};
</script>

<style scoped>
/* 让标签和选择框在同一行垂直居中。 */
.data-size-control {
    display: inline-flex;
    align-items: center;
    gap: 10px;
}

/* 统一两个页面中数据规模选择框的尺寸和视觉样式。 */
select {
    min-height: 34px;
    padding: 0 12px;
    border: 1px solid #cbd2da;
    border-radius: 4px;
    color: #172033;
    background: #fff;
}
</style>
