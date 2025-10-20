import { RouteItem } from './type';

type PartialRoute = Partial<Omit<RouteItem, 'children'>>;
interface PartialRouteItem extends PartialRoute {
    children?: PartialRouteItem[];
}
export function routesToTree(routes: RouteItem[]) {
    const map: Record<string, PartialRouteItem> = {};
    const result = [];
    for (const route of routes) {
        const {key, parentKey} = route;
        if (!map[key]) {
            map[key] = {children: []};
        }
        map[key] = {
            ...route,
            children: map[key].children,
        }
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
                    children: [],
                };
            }
            map[parentKey].children?.push(current);
        }
    }
    return result as RouteItem[];
}
