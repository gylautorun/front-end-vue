<template>
	<div class="child">
		<p class="error" v-html="markdown"></p>
		<p class="error" v-html="content"></p>
		<input type="text" :value="content" @input="updateContent" placeholder="请输入内容">
	</div>
</template>
<script setup lang="ts" name="Child">
	import {ref} from 'vue';
	const props = defineProps({
		content:{
			type: String,
			default: ''
		},
	});
	const emit = defineEmits(['update:content']);
	function updateContent(e: Event) {
		emit('update:content', (e.target as HTMLInputElement).value);
	}
	const content = `
	:value="content" === v-model="props.content"
	`;
	const markdown = `
	子组件 Child.vue定义了一个content prop 来接收父组件传来的数据，
	同时用defineEmits定义了一个名为update:content的事件。
	这里要注意的是，为了配合v-model，事件名必须是update:xxx的格式，
	其中xxx就是你要更新的 prop 的名字。当用户在输入框中输入时，
	updateContent函数被调用，通过emit('update:content', (e.target as HTMLInputElement).value)
	触发update:content 事件，把输入框的值传给父组件。
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
