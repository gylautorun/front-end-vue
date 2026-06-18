# 事件记录器 (EventLogger)

## 概述

`EventLogger` 是一个用于记录和管理树形图操作事件的工具类。它提供了完整的事件记录功能，支持记录事件类型、数据、时间戳，方便调试和分析用户行为。

## 文件位置

```
src/pages/data-d3/utils/EventLogger.ts
```

## 核心功能

| 功能 | 说明 |
|------|------|
| 记录事件 | 支持记录任何类型的事件，包含自定义数据 |
| 时间戳 | 自动记录事件发生的时间 |
| 格式化时间 | 提供可读性好的时间字符串（HH:mm:ss.SSS） |
| 事件过滤 | 支持按事件类型过滤 |
| 数量限制 | 可配置最大记录数量，防止内存溢出 |
| 导入导出 | 支持 JSON 格式的导入导出 |

## 使用方法

### 基本用法

```typescript
import { EventLogger } from '../utils/EventLogger';

// 创建事件记录器实例
const eventLogger = new EventLogger({
    maxEvents: 100,           // 最大记录数量（默认 100）
    enableTimestamp: true,    // 是否启用时间戳（默认 true）
    enableConsoleLog: false   // 是否输出到控制台（默认 false）
});

// 记录事件
eventLogger.log('node:click', { id: 'node1', label: '节点1' });
eventLogger.log('node:expand', { nodeId: 'node2' });

// 获取最近事件
const lastEvent = eventLogger.getLastEvent();
console.log(lastEvent);
// 输出：
// {
//     type: 'node:click',
//     data: { id: 'node1', label: '节点1' },
//     timestamp: 1718700000000,
//     timeString: '12:00:00.000'
// }
```

### API 详解

#### log<T>(type: string, data: T): void

记录一个事件。

```typescript
// 记录简单事件
eventLogger.log('app:start', {});

// 记录带数据的复杂事件
eventLogger.log('node:drop-target', {
    sourceId: 'node1',
    targetId: 'node2',
    sourceLabel: '节点1',
    targetLabel: '节点2'
});
```

#### getLastEvent(): EventLogEntry | null

获取最近记录的事件。

```typescript
const last = eventLogger.getLastEvent();
if (last) {
    console.log(`最新事件: ${last.type}`);
}
```

#### getEvents(): EventLogEntry[]

获取所有已记录的事件（深拷贝）。

```typescript
const allEvents = eventLogger.getEvents();
console.log(`共记录 ${allEvents.length} 个事件`);
```

#### getEventsByType(type: string): EventLogEntry[]

根据事件类型过滤事件。

```typescript
const clickEvents = eventLogger.getEventsByType('node:click');
const expandEvents = eventLogger.getEventsByType('node:expand');
```

#### getRecentEvents(count: number): EventLogEntry[]

获取最近的 N 个事件。

```typescript
// 获取最近 10 个事件
const recent = eventLogger.getRecentEvents(10);
```

#### getEventCount(): number

获取已记录的事件数量。

```typescript
const count = eventLogger.getEventCount();
```

#### clear(): void

清空所有已记录的事件。

```typescript
eventLogger.clear();
```

#### exportToJSON(): string

将事件导出为 JSON 格式字符串。

```typescript
const json = eventLogger.exportToJSON();
// 可以保存到本地或发送到服务器
```

#### importFromJSON(json: string): void

从 JSON 字符串导入事件记录。

```typescript
eventLogger.importFromJSON(savedJson);
```

## 事件类型

### 节点事件

| 事件类型 | 数据结构 | 说明 |
|---------|---------|------|
| `node:click` | `{ id: string, label: string }` | 节点单击 |
| `node:dblclick` | `{ id: string, label: string }` | 节点双击 |
| `node:more` | `{ nodeId: string }` | 更多按钮点击 |
| `node:expand` | `{ nodeId: string }` | 展开/收起按钮点击 |
| `node:drop-target` | `{ sourceId, targetId, sourceLabel, targetLabel }` | 拖拽放置 |

### 历史事件

| 事件类型 | 数据结构 | 说明 |
|---------|---------|------|
| `history:change` | `{ canUndo: boolean, canRedo: boolean }` | 历史状态变化 |
| `history:undo` | `{}` | 撤销操作 |
| `history:redo` | `{}` | 重做操作 |

### 缩放事件

| 事件类型 | 数据结构 | 说明 |
|---------|---------|------|
| `zoom:in` | `{}` | 放大操作 |
| `zoom:out` | `{}` | 缩小操作 |
| `zoom:reset` | `{}` | 重置缩放 |
| `zoom:fit` | `{}` | 适应视图 |

### 布局事件

