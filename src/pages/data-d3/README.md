# data-d3 应用整合图

教育局应用体系 D3 树形图页面，**当前可直接运行**，已接入 `@/lib/d3-tree-sdk`。

## 快速开始

| 入口 | 路径 | 说明 |
|------|------|------|
| 完整业务页 | 菜单「数据-d3-可视化」 | 模态框、Drawer、合并、历史栈 |
| SDK 最小演示 | `/data-d3/sdk-demo` | 仅 D3TreeGraph，无业务 UI |

本地启动项目后打开上述路由即可。

## 当前架构（一览）

```
index.vue（Vue UI + 业务编排）
    │  :schema="DATA_D3_TREE_SCHEMA"
    │  applyTreeChange* → graph.getContext()
    ▼
GraphCanvas.vue（薄包装）
    │  new D3TreeGraph({ schema, data })
    ▼
@/lib/d3-tree-sdk
    ├── D3TreeGraph      渲染 / 缩放 / 历史 / 事件
    ├── TreeContext      树操作（增删改、合并）
    ├── schema/*         字段映射（fields / selection / styles）
    └── core/d3Tree.ts   D3 渲染与拖拽
```

## 目录说明

```
src/pages/data-d3/
├── README.md                 ← 本文件（页面入口）
├── config/
│   └── treeConfig.ts         ← ★ schema 配置（对接后端只改这里）
├── index.vue                 ← 主页面：Modals / Drawer / 业务回调
├── components/
│   ├── GraphCanvas.vue       ← D3TreeGraph 实例 + 工具栏
│   ├── Modals.vue
│   ├── SidebarLeft.vue
│   └── SidebarRight.vue
├── sdk-demo/                 ← SDK 独立演示
├── data/
│   └── mockData.ts           ← 历史 mock（页面现用 SDK initialTreeData）
├── types/index.ts            ← re-export SDK 类型
├── utils/
│   ├── d3Tree.ts             ← re-export SDK
│   └── treeLogger.ts         ← re-export SDK
└── docs/                     ← 设计文档与修复记录
    ├── README.md
    ├── tech-doc.md
    └── ...
```

SDK 源码：`src/lib/d3-tree-sdk/`  
SDK 文档：[../../lib/d3-tree-sdk/README.md](../../lib/d3-tree-sdk/README.md)

## 日常使用

### 改初始数据

页面从 SDK 加载示例数据：

```typescript
import { initialTreeData } from '@/lib/d3-tree-sdk';
const treeData = ref(cloneDeep(initialTreeData));
```

替换为你的 API 数据时，保持 JSON 字段与 `treeConfig.ts` 中 `fields` 映射一致即可。

### 对接不同字段名

只改 `config/treeConfig.ts`：

```typescript
export const DATA_D3_TREE_SCHEMA = defineTreeConfig({
  rootId: 'yourRootId',
  fields: {
    id: 'nodeId',
    label: 'name',
    children: 'subNodes',   // 不是 children 就改这里
  },
  selection: { parentId: 'pid' },
});
```

GraphCanvas 已通过 `:schema="DATA_D3_TREE_SCHEMA"` 传入，**无需改 SDK 内核**。

### 业务操作模式

```typescript
// index.vue 内统一模式
applyTreeChangeWithResult((root, ctx) =>
  ctx.addChildNode(root, { parentId, name, level, integrationType })
);
// 内部：graph.mutateData() → ctx 操作 → graph.commit() → syncFromGraph()
```

## 文档索引

| 文档 | 用途 |
|------|------|
| [docs/README.md](./docs/README.md) | 文档目录 |
| [docs/tech-doc.md](./docs/tech-doc.md) | 拖拽/合并规则、zoom 坐标（`clientToGraphLocal`）、D3 设计 |
| [docs/2026-06-11-d3-tree-bugfix.md](./docs/2026-06-11-d3-tree-bugfix.md) | 问题时间线（含问题十：缩放拖拽修复） |
| [../../lib/d3-tree-sdk/docs/SDK-CORE.md](../../lib/d3-tree-sdk/docs/SDK-CORE.md) | SDK 核心设计（可分享） |

## 在其他项目使用 SDK

```typescript
import { D3TreeGraph, defineTreeConfig, initialTreeData } from '@/lib/d3-tree-sdk';

const schema = defineTreeConfig({ fields: { children: 'nodes' } });

const graph = new D3TreeGraph({
  container: document.getElementById('graph')!,
  data: initialTreeData,
  schema
});
graph.mount();
```
