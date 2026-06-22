# 事件记录器 (EventLogger)

## 概述

`EventLogger` 是一个用于记录和管理 D3 树形图操作事件的工具类。它提供了完整的事件记录功能，支持事件订阅、响应式更新、JSON 导出等特性。

## 文件位置

```
SDK 实现：src/lib/d3-tree-sdk/core/EventLogger.ts
业务层 re-export：src/pages/data-d3/utils/EventLogger.ts
```

## 核心功能

| 功能 | 说明 |
|------|------|
| 记录事件 | 支持记录任何类型的事件，包含自定义数据 |
| 事件订阅 | 支持订阅机制，事件变化时自动通知订阅者 |
| 时间戳 | 自动记录事件发生的时间（使用 dayjs 格式化） |
| 数量限制 | 可配置最大记录数量（默认 100），防止内存溢出 |
| 导出 | 支持 JSON 格式导出 |
| 清空 | 支持清空历史记录 |

## 事件类型清单

### 节点操作

| 事件类型 | 显示名称 | 详情格式 |
| -------- | -------- | -------- |
| `node:click` | 点击节点 | 节点名称xxx, 节点id:xxx |
| `node:dblclick` | 双击节点 | 节点名称xxx, 节点id:xxx |
| `node:more` | 更多操作 | 节点id:xxx |
| `node:expand` | 展开 | 节点名称xxx, 节点id:xxx |
| `node:collapse` | 收起 | 节点名称xxx, 节点id:xxx |
| `node:drop-target` | 拖拽节点 | 拖拽节点A → 节点B |
| `node:select-multi` | 多选节点 | 节点名称xxx, 节点id:xxx |
| `node:deselect` | 取消选中 | 节点名称xxx, 节点id:xxx |
| `node:add` | 新增节点 | 节点名称xxx, 父节点id:xxx |
| `node:delete` | 删除节点 | 节点名称xxx, 节点id:xxx |
| `node:edit` | 编辑节点 | 节点名称xxx, 节点id:xxx |
| `node:integration` | 整合节点 | 节点名称xxx, 节点id:xxx |

### 历史操作

| 事件类型 | 显示名称 | 详情格式 |
| -------- | -------- | -------- |
| `history:change` | 历史变化 | canUndo: boolean, canRedo: boolean |
| `history:undo` | 撤销 | - |
| `history:redo` | 重做 | - |

### 视图操作

| 事件类型 | 显示名称 | 详情格式 |
| -------- | -------- | -------- |
| `zoom:in` | 放大 | - |
| `zoom:out` | 缩小 | - |
| `zoom:reset` | 重置缩放 | - |
| `zoom:fit` | 适应视图 | - |
| `layout:toggle` | 切换布局 | 布局方向: vertical/horizontal |
| `orientation:change` | 方向变化 | orientation: string |
| `refresh` | 刷新 | - |
| `download` | 下载图片 | - |

### 其他操作

| 事件类型 | 显示名称 | 详情格式 |
| -------- | -------- | -------- |
| `module:add` | 新增模块 | 节点名称xxx |

## 类型定义

```typescript
/**
 * 事件日志条目
 */
export interface EventLogEntry {
    type: string;           // 事件类型
    data: any;             // 事件数据
    timestamp: number;      // 时间戳（毫秒）
    formattedTime: string;  // 格式化后的时间（YYYY-MM-DD HH:mm:ss）
}

/**
 * EventLogger 配置选项
 */
export interface EventLoggerOptions {
    maxEvents?: number;         // 最大记录数量，默认 100
    enableTimestamp?: boolean;   // 是否启用时间戳，默认 true
    enableConsoleLog?: boolean;  // 是否输出到控制台，默认 false
}

/**
 * 事件订阅回调函数类型
 */
export type EventLoggerCallback = (events: EventLogEntry[]) => void;
```

## 使用方法

### 基本用法

```typescript
import { EventLogger } from '@/lib/d3-tree-sdk';

// 创建事件记录器实例
const eventLogger = new EventLogger({
    maxEvents: 100,           // 最大记录数量（默认 100）
    enableTimestamp: true,    // 是否启用时间戳（默认 true）
    enableConsoleLog: false   // 是否输出到控制台（默认 false）
});

// 记录事件
eventLogger.log('node:click', { id: 'node1', label: '节点1' });
eventLogger.log('node:expand', { nodeId: 'node2', label: '节点2', action: 'expand' });

// 获取所有事件
const allEvents = eventLogger.getEvents();
console.log(allEvents);
// 输出：
// [
//     {
//         type: 'node:click',
//         data: { id: 'node1', label: '节点1' },
//         timestamp: 1750294845000,
//         formattedTime: '2026-06-18 14:30:45'
//     },
//     {
//         type: 'node:expand',
//         data: { nodeId: 'node2', label: '节点2', action: 'expand' },
//         timestamp: 1750294846000,
//         formattedTime: '2026-06-18 14:30:46'
//     }
// ]
```

