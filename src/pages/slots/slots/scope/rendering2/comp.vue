<template>
    <div>
        <slot :text="message" :count="1"></slot>
    </div>
</template>

<script setup lang="ts">
    const message = 'Hello from button';
</script>

<style scoped lang="scss">

</style>