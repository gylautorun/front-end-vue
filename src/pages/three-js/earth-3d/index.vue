<template>
	<div class="earth-3d">
		<h3>Three.js - 实现一个简单的3D地球可视化</h3>
		<canvas ref="canvasRef" class="canvas" width="1200" height="800"></canvas>
	</div>
</template>
<script setup lang="ts" name="Earth3d">
	import { ref, onMounted } from 'vue';
	import {Earth3D} from './earth';
	const canvasRef = ref<HTMLCanvasElement | null>(null);

	onMounted(() => {
		if (canvasRef.value) {
			const earth = new Earth3D({
				canvas: canvasRef.value,
			});
			earth.onload();
		}
	});
</script>

<style scoped lang="scss">
	@import url('./index.scss');
</style>


	