# 布局控制优先级修复

## 问题描述

之前的逻辑存在问题：如果路由元数据中定义了 `showSider` 等字段，那么动态修改 global store 状态永远不会生效，因为布局组件会一直使用路由元数据中的值。

## 解决方案

添加了 `layoutModified` 标记来跟踪是否被动态修改过，实现正确的优先级：

### 新的优先级逻辑

1. **动态修改** (`layoutModified: true`) - 最高优先级
2. **路由元数据** (`route.meta.showSider`) - 次优先级
3. **Global Store 默认值** - 最低优先级

### 实现细节

#### 1. 添加标记字段

```typescript
// GlobalState 中添加
layoutModified: boolean;
```

#### 2. 动态修改时设置标记

```typescript
// setLayoutState 和 setLayoutPreset 函数中
globalStore.setGlobalState('layoutModified', true);
```

#### 3. 路由守卫重置标记

```typescript
// 路由守卫设置布局时
globalStore.setGlobalState('layoutModified', false);
```

#### 4. 布局组件使用标记

```typescript
const shouldShowSider = computed(() => {
    // 如果被动态修改过，优先使用 global store 状态
    if (globalStore.layoutModified) {
        return globalStore.showSider;
    }
    // 否则使用路由元数据或默认值
    return route.meta?.showSider ?? globalStore.showSider;
});
```

## 使用场景

### 场景1：静态配置

```typescript
// page.ts
export default {
    template: 'dashboard',
    title: '数据大屏',
    layoutPreset: 'fullscreen' // 静态配置，不会被动态修改覆盖
};
```

### 场景2：动态修改

```typescript
// 在组件中
function toggleSider() {
    setLayoutState({ showSider: !globalStore.showSider });
    // 现在会生效，因为 layoutModified 被设置为 true
}
```

### 场景3：路由切换

```typescript
// 切换到新路由时，layoutModified 被重置为 false
// 新路由的配置会生效
```

## 优势

✅ **解决冲突** - 动态修改可以覆盖静态配置  
✅ **保持一致性** - 路由切换时重置标记  
✅ **向后兼容** - 不影响现有功能  
✅ **清晰明确** - 优先级逻辑简单易懂