### 事件订阅（响应式更新）

```typescript
import { EventLogger, EventLoggerCallback } from '@/lib/d3-tree-sdk';

// 创建事件记录器
const eventLogger = new EventLogger();

// 订阅事件变化
const unsubscribe: () => void = eventLogger.subscribe((events: EventLogEntry[]) => {
    console.log(`收到 ${events.length} 个事件`);
    // 更新 UI
    this.events = events;
});

// 取消订阅
unsubscribe();
```

### 导出事件

```typescript
// 导出为 JSON 字符串
const jsonString = eventLogger.exportEvents();
console.log(jsonString);

// 保存到文件
const blob = new Blob([jsonString], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `events-${new Date().toISOString()}.json`;
a.click();
```

### 清空历史

```typescript
// 清空所有事件记录
eventLogger.clear();
```

## API 详解

### log<T>(type: string, data: T): void

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

### subscribe(callback: EventLoggerCallback): () => void

订阅事件变化。当有新事件记录时，所有订阅者都会收到通知。

```typescript
// 订阅
const unsubscribe = eventLogger.subscribe((events) => {
    console.log('事件已更新:', events.length);
});

// 取消订阅
unsubscribe();
```

### getEvents(): EventLogEntry[]

获取所有已记录的事件。

```typescript
const allEvents = eventLogger.getEvents();
console.log(`共记录 ${allEvents.length} 个事件`);
```

### exportEvents(): string

导出所有事件为 JSON 字符串。

```typescript
const json = eventLogger.exportEvents();
```

### clear(): void

清空所有事件记录。

```typescript
eventLogger.clear();
```

## 与 Vue 响应式系统集成

由于 `EventLogger` 是一个普通类，Vue 的响应式系统无法检测其内部数组的变化。因此，`EventLogger` 提供了订阅机制来解决这个问题。

```typescript
// EventHistoryPanel.vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import type { EventLogEntry } from '@/lib/d3-tree-sdk';

const props = defineProps<{
    eventLogger: EventLogger;
}>();

// 响应式数据
const events = ref<EventLogEntry[]>([]);
let unsubscribe: (() => void) | null = null;

onMounted(() => {
    // 初始化事件列表
    events.value = props.eventLogger.getEvents();
    
    // 订阅事件变化
    unsubscribe = props.eventLogger.subscribe((newEvents) => {
        events.value = newEvents;
    });
});

onUnmounted(() => {
    // 取消订阅
    unsubscribe?.();
});
</script>
```

## 业务层使用示例

在 `GraphCanvas.vue` 中使用：

```typescript
import { EventLogger } from '@/pages/data-d3/utils/EventLogger';

const props = defineProps<{
    eventLogger?: EventLogger;
}>();

// 获取 EventLogger 实例
function getEventLogger(): EventLogger {
    return props.eventLogger || new EventLogger();
}

// 记录事件
function handleNodeClick(data: TreeData) {
    getEventLogger().log('node:click', { id: data.id, label: data.label });
    emit('select-node', data);
}

function handleNodeDoubleClick(data: TreeData) {
    getEventLogger().log('node:dblclick', { id: data.id, label: data.label });
    emit('toggle-select', data);
}
```

## 时间处理

所有时间处理统一使用 `dayjs`：

```typescript
import dayjs from 'dayjs';

// 时间戳格式化
dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss');
// 输出：2026-06-18 14:30:45

// 获取当前时间戳
dayjs().valueOf();
```

## 注意事项

1. **订阅机制**：如果需要在 Vue 组件中实时显示事件历史，必须使用订阅机制而不是直接访问 `getEvents()`。

2. **内存限制**：`maxEvents` 配置限制了最大记录数量，超过后会自动删除最旧的事件。

3. **事件类型命名**：建议使用 `命名空间:操作` 格式，如 `node:click`、`zoom:in` 等。

4. **数据序列化**：导出的 JSON 包含完整的时间戳和格式化时间，可用于日志分析和审计。
