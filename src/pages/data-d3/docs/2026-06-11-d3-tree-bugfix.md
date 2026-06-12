# D3 Tree 树状图问题修复文档

> 按时间线记录问题修复。架构与核心设计见 [tech-doc.md](./tech-doc.md)，文档索引见 [README.md](./README.md)。

| 批次 | 日期 | 范围 |
| ---- | ---- | ---- |
| 问题一～六 + 优化 | 2026-06-11 | 刷新/撤销、join、拖拽占位与高亮 |
| 问题七～九 | 2026-06-12 | 合并后拖拽错乱、层级规则通用化 |
| 问题十 | 2026-06-12 | 缩放后拖拽/落点坐标修复（clientToGraphLocal） |

---

## 问题一：刷新重置无效

### 问题描述

点击刷新按钮后，树状图没有恢复到初始状态。

### 原因分析

`GraphCanvas.vue` 中的 `initialTreeData` 使用普通变量存储，数据可能被意外修改。

```typescript
// 修复前
let initialTreeData: TreeData | null = null;

// handleRefresh 中使用
emit('refresh', initialTreeData); // 可能为 null 或被修改
```

### 解决方案

1. 将 `initialTreeData` 改为 `ref` 响应式变量
2. 确保刷新时使用深拷贝数据

```typescript
// 修复后
const initialTreeData = ref<TreeData | null>(null);

function handleRefresh() {
    if (!initialTreeData.value) return;
    historyStack.value = [cloneDeep(initialTreeData.value)];
    historyIndex.value = 0;
    emit('refresh', initialTreeData.value);
}
```

---

## 问题二：撤销/重做无效

### 问题描述

修改操作后点击撤销/重做按钮，树状图状态不恢复或恢复不正确。

### 原因分析

1. `handleRenderTree` 使用 `props.treeData`，但 Vue 响应式更新是异步的
2. 撤销/重做时再次调用 `recordOperation`，导致历史栈混乱

### 解决方案

1. `handleRenderTree` 接收可选参数直接传入新数据
2. 新增 `updateTreeDataWithoutHistory` 函数用于撤销/重做

```typescript
// 修复后
function handleRenderTree(newTreeData?: TreeData) {
    const dataToRender = newTreeData || props.treeData;
    renderTree(d3Instance, dataToRender, ...);
}

function updateTreeDataWithoutHistory(newData: TreeData) {
    treeData.value = cloneDeep(newData);
    root = d3.hierarchy(treeData.value);
    graphCanvasRef.value?.renderTree(treeData.value); // 传入新数据
}

function updateTreeData(newData: TreeData) {
    treeData.value = cloneDeep(newData);
    root = d3.hierarchy(treeData.value);
    graphCanvasRef.value?.renderTree(treeData.value);
    graphCanvasRef.value?.recordOperation(treeData.value); // 记录历史
}
```

---

## 问题三：合并节点后线条多了一条

### 问题描述

合并节点后，树状图上出现多余的连线。

### 原因分析

`renderTree` 函数只更新现有元素的属性（enter/update），没有处理新增/删除（exit）。

```typescript
// 修复前 - 只更新，不处理删除
path.data(linkData).attr('d', linkGenerator);
labelBg.data(linkData).attr('x', ...);
labelText.data(linkData).attr('x', ...);
```

### 解决方案

使用 D3 的 `join()` 方法正确处理 enter/update/exit 模式：

```typescript
// 修复后
const linkUpdate = link
    .data(linkData)
    .join(
        // enter: 创建新的连线组
        (enter) => {
            const linkGroup = enter.append('g').attr('class', 'link-group');
            linkGroup.append('path').attr('class', 'link')...;
            linkGroup.append('rect').attr('class', 'link-label-bg')...;
            linkGroup.append('text').attr('class', 'link-label')...;
            return linkGroup;
        },
        // update: 更新现有连线
        (update) => {
            update.select('path').attr('d', linkGenerator)...;
            update.select('.link-label-bg').attr('x', getX)...;
            update.select('.link-label').attr('x', getX)...;
            return update;
        },
        // exit: 移除多余连线
        (exit) => exit.remove()
    );

instance.link = linkUpdate; // 更新实例引用
```

