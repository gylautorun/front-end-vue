<template>
	<div class="container">
	</div>
</template>

<script setup lang="ts" name="webSocket">
import { ref, computed, onMounted, onUnmounted, } from 'vue';
import {WebSocketClient} from './client/web-socket-client';
const wsRef = ref<WebSocketClient>();

onMounted(() => {
	// 有则先断开
	wsRef.value?.close();
	// 创建实例
	wsRef.value = new WebSocketClient('ws://localhost:3200');
	// 连接
	wsRef.value.connect();
	// 同原生方法
	wsRef.value.onclose(() => {
		console.log('onclose');
	});
	// 同原生方法
	wsRef.value.onerror((error: Error) => {
		console.log('onerror', error);
	});
	// 同原生方法
	wsRef.value.onmessage(() => {
		// 同原生方法
		wsRef.value?.send('自定义发送的数据');
	});
	// 同原生方法
	wsRef.value.onopen(() => {
		console.log('onopen');
	});
	
});

onUnmounted(() => {
	// 关闭连接
	wsRef.value?.close();
});

</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
