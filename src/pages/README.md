# 通用布局控制系统

## 功能概述

现在你可以通过简单的配置来控制任何页面的布局显示，无需在每个页面中重复编写控制逻辑。

## 使用方法

### 方法一：使用布局预设（推荐）

在 `page.ts` 中直接设置布局预设：

```typescript
// 全屏模式 - 隐藏所有布局组件
export default {
    template: 'dashboard',
    title: '数据大屏',
    layoutPreset: 'fullscreen'
};

// 无侧边栏模式
export default {
    template: 'content',
    title: '内容页面',
    layoutPreset: 'noSider'
};

// 标准模式
export default {
    template: 'standard',
    title: '标准页面',
    layoutPreset: 'standard'
};
```

### 方法二：使用具体控制字段

```typescript
export default {
    template: 'custom',
    title: '自定义页面',
    showSider: false,
    showHeader: true,
    showFooter: false
};
```

### 方法三：在组件中动态控制

```vue
<script setup lang="ts">
import { setLayoutPreset, setLayoutState } from '@/router/guards/layout';

// 使用预设
function setFullscreen() {
    setLayoutPreset('fullscreen');
}

// 自定义控制
function toggleSider() {
    setLayoutState({ showSider: !globalStore.showSider });
}
</script>
```

## 布局预设说明

| 预设名称      | 说明           | 侧边栏 | 顶部导航 | 底部信息 |
| ------------- | -------------- | ------ | -------- | -------- |
| `fullscreen`  | 全屏模式       | ❌     | ❌       | ❌       |
| `contentOnly` | 仅内容模式     | ❌     | ❌       | ❌       |
| `standard`    | 标准模式       | ✅     | ✅       | ✅       |
| `noSider`     | 无侧边栏模式   | ❌     | ✅       | ✅       |
| `noHeader`    | 无顶部导航模式 | ✅     | ❌       | ✅       |
| `noFooter`    | 无底部信息模式 | ✅     | ✅       | ❌       |

## 优先级说明

1. **布局预设** (`layoutPreset`) - 最高优先级
2. **具体控制字段** (`showSider/showHeader/showFooter`) - 次优先级
3. **路由路径默认配置** - 最低优先级

## 自动路由守卫

系统会自动根据路由配置设置布局状态，无需手动处理：

-   数据可视化页面 (`/data-visualization/*`) → 全屏模式
-   登录页面 (`/login`, `/auth/*`) → 仅内容模式
-   管理页面 (`/admin/*`, `/management/*`) → 标准模式
-   其他页面 → 标准模式

## 示例页面

查看 `src/pages/data-visualization/adaptive-layout/` 了解完整的使用示例。

## 优势

✅ **零配置** - 大部分页面无需任何配置  
✅ **预设模式** - 常用布局一键设置  
✅ **灵活控制** - 支持细粒度控制  
✅ **自动管理** - 路由守卫自动处理  
✅ **类型安全** - 完整的 TypeScript 支持  
✅ **状态持久化** - 布局状态自动保存
