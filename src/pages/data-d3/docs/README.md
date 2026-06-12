# data-d3 文档索引

> 页面快速上手见上级 [../README.md](../README.md)

## 文档分工

| 文档 | 用途 |
| ---- | ---- |
| [../README.md](../README.md) | **页面入口**：路由、目录、schema 配置、日常用法 |
| [tech-doc.md](./tech-doc.md) | D3 拖拽/合并规则、zoom 坐标、关键设计决策 |
| [2026-06-11-d3-tree-bugfix.md](./2026-06-11-d3-tree-bugfix.md) | 按时间线的 bug 修复记录（问题十：缩放拖拽） |
| [fix-code-snippets.md](./fix-code-snippets.md) | 可复制的修复代码片段 |
| [../../../lib/d3-tree-sdk/docs/SDK-CORE.md](../../../lib/d3-tree-sdk/docs/SDK-CORE.md) | **SDK 核心设计**（字段 schema、API、集成） |

## 推荐阅读顺序

1. [../README.md](../README.md) — 确认能跑、知道改哪个文件
2. [../../../lib/d3-tree-sdk/README.md](../../../lib/d3-tree-sdk/README.md) — SDK 用法与 `defineTreeConfig`
3. [tech-doc.md](./tech-doc.md) 第二节 — 拖拽与合并规则
4. 排查历史问题时再看 bugfix / snippets

## 当前源码结构（2026-06）

```
业务层（Vue）
  index.vue              业务 UI + applyTreeChange*
  config/treeConfig.ts   schema 配置（字段映射）
  components/GraphCanvas.vue

SDK 层
  src/lib/d3-tree-sdk/
    D3TreeGraph.ts       主类
    TreeContext.ts       树操作
    schema/              TreeConfig / Accessors
    core/d3Tree.ts       D3 渲染

兼容 re-export（可忽略，直接用 SDK）
  utils/d3Tree.ts
  utils/treeLogger.ts
  types/index.ts
```

## 维护约定

- **对接后端字段** → 只改 `config/treeConfig.ts`
- **SDK API / schema 设计** → 改 `src/lib/d3-tree-sdk/` + 更新 SDK-CORE.md
- **D3 拖拽/渲染行为** → 改 SDK `core/d3Tree.ts` + 更新 tech-doc.md
- **修 bug** → bugfix 文档追加条目 + 必要时更新 tech-doc
