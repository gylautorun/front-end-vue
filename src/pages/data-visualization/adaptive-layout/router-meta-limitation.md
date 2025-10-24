# Vue Router Meta 修改限制说明

## 问题描述

在 Vue Router 中，`route.meta` 是只读的，不能直接修改：

```typescript
// ❌ 错误：不能直接修改 route.meta
function toggleSider() {
    route.meta = {
        ...route.meta,
        showSider: !route.meta.showSider
    };
    // 这会抛出错误：'set' on proxy: trap returned falsish for property 'meta'
}
```

## 解决方案

### 方案1：使用 Global Store（推荐）

```typescript
// ✅ 正确：使用 global store 控制布局
function toggleSider() {
    setLayoutState({ showSider: !globalStore.showSider });
}
```

### 方案2：使用路由导航

```typescript
// ✅ 正确：通过路由导航更新 meta
function toggleSider() {
    router.push({
        ...route,
        meta: {
            ...route.meta,
            showSider: !route.meta.showSider
        }
    });
}
```

## 为什么使用 Global Store？

1. **响应式更新** - 布局状态改变后立即响应
2. **状态持久化** - 通过 pinia-persist 自动保存
3. **简单易用** - 不需要复杂的路由操作
4. **性能更好** - 避免不必要的路由重新渲染

## 最佳实践

-   使用 `layoutPreset` 进行静态配置
-   使用 `setLayoutState` 进行动态控制
-   避免直接修改 `route.meta`
