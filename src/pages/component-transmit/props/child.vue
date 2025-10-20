<template>
	<div class="child">
		<p>父组件传递来的信息：{{msg}}</p>
		<ul>
			<li v-for="item in msgList" :key="item">{{ item }}</li>
		</ul>
	</div>
</template>
<script setup lang="ts" name="Child">
	import { ref, watch } from 'vue';
	const props = defineProps({
		msg:{
			type: String,
			default: ''
		},
	});
	const msgList = ref(['苹果', '香燕', '橘子']);
	watch(() => props.msg, (newMsg) => {
		if(newMsg){
			msgList.value.push(newMsg);
		}
	});
</script>

<style scoped lang="scss">
	.child{
		margin-top: 20px;
		border: 1px solid #CCC;
		padding: 10px;
	}
</style>
