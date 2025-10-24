<template>
    <div class="global-control">
        <div class="control-header">
            <h4>🎯 布局控制</h4>
            <div class="current-status">
                <span class="status-item" :class="{ active: globalStore.showSider }">
                    <i class="icon">📋</i> 侧边栏
                </span>
                <span class="status-item" :class="{ active: globalStore.showHeader }">
                    <i class="icon">📄</i> 顶部
                </span>
                <span class="status-item" :class="{ active: globalStore.showFooter }">
                    <i class="icon">📝</i> 底部
                </span>
            </div>
        </div>

        <div class="control-content">
            <div class="button-group">
                <h5>单独控制</h5>
                <div class="button-row">
                    <a-button
                        size="small"
                        :type="globalStore.showSider ? 'primary' : 'default'"
                        @click="toggleSider()"
                    >
                        {{ globalStore.showSider ? '隐藏' : '显示' }} 侧边栏
                    </a-button>
                    <a-button
                        size="small"
                        :type="globalStore.showHeader ? 'primary' : 'default'"
                        @click="toggleHeader()"
                    >
                        {{ globalStore.showHeader ? '隐藏' : '显示' }} 顶部
                    </a-button>
                    <a-button
                        size="small"
                        :type="globalStore.showFooter ? 'primary' : 'default'"
                        @click="toggleFooter()"
                    >
                        {{ globalStore.showFooter ? '隐藏' : '显示' }} 底部
                    </a-button>
                </div>
            </div>

            <div class="button-group">
                <h5>预设模式</h5>
                <div class="button-row">
                    <a-button size="small" @click="setFullscreen()">全屏模式</a-button>
                    <a-button size="small" @click="setNoSider()">无侧边栏</a-button>
                    <a-button size="small" @click="setNoHeader()">无顶部</a-button>
                    <a-button size="small" @click="setNoFooter()">无底部</a-button>
                    <a-button size="small" type="primary" @click="resetLayout()">标准模式</a-button>
                </div>
            </div>

            <div class="button-group">
                <h5>快捷操作</h5>
                <div class="button-row">
                    <a-button size="small" @click="toggleAll()">切换全部</a-button>
                    <a-button size="small" @click="hideAll()">隐藏全部</a-button>
                    <a-button size="small" @click="showAll()">显示全部</a-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useGlobalStore } from '@/stores/modules/global';
import { setLayoutPreset, setLayoutState } from '@/router/guards/layout';

// 控制全局
const globalStore = useGlobalStore();

// 切换侧边栏显示
function toggleSider() {
    setLayoutState({ showSider: !globalStore.showSider });
    console.log('侧边栏状态:', globalStore.showSider);
}

// 切换顶部导航显示
function toggleHeader() {
    setLayoutState({ showHeader: !globalStore.showHeader });
    console.log('顶部导航状态:', globalStore.showHeader);
}

// 切换底部信息显示
function toggleFooter() {
    setLayoutState({ showFooter: !globalStore.showFooter });
    console.log('底部信息状态:', globalStore.showFooter);
}

// 重置布局到默认状态
function resetLayout() {
    setLayoutPreset('standard');
    console.log('布局已重置为标准模式');
}

// 设置为全屏模式
function setFullscreen() {
    setLayoutPreset('fullscreen');
    console.log('已设置为全屏模式');
}

// 设置为无侧边栏模式
function setNoSider() {
    setLayoutPreset('noSider');
    console.log('已设置为无侧边栏模式');
}

// 设置为无顶部导航模式
function setNoHeader() {
    setLayoutPreset('noHeader');
    console.log('已设置为无顶部导航模式');
}

// 设置为无底部信息模式
function setNoFooter() {
    setLayoutPreset('noFooter');
    console.log('已设置为无底部信息模式');
}

// 快捷操作函数
function toggleAll() {
    const allVisible = globalStore.showSider && globalStore.showHeader && globalStore.showFooter;
    setLayoutState({
        showSider: !allVisible,
        showHeader: !allVisible,
        showFooter: !allVisible
    });
    console.log('已切换全部布局组件');
}

function hideAll() {
    setLayoutPreset('fullscreen');
    console.log('已隐藏全部布局组件');
}

function showAll() {
    setLayoutPreset('standard');
    console.log('已显示全部布局组件');
}
</script>

<style scoped lang="scss">
.global-control {
    width: 320px;
    background: white;
    border-radius: 12px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.control-header {
    padding: 16px 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    h4 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
    }

    .current-status {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .status-item {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 4px 8px;
            background: rgba(255, 255, 255, 0.2);
            border-radius: 6px;
            font-size: 12px;
            transition: all 0.2s ease;

            &.active {
                background: rgba(255, 255, 255, 0.3);
                font-weight: 600;
            }

            .icon {
                font-size: 14px;
            }
        }
    }
}

.control-content {
    padding: 20px;
}

.button-group {
    margin-bottom: 20px;

    &:last-child {
        margin-bottom: 0;
    }

    h5 {
        margin: 0 0 12px 0;
        font-size: 14px;
        font-weight: 600;
        color: #333;
    }

    .button-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .ant-btn {
            font-size: 12px;
            height: 32px;
        }
    }
}

// 响应式设计
@media (max-width: 768px) {
    .global-control {
        width: 280px;
    }

    .control-content {
        padding: 16px;
    }

    .button-group .button-row {
        .ant-btn {
            font-size: 11px;
            height: 28px;
        }
    }
}
</style>
