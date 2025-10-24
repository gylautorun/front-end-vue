<template>
    <a-layout class="antd-layout">
        <a-layout-sider
            v-if="shouldShowSider"
            v-model:collapsed="collapsed"
            collapsible
            class="antd-sider"
        >
            <div class="logo" />
            <a-menu
                class="antd-menu-wrapper"
                v-model:selectedKeys="selectedKeys"
                mode="inline"
                theme="dark"
                :items="items"
                @click="handleClick"
            ></a-menu>
        </a-layout-sider>
        <a-layout>
            <a-layout-header v-if="shouldShowHeader" class="antd-header"> Header </a-layout-header>
            <a-layout-content class="main-wrapper">
                <!-- <a-breadcrumb style="margin: 16px 0">
                    <a-breadcrumb-item>User</a-breadcrumb-item>
                    <a-breadcrumb-item>Bill</a-breadcrumb-item>
                </a-breadcrumb> -->
                <div class="main-content">
                    <MainAntd />
                </div>
            </a-layout-content>
            <a-layout-footer v-if="shouldShowFooter" class="antd-footer">
                Ant Design ©2018 Created by Ant UED
            </a-layout-footer>
        </a-layout>
    </a-layout>
</template>

<script setup lang="ts" name="layoutTransverse">
import { ref, computed, watchEffect, watch, reactive, h } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { menuRoutes, firstRoute } from '@/router/pages';
import type { MenuProps } from 'ant-design-vue';
import { useAuthStore } from '@/stores/modules/auth';
import SubMenu from '@/layout/components/menu/sub-menu.vue';
import MainAntd from '@/layout/components/main/antd.vue';
import { getMenuList } from './util-menu';
import { validateBoolean } from '@/utils/util-normal';

const items = reactive(getMenuList(menuRoutes));

const selectedKeys = ref<string[]>([]);
const collapsed = ref<boolean>(false);

const route = useRoute();
const authStore = useAuthStore();
const router = useRouter();

// 根据路由元数据控制布局组件显示
const shouldShowSider = computed(() => {
    return route.meta?.showSider;
});

const shouldShowHeader = computed(() => {
    return route.meta?.showHeader;
});

const shouldShowFooter = computed(() => {
    return route.meta?.showFooter;
});

const handleClick: MenuProps['onClick'] = (e: any) => {
    console.log(e.key);
    router.push(e.key);
};

// 或者路由守卫里面 结合 pinia 处理
watch(
    () => route.path,
    (newPath, oldPath) => {
        selectedKeys.value = [newPath];
    },
    { immediate: true }
);
// watchEffect(() => {
// });
</script>

<style scoped lang="scss">
@import url('./index.scss');
</style>
