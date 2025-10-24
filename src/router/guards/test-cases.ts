// 测试用例：验证布局控制逻辑

// 测试1：布局预设优先级
const test1 = {
    template: 'test',
    title: '测试页面',
    layoutPreset: 'fullscreen' // 应该隐藏所有布局组件
};
// 预期结果：showSider: false, showHeader: false, showFooter: false

// 测试2：具体字段覆盖预设
const test2 = {
    template: 'test',
    title: '测试页面',
    layoutPreset: 'fullscreen', // 预设隐藏所有
    showSider: true // 但具体指定显示侧边栏
};
// 预期结果：showSider: true, showHeader: false, showFooter: false

// 测试3：只有具体字段
const test3 = {
    template: 'test',
    title: '测试页面',
    showSider: false,
    showHeader: true,
    showFooter: false
};
// 预期结果：showSider: false, showHeader: true, showFooter: false

// 测试4：无任何配置
const test4 = {
    template: 'test',
    title: '测试页面'
};
// 预期结果：使用默认配置（根据路径决定）
