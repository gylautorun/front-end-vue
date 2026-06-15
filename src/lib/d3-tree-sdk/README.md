# D3 Tree SDK

框架无关的 D3 树形图 SDK。**不对你的 JSON 结构做任何假设**，通过 `schema` 参数传入字段映射与样式。

> 设计文档：[docs/SDK-CORE.md](./docs/SDK-CORE.md)

## 目录

-   [快速开始](#快速开始)
-   [核心概念](#核心概念)
-   [schema 可配置项](#schema-可配置项)
-   [API 速查](#api-速查)
-   [事件系统](#事件系统)
-   [数据操作](#数据操作)
-   [演示](#演示)
-   [拖拽与 zoom](#拖拽与-zoom)
-   [类型定义](#类型定义)
-   [常见问题](#常见问题)

## 快速开始

```typescript
import { D3TreeGraph, defineTreeConfig } from '@/lib/d3-tree-sdk';

// 1. 定义 schema（只写与默认不同的字段）
const schema = defineTreeConfig({
    rootId: 'root',
    fields: {
        id: 'nodeId', // 你的 id 字段
        label: 'title', // 你的名称字段
        children: 'subNodes', // 子节点不叫 children 就改这里
        modules: 'funcList', // 功能模块字段
        relations: 'links', // 关联关系字段
        relationTargetId: 'toId'
    },
    selection: {
        parentId: 'pid' // 多选/整合时父级 id 字段
    },
    defaults: { dept: '默认单位', moduleLevel: 'module' },
    styles: {
        levelColors: { domain: '#f00', module: '#909' },
        edgeColors: { merge: '#f5222d' },
        integrationTypeNames: { merge: '合并' }
    }
});

// 2. 创建实例 —— schema 作为参数传入
const graph = new D3TreeGraph({
    container: '#graph-container',
    data: yourTreeData,
    schema
});

// 3. 挂载
graph.mount();

// 4. 监听事件
graph.on('node:click', (node) => console.log('点击节点', node));
graph.on('node:drop-target', ({ sourceId, targetId }) => {
    console.log(`拖拽 ${sourceId} 到 ${targetId}`);
});

// 5. 操作数据
const ctx = graph.getContext();
ctx.addChildNode(graph.mutateData(), {
    parentId: 'xxx',
    name: '新节点',
    level: 'dept_single',
    integrationType: 'base'
});
graph.commit();

// 6. 销毁
graph.destroy();
```

## 核心概念

### 1. Schema 配置

Schema 是 SDK 的核心概念，用于适配不同的后端数据结构。通过字段映射，SDK 可以处理任意 JSON 结构。

### 2. TreeContext

树操作上下文，封装所有树操作方法：

```typescript
const ctx = graph.getContext();

// 添加子节点
ctx.addChildNode(data, {
    parentId: 'root',
    name: '新节点',
    level: 'domain',
    integrationType: 'base'
});

// 合并节点
ctx.mergeSiblingNodes(data, {
    name: '合并节点',
    integrationType: 'merge',
    sourceId: 'node1',
    targetId: 'node2'
});

// 删除节点
ctx.deleteNodeFromTree(data, 'nodeId');
```

### 3. 数据变更流程

SDK 采用"获取引用 → 修改 → 提交"的数据变更模式：

```typescript
// 1. 获取数据引用
const data = graph.mutateData();

// 2. 修改数据（通过 TreeContext 或直接修改）
const ctx = graph.getContext();
ctx.addChildNode(data, { parentId: 'root', name: 'A', level: 'domain', integrationType: 'base' });

// 3. 提交变更
graph.commit(); // 会重新渲染并记录历史
```

### 4. 历史记录

内置撤销/重做功能：

```typescript
// 撤销
graph.undo();

// 重做
graph.redo();

// 查询状态
if (graph.canUndo()) { ... }
if (graph.canRedo()) { ... }
```

## schema 可配置项

| 配置块                        | 说明                                                                        |
| ----------------------------- | --------------------------------------------------------------------------- |
| `fields`                      | 节点上所有字段名：`id` / `label` / `children` / `modules` / `relations` / … |
| `selection`                   | 多选、整合模块时的 `id` / `label` / `parentId`（可改为 `pid`）              |
| `defaults`                    | 新建节点默认 `dept` / `owner` / `moduleLevel`                               |
| `rootId` / `protectedRootId`  | 根节点与不可删除节点                                                        |
| `levelPriority`               | 合并时 level 优先级                                                         |
| `idPrefix`                    | 新建 id 前缀                                                                |
| `styles.levelColors`          | 节点背景色                                                                  |
| `styles.edgeColors`           | 连线颜色                                                                    |
| `styles.integrationTypeNames` | 整合方式显示名                                                              |

## API 速查

### D3TreeGraph 主类

| 方法                       | 说明             | 示例                                           |
| -------------------------- | ---------------- | ---------------------------------------------- |
| `new D3TreeGraph(options)` | 创建实例         | `new D3TreeGraph({ container, data, schema })` |
| `mount()`                  | 挂载到 DOM       | `graph.mount()`                                |
| `destroy()`                | 销毁实例         | `graph.destroy()`                              |
| `on(event, handler)`       | 监听事件         | `graph.on('node:click', fn)`                   |
| `getData()`                | 获取数据（副本） | `graph.getData()`                              |
| `mutateData()`             | 获取数据引用     | `graph.mutateData()`                           |
| `commit()`                 | 提交变更         | `graph.commit()`                               |
| `render()`                 | 重新渲染         | `graph.render()`                               |
| `refresh()`                | 刷新（恢复初始） | `graph.refresh()`                              |
| `undo()` / `redo()`        | 撤销/重做        | `graph.undo()`                                 |
| `zoomIn()` / `zoomOut()`   | 缩放             | `graph.zoomIn()`                               |
| `fitView()`                | 自适应视图       | `graph.fitView()`                              |
| `getContext()`             | 获取 TreeContext | `graph.getContext()`                           |

### TreeContext

| 方法                         | 说明             |
| ---------------------------- | ---------------- |
| `addChildNode()`             | 添加子节点       |
| `addModule()`                | 添加功能模块     |
| `mergeSiblingNodes()`        | 合并同级节点     |
| `editNode()`                 | 编辑节点         |
| `deleteNodeFromTree()`       | 删除节点         |
| `bindRelation()`             | 绑定关联关系     |
| `integrateSelectedModules()` | 整合选中模块     |
| `findNodeInTree()`           | 查找节点         |
| `canMergeNodesInTree()`      | 判断是否可以合并 |

## 事件系统

### 可监听事件

```typescript
// 节点点击
graph.on('node:click', (node: TreeData) => {
    console.log('点击', node);
});

// 节点双击
graph.on('node:dblclick', (node: TreeData) => {
    console.log('双击', node);
});

// 更多按钮点击
graph.on('node:more', ({ event, nodeId }) => {
    console.log('更多', event, nodeId);
});

// 拖拽放置
graph.on('node:drop-target', ({ sourceId, targetId, sourceData, targetData }) => {
    console.log(`${sourceId} 拖拽到 ${targetId}`);
});

// SVG 点击（空白区域）
graph.on('svg:click', () => {
    console.log('点击空白');
});

// 数据变更
graph.on('data:change', (data: TreeData) => {
    console.log('数据已更新');
});

// 历史状态变更
graph.on('history:change', (state) => {
    console.log('历史', state);
    // state: { canUndo, canRedo, index, length }
});

// 布局方向变更
graph.on('orientation:change', (orientation) => {
    console.log('方向变更', orientation);
});
```

### 监听 zoom 变化

```typescript
const unsub = graph.onZoom((transform) => {
    console.log('缩放:', transform.k);
    console.log('平移:', transform.x, transform.y);
});

// 取消监听
unsub();
```

## 数据操作

### 添加子节点

```typescript
const ctx = graph.getContext();
const data = graph.mutateData();

ctx.addChildNode(data, {
    parentId: 'root',
    name: '新部门',
    level: 'dept_composite',
    integrationType: 'base',
    dept: '教育部'
});

graph.commit();
```

### 添加功能模块

```typescript
ctx.addModule(data, {
    parentId: 'dept1',
    name: '用户管理模块',
    dept: '人力资源部'
});

graph.commit();
```

### 合并同级节点

```typescript
const result = ctx.mergeSiblingNodes(data, {
    name: '教育综合平台',
    integrationType: 'merge',
    sourceId: 'edu1',
    targetId: 'edu2'
});

if (result.ok) {
    graph.commit();
    console.log('合并成功', result.node);
} else {
    console.error('合并失败', result.message);
}
```

### 编辑节点

```typescript
ctx.editNode(data, {
    nodeId: 'node123',
    name: '新名称',
    dept: '新部门',
    level: 'dept_composite',
    owner: '张三'
});

graph.commit();
```

### 删除节点

```typescript
const success = ctx.deleteNodeFromTree(data, 'node123');

if (success) {
    graph.commit();
}
```

### 整合选中模块

```typescript
const result = ctx.integrateSelectedModules(data, {
    selected: [
        { id: 'm1', parentId: 'p1' },
        { id: 'm2', parentId: 'p1' },
        { id: 'm3', parentId: 'p2' }
    ],
    name: '综合管理模块',
    type: 'base'
});

if (result) {
    graph.commit();
    console.log('整合成功', result);
}
```

## 演示

| 页面                | 说明                                         |
| ------------------- | -------------------------------------------- |
| `/data-d3`          | 完整业务，`config/treeConfig.ts` 定义 schema |
| `/data-d3/sdk-demo` | 最小 SDK 演示                                |

### Vue 集成

```vue
<GraphCanvas :tree-data="treeData" :schema="DATA_D3_TREE_SCHEMA" />
```

schema 定义在 `src/pages/data-d3/config/treeConfig.ts`，改一处即可对接后端。

## 拖拽与 zoom

缩放后拖拽使用 `clientToGraphLocal`（zoom 容器 `g` 的 CTM 逆变换），落点检测为 DOM 优先 + 坐标回退。详见 [docs/SDK-CORE.md §7.1](./docs/SDK-CORE.md#71-拖拽与-zoom-坐标2026-06-12) 与页面 [tech-doc.md](../../pages/data-d3/docs/tech-doc.md)。

## 类型定义

### 整合方式（IntegrationTypeKey）

| Key         | 说明     |
| ----------- | -------- |
| `base`      | 基础     |
| `interface` | 接口对接 |
| `migrate`   | 迁移     |
| `merge`     | 合并     |

### 层级类型（LevelKey）

| Key              | 说明           |
| ---------------- | -------------- |
| `domain`         | 领域级应用     |
| `dept_composite` | 部门级综合应用 |
| `dept_single`    | 部门级单点应用 |
| `office_single`  | 处室级单点应用 |
| `module`         | 功能模块       |

## 常见问题

### Q: 如何对接后端数据？

通过 `schema.fields` 配置字段映射：

```typescript
const schema = defineTreeConfig({
    fields: {
        id: 'yourIdField',
        label: 'yourLabelField',
        children: 'yourChildrenField'
    }
});
```

### Q: 如何自定义节点样式？

通过 `schema.styles.levelColors` 配置颜色：

```typescript
const schema = defineTreeConfig({
    styles: {
        levelColors: {
            domain: '#1890ff',
            dept_composite: '#52c41a',
            dept_single: '#faad14'
        }
    }
});
```

### Q: 如何禁用历史记录？

```typescript
const graph = new D3TreeGraph({
    container: '#graph',
    data: treeData,
    enableHistory: false // 禁用撤销/重做
});
```