同理，节点也需要使用 `join()` 处理 enter/update/exit：

```typescript
const nodeUpdate = node.data(nodeData).join(
    (enter) => {
        /* 创建新节点 */
    },
    (update) => {
        /* 更新现有节点 */
    },
    (exit) => exit.remove() /* 删除多余节点 */
);

instance.node = nodeUpdate;
```

---

## 问题四：连线标签默认显示问题

### 问题描述

默认状态下，连线标签背景（`.link-label-bg`）仍然可见，即使没有设置整合方式。

### 原因分析

1. `integrationType` 可能被设置为 `base`（基础类型），但原来的判断只检查是否存在值
2. 三个渲染位置都需要修复：`initD3`、`renderTree` 的 enter 和 update 阶段

```typescript
// 修复前 - 只要有值就显示
.attr('opacity', (d) => (d.target.data.integrationType ? 1 : 0));
```

### 解决方案

修改判断逻辑，排除 `base` 类型：

```typescript
// 修复后 - 只有真正的整合方式才显示
.attr('opacity', (d) => (d.target.data.integrationType && d.target.data.integrationType !== IntegrationTypeKey.base ? 1 : 0));
```

### 修改位置（共3处）

**1. initD3 函数（初始化阶段）**

```typescript
const labelBg = link
    .append<SVGRectElement>('rect')
    .attr('class', 'link-label-bg')
    .attr('opacity', (d) =>
        d.target.data.integrationType && d.target.data.integrationType !== IntegrationTypeKey.base
            ? 1
            : 0
    );

const labelText = link
    .append<SVGTextElement>('text')
    .attr('class', 'link-label')
    .attr('opacity', (d) =>
        d.target.data.integrationType && d.target.data.integrationType !== IntegrationTypeKey.base
            ? 1
            : 0
    )
    .text((d) => d.target.data.integrationTypeName || '');
```

**2. renderTree 函数 enter 阶段（创建新连线）**

```typescript
linkGroup
    .append('rect')
    .attr('class', 'link-label-bg')
    .attr('opacity', (d) =>
        d.target.data.integrationType && d.target.data.integrationType !== IntegrationTypeKey.base
            ? 1
            : 0
    );

linkGroup
    .append('text')
    .attr('class', 'link-label')
    .attr('opacity', (d) =>
        d.target.data.integrationType && d.target.data.integrationType !== IntegrationTypeKey.base
            ? 1
            : 0
    );
```

**3. renderTree 函数 update 阶段（更新现有连线）**

```typescript
update
    .select('.link-label-bg')
    .attr('opacity', (d) =>
        d.target.data.integrationType && d.target.data.integrationType !== IntegrationTypeKey.base
            ? 1
            : 0
    );

update
    .select('.link-label')
    .attr('opacity', (d) =>
        d.target.data.integrationType && d.target.data.integrationType !== IntegrationTypeKey.base
            ? 1
            : 0
    );
```

### 整合方式显示规则

| 整合方式                   | 连线颜色     | 标签显示          |
| -------------------------- | ------------ | ----------------- |
| `undefined`（未设置）      | 灰色（默认） | ❌ 隐藏           |
| `base`（基础）             | 灰色         | ❌ 隐藏           |
| `merge`（合并）            | 红色         | ✅ 显示"合并"     |
| `migrate`（迁移）          | 蓝色         | ✅ 显示"迁移"     |
| `integration`（接口对接）  | 绿色         | ✅ 显示"接口对接" |
| `deprecate`（停用下线）    | 灰色虚线     | ✅ 显示"停用下线" |
| `module_merge`（模块整合） | 紫色         | ✅ 显示"模块整合" |

---

## 问题五：拖拽时原位置显示灰色虚线框占位

### 问题描述

拖拽节点时，被拖拽节点直接移开，原位置变空，用户无法理解节点原来的位置。

### 原因分析

原代码在 `dragStarted` 时没有在原位置创建占位元素。

### 解决方案

在 `dragStarted` 中创建独立的占位元素（SVG g 元素），添加到父容器中，保持在原位置：

