<template>
	<div class="computed">
		<a-table :columns="columns" :dataSource="data">
			<template #bodyCell="{ column, record }">
				<template v-if="column.key === 'name'">
					<span>{{ record.name }}</span>
				</template>
				<template v-if="column.key === 'price'">
					<span>{{ record.price }}</span>
				</template>
				<template v-if="column.key === 'count'">
					<div class="count">
						<a-button
							type="primary"
							shape="circle"
							:icon="h(PlusOutlined)"
							@click="record.count++"
						/>
						<span>{{ record.count }}</span>
						<a-button
							type="primary"
							danger shape="circle"
							:icon="h(MinusOutlined)"
							@click="record.count--"
						/>
					</div>
				</template>
				<template v-if="column.key === 'totalPrice'">
					<span>{{ totalPrice(record) }}</span>
				</template>
			</template>
		</a-table>
	</div>
</template>
<script setup lang="ts" name="computed">
	import { ref, reactive, h } from 'vue';
	import { PlusOutlined, MinusOutlined } from '@ant-design/icons-vue';
	interface DataType {
		name: string;
		price: number;
		count: number;
	}
	const data = reactive<DataType[]>([
		{
			name: 'iphone',
			price: 6889.99,
			count: 2,
		},
		{
			name: 'mac',
			price: 12999.66,
			count: 5,
		},
		{
			name: 'ipad',
			price: 5999.99,
			count: 3,
		},
		{
			name: 'watch',
			price: 3999.89,
			count: 7,
		},
		{
			name: 'airPods',
			price: 1299.99,
			count: 10,
		},
	]);
	const columns = [
		{
			title: '商品名称',
			dataIndex: 'name',
			key: 'name',
		},
		{
			title: '单价 (元)',
			dataIndex: 'price',
			key: 'price',
		},
		{
			title: '数量',
			dataIndex: 'count',
			key: 'count',
		},
		{
			title: '总价',
			dataIndex: 'totalPrice',
			key: 'totalPrice',
		},
	];

	function totalPrice(record: DataType) {
		console.log('computed');
		return (record.price * record.count).toFixed(2);
	}
</script>

<style scoped lang="scss">
	@import url('./index.scss');
</style>


	