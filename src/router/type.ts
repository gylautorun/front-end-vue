import { RouteRecordRaw } from 'vue-router';

export type RouteItem = RouteRecordRaw & {
    parentKey?: string;
    key: string;
    children?: RouteItem[];
} & {
    meta?: RouteMeta;
};

// 布局预设类型
export type LayoutPreset =
    | 'fullscreen'
    | 'contentOnly'
    | 'standard'
    | 'noSider'
    | 'noHeader'
    | 'noFooter';

export interface RouteMeta {
    title: string;
    template: string;
    description?: string;
    // 渲染路径名，默认是 index
    pathFileName?: string | 'index';
    // 渲染后缀 默认是 vue
    fileSuffix?: 'tsx' | 'vue';
    // 布局预设 - 优先级最高
    layoutPreset?: LayoutPreset;
    // 布局控制字段 - 优先级次之
    showSider?: boolean;
    showHeader?: boolean;
    showFooter?: boolean;

    setValue?: <K extends keyof Omit<RouteMeta, 'setValue'>>(
        type: K,
        value: Required<Omit<RouteMeta, 'setValue'>>[K]
    ) => void;
}
