<template>
    <div class="container">
        <header>
            <slot name="header"></slot>
        </header>
        <main>
            <slot></slot>
        </main>
        <footer>
            <slot name="footer"></slot>
        </footer>
    </div>
</template>

<script setup lang="ts">

</script>

<style scoped lang="scss">
header {
    background: #FF0000;
    color: #FFF;
}
footer {
    background: #CCC;
    color: #FFF;
}
</style>