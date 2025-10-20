<template>
	<div>
		切换布局
		<el-switch
			v-model="statusForShow"
			class="ml-2"
			active-color="#13ce66"
			inactive-color="#ff4949"
		/>
	</div>

	<div :class="{drag: dragging}">
		<div class="inner-container" :style="{'flex-direction': statusForShow ? 'column' : 'row'}">
			<div v-for="(item, key) in source" :key="key" :class="key">
				<vue-draggable
					v-bind="dragOptions"
					class="list-group"
					:list="item"
					:item-key="key"
					animation="500"
					@start="onStart"
					@end="onEnd"
				>
					<div v-for="element in item" :key="element.id">
						{{element.name}}
					</div>
					<template #header>
					</template>
					<!-- <template #item="{element, index}">
						<div class="content-box" :style="{flex: statusForShow ? element.flexStyle || 1 : 'none'}">
							<div style="display: flex;flex-direction: row">
								<div class="drag-handle" style="flex: 7">{{ element.title }}</div>
								<div style="flex: 1" @click="changeModel($event, key, element)">按钮</div>
							</div>
							<div class="component-box">
								<component :is="element.name" v-bind="element.data" :ref="`dragRef${index}`" :key="element.name"/>
							</div>
						</div>
					</template> -->
				</vue-draggable>
			</div>
		</div>
	</div>
</template>
<script lang="ts">
	import {
		Test1,
		Test2,
		Test3,
		Test4,
		Test5,
		Test6,
		Test7,
		Test8,
	} from '../components'

	export default {
		components: {
			Test1,
			Test2,
			Test3,
			Test4,
			Test5,
			Test6,
			Test7,
			Test8
		},
	};
</script>
<script setup lang="ts" name="dragContent">
	import VueDraggable from 'vuedraggable';
	import { computed, ref, reactive, onMounted, watchEffect, watch } from 'vue';

	// type ComponentType = typeof Test1 | typeof Test2 | typeof Test3 | typeof Test4 | typeof Test5 | typeof Test6 | typeof Test7 | typeof Test8;
	// type LayoutType = 'rowsLayout-left' | 'rowsLayout-middle' | 'rowsLayout-right';
	enum LayoutTypeEnum {
		RowsLayoutLeft = 'rowsLayout-left',
		RowsLayoutMiddle = 'rowsLayout-middle',
		RowsLayoutRight = 'rowsLayout-right',
	}
	type ILayout = {
		[key in LayoutTypeEnum]: string[];
	}
	interface IComponentItem {
		name: string;
		title: string;
		id: string;
		flexStyle?: number;
	}

	type ISourceType = Record<LayoutTypeEnum, IComponentItem[]>;
	
	const statusForShow = ref(true);
	const dragging = ref(false);
	const componentList = reactive<IComponentItem[]>([
		{
			name: 'Test1',
			title: '测试1',
			id: '1'
		},
		{
			name: 'Test2',
			title: '测试2',
			id: '2'
		},
		{
			name: 'Test3',
			title: '测试3',
			id: '3'
		},
		{
			name: 'Test4',
			title: '测试4',
			id: '4'
		},
		{
			name: 'Test5',
			title: '测试5',
			id: '5'
		},
		{
			name: 'Test6',
			title: '测试6',
			id: '6'
		},
		{
			name: 'Test7',
			title: '测试7',
			id: '7'
		},
		{
			name: 'Test8',
			title: '测试8',
			id: '8'
		}
	]);
	const layout = reactive<ILayout>({
		'rowsLayout-left': ['1', '2', '3'],
		'rowsLayout-middle': ['4', '5', '6'],
		'rowsLayout-right': ['7', '8'],
	});
	
	const source = reactive<ISourceType>({
		[LayoutTypeEnum.RowsLayoutLeft]: [],
		[LayoutTypeEnum.RowsLayoutMiddle]: [],
		[LayoutTypeEnum.RowsLayoutRight]: [],
	});
	const dragOptions = computed(() => {
		return {
			animation: 500,
			handle: '.drag-handle',
			group: 'description',
			ghostClass: 'ghost',
			chosenClass: 'sortable',
			forceFallback: true
		};
	});

	const changeModel = (e: {
		preventDefault: () => void;
		stopPropagation: () => void; },
		prop: string | number,
		ele: { name: string;
	}) => {
		e.preventDefault();
		e.stopPropagation();
		source[prop as LayoutTypeEnum].forEach((item: { name: any; flexStyle?: number; }) => {
			if (item.name === ele.name) {
				item.flexStyle = 2;
			}
		});
	};

	const onStart = () => {
		dragging.value = true;
	};
	const onEnd = () => {
		dragging.value = false;
		setLayout();
	};

	const getLayout = () => {
		const value = window.localStorage.getItem('dragLayout');
		let myLayout = JSON.parse(value as string) as ILayout;
		if (!myLayout || Object.keys(myLayout).length === 0 || !includes(myLayout)) {
			myLayout = layout;
		}
		const newLayout: ISourceType = ({
			[LayoutTypeEnum.RowsLayoutLeft]: [],
			[LayoutTypeEnum.RowsLayoutMiddle]: [],
			[LayoutTypeEnum.RowsLayoutRight]: [],
		});
		const valueKeys = Object.keys(myLayout) as LayoutTypeEnum[];
		for (const side of valueKeys) {
			if (myLayout[side].length > 0) {
				const temp = myLayout[side].map((i: string) => {
					return componentList.find(c => c.id === i)
				}).filter(Boolean);
				newLayout[side] = temp as IComponentItem[];
			}
		}
		Object.assign(source, newLayout);
		console.log(source);
	};

	const setLayout = () => {
		const res: any = {};
		for (const side in source) {
			res[side] = source[side as LayoutTypeEnum].map((i: {id: string;}) => i.id);
		}
		window.localStorage.setItem('dragLayout', JSON.stringify(res));
	}
	const includes = (prop: { [s: string]: unknown; } | ArrayLike<unknown>) => {
		const layoutArr = ['rowsLayout', 'columnsLayout', 'gridLayout'];
		const nowStr = Object.entries(prop)[0][0];
		const index = nowStr.indexOf('-');
		return index > -1 ? layoutArr.includes(nowStr.slice(0, index)) : false;
	}
	const changeLayout = (layouts: string) => {
		const newLayout: ISourceType = {
			[LayoutTypeEnum.RowsLayoutLeft]: [],
			[LayoutTypeEnum.RowsLayoutMiddle]: [],
			[LayoutTypeEnum.RowsLayoutRight]: [],
		};
		for (const key in source) {
			const aliasName = key.slice(key.indexOf('-'));
			const layoutName = layouts + aliasName;
			newLayout[layoutName as LayoutTypeEnum] = source[key as LayoutTypeEnum];
			delete source[key as LayoutTypeEnum];
		}

		Object.assign(source, newLayout);
	}
	watch(
		() => statusForShow.value,
		(visible) => {
			if (visible) {
				changeLayout('rowsLayout');
			}
			else {
				changeLayout('columnsLayout');
			}
		}
	);
	onMounted(() => {
		getLayout();
	});
</script>

<style scoped lang="scss">
	@import url('./index.scss');
</style>


	