<template>
	<!-- 列表容器，监听滚动事件 -->
	<div
		class="fixed-height-container"
		ref="containerRef"
		@scroll="handleScroll"
	>
		<!-- 占位区域，用于模拟完整列表的高度 -->
		<div
			class="placeholder"
			:style="{height: `${containerHeight}px`}"
		></div>
		<!-- 实际渲染的内容，根据偏移量动态调整位置，因为上面这个滚动条展位容器采用的是定位，
			但是因为 .render-container 这个容器高度是不会变化的，永远只有5个元素这么高（如果只渲染5个可视元素）
			随着滚动，这个容器一个是在外层容器的顶部，不会进行偏移，所以需要使用便宜，让 .render-container 容器能正常移动到视口
		-->
		<div
			class="render-container"
			:style="{transform: `translate3D(0, ${offset}px, 0)`}"
		>
			<!-- 渲染的列表项 -->
			<div
				class="item"
				v-for="item in renderedItems"
				:key="item.id"
				:style="{ height: `${itemSize}px` }"
			>
				<h4>{{ item.title }}</h4>
				<div>{{ item.value }}</div>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts" name="fixedHeight">
	import { computed, onMounted, ref } from 'vue'
	import { IListItem, listData_default, listData_100 } from '../method';

	const itemSize = ref(100); // 每项的高度
	const bufferCount = ref(2); // 缓冲区大小
	const listData = ref<IListItem[]>(listData_default); // 列表数据，每项包含值和唯一标识符

	// 屏幕高度（用于计算可视区域的显示数量）
	const screenHeight = ref(0);
	// 当前滚动距离（顶部到当前可视区域顶部的距离）
	const scrollTop = ref(0)
	// 列表容器的引用，用于获取容器的实际高度
	const containerRef = ref<HTMLElement | null>(null);

	// 列表总数量
	const totalItemCount = computed(() => listData.value.length);

	// 列表容器的总高度，计算方法为：总数量 * 每项高度
	const containerHeight = computed(() => totalItemCount.value * itemSize.value);

	// 可视区域显示的数量，取决于容器高度和每项的高度（向上取整） Math.ceil(1.6) => 2
	const visibleCount = computed(() => {
		return Math.ceil(screenHeight.value / itemSize.value);
	});

	// 计算当前可视范围的顶部索引
	const topIndex = computed(() => {
		return Math.floor(scrollTop.value / itemSize.value);
	});

	// 当前滚动位置对应的起始索引
	const startIndex = computed(() => {
		return Math.max(0, topIndex.value - bufferCount.value);
	});

	// 当前滚动位置对应的结束索引，基于起始索引和可视数量
	const endIndex = computed(() => {
		return Math.min(
			totalItemCount.value,
			topIndex.value + visibleCount.value + bufferCount.value
		);
	});

	// 当前需要渲染的列表项，基于起始索引和结束索引
	const renderedItems = computed(() => {
		return listData.value.slice(startIndex.value, endIndex.value);
	});

	// 偏移位置，用于调整显示位置，使列表与滚动位置对齐
	const offset = computed(() => startIndex.value * itemSize.value);

	// 滚动事件处理函数，更新当前滚动位置
	const handleScroll = (e: Event) => {
		scrollTop.value = (e.target as HTMLElement).scrollTop;
	};

	// 组件挂载后，初始化屏幕高度
	onMounted(() => {
		screenHeight.value = containerRef.value?.clientHeight ?? 0;
	});

</script>

<style scoped lang="scss">
	@import url('./index.scss');
</style>


	