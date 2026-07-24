<template>
	<a-layout-content :class="{ 'fullscreen-content': isFullscreenPage }">
		<router-view v-slot="{ Component, route }">
			<transition appear name="fade-transform" mode="out-in">
				<div class="main-container" :class="{ 'fullscreen-container': isFullscreenPage }">
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
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useGlobalStore } from '@/stores/modules/global';
import { useKeepAliveStore } from '@/stores/modules/keep-alive';

const globalStore = useGlobalStore();
const keepAliveStore = useKeepAliveStore();
const route = useRoute();
const { keepAliveName } = storeToRefs(keepAliveStore);
const isFullscreenPage = computed(() => route.meta?.layoutPreset === 'fullscreen');
// 刷新当前页面
const isRouterShow = computed(() => globalStore.refreshPage);
</script>

<style scoped lang="scss">
@import url("./index.scss");
.main-container {
	width: 100%;
	height: 100%;

	&.fullscreen-container {
		flex: 1;
		min-width: 0;
		min-height: 0;
		overflow: hidden;
	}
}
</style>
