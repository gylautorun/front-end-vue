/**
 * 页面配置信息
 * ----------------------------------------------------------------------------
 * 注册 data-d3 页面到全局路由/菜单系统
 *
 * 步骤：
 *   1. 框架启动时读取此文件获取页面元信息（title / template）
 *   2. 根据 template 加载对应组件 (src/pages/data-d3/index.vue)
 *   3. 根据 layoutPreset 决定是否使用全屏布局
 */
export const page = {
    title: '数据-d3-可视化',
    template: 'data-d3',
    layoutPreset: 'fullscreen' // 关键：使用全屏布局，避免被 antd-layout 的 header/sider/footer 干扰
};
export default page;
