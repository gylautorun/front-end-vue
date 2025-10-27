<template>
    <div class="floating-layout-controller" v-if="showController">
        <a-popover
            v-model:open="isPanelOpen"
            placement="topRight"
            trigger="hover"
            :overlay-style="{ padding: 0 }"
            :arrow="false"
            overlay-class-name="floating-layout-popover"
        >
            <template #content>
                <GlobalControl />
            </template>

            <!-- 悬浮小球 -->
            <div class="floating-ball" :class="{ active: isPanelOpen }">
                <div class="ball-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path
                            fill="currentColor"
                            d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z"
                        />
                    </svg>
                </div>
            </div>
        </a-popover>
    </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGlobalStore } from '@/stores/modules/global';
import GlobalControl from '@/components/global-control/index.vue';

// 控制面板显示状态
const isPanelOpen = ref(false);

// 全局状态
const globalStore = useGlobalStore();

// 是否显示控制器（可以根据需要控制显示条件）
const showController = computed(() => {
    // 这里可以添加条件，比如只在特定页面显示
    // 或者添加用户设置来控制是否显示
    return true;
});
</script>

<style scoped lang="scss">
.floating-layout-controller {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.floating-ball {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;

    &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.2);
    }

    &.active {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        transform: scale(1.05);
    }

    .ball-icon {
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s ease;
    }

    &:hover .ball-icon {
        transform: rotate(180deg);
    }
}

// 响应式设计
@media (max-width: 768px) {
    .floating-layout-controller {
        bottom: 15px;
        right: 15px;
    }

    .floating-ball {
        width: 48px;
        height: 48px;

        .ball-icon {
            width: 18px;
            height: 18px;
        }
    }
}
</style>

<style>
/* 全局样式，用于自定义 Popover */
.floating-layout-popover {
    .ant-popover-inner {
        padding: 0;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(0, 0, 0, 0.05);
    }

    .ant-popover-content {
        border-radius: 12px;
    }

    .ant-popover-arrow {
        display: none;
    }
}
</style>
