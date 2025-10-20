import { RouteRecordRaw } from 'vue-router';

export type RouteItem = RouteRecordRaw & {
    parentKey?: string;
    key: string;
    children?: RouteItem[];
}

export interface RouteMeta {
    title: string;
    template: string;
    description?: string;
    // 渲染路径名，默认是 index
    pathFileName?: string;
    // 渲染后缀 默认是 vue
    fileSuffix?: 'tsx' | 'vue';
}