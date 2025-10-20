<template>
    <div class="container">
        <div class="title">渲染作用域: 插槽的内容无法访问到子组件的状态</div>
        <RenderingSlot />
    </div>
    <div class="container">
        <div class="title">渲染作用域: 插槽的内容访问到子组件的状态</div>
        <Rendering2Slot />
    </div>
    <div class="container">
        <div class="title">具名作用域插槽</div>
        <NamedScopeSlot />
    </div>
    <div class="container">
        <div class="title">高级列表组件示例</div>
        <AdvancedListSlot />
    </div>
    <div class="container">
        <div class="title">无渲染组件</div>
        <NoRenderingSlot />
    </div>
</template>

<script setup lang="ts">
    import RenderingSlot from './rendering/slot.vue';
    import Rendering2Slot from './rendering2/slot.vue';
    import NamedScopeSlot from './named-scope/slot.vue';
    import AdvancedListSlot from './advanced-list/slot.vue';
    import NoRenderingSlot from './no-rendering/slot.vue';
</script>

<style scoped lang="scss">
.container {
    border: 1px solid #CCC;
    padding: 10px;
    margin-bottom: 10px;
    .title {
        font-size: 16px;
        font-weight: bold;
    }
}
</style>