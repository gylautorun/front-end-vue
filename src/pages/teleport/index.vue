<template>
	<Teleport to="body">
		<div v-if="open" class="teleport-modal">
			<p class="text">这是一个 teleport 模态框 示例: dom 挂载到了 body 节点上</p>
			<Button @click="open = false">Close</Button>
		</div>
	</Teleport>
	<Teleport to="#app">
		<div v-if="visible" class="teleport-modal">
			<p class="text">这是一个 teleport 模态框 示例: dom 挂载到了 #app 节点上</p>
			<Button @click="visible = false">Close</Button>
		</div>
	</Teleport>
	<Button @click="open = true">Open Modal to Body</Button>
	<Button @click="visible = true">Open Modal to #app</Button>
</template>
<script setup lang="ts" name="teleport">
	import { ref } from 'vue';
	import {Button} from 'ant-design-vue';
	const open = ref(false);
	const visible = ref(false);

</script>

<style scoped lang="scss">
	@import url('./index.scss');
</style>


	