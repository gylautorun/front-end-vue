<template>
    <Base>
        <template #header>
            <h1>这是 Header</h1>
        </template>
        <template #default>
            <p>这是 content.</p>
            <p>And another one.</p>
        </template>
        <template #footer>
            <h1>这是 Footer</h1>
        </template>
    </Base>
</template>

<script setup lang="ts">
    import Base from './base.vue';
</script>

<style scoped lang="scss">
</style>