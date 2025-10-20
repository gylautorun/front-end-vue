<template>
	<a-layout-content>
		<router-view v-slot="{ Component, route }">
			<transition appear name="fade-transform" mode="out-in">
				<div class="main-container">
					<keep-alive :include="keepAliveName">
						<component :is="Component" :key="route.fullPath" v-if="isRouterShow"></component>
					</keep-alive>
				</div>
			</transition>
		</router-view>
	</a-layout-content>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useGlobalStore } from '@/stores/modules/global';
import { useKeepAliveStore } from '@/stores/modules/keep-alive';

const globalStore = useGlobalStore();
const keepAliveStore = useKeepAliveStore();
const { keepAliveName } = storeToRefs(keepAliveStore);
// 刷新当前页面
const isRouterShow = computed(() => globalStore.refreshPage);
</script>

<style scoped lang="scss">
@import url("./index.scss");
.main-container {
	width: 100%;
	height: 100%;
}
</style>
