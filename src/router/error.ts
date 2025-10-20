import {RouteItem} from './type';

const pages = import.meta.glob('../components/error/*.vue', {eager: true, import: 'default'});
export const errorRoutes = Object.entries(pages).map(([path, component]) => {
    path = path.replace('../components/error', '').replace('.vue', '');
    const name = path.split('/').filter(Boolean).join('-');

    return {
        path,
        key: path,
        name,
        component,
        meta: {
            title: `${name}页面`
        },
    };
}) as RouteItem[];

export default errorRoutes;