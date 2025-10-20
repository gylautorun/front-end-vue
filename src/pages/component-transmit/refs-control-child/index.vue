<template>
	<h2>refs直接操作子组件: refs 可以直接访问子组件的实例</h2>
	<button @click="showData">显示数据</button>
	<p>子组件数据: {{ childData }}</p>
	<p class="error" v-html="markdown"></p>
	<Child ref="control" />
</template>
<script setup lang="ts" name="RefsControlChild">
	import { ref } from 'vue';
	import Child from './child.vue';
	const control = ref<{
		getData?: () => string;
	}>({});
	const childData = ref('');
	function showData() {
		childData.value = control.value.getData?.() || '';
	}

	const markdown = `
	通过 ref="control" 给 Child 子组件标记了一个引用。当我们点击“显示数据”按钮时，
	showData 函数通过 control.value.getData() 直接调用了子组件的 getData 方法获取数据。
	这里我们访问了子组件 control 的内部方法。
	`;
</script>

<style scoped lang="scss">
	.error {
		color: red;
	}
</style>



	