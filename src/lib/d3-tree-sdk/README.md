# D3 Tree SDK

框架无关的 D3 树形图 SDK。**不对你的 JSON 结构做任何假设**，通过 `schema` 参数传入字段映射与样式。

> 设计文档：[docs/SDK-CORE.md](./docs/SDK-CORE.md)

## 核心用法（必看）

```typescript
import { D3TreeGraph, defineTreeConfig } from '@/lib/d3-tree-sdk';

// 1. 声明你的数据结构（只写与默认不同的字段）
const schema = defineTreeConfig({
  rootId: 'root',
  fields: {
    id: 'nodeId',           // 你的 id 字段
    label: 'title',         // 你的名称字段
    children: 'subNodes',   // 子节点不叫 children 就改这里
    modules: 'funcList',
    relations: 'links',
    relationTargetId: 'toId',
  },
  selection: {
    parentId: 'pid'         // 多选/整合时父级 id 字段
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

graph.mount();

// 3. 变更数据 —— 全部走 TreeContext + 同一套 schema
const ctx = graph.getContext();
ctx.addChildNode(graph.mutateData(), {
  parentId: 'xxx',
  name: '新节点',
  level: 'dept_single',
  integrationType: 'merge'
});
graph.commit();
```

## schema 可配置项

| 配置块 | 说明 |
|--------|------|
| `fields` | 节点上所有字段名：`id` / `label` / `children` / `modules` / `relations` / … |
| `selection` | 多选、整合模块时的 `id` / `label` / `parentId`（可改为 `pid`） |
| `defaults` | 新建节点默认 `dept` / `owner` / `moduleLevel` |
| `rootId` / `protectedRootId` | 根节点与不可删除节点 |
| `levelPriority` | 合并时 level 优先级 |
| `idPrefix` | 新建 id 前缀 |
| `styles.levelColors` | 节点背景色 |
| `styles.edgeColors` | 连线颜色 |
| `styles.integrationTypeNames` | 整合方式显示名 |

## API 速查

| 方法 | 说明 |
| ---- | ---- |
| `defineTreeConfig(partial)` | 定义 schema（推荐） |
| `new D3TreeGraph({ schema, data, container })` | 创建实例 |
| `graph.getContext()` | 获取带 schema 的 TreeContext |
| `graph.mutateData()` + `graph.commit()` | 变更并提交 |
| `ctx.addChildNode` / `mergeSiblingNodes` / … | 树操作 |

## 演示

| 页面 | 说明 |
|------|------|
| `/data-d3` | 完整业务，`config/treeConfig.ts` 定义 schema |
| `/data-d3/sdk-demo` | 最小 SDK 演示 |

## Vue 集成

```vue
<GraphCanvas :tree-data="treeData" :schema="DATA_D3_TREE_SCHEMA" />
```

schema 定义在 `src/pages/data-d3/config/treeConfig.ts`，改一处即可对接后端。

## 拖拽与 zoom

缩放后拖拽使用 `clientToGraphLocal`（zoom 容器 `g` 的 CTM 逆变换），落点检测为 DOM 优先 + 坐标回退。详见 [docs/SDK-CORE.md §7.1](./docs/SDK-CORE.md#71-拖拽与-zoom-坐标2026-06-12) 与页面 [tech-doc.md](../../pages/data-d3/docs/tech-doc.md)。
