<template>
    <h1>插槽 Slots</h1>
    <div class="container">
        <div class="title">demo1: 内容&出口 </div>
        <FancySlot />
    </div>
    <div class="container">
        <div class="title">demo2: 具名插槽 </div>
        <NamedSlot />
    </div>
    <div class="container">
        <div class="title">demo3: 条件插槽 </div>
        <ConditionalSlot />
    </div>
    <div class="container">
        <div class="title">demo4: 动态插槽名 </div>
        看官网 https://cn.vuejs.org/guide/components/slots.html#fallback-content
    </div>
    <div class="container">
        <div class="title">demo5: 作用域插槽 </div>
        <ScopeSlot />
    </div>
</template>

<script setup lang="ts">
    import FancySlot from './slots/fancy/slot.vue';
    import ScopeSlot from './slots/scope/slot.vue';
    import NamedSlot from './slots/named/slot.vue';
    import ConditionalSlot from './slots/conditional/slot.vue';
</script>

<style scoped lang="scss">
.container {
    border: 1px solid #CCC;
    padding: 10px;
    margin-bottom: 10px;
    .title {
        font-size: 16px;
        font-weight: bold;
        padding-bottom: 10px;
    }
}
</style>