| 事件类型 | 数据结构 | 说明 |
|---------|---------|------|
| `layout:toggle` | `{ orientation: 'horizontal' \| 'vertical' }` | 布局切换 |
| `orientation:change` | `{ orientation: 'horizontal' \| 'vertical' }` | 布局方向变化 |

### 其他事件

| 事件类型 | 数据结构 | 说明 |
|---------|---------|------|
| `refresh` | `{}` | 刷新树 |
| `download:png` | `{ filename: string }` | 下载 PNG |

## 集成示例

### 在 Vue 组件中使用

```typescript
import { EventLogger } from '../utils/EventLogger';

const eventLogger = new EventLogger({ maxEvents: 100 });

// 在事件处理中记录
function handleNodeClick(data: TreeData) {
    eventLogger.log('node:click', { id: data.id, label: data.label });
}

function handleExpandClick(nodeId: string) {
    eventLogger.log('node:expand', { nodeId });
    // 执行展开逻辑...
}

// 绑定到 D3TreeGraph
graph.on('node:click', handleNodeClick);
graph.on('node:expand', handleExpandClick);
```

### 在 SDK 演示页中使用

```typescript
// src/pages/data-d3/sdk-demo/index.vue
import { EventLogger } from '../utils/EventLogger';

const eventLogger = new EventLogger({
    maxEvents: 50,
    enableConsoleLog: true  // 在演示时显示到控制台
});

function bindGraphEvents(instance: D3TreeGraph) {
    instance.on('node:click', (node) => {
        eventLogger.log('node:click', { id: node.id, label: node.label });
    });
    instance.on('node:expand', (nodeId) => {
        eventLogger.log('node:expand', { nodeId });
    });
    // ... 其他事件
}
```

## EventLogEntry 数据结构

```typescript
interface EventLogEntry<T = any> {
    /** 事件类型 */
    type: string;
    
    /** 事件数据（用户传入的任意数据） */
    data: T;
    
    /** Unix 时间戳（毫秒） */
    timestamp: number;
    
    /** 格式化的时间字符串 */
    timeString: string;  // 格式: "HH:mm:ss.SSS"
}
```

## EventLogger 配置选项

```typescript
interface EventLoggerOptions {
    /** 最大记录数量（默认 100） */
    maxEvents?: number;
    
    /** 是否启用时间戳（默认 true） */
    enableTimestamp?: boolean;
    
    /** 是否启用控制台日志（默认 false） */
    enableConsoleLog?: boolean;
}
```

## 与异步加载的集成

事件记录器与异步加载功能紧密结合，可以记录异步加载的完整过程：

```typescript
// 记录展开操作（可能触发异步加载）
instance.on('node:expand', async (nodeId) => {
    eventLogger.log('node:expand:start', { nodeId });
    
    try {
        await graph.toggleNodeExpansion(nodeId);
        eventLogger.log('node:expand:success', { nodeId });
    } catch (error) {
        eventLogger.log('node:expand:error', { nodeId, error: String(error) });
    }
});

// 记录异步加载完成事件
instance.on('node:async-loaded', (payload) => {
    eventLogger.log('node:async-loaded', {
        nodeId: payload.nodeId,
        childCount: payload.children?.length ?? 0
    });
});
```

## 最佳实践

### 1. 合理设置最大记录数量

```typescript
// 生产环境：限制记录数量
const eventLogger = new EventLogger({ maxEvents: 100 });

// 演示/调试：增加记录数量
const eventLogger = new EventLogger({ maxEvents: 500 });
```

### 2. 记录关键业务事件

```typescript
// ✅ 推荐：记录有意义的业务事件
eventLogger.log('merge:complete', { sourceId, targetId, mergeType });

// ❌ 不推荐：记录过于频繁的内部事件
eventLogger.log('render:frame', { frame: 123 });
```

### 3. 使用结构化数据

```typescript
// ✅ 推荐：使用描述性字段名
eventLogger.log('node:drop-target', {
    sourceId: 'node1',
    targetId: 'node2',
    action: 'merge'
});

// ❌ 不推荐：使用模糊的数据结构
eventLogger.log('node:drop-target', { a: 'node1', b: 'node2' });
```

### 4. 启用控制台日志用于调试

```typescript
// 开发环境
const eventLogger = new EventLogger({ 
    enableConsoleLog: import.meta.env.DEV 
});
```

## 调试与分析

### 导出事件用于分析

```typescript
// 定期导出事件
setInterval(() => {
    const events = eventLogger.exportToJSON();
    localStorage.setItem('tree-events', events);
}, 60000); // 每分钟保存一次
```

### 分析用户行为

```typescript
// 统计事件频率
const events = eventLogger.getEvents();
const eventCounts = events.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
}, {});

console.log('事件统计:', eventCounts);
// { 'node:click': 45, 'node:expand': 12, 'history:undo': 3 }
```
