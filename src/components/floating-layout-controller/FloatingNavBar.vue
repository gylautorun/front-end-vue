<template>
    <!-- 全屏模式下顶部悬浮导航栏：默认 40% 透明度，hover 时 100% -->
    <nav v-show="isFullscreenMode" class="floating-nav-bar" aria-label="全屏导航">
        <div class="floating-nav-bar__inner">
            <a-menu
                v-model:selectedKeys="activeMenu"
                mode="horizontal"
                theme="dark"
                class="floating-nav-menu"
            >
                <template v-for="subItem in menuList" :key="subItem.name">
                    <a-sub-menu
                        v-if="subItem.children && subItem.children.length > 0"
                        :key="subItem.path"
                    >
                        <template #icon>
                            <component :is="subItem.meta.icon" v-if="subItem.meta?.icon" />
                        </template>
                        <template #title>
                            <span>{{ subItem.meta.title }}</span>
                        </template>
                        <SubMenu :menuList="subItem.children" />
                    </a-sub-menu>
                    <a-menu-item
                        v-else
                        :key="subItem.path + ''"
                        @click="handleClickMenu(subItem)"
                    >
                        <template #icon>
                            <component :is="subItem.meta.icon" v-if="subItem.meta?.icon" />
                        </template>
                        <span>{{ subItem.meta.title }}</span>
                    </a-menu-item>
                </template>
            </a-menu>

            <a-button
                type="text"
                size="small"
                class="exit-btn"
                title="退出全屏"
                @click="handleExitFullscreen"
            >
                <template #icon><FullscreenExitOutlined /></template>
            </a-button>
        </div>
    </nav>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useGlobalStore } from '@/stores/modules/global';
import { useAuthStore } from '@/stores/modules/auth';
import { FullscreenExitOutlined } from '@ant-design/icons-vue';
import { setLayoutPreset } from '@/router/guards/layout';
import SubMenu from '@/layout/components/menu/sub-menu.vue';
import { Menu } from '@/types/global';

const router = useRouter();
const route = useRoute();
const globalStore = useGlobalStore();
const authStore = useAuthStore();
const activeMenu = ref<string[]>([]);

const isFullscreenMode = computed(() => {
    if (globalStore.layoutModified) {
        return !globalStore.showSider && !globalStore.showHeader && !globalStore.showFooter;
    }
    const showSider =
        route.meta?.showSider !== undefined ? route.meta.showSider : globalStore.showSider;
    const showHeader =
        route.meta?.showHeader !== undefined ? route.meta.showHeader : globalStore.showHeader;
    const showFooter =
        route.meta?.showFooter !== undefined ? route.meta.showFooter : globalStore.showFooter;
    return !showSider && !showHeader && !showFooter;
});

const menuList = computed(() => authStore.showMenuListGet);

watchEffect(() => {
    const key = route.meta.activeMenu ? route.meta.activeMenu : route.path;
    activeMenu.value = [key + ''];
});

function handleClickMenu(subItem: Menu.MenuOptions) {
    if (subItem.meta.isLink) return window.open(subItem.meta.isLink, '_blank');
    router.push(subItem.path);
}

function handleExitFullscreen() {
    setLayoutPreset('standard');
}
</script>

<style scoped lang="scss">
.floating-nav-bar {
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    max-width: calc(100vw - 32px);
    opacity: 0.4;
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        opacity: 1;
    }

    &__inner {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px 4px 4px;
        background: rgba(0, 21, 41, 0.85);
        backdrop-filter: blur(12px);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
    }
}

.floating-nav-menu {
    flex: 1;
    min-width: 0;
    background: transparent !important;
    border-bottom: none !important;
    line-height: 40px;

    :deep(.ant-menu-item),
    :deep(.ant-menu-submenu-title) {
        padding-inline: 12px;
    }
}

.exit-btn {
    flex-shrink: 0;
    color: rgba(255, 255, 255, 0.75);

    &:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.1) !important;
    }
}

@media (max-width: 768px) {
    .floating-nav-bar {
        top: 8px;
        max-width: calc(100vw - 16px);

        &__inner {
            padding: 2px 4px 2px 2px;
        }

        .floating-nav-menu {
            line-height: 36px;

            :deep(.ant-menu-item),
            :deep(.ant-menu-submenu-title) {
                padding-inline: 8px;
                font-size: 12px;
            }
        }
    }
}
</style>
