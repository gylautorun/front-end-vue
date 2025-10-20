<template>
    <Comp api-url="url" :per-page="10">
        <template #item="{body, username, likes}">
            <div class="item">
                <p>{{ body }}</p>
                <p class="meta">by {{ username }} | {{ likes }} likes</p>
            </div>
        </template>
    </Comp>
</template>

<script setup lang="ts">
    import Comp from './comp.vue';
</script>

<style scoped lang="scss">
.meta {
    font-size: 0.8em;
    color: #42b883;
}
</style>