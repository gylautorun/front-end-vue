<template>
	<div
		class="scroll-load-list"
		ref="el"
	>
		<keep-alive>
			<div class="scroll-load-item" v-for="(item, index) in listData" :key="index">
				<div class="value">{{ item }}</div>
			</div>
		</keep-alive>
		<div class="loading" v-if="loading">加载中...</div>
	</div>
</template>

<script setup lang="ts" name="scroll-load-list">
	import { ref } from 'vue';
	import { useScrollList } from './use-scroll-list';

	const api = async (params: {
		pageNum: number
	}) => {
		return new Promise((resolve) => {
			setTimeout(() => {
				// 模拟API请求
				resolve({
					code: 200,
					data: {
						records: Array.from({ length: 20 }, (_, i) => `Item ${i + params.pageNum * 20}`),
					}
				});
			}, 1000);
		});
	};	

	const el = ref<HTMLElement | null>(null) // 滚动容器的ref

	const {listData, loading, handleSearch} = useScrollList(api, el, {}, {
		immediate: true
	});
</script>

<style scoped lang="scss">
	@import url('./index.scss');
</style>
