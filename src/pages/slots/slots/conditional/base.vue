<template>
    <div class="container">
        <div v-if="$slots.header" class="container-header">
            <slot name="header" />
        </div>
        
        <div v-if="$slots.default" class="container-content">
            <slot />
        </div>
        
        <div v-if="$slots.footer" class="container-footer">
            <slot name="footer" />
        </div>
    </div>
</template>

<script setup lang="ts">

</script>

<style scoped lang="scss">
.container {
    border: 1px solid black;
    padding: 0;
}

.container-header {
    background-color: skyblue;
    padding: 4px;
}

.container-content {
    padding: 4px;
}

.container-footer {
    background-color: lightgray;
    padding: 4px;
}
</style>