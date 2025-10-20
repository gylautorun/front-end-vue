<template>
	<div class="drag-api">
		<h1>课程表</h1>
		<div
			class="drag-container"
			@dragstart="handleDragStart"
			@dragend="handleDragEnd"
			@dragover="handleDragOver"
			@dragleave="handleDragLeave"
			@dragenter="handleDragEnter"
			@drop="handleDrop"
			ref="dragContainer"
		>
			<div class="drag-left" data-allowed="move">
				<div
					v-for="course in courseList"
					:key="course.id"
					class="drag-item"
					:style="{ backgroundColor: course.bgColor }"
					draggable="true"
					data-effect="copy"
				>
					{{course.name}}
				</div>
			</div>
			<div class="drag-right">
				<table>
					<colgroup>
						<col />
						<col v-for="week in weekList" :key="week.id" />
					</colgroup>
					<thead>
						<tr>
							<th></th>
							<th v-for="week in weekList" :key="week.id">
								{{week.name}}
							</th>
						</tr>
					</thead>
					<tbody>
						<!-- 上午课程 -->
						<tr class="time-slot"><td :rowspan="weekInfo.morning.length + 1">上午</td></tr>
						<tr v-for="tr in weekInfo.morning" :key="tr">
							<td v-for="week in weekList" :key="week.id" data-allowed="copy">
							</td>
						</tr>
						<tr class="gap"><td colspan="8"></td></tr>
						<!-- 下午课程 -->
						<tr class="time-slot"><td :rowspan="weekInfo.afternoon.length + 1">下午</td></tr>
						<tr v-for="tr in weekInfo.afternoon" :key="tr">
							<td v-for="week in weekList" :key="week.id" data-allowed="copy">
							</td>	
						</tr>
						<tr class="gap"><td colspan="8"></td></tr>
						<!-- 晚上课程 -->
						<tr class="time-slot"><td :rowspan="weekInfo.evening.length + 1">晚上</td></tr>
						<tr v-for="tr in weekInfo.evening" :key="tr">
							<td v-for="week in weekList" :key="week.id" data-allowed="copy">
							</td>	
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</div>
</template>
<script setup lang="ts" name="dragApi">
	import { ref } from 'vue';
	import { ICourseData, CourseData, WeekData, IWeekData } from './constant';

	type DragType = 'copy' | 'move';

	const dragContainer = ref<HTMLElement | null>(null);
	const courseList = ref<ICourseData[]>(CourseData);
	const weekList = ref<IWeekData[]>(WeekData);
	const weekInfo = ref<{
		morning: number[];
		afternoon: number[];
		evening: number[];
	}>({
		morning: [1, 2, 3, 4],
		afternoon: [1, 2, 3, 4],
		evening: [1, 2],
	});
	const dragEle = ref<HTMLElement | null>(null);

	function clearStyles() {
		dragContainer.value?.querySelectorAll('.drag-over').forEach((item) => {
			item.classList.remove('drag-over');
		});
	}
	function getAllowedParent(element: HTMLElement | null) {
		while (element) {
			if (element.dataset.allowed) {
				return element;
			}
			element = element.parentNode as HTMLElement;
		}
		return null;
	}

	const handleDragStart = (event: DragEvent) => {
		// 设置拖拽数据 copy move
		const element = event.target as HTMLElement;
		if (event.dataTransfer && element) {
			event.dataTransfer.effectAllowed = element.dataset.effect as DragType;
		}
		dragEle.value = element;
		// console.log('拖拽开始', event);
	};
	const handleDragEnd = (event: DragEvent) => {
		// console.log('拖拽结束', event);
	};
	const handleDragOver = (event: DragEvent) => {
		event.preventDefault(); // 阻止默认行为，允许放置
		// console.log('拖拽经过', event);
	};
	const handleDragLeave = (event: DragEvent) => {
		// console.log('拖拽离开', event);
	};
	const handleDragEnter = (event: DragEvent) => {
		clearStyles();
		const target = event.target as HTMLElement;
		const node = getAllowedParent(target);
		const source = dragEle.value;
		if (!node || !source) {
			return;
		}
		if (source.dataset.effect === node.dataset.allowed) {
			node.classList.add('drag-over');
		}
		// console.log('拖拽进入', event);
	};
	const handleDrop = (event: DragEvent) => {
		clearStyles();
		const node = getAllowedParent(event.target as HTMLElement);
		if (!node) {
			return;
		}
		const target = event.target as HTMLElement;
		const source = dragEle.value;
		if (!target || !source) {
			return;
		}
		if (source.dataset.effect !== node.dataset.allowed) {
			return;
		}
		
		if (node.dataset.allowed === 'copy') {
			node.innerHTML = '';
			const cloned = source.cloneNode(true) as HTMLElement;
			cloned.dataset.effect = 'move';
			node.appendChild(cloned);
		}
		else if (node.dataset.allowed === 'move') {
			source.remove();
		}
	};
</script>

<style scoped lang="scss">
	@import url('./index.scss');
</style>


	