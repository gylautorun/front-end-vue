<template>
	<div class="canvas-demo">
		<button @click="makeWorker">开始绘图</button>
		<div>绘图完成：{{ result.finished }}</div>
		<div>
			<canvas ref="refCanvas" width="300" height="150"></canvas>
		</div>
	</div>
</template>

<script setup lang="ts" name="workerCanvas">
	import { reactive, ref } from 'vue';
	import { IWorkerEvent } from '../type';
	import CanvasWorker from '@/pages/web-worker/worker/canvas-worker.ts?worker';

	const result = reactive<{
		finished: string;
	}>({
		finished: '未完成绘图',
	});

	const refCanvas = ref<HTMLCanvasElement | null>(null);
	const makeWorker = () => {
		// const url = 
		const worker = new CanvasWorker();
		// const worker = new Worker(
		// 	new URL('../worker/canvas-worker.ts', import.meta.url),
		// 	{ type: 'module' }
		// );
		// 使用canvas的transferControlToOffscreen函数获取一个OffscreenCanvas对象
		if (!refCanvas.value) {
			return;
		};
		const offscreen = refCanvas.value.transferControlToOffscreen();
		// 注意：第二个参数不能省略
		void worker.postMessage({canvas: offscreen}, [offscreen]);

		worker.onmessage = (e: IWorkerEvent<string>) => {
			result.finished = e.data;
		};
    };
</script>

<style scoped lang="scss">
	@import url('./index.scss');
</style>

