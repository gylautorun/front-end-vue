<template>
    <button class="btn">
        <slot/>
	</button>
</template>

<script setup lang="ts">

</script>

<style scoped lang="scss">
.btn {
    color: #fff;
    background: linear-gradient(315deg, #42d392 25%, #647eff);
    border: none;
    padding: 5px 10px;
    margin: 5px;
    border-radius: 8px;
    cursor: pointer;
}
</style>