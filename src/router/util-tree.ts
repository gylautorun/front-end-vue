import { validateBoolean } from '@/utils/util-normal';
import { RouteItem, RouteMeta, LayoutPreset } from './type';
import { LAYOUT_PRESETS } from './guards/layout';

type PartialRoute = Partial<Omit<RouteItem, 'children'>>;
interface PartialRouteItem extends PartialRoute {
    children?: PartialRouteItem[];
}
export function routesToTree(routes: RouteItem[]) {
    const map: Record<string, PartialRouteItem> = {};
    const result = [];
    for (const route of routes) {
        const { key, parentKey } = route;
        if (!map[key]) {
            map[key] = { children: [] };
        }
        map[key] = {
            ...route,
            children: map[key].children
        };
        const current = map[key];

        // 是否第一层
        if (parentKey === '/') {
            result.push(current);
        }
        // 非第一层, 需要children 里添加
        else if (typeof parentKey === 'string') {
            // 有可能当前父级还未遍历到, 需要提前赋予children
            if (!map[parentKey]) {
                map[parentKey] = {
                    children: []
                };
            }
            map[parentKey].children?.push(current);
        }
    }
    return result as RouteItem[];
}

export function handleRouteMeta(meta: RouteMeta): RouteMeta {
    // 如果定义了布局预设，使用预设值
    const presetConfig =
        meta.layoutPreset && LAYOUT_PRESETS[meta.layoutPreset]
            ? LAYOUT_PRESETS[meta.layoutPreset]
            : { showSider: undefined, showHeader: undefined, showFooter: undefined };

    const result = {
        ...meta,
        ...presetConfig,
        // 具体的布局控制字段优先级更高，会覆盖预设值
        showSider:
            meta.showSider !== undefined ? validateBoolean(meta.showSider) : presetConfig.showSider,
        showHeader:
            meta.showHeader !== undefined
                ? validateBoolean(meta.showHeader)
                : presetConfig.showHeader,
        showFooter:
            meta.showFooter !== undefined
                ? validateBoolean(meta.showFooter)
                : presetConfig.showFooter
    };
    result.setValue = (type, value) => {
        result[type] = value;
    };
    return result;
}
