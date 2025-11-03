import { defineStore } from 'pinia';
import { GlobalState } from '@/stores/type';
import { DEFAULT_PRIMARY } from '@/config';
import piniaPersistConfig from '@/config/pinia-persist';

// defineStore 调用后返回一个函数，调用该函数获得 Store 实体
export const useGlobalStore = defineStore({
    // id: 必须的，在所有 Store 中唯一
    id: 'gyl-global',
    state: (): GlobalState => ({
        // 刷新页面
        refreshPage: true,
        // 当前Route Name
        routeName: '',
        // 全局loading
        loading: false,
        // 布局切换 -->  纵向：vertical | 横向：transverse | 侧边： antd
        layout: 'antd',
        // antd组件大小
        assemblySize: 'middle',
        // language
        language: 'zh_CN',
        // 当前页面是否全屏
        maximize: false,
        // 默认 primary 主题颜色
        primary: DEFAULT_PRIMARY,
        // 风格切换 --> 亮色：light | 暗色：dark | 暗黑：realDark
        styleSetting: 'dark',
        // 灰色模式
        isGrey: false,
        // 色弱模式
        isWeak: false,
        // 折叠菜单
        isCollapse: false,
        // 面包屑导航
        breadcrumb: true,
        // 面包屑导航图标
        breadcrumbIcon: true,
        // 标签页
        tabs: true,
        // 标签页图标
        tabsIcon: true,
        // 页脚
        footer: true,
        // 布局组件显示控制
        showSider: true,
        showHeader: true,
        showFooter: true,
        // 标记是否被动态修改过
        layoutModified: false,
        // 是否清除布局间距
        isClearLayoutGap: false
    }),
    getters: {
        // 类 mobx computed
        // active():boolean {
        //     return this.showSider;
        // },
    },
    actions: {
        // Set GlobalState
        setGlobalState(key: keyof GlobalState, val: unknown) {
            this.$patch({ [key]: val });
        },
        toggleClearLayoutGap() {
            this.isClearLayoutGap = !this.isClearLayoutGap;
        },
        setClearLayoutGap(val: boolean) {
            this.isClearLayoutGap = val;
        }
    },
    persist: piniaPersistConfig('gyl-global')
});
