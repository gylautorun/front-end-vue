# data-d3 文档索引

本目录存放 D3 树形图（应用整合图）的设计说明与问题修复记录。

## 文档分工

| 文档 | 用途 | 适合阅读场景 |
| ---- | ---- | ------------ |
| [tech-doc.md](./tech-doc.md) | **核心设计与架构**：模块划分、拖拽/合并规则、数据流、注意事项 | 新人上手、做功能扩展前 |
| [2026-06-11-d3-tree-bugfix.md](./2026-06-11-d3-tree-bugfix.md) | **按时间线的修复记录**：问题描述 → 根因 → 方案 → 验证 | 排查历史 bug、对照改动 |
| [fix-code-snippets.md](./fix-code-snippets.md) | **可复制的代码片段**：按问题分类的修复示例 | 快速查具体写法 |

## 推荐阅读顺序

1. `tech-doc.md` 第二节（设计思路）+ 第三节（实现说明）
2. `tech-doc.md` 第二节 2.3.4～2.3.6（合并规则、key 绑定、拖拽绑定）— **当前最关键**
3. `2026-06-11-d3-tree-bugfix.md` 问题七～九（2026-06-12 拖拽错乱修复）
4. `fix-code-snippets.md` 第 1.9～1.11 节（对应上述核心修复）

## 源码入口

```
src/pages/data-d3/
├── index.vue              # 树数据、合并业务、历史栈
├── components/GraphCanvas.vue
├── utils/d3Tree.ts        # D3 渲染与拖拽
├── utils/treeLogger.ts    # 调试日志
├── types/index.ts         # TreeData、canSiblingMerge 等
└── data/mockData.ts       # 初始数据（根节点默认整合标记）
```

## 维护约定

- **设计变更** → 先更新 `tech-doc.md`
- **修 bug** → 在 `2026-06-11-d3-tree-bugfix.md` 末尾追加条目（注明日期），并同步 `fix-code-snippets.md` 对应片段
- **避免三份文档描述矛盾**：以 `tech-doc.md` 的「当前实现」为准；历史方案在 bugfix 文档中标注「已废弃」
