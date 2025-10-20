<template>
	<h2>props 通信: 父子组件通信</h2>
	<input type="text" v-model="message" placeholder="请输入内容" />
	<button @click="sendMessage">发送</button>
	<Child :msg="parentMsg" />
	<pre>{{ markdown }}</pre>
</template>
<script setup lang="ts" name="TransmitProps">
	import { ref } from 'vue';
	import Child from './child.vue';

	const markdown = `
		// 父组件 传递
		<Child :msg="parentMsg" />
		// 子组件 props 接收
		const props = defineProps({
			msg:{
				type: String,
				default: ''
			},
		});
	`;

	const message = ref('');
	const parentMsg = ref('父组件的初始化信息');
	function sendMessage(){
		parentMsg.value = message.value;
		message.value='';
	}
</script>

<style scoped lang="scss">
</style>



	