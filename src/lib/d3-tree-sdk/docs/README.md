# D3 Tree SDK 文档

## 快速链接

| 文档                                       | 说明                                   |
| ------------------------------------------ | -------------------------------------- |
| [../README.md](../README.md)               | **API 速查 + defineTreeConfig 示例**   |
| [SDK-CORE.md](./SDK-CORE.md)               | 完整设计（架构、schema、集成、可分享） |
| [async-load.md](./async-load.md)           | **异步加载子节点功能**                 |
| [expand-collapse.md](./expand-collapse.md) | **展开收起按钮及逻辑**                 |
| [event-logger.md](./event-logger.md)      | **事件记录器（EventLogger）**          |
| [operation-modes.md](./operation-modes.md) | **操作模式说明（点击/双击/拖拽）**     |

## 演示

| 页面         | 路径                   |
| ------------ | ---------------------- |
| 完整业务     | 菜单「数据-d3-可视化」 |
| SDK 最小演示 | `/data-d3/sdk-demo`    |

## 最小示例（复制即用）

```typescript
import { D3TreeGraph, defineTreeConfig, initialTreeData } from '@/lib/d3-tree-sdk';

const schema = defineTreeConfig({
    rootId: 'edu',
    fields: { id: 'id', label: 'label', children: 'children' }
});

const graph = new D3TreeGraph({
    container: '#graph-container',
    data: initialTreeData,
    schema
});

graph.on('node:click', (node) => console.log(node.label));
graph.mount();
```

业务页 schema 见：`src/pages/data-d3/config/treeConfig.ts`

## 2026-06-18 更新说明

本次更新包含以下修复和改进：

### 问题修复

1. **双击节点无法触发多选切换**：`isDragExcludeButton` 函数向上遍历 DOM 树检查按钮，当节点卡片包含按钮时，双击卡片也会被错误拦截。已修复。
2. **点击更多按钮打开详情抽屉**：点击更多按钮现在只打开上下文菜单，不影响选中状态。
3. **双击画布误触发放大**：通过 D3 zoom 的 `filter` 禁用了双击事件。
4. **更多菜单重复点击问题**：添加了状态清理逻辑。

### 新增功能

1. **事件记录系统（EventLogger）**：完整的操作事件记录功能，支持事件订阅和响应式更新。
2. **选中节点样式**：选中节点显示蓝色虚线边框。
3. **展开/收起操作记录**：展开和收起作为独立事件类型记录。

### 设计文档

- [event-logger.md](./event-logger.md) - 完整的 EventLogger 文档
- [expand-collapse.md](./expand-collapse.md) - 展开收起逻辑说明
- [operation-modes.md](./operation-modes.md) - 操作模式说明
