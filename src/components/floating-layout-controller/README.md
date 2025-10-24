# 悬浮布局控制器 - Popover 版本

## 功能概述

悬浮布局控制器现在使用 Ant Design 的 Popover 组件重构，实现了 hover 显示控制面板的效果，提供了更好的用户体验。

## 主要改进

### 🎯 交互方式

-   **Hover 触发** - 鼠标悬停即可显示控制面板
-   **自动隐藏** - 鼠标离开后自动隐藏
-   **无需点击** - 更加便捷的操作方式

### 🎨 视觉设计

-   **统一风格** - 使用 Ant Design 组件保持一致性
-   **渐变头部** - 美观的状态显示区域
-   **实时状态** - 显示当前布局组件状态
-   **响应式** - 适配不同屏幕尺寸

### ⚡ 功能特性

-   **完整控制** - 包含所有布局控制功能
-   **状态反馈** - 按钮颜色反映当前状态
-   **快捷操作** - 提供批量操作功能
-   **预设模式** - 一键设置常用布局

## 组件结构

### FloatingLayoutController

```vue
<template>
    <a-popover
        v-model:open="isPanelOpen"
        placement="topRight"
        trigger="hover"
        :overlay-style="{ padding: 0 }"
        :arrow="false"
    >
        <template #content>
            <GlobalControl />
        </template>

        <div class="floating-ball">
            <!-- 悬浮小球 -->
        </div>
    </a-popover>
</template>
```

### GlobalControl

```vue
<template>
    <div class="global-control">
        <div class="control-header">
            <!-- 状态显示 -->
        </div>
        <div class="control-content">
            <!-- 控制按钮 -->
        </div>
    </div>
</template>
```

## 控制选项

### 单独控制

-   **切换侧边栏** - 显示/隐藏侧边栏
-   **切换顶部导航** - 显示/隐藏顶部导航
-   **切换底部信息** - 显示/隐藏底部信息

### 预设模式

-   **全屏模式** - 隐藏所有布局组件
-   **无侧边栏** - 只隐藏侧边栏
-   **无顶部** - 只隐藏顶部导航
-   **无底部** - 只隐藏底部信息
-   **标准模式** - 显示所有布局组件

### 快捷操作

-   **切换全部** - 同时切换所有布局组件
-   **隐藏全部** - 隐藏所有布局组件
-   **显示全部** - 显示所有布局组件

## 技术实现

### Popover 配置

```typescript
<a-popover
  v-model:open="isPanelOpen"
  placement="topRight"        // 位置：右上角
  trigger="hover"             // 触发方式：悬停
  :overlay-style="{ padding: 0 }"  // 无内边距
  :arrow="false"              // 无箭头
  overlay-class-name="floating-layout-popover"  // 自定义样式类
>
```

### 状态管理

-   使用 `useGlobalStore` 管理布局状态
-   使用 `setLayoutState` 和 `setLayoutPreset` 控制布局
-   支持状态持久化和响应式更新

### 样式定制

```scss
// 自定义 Popover 样式
.floating-layout-popover {
    .ant-popover-inner {
        padding: 0;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    }
}
```

## 使用方式

### 自动集成

控制器已集成到主布局组件中，所有页面都会自动显示：

```vue
<!-- src/layout/index.vue -->
<template>
    <component :is="LayoutComponents[layout]" />
    <ThemeDrawer />
    <FloatingLayoutController />
</template>
```

### 手动使用

如果需要在特定页面使用：

```vue
<template>
    <div>
        <!-- 页面内容 -->
        <FloatingLayoutController />
    </div>
</template>

<script setup>
import FloatingLayoutController from '@/components/floating-layout-controller/index.vue';
</script>
```

## 优势对比

### 相比点击版本

| 特性     | 点击版本                   | Hover 版本    |
| -------- | -------------------------- | ------------- |
| 触发方式 | 需要点击                   | 悬停即可      |
| 操作步骤 | 点击 → 选择 → 点击外部关闭 | 悬停 → 选择   |
| 交互体验 | 需要多次操作               | 一次悬停完成  |
| 视觉反馈 | 需要手动关闭               | 自动显示/隐藏 |

### 相比传统控制面板

| 特性     | 传统面板     | 悬浮控制器     |
| -------- | ------------ | -------------- |
| 占用空间 | 固定占用     | 不占用页面空间 |
| 访问便利 | 需要导航     | 随时可用       |
| 视觉干扰 | 可能干扰内容 | 最小化干扰     |
| 移动适配 | 需要特殊处理 | 自动适配       |

## 自定义配置

### 显示条件

```typescript
const showController = computed(() => {
    // 可以根据条件控制显示
    return process.env.NODE_ENV === 'development' || userSettings.showController;
});
```

### 触发方式

```typescript
// 可以修改触发方式
trigger = 'click'; // 点击触发
trigger = 'hover'; // 悬停触发（默认）
trigger = 'focus'; // 聚焦触发
```

### 位置调整

```typescript
placement = 'topRight'; // 右上角（默认）
placement = 'topLeft'; // 左上角
placement = 'bottomRight'; // 右下角
placement = 'bottomLeft'; // 左下角
```

## 注意事项

1. **性能考虑** - Popover 组件性能良好，不会影响页面性能
2. **层级管理** - 确保 z-index 不会与其他组件冲突
3. **移动适配** - 在小屏设备上提供合适的交互体验
4. **状态同步** - 确保与全局状态保持同步

## 未来扩展

-   [ ] 添加拖拽功能
-   [ ] 支持自定义位置
-   [ ] 添加更多预设模式
-   [ ] 支持快捷键操作
-   [ ] 添加用户偏好保存
-   [ ] 支持主题定制
