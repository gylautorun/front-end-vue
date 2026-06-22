# D3 Tree SDK 对外设计文档

> 版本：1.0.0
> 更新日期：2026-06-18

## 目录

1. [概述](#1-概述)
2. [快速开始](#2-快速开始)
3. [核心概念](#3-核心概念)
4. [API 文档](#4-api-文档)
5. [事件系统](#5-事件系统)
6. [事件记录器](#6-事件记录器)
7. [交互模式](#7-交互模式)
8. [异步加载](#8-异步加载)
9. [展开收起](#9-展开收起)
10. [拖拽与缩放](#10-拖拽与缩放)
11. [Schema 配置](#11-schema-配置)
12. [最佳实践](#12-最佳实践)
13. [常见问题](#13-常见问题)

## 1. 概述

D3 Tree SDK 是一个**框架无关**的 D3 树形图可视化 SDK。它不对你的 JSON 数据结构做任何假设，通过 `schema` 参数传入字段映射与样式配置，即可适配任意后端数据结构。

### 1.1 特性

-   **框架无关**：不依赖 Vue/React，可与任何框架集成
-   **Schema 配置**：通过配置适配任意数据结构
-   **丰富交互**：节点点击、双击、拖拽、缩放、展开收起
-   **历史管理**：内置撤销/重做功能
-   **事件记录**：支持操作事件记录与导出
-   **异步加载**：支持按需异步加载子节点
-   **灵活样式**：支持自定义节点颜色、连线样式、边框等

### 1.2 架构

```
┌─────────────────────────────────────────────────────────┐
│                      D3TreeGraph                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │TreeContext  │  │ EventLogger │  │  HistoryStack   │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │   Schema    │  │   D3 Core   │  │  AsyncLoader    │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

-   **D3TreeGraph**：主入口类，负责初始化和协调各模块
-   **TreeContext**：树形数据与状态管理中心
-   **EventLogger**：操作事件记录器
-   **HistoryStack**：撤销/重做历史栈
-   **Schema**：字段映射与配置系统

## 2. 快速开始

### 2.1 安装依赖

```bash
npm install d3
```

### 2.2 最小示例

```typescript
import { D3TreeGraph, defineTreeConfig } from '@/lib/d3-tree-sdk';

// 定义 schema，映射你的数据字段
const schema = defineTreeConfig({
    rootId: 'root',
    fields: {
        id: 'id',
        label: 'name',
        children: 'children'
    }
});

// 树形数据
const treeData = {
    id: 'root',
    name: '根节点',
    children: [
        { id: '1', name: '子节点1' },
        { id: '2', name: '子节点2', children: [...] }
    ]
};

// 创建实例
const graph = new D3TreeGraph({
    container: '#graph-container',
    data: treeData,
    schema
});

// 监听事件
graph.on('node:click', (node) => {
    console.log('点击节点:', node.label);
});

// 挂载渲染
graph.mount();
```

### 2.3 完整配置示例

```typescript
const graph = new D3TreeGraph({
    container: '#graph-container',
    data: treeData,
    schema,
    // 异步加载子节点
    asyncLoader: async (nodeId) => {
        const response = await fetch(`/api/nodes/${nodeId}/children`);
        return response.json();
    },
    // 加载策略
    strategy: 'cache-first',
    // 交互模式
    interactionMode: 'click',
    // 缩放范围
    zoomExtent: [0.3, 3],
    // 节点样式
    nodeStyle: {
        width: 160,
        height: 40,
        radius: 8
    }
});

graph.mount();
```

## 3. 核心概念

### 3.1 TreeContext

TreeContext 是树形数据与状态管理中心，负责：

-   管理树形数据的引用
-   维护节点的展开/收起状态
-   提供数据查询接口
-   触发数据变更通知

```typescript
const context = graph.getContext();

// 获取节点
const node = context.getNode('node-id');

// 获取子节点
const children = context.getChildren('node-id');

// 检查是否展开
const isExpanded = context.isExpanded('node-id');

// 展开/收起
context.expand('node-id');
context.collapse('node-id');
```

### 3.2 Schema 配置

Schema 是数据与视图之间的桥梁，定义字段映射关系：

```typescript
const schema = defineTreeConfig({
    rootId: 'root',
    fields: {
        id: 'id', // 节点 ID 字段
        label: 'label', // 显示文本字段
        children: 'children', // 子节点字段
        parent: 'parentId' // 父节点 ID 字段（可选）
    },
    // 节点样式映射
    style: {
        label: 'color', // 标签颜色字段
        icon: 'icon' // 图标字段
    }
});
```

### 3.3 数据变更流程

```
获取引用 → 修改数据 → 提交变更
```

```typescript
// 获取数据引用
const ref = context.getDataRef();

// 修改数据
ref.mutateData((data) => {
    data.children.push({ id: 'new', label: '新节点' });
});

// 提交变更
ref.commit();
```

## 4. API 文档

### 4.1 D3TreeGraph 类

#### 构造函数

```typescript
new D3TreeGraph(options: TreeOptions): D3TreeGraph
```

**options:**

| 参数            | 类型                            | 必填 | 说明                       |
| --------------- | ------------------------------- | ---- | -------------------------- |
| container       | string\| HTMLElement            | 是   | 容器选择器或元素           |
| data            | TreeData                        | 是   | 初始树形数据               |
| schema          | TreeSchema                      | 是   | Schema 配置                |
| asyncLoader     | AsyncLoader                     | 否   | 异步加载函数               |
| strategy        | 'cache-first'\| 'network-first' | 否   | 加载策略，默认 cache-first |
| interactionMode | 'click'\| 'dblclick'            | 否   | 交互模式，默认 click       |
| zoomExtent      | [number, number]                | 否   | 缩放范围，默认 [0.3, 3]    |
| nodeStyle       | NodeStyle                       | 否   | 节点样式配置               |

#### 核心方法

| 方法                     | 返回值      | 说明                  |
| ------------------------ | ----------- | --------------------- |
| mount()                  | void        | 挂载并渲染树形图      |
| unmount()                | void        | 卸载树形图            |
| on(event, handler)       | void        | 绑定事件监听          |
| off(event, handler)      | void        | 解绑事件监听          |
| getContext()             | TreeContext | 获取 TreeContext 实例 |
| zoomTo(scale, duration?) | void        | 缩放到指定级别        |
| fitView(duration?)       | void        | 自适应视图            |
| exportSVG()              | string      | 导出 SVG              |
| undo()                   | boolean     | 撤销                  |
| redo()                   | boolean     | 重做                  |

### 4.2 TreeContext 类

```typescript
interface TreeContext {
    // 获取节点
    getNode(id: string): TreeNode | undefined;

    // 获取子节点
    getChildren(id: string): TreeNode[];

    // 获取根节点
    getRoot(): TreeNode;

    // 检查节点是否存在
    hasNode(id: string): boolean;

    // 检查是否展开
    isExpanded(id: string): boolean;

    // 展开节点
    expand(id: string): void;

    // 收起节点
    collapse(id: string): void;

    // 展开所有
    expandAll(): void;

    // 收起所有
    collapseAll(): void;

    // 获取数据引用
    getDataRef(): DataRef;

    // 重新渲染
    render(): void;
}
```

### 4.3 defineTreeConfig

```typescript
function defineTreeConfig(options: TreeConfigOptions): TreeSchema;
```

**options:**

| 参数   | 类型          | 必填 | 说明         |
| ------ | ------------- | ---- | ------------ |
| rootId | string        | 是   | 根节点 ID    |
| fields | FieldsMapping | 是   | 字段映射配置 |
| style  | StyleMapping  | 否   | 样式映射配置 |

## 5. 事件系统

### 5.1 事件类型

| 事件名           | 参数                 | 说明         |
| ---------------- | -------------------- | ------------ |
| node:click       | TreeNode             | 节点点击     |
| node:dblclick    | TreeNode             | 节点双击     |
| node:contextmenu | TreeNode, MouseEvent | 节点右键     |
| expand           | TreeNode             | 节点展开     |
| collapse         | TreeNode             | 节点收起     |
| select           | TreeNode             | 节点选中     |
| deselect         | TreeNode             | 节点取消选中 |
| drag:start       | TreeNode             | 开始拖拽     |
| drag:end         | TreeNode             | 结束拖拽     |
| zoom             | Transform            | 缩放变更     |
| view:change      | ViewState            | 视图变更     |

### 5.2 事件监听

```typescript
// 单次监听
graph.on('node:click', (node) => {
    console.log('点击:', node.label);
});

// 监听多个事件
graph.on('node:click', handleClick);
graph.on('expand', handleExpand);

// 移除监听
graph.off('node:click', handleClick);
```

### 5.3 事件阻止

```typescript
graph.on('node:click', (node, event) => {
    if (node.id === 'forbidden') {
        event.stopPropagation();
    }
});
```

## 6. 事件记录器

### 6.1 EventLogger

EventLogger 负责记录所有操作事件，支持事件回放和导出。

```typescript
const logger = graph.getEventLogger();

// 监听所有事件
logger.on('*', (event: EventLogEntry) => {
    console.log(event.type, event.data);
});

// 获取事件历史
const history = logger.getHistory();

// 导出事件
const exported = logger.export();

// 清空历史
logger.clear();
```

### 6.2 EventLogEntry 接口

```typescript
interface EventLogEntry {
    id: string; // 事件 ID
    type: string; // 事件类型
    timestamp: number; // 时间戳
    data: any; // 事件数据
    nodeId?: string; // 相关节点 ID
}
```

### 6.3 事件订阅

```typescript
// 订阅特定类型事件
logger.subscribe('node:click', (entry) => {
    analytics.track('node_clicked', { nodeId: entry.nodeId });
});

// 批量订阅
logger.subscribe(['expand', 'collapse'], (entry) => {
    console.log('树操作:', entry.type);
});
```

## 7. 交互模式

### 7.1 点击模式（默认）

-   **单击节点**：选中节点
-   **单击展开/收起按钮**：切换节点展开状态
-   **双击画布**：放大视图

### 7.2 双击模式

-   **双击节点**：选中节点
-   **双击展开/收起按钮**：切换节点展开状态

### 7.3 拖拽操作

-   **拖拽节点**：移动节点位置
-   **拖拽节点到目标节点**：合并节点（需配置 `allowMerge`）

```typescript
const graph = new D3TreeGraph({
    // ...
    allowMerge: true,
    onMerge: (sourceId, targetId) => {
        console.log(`合并 ${sourceId} 到 ${targetId}`);
    }
});
```

## 8. 异步加载

### 8.1 配置异步加载器

```typescript
const graph = new D3TreeGraph({
    container: '#graph',
    data: treeData,
    schema,
    asyncLoader: async (nodeId: string) => {
        const response = await fetch(`/api/tree/${nodeId}/children`);
        return response.json();
    },
    strategy: 'cache-first' // 或 'network-first'
});
```

### 8.2 数据结构要求

异步加载返回的数据需包含 `isLeaf` 字段标识叶子节点：

```typescript
interface AsyncNodeData {
    id: string;
    label: string;
    children?: AsyncNodeData[];
    isLeaf?: boolean; // true 表示叶子节点，不会有子节点
}
```

### 8.3 缓存策略

| 策略          | 说明                               |
| ------------- | ---------------------------------- |
| cache-first   | 优先使用缓存，缓存不存在时请求网络 |
| network-first | 优先请求网络，网络失败时使用缓存   |

## 9. 展开收起

### 9.1 自动渲染

SDK 自动在每个非叶子节点上渲染展开/收起按钮。

### 9.2 手动控制

```typescript
const context = graph.getContext();

// 展开单个节点
context.expand('node-id');

// 收起单个节点
context.collapse('node-id');

// 展开所有
context.expandAll();

// 收起所有
context.collapseAll();
```

### 9.3 事件监听

```typescript
graph.on('expand', (node) => {
    console.log('展开:', node.label);
});

graph.on('collapse', (node) => {
    console.log('收起:', node.label);
});
```

## 10. 拖拽与缩放

### 10.1 拖拽节点

```typescript
const graph = new D3TreeGraph({
    // ...
    draggable: true,
    onDragEnd: (nodeId, x, y) => {
        console.log(`节点 ${nodeId} 拖拽到 (${x}, ${y})`);
    }
});
```

### 10.2 缩放控制

```typescript
// 设置缩放范围
const graph = new D3TreeGraph({
    zoomExtent: [0.3, 3] // 最小 30%，最大 300%
});

// 程序控制缩放
graph.zoomTo(0.5); // 缩放到 50%
graph.zoomTo(2, 500); // 500ms 动画缩放到 200%

// 自适应视图
graph.fitView(); // 立即适应
graph.fitView(800); // 800ms 动画适应
```

### 10.3 导出 SVG

```typescript
const svgString = graph.exportSVG();

// 保存为文件
const blob = new Blob([svgString], { type: 'image/svg+xml' });
const url = URL.createObjectURL(blob);
// 下载文件...
```

## 11. Schema 配置

### 11.1 完整配置

```typescript
const schema = defineTreeConfig({
    rootId: 'root',
    fields: {
        id: 'id',
        label: 'label',
        children: 'children',
        parent: 'parentId'
    },
    style: {
        label: 'color',
        bgColor: 'backgroundColor',
        icon: 'icon'
    },
    meta: {
        iconField: 'icon',
        linkColorField: 'linkColor'
    }
});
```

### 11.2 字段映射规则

| 目标字段 | 源数据结构   | 说明               |
| -------- | ------------ | ------------------ |
| id       | 节点唯一标识 | 必填               |
| label    | 显示文本     | 必填               |
| children | 子节点数组   | 必填               |
| parent   | 父节点 ID    | 可选，用于快速查找 |
| color    | 节点颜色     | 可选               |
| icon     | 节点图标     | 可选               |

## 12. 最佳实践

### 12.1 数据组织

```typescript
// 推荐：保持数据扁平化
const treeData = {
    id: 'root',
    label: '根节点',
    children: [
        { id: '1', label: '节点1', children: [] },
        { id: '2', label: '节点2' }
    ]
};
```

### 12.2 性能优化

-   对于大数据量，启用异步加载
-   合理设置 `zoomExtent` 限制缩放范围
-   不需要交互时设置 `draggable: false`

```typescript
const graph = new D3TreeGraph({
    // ...
    virtualize: true, // 启用虚拟化
    maxVisibleNodes: 500 // 最大可见节点数
});
```

### 12.3 事件处理

```typescript
// 推荐：使用命名函数便于移除
function handleNodeClick(node) {
    // 处理逻辑
}

graph.on('node:click', handleNodeClick);

// 组件卸载时移除
graph.off('node:click', handleNodeClick);
```

## 13. 常见问题

### Q1: 如何自定义节点样式？

```typescript
const schema = defineTreeConfig({
    // ...
});

const graph = new D3TreeGraph({
    // ...
    nodeStyle: {
        width: 180,
        height: 48,
        radius: 12,
        fill: '#ffffff',
        stroke: '#3498db',
        strokeWidth: 2
    }
});
```

### Q2: 如何禁止拖拽？

```typescript
const graph = new D3TreeGraph({
    draggable: false
});
```

### Q3: 如何获取当前选中的节点？

```typescript
graph.on('select', (node) => {
    console.log('当前选中:', node);
});

// 或者通过 context 获取
const selected = graph.getContext().getSelectedNodes();
```

### Q4: 异步加载的数据格式是什么？

```typescript
// 返回格式
{
    id: 'node-id',
    label: '节点名称',
    children: [
        { id: 'child-1', label: '子节点1' },
        { id: 'child-2', label: '子节点2', isLeaf: true }
    ]
}
```

### Q5: 如何实现节点合并？

```typescript
const graph = new D3TreeGraph({
    allowMerge: true,
    onMerge: (sourceId, targetId) => {
        // 合并后的业务逻辑
        console.log(`将 ${sourceId} 合并到 ${targetId}`);
    }
});
```

## 更新日志

### v1.0.0 (2026-06-18)

-   初始版本发布
-   支持框架无关集成
-   Schema 配置系统
-   事件系统
-   异步加载
-   拖拽与缩放
-   历史管理
