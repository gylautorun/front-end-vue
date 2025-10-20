<template>
	<h2>子组件向父组件传递: $emit 触发自定义事件</h2>
	<div>
		<p>子组件传递信息:</p>
		<ul>
			<li v-for="(item, index) in message" :key="index">{{ item }}</li>
		</ul>
	</div>
	<Child @handler="handleInfo" />
	<pre>{{ markdown }}</pre>
</template>
<script setup lang="ts" name="ChildToParent">
	import { ref } from 'vue';
	import Child from './child.vue';
	const message = ref<string[]>([]);
	function handleInfo(value: string){
		message.value.push(value);
	}

	const markdown = `
		// 父组件 传递 handleInfo 函数给子组件
		<Child @handler="handleInfo" />
		const message = ref<string[]>([]);
		function handleInfo(value: string){
			message.value.push(value);
		}

		// 子组件 发送给父组件
		const emit = defineEmits(['handler']);
		function onHandler() {
			emit('handler', msg.value);
		}
	`;
</script>

<style scoped lang="scss">
</style>



	