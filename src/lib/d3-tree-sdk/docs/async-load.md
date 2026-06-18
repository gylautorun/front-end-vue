# 异步加载子节点功能

## 目录

- [功能概述](#功能概述)
- [核心设计](#核心设计)
- [类型定义](#类型定义)
- [配置说明](#配置说明)
- [使用示例](#使用示例)
- [代码实现](#代码实现)
- [异步加载逻辑](#异步加载逻辑)
- [缓存策略](#缓存策略)

---

## 功能概述

### 背景

在实际开发中，树形数据可能不是一次性返回的，而是根据用户展开节点的操作，按需加载子节点。这种场景常见于：

- 权限树、组织架构树等大型层级数据
- 需要实时获取最新数据的场景
- 减少初始加载数据量，提升页面性能

### 解决方案

通过 `isLeaf` 字段标记节点是否为叶子节点，结合 `children` 是否为空判断是否需要异步加载子节点。

---

## 核心设计

### 异步加载判断逻辑

```
┌─────────────────────────────────────────────────────────────┐
│ isLeaf = true                                               │
│   → 叶子节点，无论 children 是否有值，都不显示展开按钮       │
│   → 不触发异步加载                                          │
├─────────────────────────────────────────────────────────────┤
│ isLeaf = false（或不设置）                                  │
│   ├─ children 有数据                                         │
│   │   → 正常展开/收起，不触发异步加载                        │
│   │                                                         │
│   └─ children 为空 []                                       │
│       → 显示展开按钮，点击时触发异步加载                      │
│       → 加载后 children = [子节点...]                        │
└─────────────────────────────────────────────────────────────┘
```

### 数据格式

```typescript
// 叶子节点（不显示展开按钮）
{
    id: 'leaf-node',
    label: '叶子节点',
    isLeaf: true,
    children: []  // 或 undefined
}

// 非叶子节点，有子节点（正常展开）
{
    id: 'parent-node',
    label: '父节点',
    isLeaf: false,
    children: [
        { id: 'child-1', label: '子节点1' },
        { id: 'child-2', label: '子节点2' }
    ]
}

// 非叶子节点，需要异步加载（显示展开按钮）
{
    id: 'async-node',
    label: '异步节点',
    isLeaf: false,
    children: []  // 空数组表示需要异步加载
}
```

### 缓存策略

| 策略 | 说明 | 适用场景 |
|------|------|----------|
| `cache-first` | 首次加载后缓存，后续使用缓存 | 数据变化不频繁，追求性能 |
| `realtime` | 每次展开都重新请求 | 数据实时变化，需要最新数据 |

---

## 类型定义

### AsyncLoadStrategy 枚举

```typescript
// src/lib/d3-tree-sdk/types/index.ts
export enum AsyncLoadStrategy {
    /** 缓存优先策略：首次加载后缓存，后续使用缓存 */
    CacheFirst = 'cache-first',
    /** 实时策略：每次展开都重新请求 */
    Realtime = 'realtime'
}
```

### TreeData 类型扩展

```typescript
// src/lib/d3-tree-sdk/types/index.ts
interface TreeData {
    id: string;
    label?: string;
    children?: TreeData[];
    // ... 其他字段
    
    /**
     * 标记节点是否为叶子节点（适用于异步加载场景）
     * @description isXXX 开头的字段应为布尔类型
     * - true: 叶子节点（无子节点）
     * - false: 非叶子节点（可能需要异步加载子节点）
     */
    isLeaf?: boolean;
}
```

### 配置接口

```typescript
// src/lib/d3-tree-sdk/schema/TreeConfig.ts
export interface TreeConfigInput {
    // ... 其他配置
    
    /**
     * 异步加载配置（可选）
     * @description 当数据不是一次性返回时，配置此选项实现按需加载子节点
     */
    asyncLoad?: {
        /**
         * 异步加载函数
         * @param nodeId - 要加载子节点的父节点 ID
         * @returns 返回子节点数组的 Promise
         */
        loadChildren: (nodeId: string) => Promise<TreeData[]>;
        
        /**
         * isLeaf 字段名（默认 'isLeaf'）
         * @description 用于判断节点是否为叶子节点
         * @note 该字段对应的值应为 boolean 类型：
         *       - true: 叶子节点（无子节点）
         *       - false: 非叶子节点（可能需要异步加载子节点）
         */
        isLeafField?: string;
    };
}
```

### TreeAccessors 方法扩展

```typescript
// src/lib/d3-tree-sdk/schema/TreeAccessors.ts
export interface TreeAccessors {
    // ... 其他方法
    
    /**
     * 检查节点是否为叶子节点
     * @description 通过 isLeaf 字段判断，适用于异步加载场景
     * @returns true 表示是叶子节点（无子节点），false 表示有子节点（可能需要异步加载）
     */
    isLeaf(node: TreeData): boolean;
    
    /**
     * 检查节点是否已加载过子节点
     * @description 用于判断是否需要重新请求数据（cache-first 策略）
     * @returns true 表示子节点已加载（或已尝试加载过）
     */
    hasLoadedChildren(node: TreeData): boolean;
    
    /**
     * 标记节点子节点已加载
     * @description 设置内部标记，表示该节点的子节点已加载过
     */
    markChildrenLoaded(node: TreeData): void;
}
```

---

## 配置说明

### Schema 配置示例

```typescript
// src/pages/data-d3/config/treeConfig.ts
import { defineTreeConfig } from '@/lib/d3-tree-sdk';

const schema = defineTreeConfig({
    rootId: 'edu',
    fields: {
        id: 'id',
        label: 'label',
        children: 'children'
    },
    asyncLoad: {
        // 异步加载函数
        loadChildren: async (nodeId: string) => {
            // 模拟 API 请求
            const response = await fetch(`/api/tree/children/${nodeId}`);
            return response.json();
        },
        // 可选：isLeaf 字段名（默认 'isLeaf'）
        isLeafField: 'isLeaf'
    }
});
```

### GraphCanvas Props

```vue
<!-- src/pages/data-d3/components/GraphCanvas.vue -->
<template>
    <GraphCanvas
        :tree-data="treeData"
        :schema="schema"
        :selected-nodes="selectedNodes"
        :selected-count="selectedCount"
        async-load-strategy="cache-first"  <!-- 缓存策略 -->
    />
</template>

<script setup lang="ts">
import { AsyncLoadStrategy } from '@/lib/d3-tree-sdk';

// 定义 props
const props = defineProps({
    // ... 其他 props
    asyncLoadStrategy: {
        type: String as () => 'cache-first' | 'realtime',
        default: 'cache-first'
    }
});

// 全局异步加载策略
const asyncLoadStrategy = ref<AsyncLoadStrategy>(
    props.asyncLoadStrategy ?? AsyncLoadStrategy.CacheFirst
);
</script>
```

---

## 使用示例

### 1. 基础使用（一次性加载）

```typescript
// 不配置 asyncLoad，使用原有的同步展开/收起逻辑
const schema = defineTreeConfig({
    rootId: 'edu',
    fields: { id: 'id', label: 'label', children: 'children' }
});
```

### 2. 异步加载（缓存优先）

```typescript
// 配置异步加载，使用 cache-first 策略
const schema = defineTreeConfig({
    rootId: 'edu',
    fields: { id: 'id', label: 'label', children: 'children' },
    asyncLoad: {
        loadChildren: (nodeId) => fetch(`/api/children/${nodeId}`).then(res => res.json()),
        isLeafField: 'isLeaf'
    }
});

// 使用缓存策略
const graph = new D3TreeGraph({
    container: '#graph',
    data: initialData,
    schema,
    asyncLoadStrategy: 'cache-first'  // 或 'realtime'
});
```

### 3. 实时加载策略

```typescript
// 每次展开都重新请求数据
const schema = defineTreeConfig({
    rootId: 'edu',
    fields: { id: 'id', label: 'label', children: 'children' },
    asyncLoad: {
        loadChildren: async (nodeId) => {
            // 每次都重新请求，获取最新数据
            const response = await fetch(`/api/realtime/children/${nodeId}`);
            return response.json();
        }
    }
});

const graph = new D3TreeGraph({
    container: '#graph',
    data: initialData,
    schema,
    asyncLoadStrategy: 'realtime'  // 每次展开都重新请求
});
```

### 4. 混合使用（部分节点异步加载）

```typescript
// 数据结构：部分节点有子节点，部分需要异步加载
const treeData: TreeData = {
    id: 'root',
    label: '根节点',
    isLeaf: false,
    children: [
        {
            id: 'node-1',
            label: '节点1（有子节点）',
            isLeaf: false,
            children: [
                { id: 'child-1', label: '子节点1' },
                { id: 'child-2', label: '子节点2' }
            ]
        },
        {
            id: 'node-2',
            label: '节点2（需要异步加载）',
            isLeaf: false,
            children: []  // 空数组，需要异步加载
        },
        {
            id: 'leaf',
            label: '叶子节点',
            isLeaf: true,
            children: []  // 叶子节点，不显示展开按钮
        }
    ]
};
```

---

## 代码实现

### TreeContext.toggleNodeExpansion

```typescript
// src/lib/d3-tree-sdk/TreeContext.ts
import { AsyncLoadStrategy } from '../types';

/**
 * 切换节点展开状态（支持异步加载）
 * @param root - 树根节点数据
 * @param nodeId - 要切换的节点 ID
 * @param loadChildren - 异步加载函数
 * @param strategy - 缓存策略
 */
toggleNodeExpansion(
    root: TreeData,
    nodeId: string,
    loadChildren?: (nodeId: string) => Promise<TreeData[]>,
    strategy: AsyncLoadStrategy = AsyncLoadStrategy.CacheFirst
): Promise<void> {
    // 1. 查找节点
    const node = this.findNode(root, nodeId);
    if (!node) return;

    // 2. 检查是否为叶子节点（叶子节点不处理）
    if (this.acc.isLeaf(node)) {
        console.warn(`TreeContext.toggleNodeExpansion: 节点 ${nodeId} 是叶子节点，无法展开`);
        return;
    }

    // 3. 获取节点当前状态
    const hasChildren = this.acc.getChildren(node) && this.acc.getChildren(node)!.length > 0;
    const hasCachedChildren = this.acc.hasCachedChildren(node);

    // 4. 展开逻辑
    if (hasChildren) {
        // 4.1 有子节点 → 使用原有的展开/收起逻辑
        this.toggleNodeChildren(root, nodeId);
        return;
    }

    // 4.2 无子节点 → 检查是否需要异步加载
    if (!loadChildren) {
        console.warn(`TreeContext.toggleNodeExpansion: 节点 ${nodeId} 需要异步加载，但未提供 loadChildren 函数`);
        return;
    }

    // 4.3 检查缓存策略
    const hasLoadedChildren = this.acc.hasLoadedChildren(node);
    if (hasLoadedChildren && strategy === AsyncLoadStrategy.CacheFirst) {
        // cache-first 策略：已加载过，使用缓存的子节点
        if (hasCachedChildren) {
            this.toggleNodeChildren(root, nodeId);
        }
        return;
    }

    // 4.4 执行异步加载
    try {
        const children = await loadChildren(nodeId);
        
        // 设置子节点
        this.acc.setChildren(node, children);
        
        // 标记已加载
        this.acc.markChildrenLoaded(node);
        
        // 展开节点
        this.toggleNodeChildren(root, nodeId);
    } catch (error) {
        console.error(`TreeContext.toggleNodeExpansion: 加载子节点失败`, error);
    }
}
```

### D3TreeGraph.toggleNodeExpansion

```typescript
// src/lib/d3-tree-sdk/D3TreeGraph.ts
import { AsyncLoadStrategy } from './types';

/**
 * 切换节点展开状态（支持异步加载）
 * @param nodeId - 要切换的节点 ID
 * @param strategy - 缓存策略
 */
async toggleNodeExpansion(nodeId: string, strategy?: AsyncLoadStrategy): Promise<void> {
    const ctx = this.getContext();
    const config = ctx.getConfig();

    // 获取加载函数
    const loadChildren = config.asyncLoad?.loadChildren;
    
    // 使用指定的策略或全局策略
    const loadStrategy = strategy ?? this.asyncLoadStrategy ?? AsyncLoadStrategy.CacheFirst;

    // 执行异步展开
    await ctx.toggleNodeExpansion(
        this.treeData,
        nodeId,
        loadChildren,
        loadStrategy
    );

    // 提交变更并重新渲染
    this.commit();
}
```

### TreeAccessors 异步加载方法

```typescript
// src/lib/d3-tree-sdk/schema/TreeAccessors.ts
isLeaf: (node) => {
    const isLeafField = config.asyncLoad?.isLeafField ?? 'isLeaf';
    const value = (node as any)[isLeafField];

    // 如果字段不存在，默认认为不是叶子节点
    if (value === undefined || value === null) {
        return false;
    }

    // 如果字段值不是 boolean 类型，发出警告
    if (typeof value !== 'boolean') {
        console.warn(
            `TreeAccessors.isLeaf: ${isLeafField} field should be boolean type, but got ${typeof value}.`
        );
    }

    // 确保返回 boolean 类型
    return Boolean(value);
},

hasLoadedChildren: (node) => {
    return Boolean((node as any)._childrenLoaded);
},

markChildrenLoaded: (node) => {
    (node as any)._childrenLoaded = true;
},
```

---

## 异步加载逻辑

### 完整流程图

```
用户点击展开按钮
        ↓
handleExpandClick(nodeId)
        ↓
graph.toggleNodeExpansion(nodeId, strategy)
        ↓
ctx.toggleNodeExpansion(root, nodeId, loadChildren, strategy)
        ↓
┌─────────────────────────────────────────────┐
│ 1. 查找节点                                  │
│    const node = this.findNode(root, nodeId) │
├─────────────────────────────────────────────┤
│ 2. 检查 isLeaf 字段                          │
│    if (isLeaf(node)) {                      │
│        // 叶子节点，不处理                   │
│        return;                               │
│    }                                         │
├─────────────────────────────────────────────┤
│ 3. 检查是否有子节点                          │
│    const hasChildren = getChildren(node)    │
│    if (hasChildren) {                       │
│        // 有子节点 → 正常展开/收起           │
│        toggleNodeChildren(root, nodeId);     │
│        return;                               │
│    }                                         │
├─────────────────────────────────────────────┤
│ 4. 无子节点 → 检查缓存策略                   │
│    const hasLoaded = hasLoadedChildren(node)│
│    if (hasLoaded && strategy === 'cache-first') { │
│        // 已加载且使用缓存 → 展开缓存子节点  │
│        toggleNodeChildren(root, nodeId);     │
│        return;                               │
│    }                                         │
├─────────────────────────────────────────────┤
│ 5. 执行异步加载                             │
│    const children = await loadChildren(nodeId) │
│    setChildren(node, children)              │
│    markChildrenLoaded(node)                 │
│    toggleNodeChildren(root, nodeId)          │
└─────────────────────────────────────────────┘
        ↓
graph.commit()  → 重新渲染树
```

### 状态转换

| 状态 | isLeaf | children | 展开按钮 | 点击行为 |
|------|--------|----------|----------|----------|
| 叶子节点 | `true` | `[]` / `undefined` | ❌ 不显示 | 无响应 |
| 有子节点 | `false` | `[...]` | ✅ 显示 | 展开/收起 |
| 待加载 | `false` | `[]` | ✅ 显示 | 异步加载 |
| 已加载 | `false` | `[...]` | ✅ 显示 | 展开/收起 |
| 已收起（缓存） | `false` | `[]` | ✅ 显示 | 展开缓存子节点 |

---

## 缓存策略

### CacheFirst（缓存优先）

```typescript
// 策略：首次加载后缓存，后续使用缓存
const strategy = AsyncLoadStrategy.CacheFirst;

// 首次点击节点2
if (!hasLoadedChildren(node2)) {
    const children = await loadChildren(node2);
    setChildren(node2, children);        // 设置子节点
    markChildrenLoaded(node2);           // 标记已加载
    toggleNodeChildren(node2);           // 展开
}

// 后续点击节点2（已缓存）
if (hasLoadedChildren(node2)) {
    // 使用缓存的子节点展开
    toggleNodeChildren(node2);
}
```

### Realtime（实时加载）

```typescript
// 策略：每次展开都重新请求数据
const strategy = AsyncLoadStrategy.Realtime;

// 每次点击节点都重新加载
const children = await loadChildren(nodeId);
setChildren(node, children);
markChildrenLoaded(node);  // 仍然标记，但下次仍会重新加载
toggleNodeChildren(node);
```

### 策略对比

| 特性 | CacheFirst | Realtime |
|------|-----------|----------|
| 加载次数 | 首次加载，后续使用缓存 | 每次展开都加载 |
| 数据新鲜度 | 可能有延迟 | 始终最新 |
| 网络请求 | 少 | 多 |
| 适用场景 | 数据变化不频繁 | 数据实时变化 |
| 性能 | 优 | 一般 |

---

## 最佳实践

### 1. 合理设置 isLeaf

```typescript
// ✅ 推荐：明确标记叶子节点
{
    id: 'leaf',
    label: '叶子节点',
    isLeaf: true,
    children: []
}

// ❌ 不推荐：大量节点都标记为 isLeaf: false
{
    id: 'node',
    label: '节点',
    isLeaf: false,
    children: []
}
```

### 2. 选择合适的缓存策略

```typescript
// ✅ 权限树、菜单树等变化不频繁的数据 → 使用 cache-first
asyncLoad: {
    loadChildren: fetchPermissions,
    // 默认使用 cache-first
}

// ✅ 实时监控数据、股票数据等 → 使用 realtime
asyncLoad: {
    loadChildren: fetchRealtimeData,
    // 设置为 realtime
}
```

### 3. 处理加载错误

```typescript
asyncLoad: {
    loadChildren: async (nodeId) => {
        try {
            const response = await fetch(`/api/children/${nodeId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('加载子节点失败:', error);
            // 返回空数组或抛出错误
            return [];
            // 或者 throw error;
        }
    }
}
```

### 4. 性能优化

```typescript
// ✅ 预加载关键节点
const importantNodes = ['dept-1', 'dept-2', 'dept-3'];
importantNodes.forEach(nodeId => {
    schema.asyncLoad.loadChildren(nodeId);
});

// ✅ 懒加载：只在用户需要时加载
// 不需要在初始化时加载所有数据
```

---

## 注意事项

1. **向后兼容**：不配置 `asyncLoad` 时，使用原有的同步展开/收起逻辑
2. **isLeaf 字段**：应为 boolean 类型，非 boolean 值会自动转换并发出警告
3. **children 为空**：只有 `children: []` 且 `isLeaf: false` 时才触发异步加载
4. **叶子节点**：`isLeaf: true` 时，无论 children 是否有值，都不显示展开按钮
5. **缓存标记**：`_childrenLoaded` 和 `_children` 是内部实现细节，不应在业务代码中使用

---

## 事件记录

### 概述

异步加载功能与事件记录器（EventLogger）紧密结合，可以完整记录异步加载的完整过程，便于调试和监控。

### 事件类型

异步加载涉及以下事件类型：

| 事件类型 | 数据结构 | 说明 |
|---------|---------|------|
| `node:expand` | `{ nodeId: string }` | 展开/收起按钮点击 |
| `node:expand:start` | `{ nodeId: string }` | 异步加载开始 |
| `node:expand:success` | `{ nodeId: string, childCount: number }` | 异步加载成功 |
| `node:expand:error` | `{ nodeId: string, error: string }` | 异步加载失败 |
| `node:async-loaded` | `{ nodeId: string, childCount: number }` | 异步加载完成（数据已设置） |

### GraphCanvas 中的事件记录

在 `GraphCanvas.vue` 中，`handleExpandClick` 函数会自动记录展开事件：

```typescript
// src/pages/data-d3/components/GraphCanvas.vue
async function handleExpandClick(nodeId: string) {
    if (!graph) return;

    // 记录展开事件
    eventLogger.log('node:expand', { nodeId });

    try {
        // 切换节点展开状态（支持异步加载）
        await graph.toggleNodeExpansion(nodeId, asyncLoadStrategy.value);
        
        // 记录加载结果
        const data = graph.getData();
        const node = findNodeById(data, nodeId);
        if (node && node.children) {
            eventLogger.log('node:expand:success', {
                nodeId,
                childCount: node.children.length
            });
        }
    } catch (error) {
        console.error('展开/收起节点失败:', error);
        eventLogger.log('node:expand:error', {
            nodeId,
            error: String(error)
        });
    }
}
```

### SDK 演示页中的事件记录

在 `sdk-demo/index.vue` 中，事件记录器已集成到所有图事件中：

```typescript
// src/pages/data-d3/sdk-demo/index.vue
const eventLogger = new EventLogger({
    maxEvents: 50,
    enableConsoleLog: false
});

function bindGraphEvents(instance: D3TreeGraph) {
    instance.on('node:click', (node) => {
        eventLogger.log('node:click', { id: node.id, label: node.label });
    });
    
    instance.on('node:expand', (nodeId) => {
        eventLogger.log('node:expand', { nodeId });
    });
    
    // 其他事件...
}
```

### 分析异步加载行为

通过事件记录，可以分析用户的异步加载行为：

```typescript
// 获取所有展开事件
const expandEvents = eventLogger.getEventsByType('node:expand');

// 获取异步加载成功事件
const successEvents = eventLogger.getEventsByType('node:expand:success');

// 统计异步加载次数
const loadCount = successEvents.length;
console.log(`用户异步加载了 ${loadCount} 个节点的子节点`);

// 统计加载失败的节点
const errorEvents = eventLogger.getEventsByType('node:expand:error');
const failedNodes = errorEvents.map(e => e.data.nodeId);
console.log(`加载失败的节点: ${failedNodes.join(', ')}`);
```

### 事件记录配置

事件记录器支持通过配置控制异步加载事件的记录：

```typescript
// 创建事件记录器
const eventLogger = new EventLogger({
    maxEvents: 100,           // 最大记录数量
    enableTimestamp: true,    // 记录时间戳
    enableConsoleLog: false   // 不输出到控制台（生产环境）
});

// 监听异步加载事件
instance.on('node:expand', (nodeId) => {
    // 记录展开开始
    eventLogger.log('node:expand:start', { nodeId });
});

instance.on('node:async-loaded', (payload) => {
    // 记录加载完成
    eventLogger.log('node:async-loaded', {
        nodeId: payload.nodeId,
        childCount: payload.children?.length ?? 0
    });
});
```

### 导出异步加载日志

可以将异步加载相关事件导出用于分析：

```typescript
// 导出所有事件
const allEvents = eventLogger.exportToJSON();

// 过滤异步加载相关事件
const asyncEvents = eventLogger.getEvents().filter(e => 
    e.type.startsWith('node:expand') || 
    e.type.startsWith('node:async')
);

// 导出异步加载日志
const asyncLogs = JSON.stringify(asyncEvents, null, 2);
console.log('异步加载日志:', asyncLogs);
```

### 事件时序分析

通过时间戳可以分析异步加载的时序：

```typescript
// 获取最近的事件
const recentEvents = eventLogger.getRecentEvents(10);

// 按时间顺序显示
recentEvents.forEach(event => {
    console.log(`[${event.timeString}] ${event.type}:`, event.data);
});

// 输出示例：
// [14:30:15.123] node:expand:start → { nodeId: 'node-2' }
// [14:30:15.456] node:expand → { nodeId: 'node-2' }
// [14:30:16.789] node:expand:success → { nodeId: 'node-2', childCount: 3 }
// [14:30:16.790] node:async-loaded → { nodeId: 'node-2', childCount: 3 }
```

### 相关文件

| 文件 | 说明 |
|------|------|
| `types/index.ts` | 类型定义（AsyncLoadStrategy 枚举、TreeData 类型） |
| `schema/TreeConfig.ts` | 配置接口（asyncLoad 配置） |
| `schema/TreeAccessors.ts` | 数据访问器（isLeaf、hasLoadedChildren 等方法） |
| `TreeContext.ts` | 树上下文（toggleNodeExpansion 方法） |
| `D3TreeGraph.ts` | 图实例（toggleNodeExpansion 方法、asyncLoadStrategy） |
| `components/GraphCanvas.vue` | Vue 组件（asyncLoadStrategy prop、事件记录） |
| `data/mockData.ts` | Mock 数据（isLeaf 字段示例） |
| `utils/EventLogger.ts` | 事件记录器类 |
| `sdk-demo/index.vue` | SDK 演示页（事件记录集成示例） |