```typescript
function dragStarted(instance, d) {
    // ... 其他逻辑 ...

    // 添加拖拽中样式
    gEl.classList.add('dragging');

    // 创建占位背景矩形（添加到父容器，保持在原位置）
    const parentEl = gEl.parentElement;
    if (parentEl) {
        const parentG = parentEl as unknown as SVGGElement;
        const placeholder = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        placeholder.setAttribute('class', 'drag-placeholder');
        placeholder.setAttribute('data-target-id', nodeId);
        placeholder.setAttribute('transform', `translate(${Number(d.y ?? 0)},${Number(d.x ?? 0)})`);

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', '-80');
        rect.setAttribute('y', '-20');
        rect.setAttribute('width', '160');
        rect.setAttribute('height', '40');
        rect.setAttribute('rx', '6');
        rect.setAttribute('ry', '6');
        rect.setAttribute('fill', 'rgba(140, 140, 140, 0.3)');
        rect.setAttribute('stroke', '#8c8c8c');
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('stroke-dasharray', '4,4');
        rect.setAttribute('pointer-events', 'none');

        placeholder.appendChild(rect);
        parentG.appendChild(placeholder);
    }
}
```

在 `dragEnded` 中移除占位元素：

```typescript
function dragEnded(instance, event, d, root, onDropToTarget) {
    // ... 其他逻辑 ...

    // 移除占位背景（限定在当前 SVG 实例内）
    svg.select(`g.drag-placeholder[data-target-id="${CSS.escape(d.data.id)}"]`).remove();
}
```

### 设计要点

1. **独立占位元素**：占位元素是独立的 SVG g 元素，不是被拖拽节点的子元素
2. **添加到父容器**：确保占位元素在原位置，不受拖拽 transform 影响
3. **灰色虚线样式**：使用灰色半透明填充 + 虚线边框，视觉上表示"空位"
4. **pointer-events: none**：占位元素不拦截鼠标事件

---

## 问题六：目标节点触发范围和放大效果

### 问题描述

1. 目标节点触发范围太大，还没到节点就触发了高亮
2. 目标节点高亮效果不够明显

### 解决方案

### 6.1 精确的范围检测

