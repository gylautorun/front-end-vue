import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import NProgress from '@/utils/nprogress';
import { LOGIN_URL, ROUTER_WHITE_LIST } from '@/config';
import { useAuthStore } from '@/stores/modules/auth';
import { useUserStore } from '@/stores/modules/user';
// import { initDynamicRouter } from './dynamic';
import pagesRoutes, { firstRoute } from './pages';
import errorRoutes from './error';
import { setupLayoutGuard } from './guards/layout';
import { RouteItem } from './type';

const routes: RouteItem[] = [...pagesRoutes, ...errorRoutes].concat([
    {
        path: '/',
        key: 'redirect',
        redirect: firstRoute.path
    },
    // 路由未匹配到，进入这个
    {
        path: '/:currentPath(.*)*',
        key: 'path-all',
        redirect: errorRoutes[0].path
        // redirect: () => {
        //     return {path: '/404'};
        // }
    }
    // 解决刷新页面，路由警告
    // {
    // 	path: '/:pathMatch(.*)*',
    //  key: 'path-404',
    // 	redirect: '/404',
    // },
]);
/**
 * @description 动态路由参数配置简介 📚
 * @param path ==> 菜单路径
 * @param name ==> 菜单别名
 * @param redirect ==> 重定向地址
 * @param component ==> 视图文件路径
 * @param meta ==> 菜单信息
 * @param meta.icon ==> 菜单图标
 * @param meta.title ==> 菜单标题
 * @param meta.activeMenu ==> 当前路由为详情页时，需要高亮的菜单
 * @param meta.isLink ==> 是否外链
 * @param meta.isHide ==> 是否隐藏
 * @param meta.isFull ==> 是否全屏(示例：数据大屏页面)
 * @param meta.isAffix ==> 是否固定在 tabs nav
 * @param meta.isKeepAlive ==> 是否缓存
 * */
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior(to, from, savedPosition) {
        return {
            el: '#app',
            top: 0,
            behavior: 'smooth'
        };
    }
});

// 设置布局守卫
setupLayoutGuard(router);

/**
 * @description 重置路由
 */
export const resetRouter = () => {
    const authStore = useAuthStore();
    authStore.flatMenuListGet.forEach((route) => {
        const { name } = route;
        if (name && router.hasRoute(name)) {
            router.removeRoute(name);
        }
    });
};
// 导航守卫
router.beforeEach(async (to, from, next) => {
    // 进度条
    NProgress.start();

    const userStore = useUserStore();
    // 动态修改标题
    if (to.meta.title) {
        document.title = `${to.meta.title || ''}`;
    }

    // 判断是访问登陆页，有 Token 就在当前页面，没有 Token 重置路由并放行到登陆页
    if (to.path === LOGIN_URL) {
        if (userStore.token) return next(from.fullPath);
        resetRouter();
        return next();
    }

    // 判断访问页面是否在路由白名单地址中，如果存在直接放行
    if (ROUTER_WHITE_LIST.includes(to.path)) {
        return next();
    }

    // 判断是否有 Token，没有重定向到 login
    if (!userStore.token) {
        return next({ path: LOGIN_URL, replace: true });
    }

    // 如果没有菜单列表，就重新请求菜单列表并添加动态路由
    // const authStore = useAuthStore();
    // authStore.setRouteName(to.name as string);
    // if (!authStore.authMenuListGet.length) {
    // 	await initDynamicRouter();
    // 	return next({ ...to, replace: true });
    // }

    next();
});
// 后置守卫
router.afterEach((to) => {
    document.title = `${to.meta?.title || ''}`;
    NProgress.done();
});
export default router;
