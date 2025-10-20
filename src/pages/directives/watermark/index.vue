<template>
	<div class="container" v-waterMarker="{ text: 'GuYue Admin', textColor: 'rgba(180, 180, 180, 0.6)' }">
		<a-alert class="w-100 mb-20" message="水印指令 🍇🍇🍇🍓🍓🍓" type="info" />
	</div>
</template>

<script setup lang="ts" name="watermarkDirect"></script>

<style scoped lang="scss">
.container {
	min-height: 50vh;
}
</style>
