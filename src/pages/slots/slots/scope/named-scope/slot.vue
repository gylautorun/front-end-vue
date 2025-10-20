<template>
    <Comp>
        <template #header="headerProps">
            {{ headerProps }}
        </template>

        <template #default="defaultProps">
            {{ defaultProps }}
        </template>

        <template #footer="{message}">
            {{ message }}
        </template>
    </Comp>
</template>

<script setup lang="ts">
    import Comp from './comp.vue';
</script>

<style scoped lang="scss">
.text {
    color: red;
}
.count {
    color: blue;
}
</style>