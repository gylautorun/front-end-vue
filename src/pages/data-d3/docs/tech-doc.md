# D3 树形图技术文档

> 最后更新：2026-06-12  
> 文档索引见 [README.md](./README.md)

---

## 目录

1. [问题解决清单](#一问题解决清单)
2. [D3 树形图设计思路](#二d3-树形图设计思路)
3. [实现说明](#三实现说明)
4. [注意事项](#四注意事项)
5. [文件结构](#五文件结构)

---

## 一、问题解决清单

### 1.1 交互功能问题

| 序号 | 问题描述 | 根因分析 | 解决方案 | 代码位置 |
| ---- | -------- | -------- | -------- | -------- |
| 1 | 拖拽节点不在鼠标位置 | `event.dx/dy` 为增量；zoom 缩放未折算 | `dataset.deltaX/deltaY` 累加位移，除以 `zoomTransform.k` | `d3Tree.ts` `dragged()` |
| 2 | 非同级节点响应拖拽 | 缺少同级判定 | `parent.data.id === sourceParentId` + 卡片 `getBoundingClientRect` 精确命中 | `findSameLevelNodeAtDOM()` |
| 3 | 拖拽到自己触发整合 | 未排除自身 | `id !== sourceNodeId` + `dragEnded` 二次校验 | `dragEnded()` |
| 4 | 合并后拖拽错乱、节点消失 | **join 无 key**，DOM 复用但 `data-id` 未更新；拖拽重复绑定 | **keyed join** + update 同步 `data-id` + `bindNodeDrag` 先清后绑 | `renderTree()`、`bindNodeDrag()` |
| 5 | 操作上一层级却拖到下一层级首节点 | 拖拽依赖过期 datum，与 DOM `data-id` 不一致 | 以 **DOM `data-id` + `getCurrentNode(instance.root)`** 为唯一数据源 | `bindNodeDrag()`、`getCurrentNode()` |
| 6 | 第三层多次合并后节点消失 | exit 误删 + transform transition 与拖拽冲突 | keyed join 正确 exit；拖拽中跳过 transform 更新 | `renderTree()` update 分支 |
| 7 | 画布边缘不自动平移 | 缺少边缘检测 | `zoom.translateBy` + `edgeMargin` / `panSpeed` | `dragged()` |
| 8 | 子层级未合并父层级即可合并 | 硬编码 `depth >= 2` | 通用 `canSiblingMerge()` + 根节点默认整合标记 | `types/index.ts`、`dragEnded()`、`confirmMergeNodes()` |

> **已废弃方案**：坐标回退 `findSameLevelNodeByCoord()` 曾用于可视区外命中，因误触发范围过大已在 2026-06-11 移除，**当前仅使用 DOM 精确命中**。

### 1.2 视觉样式问题

| 序号 | 问题描述 | 解决方案 | 代码位置 |
| ---- | -------- | -------- | -------- |
| 9 | 连线颜色被 CSS 覆盖 | 移除 `index.scss` 中 `.link { stroke }` | `index.scss` |
| 10 | 连线颜色不随整合方式变化 | `EDGE_STYLES[integrationType]` | `d3Tree.ts` |
| 11 | 默认连线标签不应显示 | `integrationType !== IntegrationTypeKey.base` 才显示 | `initD3` / `renderTree` |
| 12 | 拖拽目标高亮范围过大 | 仅卡片矩形内命中 + `drop-target` 样式 | `findSameLevelNodeAtDOM`、`index.scss` |

### 1.3 数据与业务问题

| 序号 | 问题描述 | 解决方案 | 代码位置 |
| ---- | -------- | -------- | -------- |
| 13 | 整合方式存中文 | `IntegrationTypeKey` 枚举 + `integrationTypeName` | `types/index.ts` |
| 14 | 合并后多余连线 | `join()` 处理 enter/update/exit | `renderTree()` |
| 15 | 撤销/重做不同步 | `renderTree(newTreeData)` 直传数据 + `updateTreeDataWithoutHistory` | `index.vue`、`GraphCanvas.vue` |
| 16 | 合并层级规则分散 | `isMergedNode` / `canSiblingMerge` 统一判定 | `types/index.ts` |

---

## 二、D3 树形图设计思路

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                      index.vue (主页面)                      │
│  • treeData 响应式数据                                       │
│  • confirmMergeNodes 合并业务 + canMergeNodesInTree 校验     │
│  • updateTreeData / updateTreeDataWithoutHistory             │
├─────────────────────────────────────────────────────────────┤
│                    GraphCanvas.vue (画布)                    │
│  • initD3 / renderTree 封装                                  │
│  • 历史栈 recordOperation                                    │
├─────────────────────────────────────────────────────────────┤
│                    d3Tree.ts (D3 核心)                       │
│  • initD3 / renderTree                                       │
│  • bindNodeDrag / dragStarted / dragged / dragEnded          │
│  • getCurrentNode — 单一数据源                               │
├─────────────────────────────────────────────────────────────┤
│                    types/index.ts                            │
│  • TreeData、canSiblingMerge、ROOT_DEFAULT_MERGE_MARKER      │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心技术选型

| 技术 | 版本 | 用途 |
| ---- | ---- | ---- |
| D3.js | v7 | 树布局、拖拽、zoom、join |
| Vue 3 | 3.x | 组件与响应式数据 |
| TypeScript | 5.x | 类型与枚举 |
| lodash-es | - | `cloneDeep` 深拷贝 |

### 2.3 关键设计决策

#### 2.3.1 数据与视图分离（拖拽）

**原则**：拖拽只改 DOM `transform`，不写回 `d.x` / `d.y`。

```typescript
// dragstart：记录布局坐标 + 清零累计位移
gEl.dataset.deltaX = '0';
gEl.dataset.deltaY = '0';

// drag：累加屏幕增量（需除以 zoom 比例）
const scaledDx = event.dx / currentScale;
const newDeltaX = prevDeltaX + scaledDx;
gEl.dataset.deltaX = String(newDeltaX);
d3.select(gEl).attr('transform', `translate(${d.y + newDeltaX},${d.x + newDeltaY})`);

// dragend：从 instance.root 取最新布局坐标复位
```

#### 2.3.2 单一数据源（instance.root）

D3 drag 回调中的 `d` 可能是绑定时的快照。所有拖拽逻辑统一：

1. 从被拖拽 DOM 读取 `data-id`
2. `getCurrentNode(instance, nodeId)` 从 `instance.root` 取最新 `HierarchyNode`
3. DOM 查询限定在当前 `instance.svg` 内

```typescript
function getCurrentNode(instance, nodeId) {
    return instance.root?.descendants().find((n) => n.data.id === nodeId) ?? null;
}
```

#### 2.3.3 落点检测（仅 DOM 精确命中）

```typescript
function findSameLevelNodeAtDOM(root, source, clientX, clientY) {
    // 1. 从 root 刷新 source 的 parent
    // 2. elementsFromPoint → closest('g.node')
    // 3. getBoundingClientRect 判断鼠标在卡片内
    // 4. target.parent.data.id === sourceParentId
    // 不使用坐标回退，避免误触发
}
```

#### 2.3.4 合并层级规则（通用）

**业务规则**：父层级已整合后，子层级才允许同级拖拽合并。

| 节点 depth | 是否可合并 | 条件 |
| ---------- | ---------- | ---- |
| 0（根） | ❌ | 根节点不可合并 |
| 1 | ✅ | 父为根（`isMergedNode` 对 depth=0 恒为 true） |
| ≥2 | ✅ | 父节点有 `integratedFrom`（合并产生的新节点） |

```typescript
// types/index.ts
export function isMergedNode(node, depth = 0): boolean {
    if (depth === 0) return true;
    return !!(node.integratedFrom?.length);
}

export function canSiblingMerge(node): boolean {
    if (node.depth <= 0) return false;
    const parent = node.parent;
    if (!parent) return false;
    return isMergedNode(parent.data, parent.depth);
}
```

**根节点默认标记**（`mockData.ts`）：

```typescript
integratedFrom: [ROOT_DEFAULT_MERGE_MARKER] // '__root__'
```

合并成功后新节点写入：

```typescript
integratedFrom: [sourceNode.id, targetNode.id]
```

校验双保险：`dragEnded` 调用 `canSiblingMerge`；`confirmMergeNodes` 调用 `canMergeNodesInTree`。

#### 2.3.5 Keyed Data Join（防 DOM/数据错位）

合并增删节点后，必须用 **稳定 key** 绑定，否则 DOM 复用导致 `data-id` 与 datum 不一致——这是拖拽错乱、节点消失的主因。

```typescript
// 连线
link.data(linkData, (d) => `${d.source.data.id}__${d.target.data.id}`).join(...)

// 节点
node.data(nodeData, (d) => d.data.id).join(
    (enter) => enter.attr('data-id', (d) => d.data.id)...,
    (update) => update
        .attr('data-id', (d) => d.data.id)  // 必须同步
        .attr('transform', function (d) {
            if (this.classList.contains('dragging')) {
                return this.getAttribute('transform') || `translate(${d.y},${d.x})`;
            }
            return `translate(${d.y},${d.x})`;
        }),
    (exit) => exit.remove()
);
```

#### 2.3.6 拖拽事件绑定（bindNodeDrag）

每次 `renderTree` 重绘后必须重绑拖拽；重绑前先清除旧监听，防止一次操作触发多个 handler。

```typescript
function bindNodeDrag(nodeSelection, instance, onDropToTarget) {
    nodeSelection.call(d3.drag().on('start', null).on('drag', null).on('end', null));
    nodeSelection.call(
        d3.drag()
            .on('start', function (event) {
                const nodeId = this.getAttribute('data-id');
                const currentNode = getCurrentNode(instance, nodeId);
                if (currentNode) dragStarted(instance, currentNode, this);
            })
            .on('drag', function (event) {
                dragged(this, event, instance, instance.svg, instance.zoom);
            })
            .on('end', function (event) {
                const currentNode = getCurrentNode(instance, this.getAttribute('data-id'));
                if (currentNode) dragEnded(instance, event, currentNode, instance.root, onDropToTarget);
            })
    );
}
```

#### 2.3.7 整合方式枚举化

```typescript
export enum IntegrationTypeKey {
    merge = 'merge',
    migrate = 'migrate',
    integration = 'integration',
    deprecate = 'deprecate',
    module_merge = 'module_merge',
    base = 'base'
}
```

---

## 三、实现说明

### 3.1 初始化流程（initD3）

1. 创建 `svg` + `g`，绑定 `d3.zoom`
2. `d3.tree().nodeSize([垂直间距, 水平间距])`
3. `d3.hierarchy(treeData)` + `treeLayout(root)`
4. 渲染连线（自定义 source/target 连接左右边缘）与节点（`foreignObject` + HTML 卡片）
5. `bindNodeDrag(node, instance, onDropToTarget)`
6. `resetZoom` 初始 scale=1

### 3.2 拖拽三阶段

| 阶段 | 函数 | 职责 |
| ---- | ---- | ---- |
| start | `dragStarted` | `raise()`、记录 dataset、占位虚线框、`currentDraggingNodeId` |
| drag | `dragged` | 累加位移、边缘平移、`findSameLevelNodeAtDOM` 高亮 |
| end | `dragEnded` | 复位 transform、移除占位、`canSiblingMerge` 校验、`onDropToTarget` |

### 3.3 合并流程（index.vue）

1. 拖拽落点命中同级 → 打开合并弹框
2. `confirmMergeNodes`：`mergeById` 合并 children/modules/relations
3. 父节点 children 替换 source/target 为 newNode，`integratedFrom: [sourceId, targetId]`
4. `updateTreeData` → `renderTree`（keyed join + `bindNodeDrag`）

### 3.4 连线样式

- 颜色：`EDGE_STYLES[integrationType]`
- 虚线：`deprecate` → `stroke-dasharray: 6,4`
- 标签：`integrationType !== base` 时显示 `integrationTypeName`

### 3.5 视图控制

- `zoomIn` / `zoomOut`：scaleBy 1.25 / 0.8
- `resetZoom`：scale=1 居中
- `fitView`：按 bbox 适应，最大 scale=1

---

## 四、注意事项

### 4.1 D3 v7 拖拽

- 使用 `function () {}` 回调，`this` 为被拖拽的 `g.node`
- 不要依赖 drag 回调参数中的 `d`，以 DOM `data-id` + `instance.root` 为准
- `renderTree` 后必须 `instance.root = root` 再 `bindNodeDrag`

### 4.2 坐标系

| 坐标 | 含义 | 用途 |
| ---- | ---- | ---- |
| `d.x` | 垂直（树布局） | 传给 `translate` 的 Y |
| `d.y` | 水平（树布局） | 传给 `translate` 的 X |
| `clientX/Y` | 屏幕坐标 | `elementsFromPoint`、边缘平移 |

树为**水平生长**：`transform="translate(d.y, d.x)"`。

### 4.3 性能

- 拖拽中只更新单个 `g` 的 transform
- `renderTree` 不对拖拽中节点做 transition
- 组件卸载时移除 `resize`、`d3-svg-click` 监听

### 4.4 防御性编程

- `more-btn` 点击不触发拖拽
- 占位元素 `pointer-events: none`
- 合并前 `canMergeNodesInTree` 二次校验
- 历史操作使用 `cloneDeep`，不用 `JSON.parse(JSON.stringify())`

---

## 五、文件结构

```
src/pages/data-d3/
├── components/
│   ├── GraphCanvas.vue    # 画布、工具栏、历史栈
│   ├── Modals.vue         # 合并/新增/编辑等弹框
│   ├── SidebarLeft.vue
│   └── SidebarRight.vue
├── data/
│   ├── mockData.ts        # 页面使用的初始数据
│   └── mock.ts            # 备用 mock
├── docs/
│   ├── README.md          # 文档索引（本目录入口）
│   ├── tech-doc.md        # 本文档
│   ├── 2026-06-11-d3-tree-bugfix.md
│   └── fix-code-snippets.md
├── types/
│   └── index.ts
├── utils/
│   ├── d3Tree.ts
│   └── treeLogger.ts
├── index.vue
└── index.scss
```

---

## 相关文档

- 时间线修复详情：[2026-06-11-d3-tree-bugfix.md](./2026-06-11-d3-tree-bugfix.md)（含 2026-06-12 问题七～九）
- 代码片段：[fix-code-snippets.md](./fix-code-snippets.md)（1.9～1.11 节）
