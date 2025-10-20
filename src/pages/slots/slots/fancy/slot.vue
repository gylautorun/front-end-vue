<template>
    <Button>
        Click me
    </Button>
    <Button>
        <span style="color:cyan">Click me! </span>
        <Awesome />
    </Button>
</template>

<script setup lang="ts">
    import Button from './button.vue';
    import Awesome from './awesome.vue';
</script>

<style scoped lang="scss">
</style>