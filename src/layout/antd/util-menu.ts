import { RouteItem } from '@/router/type';
import {
    MailOutlined, AppstoreOutlined, SettingOutlined,
} from '@ant-design/icons-vue';
import {MailOutlinedIconType} from '@ant-design/icons-vue/lib/icons/MailOutlined';
import { ItemType } from 'ant-design-vue';
import {h} from 'vue';

const iconMap: Record<number | string, MailOutlinedIconType> = {
    0: MailOutlined,
    1: AppstoreOutlined,
    2: SettingOutlined,
};
function changeMenuItem(route: RouteItem, index: number, isFirstLevel = false): ItemType {
    const {path, name, meta, children} = route;
    const Icon = iconMap[index % 3];
    return {
        key: path,
        icon: isFirstLevel ? () => h(Icon) : undefined,
        label: meta?.title || name,
        title: meta?.title,
        children: children && children.length > 0
            ? children.map((it, i) => changeMenuItem(it as RouteItem, i))
            : undefined,
    } as ItemType;
}
export function getMenuList(routes: RouteItem[]) {
    const routeList = routes.filter(item => item.meta?.notMenu !== true);
    return routeList.map((item, index) => changeMenuItem(item, index, true));
}