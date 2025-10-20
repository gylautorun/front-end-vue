<template>
    <div>
        <header>
            <slot name="header" message="Header"></slot>
        </header>
        <main>
            <slot :message="mainMessage"></slot>
        </main>
        <footer>
            <slot name="footer" message="Footer"></slot>
        </footer>
    </div>
</template>

<script setup lang="ts">
    const mainMessage = 'Main';
</script>

<style scoped lang="scss">

</style>