<template>
	<div class="child">
		<p class="error" v-html="markdown"></p>
		<input type="text" v-model="data" />
	</div>
</template>
<script setup lang="ts" name="Child">
	import {ref } from 'vue';
	const data = ref('子组件的数据');
	function getData() {
		return data.value;
	}
	defineExpose({
		getData
	});

	const markdown = `
	子组件通过 defineExpose 暴露了一个 getData 方法。这样父组件才能通过 refs 访问到这个方法。通过这个方法把 data 共享出去
	`;
</script>

<style scoped lang="scss">
	.child{
		margin-top: 20px;
		border: 1px solid #CCC;
		padding: 10px;
	}
	input {
		width: 100%;
	}
	.error {
		color: red;
	}
</style>
