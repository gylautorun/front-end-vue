import { Router } from 'vue-router';
import { useGlobalStore } from '@/stores/modules/global';

// 布局预设配置
export const LAYOUT_PRESETS = {
    // 全屏模式 - 隐藏所有布局组件
    fullscreen: {
        showSider: false,
        showHeader: false,
        showFooter: false
    },
    // 仅内容模式 - 只显示内容区域
    contentOnly: {
        showSider: false,
        showHeader: false,
        showFooter: false
    },
    // 标准模式 - 显示所有布局组件
    standard: {
        showSider: true,
        showHeader: true,
        showFooter: true
    },
    // 无侧边栏模式
    noSider: {
        showSider: false,
        showHeader: true,
        showFooter: true
    },
    // 无顶部导航模式
    noHeader: {
        showSider: true,
        showHeader: false,
        showFooter: true
    },
    // 无底部信息模式
    noFooter: {
        showSider: true,
        showHeader: true,
        showFooter: false
    }
} as const;

export type LayoutPreset = keyof typeof LAYOUT_PRESETS;

/**
 * 布局控制路由守卫
 * 根据路由元数据自动设置全局布局状态
 */
export function setupLayoutGuard(router: Router) {
    router.beforeEach((to, from, next) => {
        const globalStore = useGlobalStore();

        // 获取路由元数据
        const meta = to.meta as any;

        // 获取布局预设配置（如果存在）
        const presetConfig =
            meta.layoutPreset && LAYOUT_PRESETS[meta.layoutPreset as LayoutPreset]
                ? LAYOUT_PRESETS[meta.layoutPreset as LayoutPreset]
                : { showSider: undefined, showHeader: undefined, showFooter: undefined };

        // 具体的布局控制字段优先级更高，会覆盖预设值
        const finalConfig = {
            showSider: meta.showSider !== undefined ? meta.showSider : presetConfig.showSider,
            showHeader: meta.showHeader !== undefined ? meta.showHeader : presetConfig.showHeader,
            showFooter: meta.showFooter !== undefined ? meta.showFooter : presetConfig.showFooter
        };

        // 如果最终配置中有任何值，使用最终配置
        if (
            finalConfig.showSider !== undefined ||
            finalConfig.showHeader !== undefined ||
            finalConfig.showFooter !== undefined
        ) {
            if (finalConfig.showSider !== undefined) {
                globalStore.setGlobalState('showSider', finalConfig.showSider);
            }
            if (finalConfig.showHeader !== undefined) {
                globalStore.setGlobalState('showHeader', finalConfig.showHeader);
            }
            if (finalConfig.showFooter !== undefined) {
                globalStore.setGlobalState('showFooter', finalConfig.showFooter);
            }
            // 标记为已修改（路由守卫设置的不算动态修改）
            globalStore.setGlobalState('layoutModified', false);
        }
        // 如果都没有定义，使用默认配置
        else {
            // 可以根据路由路径或其他条件设置默认布局
            const defaultLayout = getDefaultLayoutForRoute(to.path);
            globalStore.setGlobalState('showSider', defaultLayout.showSider);
            globalStore.setGlobalState('showHeader', defaultLayout.showHeader);
            globalStore.setGlobalState('showFooter', defaultLayout.showFooter);
        }

        next();
    });
}

/**
 * 根据路由路径获取默认布局配置
 */
function getDefaultLayoutForRoute(path: string) {
    // 可以根据路径模式设置不同的默认布局
    if (path.includes('/data-visualization') || path.includes('/dashboard')) {
        return LAYOUT_PRESETS.fullscreen;
    }
    if (path.includes('/login') || path.includes('/auth')) {
        return LAYOUT_PRESETS.contentOnly;
    }
    if (path.includes('/admin') || path.includes('/management')) {
        return LAYOUT_PRESETS.standard;
    }

    // 默认使用标准布局
    return LAYOUT_PRESETS.standard;
}

/**
 * 手动设置布局预设
 */
export function setLayoutPreset(preset: LayoutPreset) {
    const globalStore = useGlobalStore();
    const layoutConfig = LAYOUT_PRESETS[preset];

    globalStore.setGlobalState('showSider', layoutConfig.showSider);
    globalStore.setGlobalState('showHeader', layoutConfig.showHeader);
    globalStore.setGlobalState('showFooter', layoutConfig.showFooter);
    // 标记为动态修改
    globalStore.setGlobalState('layoutModified', true);
}

/**
 * 手动设置布局状态
 */
export function setLayoutState(config: {
    showSider?: boolean;
    showHeader?: boolean;
    showFooter?: boolean;
}) {
    const globalStore = useGlobalStore();

    if (config.showSider !== undefined) {
        globalStore.setGlobalState('showSider', config.showSider);
    }
    if (config.showHeader !== undefined) {
        globalStore.setGlobalState('showHeader', config.showHeader);
    }
    if (config.showFooter !== undefined) {
        globalStore.setGlobalState('showFooter', config.showFooter);
    }
    // 标记为动态修改
    globalStore.setGlobalState('layoutModified', true);
}
