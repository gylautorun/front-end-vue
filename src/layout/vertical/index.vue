<template>
	<a-layout class="layout">
		<a-layout-sider
			v-model:collapsed="isCollapse"
			class="aside"
			:trigger="null"
			collapsible
			:theme="theme"
			:style="{ borderRight: theme === 'dark' ? '1px solid #001529' : '1px solid #f0f5ff' }"
		>
			<div class="menu" :style="{ width: isCollapse ? '70px' : '200px' }">
				<!-- logo -->
				<div class="logo flx-center">
					<img src="@/assets/images/logo.svg" alt="logo" />
					<span v-show="!isCollapse">gyl</span>
				</div>
				<!-- 菜单栏 -->
				<div class="scrollbar menu-scrollbar">
					<a-menu v-model:selectedKeys="activeMenu" :theme="theme" mode="inline">
						<SubMenu :menuList="menuList" />
					</a-menu>
				</div>
			</div>
		</a-layout-sider>
		<a-layout>
			<a-layout-header class="header">
				<ToolBarLeft />
				<ToolBarRight />
			</a-layout-header>
			<Main />
		</a-layout>
	</a-layout>
</template>

<script setup lang="ts" name="layoutVertical">
import { ref, computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';
import { useGlobalStore } from '@/stores/modules/global';
import { useAuthStore } from '@/stores/modules/auth';
import SubMenu from '@/layout/components/menu/sub-menu.vue';
import ToolBarLeft from '@/layout/components/header/toolbar-left.vue';
import ToolBarRight from '@/layout/components/header/toolbar-right.vue';
import Main from '@/layout/components/main/index.vue';

const route = useRoute();
const authStore = useAuthStore();
const globalStore = useGlobalStore();
const activeMenu = ref<Array<string>>([]);
const isCollapse = computed(() => globalStore.isCollapse);
const menuList = computed(() => authStore.showMenuListGet);
const theme = computed(() => {
	return globalStore.styleSetting === 'realDark' ? 'dark' : globalStore.styleSetting;
});

watchEffect(() => {
	let key = route.meta.activeMenu ? route.meta.activeMenu : route.path;
	activeMenu.value = [key + ''];
});
</script>

<style scoped lang="scss">
	@import url("./index.scss");
</style>
