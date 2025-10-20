<template>
    <tree :params="params"></tree>
</template>

<script lang="ts" setup component="CustomTreeOrg">
import { ref, onMounted } from 'vue';
import Tree from './tree/index.vue';
import {mitt} from '@/utils/event-mitt';
import { TreeData, TreeParams } from './tree/type';
import { apiMockPromise } from '@/utils/promise/mock-promise';
import {data as mockTreeData} from './mock/data';

const params = ref<TreeParams>({
	data: null,
});

onMounted(async () => {
	mitt.on('showTargetDetail', (data) => {
		console.log('Received target detail:', data);
	});
	const data = await apiMockPromise<TreeData>(
		mockTreeData.data,
		1.5
	);
	params.value.data = data;
});
</script>


<style scoped lang="scss">
	@import url('./index.scss');
</style>


	