<template>
	<h2>v-model 实现数据双向绑定: 父子组件共享同步数据</h2>
	<p>父组件内容: {{message}}</p>
	<p class="error" v-html="markdown"></p>
	<Child v-model:content="message" />
</template>
<script setup lang="ts" name="VModelBind">
	import { ref } from 'vue';
	import Child from './child.vue';
	const message = ref('初始内容');
	const markdown = `
	这里 v-model:content="message" 把父组件的 message 变量和子组件 Child 的 content prop 进行了双向绑定。
	这意味着任何一方对 content 的修改，都会同步到另一方。
	`;
</script>

<style scoped lang="scss">
	.error {
		color: red;
	}
</style>



	