修改 `findSameLevelNodeAtDOM` 函数，使用 DOM 命中 + 卡片 `getBoundingClientRect` 精确范围（2026-06-12 问题十：DOM 未命中时增加 **zoom 适配** 的坐标回退，仍限定在卡片矩形内，见 [问题十](#问题十缩放后拖拽落点不准--clienttographlocal2026-06-12)）：

```typescript
function findSameLevelNodeAtDOM(root, source, clientX, clientY) {
    // ... 前置逻辑 ...

    for (const el of elements) {
        const nodeG = (el as Element).closest('g.node[data-id]') as SVGGElement | null;
        if (nodeG) {
            const id = nodeG.getAttribute('data-id');
            if (id && id !== source.data.id) {
                // 精确检测：检查鼠标是否在节点卡片范围内
                const cardEl = nodeG.querySelector('.node-card');
                if (cardEl) {
                    const rect = cardEl.getBoundingClientRect();
                    // 检查鼠标是否在卡片范围内
                    if (
                        clientX >= rect.left &&
                        clientX <= rect.right &&
                        clientY >= rect.top &&
                        clientY <= rect.bottom
                    ) {
                        targetId = id;
                        break;
                    }
                }
            }
        }
    }

    // 只使用精确的 DOM 命中检测，不使用坐标计算回退
    return null;
}
```

### 6.2 放大 foreignObject 区域

修改拖拽高亮时的处理逻辑，增大 foreignObject 的宽高：

```typescript
// 添加 drop-target 高亮时
clearDropTargetHighlight();
const hit = findSameLevelNodeAtDOM(root, d, clientX, clientY);
if (hit) {
    const targetNodeEl = findNodeGElementInSvg(svg, hit.data.id);
    if (targetNodeEl) {
        targetNodeEl.classList.add('drop-target');
        // 增大 foreignObject 宽高以容纳放大的节点卡片
        const fo = targetNodeEl.querySelector('foreignObject') as SVGForeignObjectElement | null;
        if (fo) {
            fo.setAttribute('width', String(NODE_WIDTH * 1.3));
            fo.setAttribute('height', String(NODE_HEIGHT * 1.3));
            fo.setAttribute('x', String(-(NODE_WIDTH * 1.3) / 2));
            fo.setAttribute('y', String(-(NODE_HEIGHT * 1.3) / 2));
        }
    }
}
```

清除高亮时重置 foreignObject：

```typescript
function clearDropTargetHighlight() {
    const highlighted = document.querySelectorAll('g.node.drop-target');
    highlighted.forEach((el) => {
        el.classList.remove('drop-target');
        // 重置 foreignObject 宽高
        const fo = el.querySelector('foreignObject') as SVGForeignObjectElement | null;
        if (fo) {
            fo.setAttribute('width', String(NODE_WIDTH));
            fo.setAttribute('height', String(NODE_HEIGHT));
            fo.setAttribute('x', String(-NODE_WIDTH / 2));
            fo.setAttribute('y', String(-NODE_HEIGHT / 2));
        }
    });
}
```

### 6.3 CSS 样式

```css
/* 目标节点高亮样式 */
g.node.drop-target .node-card {
    box-shadow:
        0 0 0 3px #52c41a,
        0 4px 12px rgba(82, 196, 26, 0.4);
    transform: scale(1.3);
    opacity: 0.6;
    transition:
        transform 0.15s ease,
        box-shadow 0.15s ease,
        opacity 0.15s ease;
}

/* 被拖拽节点样式 */
g.node.dragging .node-card {
    opacity: 0.8;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
```

### 设计要点

1. **精确检测**：使用 `getBoundingClientRect()` 检查鼠标是否在卡片范围内
2. **移除回退**：不使用坐标计算回退，避免误触发
3. **整体放大**：修改 foreignObject 的宽高，确保整个区域都放大
4. **多重效果**：放大 1.3 倍 + 半透明 + 绿色边框 + 阴影，视觉效果明显

### 效果对比

| 效果     | 修复前       | 修复后              |
| -------- | ------------ | ------------------- |
| 触发范围 | 节点周围区域 | 仅节点卡片内        |
| 放大效果 | 仅内容 scale | 整体区域 scale(1.3) |
| 透明度   | 无           | 0.6 半透明          |
| 边框     | 无           | 绿色边框 + 阴影     |

---

## 代码优化：抽离公共函数

### 问题描述

多个函数中重复相同的代码模式：

```typescript
treeData.value = cloneDeep(newData);
root = d3.hierarchy(treeData.value);
graphCanvasRef.value?.renderTree();
graphCanvasRef.value?.recordOperation(treeData.value);
```

### 解决方案

抽离为两个公共函数：

```typescript
/**
 * 更新树数据但不记录到历史（用于撤销/重做操作）
 */
function updateTreeDataWithoutHistory(newData: TreeData) {
    treeData.value = cloneDeep(newData);
    root = d3.hierarchy(treeData.value);
    graphCanvasRef.value?.renderTree(treeData.value);
}

/**
 * 更新树数据并记录到历史（用于普通操作）
 */
function updateTreeData(newData: TreeData) {
    treeData.value = cloneDeep(newData);
    root = d3.hierarchy(treeData.value);
    graphCanvasRef.value?.renderTree(treeData.value);
    graphCanvasRef.value?.recordOperation(treeData.value);
}
```

### 优化效果

| 函数                  | 优化前 | 优化后 |
| --------------------- | ------ | ------ |
| `confirmAddNode`      | 4 行   | 1 行   |
| `confirmAddModule`    | 4 行   | 1 行   |
| `confirmEditNode`     | 4 行   | 1 行   |
| `confirmBindRelation` | 4 行   | 1 行   |
| `confirmIntegration`  | 4 行   | 1 行   |
| `deleteNode`          | 4 行   | 1 行   |
| `confirmMergeNodes`   | 5 行   | 1 行   |

---

## 深拷贝优化：JSON.parse(JSON.stringify) → cloneDeep

### 背景

项目中使用 `JSON.parse(JSON.stringify())` 进行深拷贝，存在以下问题：

-   无法处理循环引用
-   丢失 Date、RegExp 等特殊类型
-   代码可读性差

### 解决方案

使用 `lodash-es` 的 `cloneDeep` 方法：

```typescript
import { cloneDeep } from 'lodash-es';

// 替换前
const copy = JSON.parse(JSON.stringify(data));

// 替换后
const copy = cloneDeep(data);
```

### 修改位置

-   `index.vue`: 初始化、重置、合并、撤销/重做等场景
-   `GraphCanvas.vue`: 历史记录存储、初始数据备份等场景

### cloneDeep 优势

| 特性       | JSON.parse(JSON.stringify()) | lodash.cloneDeep() |
| ---------- | ---------------------------- | ------------------ |
| 循环引用   | 报错                         | 安全处理           |
| 特殊类型   | 丢失 Date/RegExp             | 正确保留           |
| 代码可读性 | 冗长                         | 简洁明了           |

---

---

## 问题七：合并后拖拽错乱、操作上层却命中下层（2026-06-12）

### 问题描述

1. 节点合并后，拖拽 A 层节点却变成 B 层第一个节点在动
2. 第三层多次合并后，拖拽触发后部分节点直接消失
3. 同层级或跨层级拖拽表现混乱

### 原因分析

1. **`renderTree` 的 `join()` 未使用 key 函数**：合并增删节点后 DOM 元素被复用，但 `data-id` 仅在 enter 时设置，update 未同步 → DOM 属性与 datum 不一致
2. **每次 `renderTree` 重复 `call(d3.drag())`**：未清除旧监听，多次合并后一次拖拽触发多个 handler
3. **拖拽用 `document.querySelector` 全局查节点**：可能命中错误 SVG/节点
4. **update 阶段对 transform 做 transition**：与拖拽中的 transform 冲突

### 解决方案

**1. Keyed join + update 同步 data-id**

```typescript
link.data(linkData, (d) => `${d.source.data.id}__${d.target.data.id}`).join(...)

node.data(nodeData, (d) => d.data.id).join(
    (enter) => enter.attr('data-id', (d) => d.data.id)...,
    (update) => update
        .attr('data-id', (d) => d.data.id)
        .attr('transform', function (d) {
            if (this.classList.contains('dragging')) {
                return this.getAttribute('transform') || `translate(${d.y},${d.x})`;
            }
            return `translate(${d.y},${d.x})`;
        }),
    (exit) => exit.remove()
);
```

**2. 抽取 `bindNodeDrag`，重绑前先清除**

```typescript
function bindNodeDrag(nodeSelection, instance, onDropToTarget) {
    nodeSelection.call(d3.drag().on('start', null).on('drag', null).on('end', null));
    nodeSelection.call(d3.drag()
        .on('start', function (event) {
            const nodeId = this.getAttribute('data-id');
            const currentNode = getCurrentNode(instance, nodeId);
            if (currentNode) dragStarted(instance, currentNode, this);
        })
        // drag / end 同样以 data-id + getCurrentNode 为准
    );
}
```

**3. 单一数据源 `getCurrentNode(instance, nodeId)`**，DOM 查询限定 `instance.svg`。

---

## 问题八：合并层级规则硬编码（2026-06-12）

### 问题描述

原先用 `depth >= 2` 判断父节点是否有 `integratedFrom`，规则分散、不易扩展到更深层级；顶层未标记默认整合。

### 解决方案

在 `types/index.ts` 抽取通用函数：

```typescript
export const ROOT_DEFAULT_MERGE_MARKER = '__root__';

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

- `mockData.ts` 根节点：`integratedFrom: [ROOT_DEFAULT_MERGE_MARKER]`
- `dragEnded`：`if (!canSiblingMerge(d)) return`
- `confirmMergeNodes`：`canMergeNodesInTree(sourceId)` 二次校验
- 合并产物：`integratedFrom: [sourceId, targetId]`，供下一层使用

### 合并层级表

| depth | 可合并 | 条件 |
| ----- | ------ | ---- |
| 0 | ❌ | 根节点 |
| 1 | ✅ | 父为根（视为已整合） |
| ≥2 | ✅ | 父节点 `integratedFrom` 非空 |

---

## 问题九：拖拽位移与 zoom 未折算（2026-06-12，已迭代）

### 问题描述

缩放后拖拽漂移、落点不准。

### 初版方案（已废弃）

```typescript
const currentScale = d3.zoomTransform(svg.node()).k ?? 1;
const scaledDx = event.dx / currentScale;
gEl.dataset.deltaX = String(prevDeltaX + scaledDx);
```

`event.dx / k` 在 viewBox + zoom 叠加时仍可能偏差。

### 当前方案（问题十 合并说明）

见 [问题十](#问题十缩放后拖拽落点不准--clienttographlocal2026-06-12)。

---

## 问题十：缩放后拖拽/落点不准 + clientToGraphLocal（2026-06-12）

### 问题描述

1. 缩小画布后，拖拽节点不跟手，拖到目标节点时高亮/合并位置偏移
2. 坐标回退 `findSameLevelNodeByCoord` 曾误传 `hNodeId(ctx, source.data)` 导致运行时 `getId` 报错

### 根因

- 用 `event.dx / zoomTransform.k` 估算位移，未统一经过 zoom 容器 `g` 的完整变换矩阵（含 viewBox）
- DOM 命中时，被拖拽节点未设 `pointer-events: none`，可能遮挡下方目标
- `hNodeId` 需要 `HierarchyNode`，不能传入 `source.data`

### 解决方案

**拖拽跟手**：`clientToGraphLocal(graphG, clientX, clientY)` + 起点差值

```typescript
// dragstart
gEl.dataset.nodeStartX = String(tx);
gEl.dataset.pointerStartX = String(local.x);
setNodePointerEvents(gEl, false);

// drag
const local = clientToGraphLocal(graphG, clientX, clientY);
const curTX = nodeStartX + (local.x - pointerStartX);
d3.select(gEl).attr('transform', `translate(${curTX},${curTY})`);
```

**落点检测**：DOM 优先 → 坐标回退（同级卡片矩形，同一套 `clientToGraphLocal`）

```typescript
// findSameLevelNodeByCoord — 注意传 HierarchyNode
const sourceNodeId = source?.data ? hNodeId(ctx, source) : '';
const local = clientToGraphLocal(graphG, clientX, clientY);
// 检测 local 是否落在 sibling 的 nodeScreenPosition 矩形内
```

### 验证

1. zoom 缩小至 50% 以下，拖拽节点仍贴鼠标
2. 拖到同级节点卡片上，绿色高亮准确，松手触发合并
3. 控制台无 `Cannot read properties of undefined (reading 'id')`

---

## 文件修改清单

| 文件 | 修改内容 |
| ---- | -------- |
| `index.vue` | `updateTreeData`、撤销/重做、`canMergeNodesInTree` 校验 |
| `GraphCanvas.vue` | `initialTreeData` ref、`renderTree(newTreeData)` |
| `d3Tree.ts` | keyed join、`bindNodeDrag`、`getCurrentNode`、精确 DOM 命中、占位与高亮 |
| `types/index.ts` | `canSiblingMerge`、`ROOT_DEFAULT_MERGE_MARKER` |
| `mockData.ts` | 根节点默认 `integratedFrom` |
| `utils/treeLogger.ts` | 拖拽/合并调试日志 |
| `SidebarLeft.vue` | `EDGE_STYLES` / `LEVEL_CONFIG` |
| `index.scss` | `drop-target`、`dragging` 样式 |
| `docs/*` | 文档结构与内容同步 |

---

## 测试验证

### 2026-06-11 批次

1. **刷新**：树恢复初始状态
2. **撤销/重做**：操作可回退/前进，按钮禁用态正确
3. **合并连线**：合并后连线数量正确，无多余线
4. **拖拽视觉**：占位虚线框、目标高亮 1.3 倍、释放后复位

### 2026-06-12 批次（合并 + 多层级拖拽）

1. **第一层**：两个子节点拖拽合并 → 成功，新节点带 `integratedFrom`
2. **第二层**：仅在父节点已合并后，同级子节点可合并；未合并父节点时拖拽不弹框
3. **第三层多次合并**：连续合并后拖拽，节点不错位、不消失
4. **缩放后拖拽**：zoom 放大/缩小后，节点仍跟手，落点高亮准确
5. **跨层误触**：拖到非同级节点卡片上，不触发合并
6. **缩放 + 合并**：缩小后拖拽到同级节点，可正常高亮并弹合并框
