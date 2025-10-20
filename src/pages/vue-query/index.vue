<template>
	<div class="vue-query">
		<div v-if="isLoading">
			<a-spin size="large" />
		</div>
		<div v-else-if="data">
			<p>title: {{ data.title }}</p>
			<p>description: {{ data.description }}</p>
			<Button @click="update">更新</Button>
		</div>
	</div>
</template>
<script setup lang="ts" name="vueQuery">
	import { ref, toRefs } from 'vue';
	import { useQuery } from 'vue-query';
	import { Button } from 'ant-design-vue';
	/**
	 * vue-query: https://blog.csdn.net/weixin_44438233/article/details/141750069
	 */

	const productId = ref(1);
	async function fetchProduct() {
		return await fetch(
			`https://dummyjson.com/products/${productId.value}`
		).then((res) => res.json());
	}

	// const {isLoading, data} = useQuery(
	// 	['product', productId.value],
	// 	// 'product',
	// 	fetchProduct,
	// 	{
	// 		refetchInterval: 2 * 1000,
	// 		refetchIntervalInBackground: true,
	// 		staleTime: 10 * 60 * 1000
	// 	}
	// );
	const store = useQuery({
		queryKey: ['product', productId.value],
		queryFn: fetchProduct,
		// refetchInterval: 2 * 1000,
		// refetchIntervalInBackground: true,
		staleTime: 10 * 60 * 1000
	});
	const { isLoading, isFetching, data, refetch } = toRefs(store);
	function update() {
		productId.value += 1;
		refetch.value();
	}
</script>

<style scoped lang="scss">
	@import url('./index.scss');
</style>


	