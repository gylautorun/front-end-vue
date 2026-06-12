# D3 树形图问题修复代码片段

> 可复制的修复示例。架构说明见 [tech-doc.md](./tech-doc.md)，完整时间线见 [2026-06-11-d3-tree-bugfix.md](./2026-06-11-d3-tree-bugfix.md)。

---

## 目录

1. [交互功能问题](#1-交互功能问题)
    - [1.1 拖拽节点不在鼠标位置（含 zoom 缩放）](#11-拖拽节点不在鼠标位置含-zoom-缩放)
    - [1.2 落点检测（DOM + 坐标回退）](#12-落点检测dom--坐标回退)
    - [1.3 非同级节点响应拖拽](#13-非同级节点响应拖拽)
    - [1.4 拖拽到自己触发整合](#14-拖拽到自己触发整合)
    - [1.5 画布边缘不自动平移](#15-画布边缘不自动平移)
    - [1.6 平移方向相反](#16-平移方向相反)
    - [1.7 坐标回退落点（zoom 适配，当前启用）](#17-坐标回退落点zoom-适配当前启用)
    - [1.8 连线连接点位置不对](#18-连线连接点位置不对)
    - [1.9 合并后拖拽错乱 / 节点消失（keyed join）](#19-合并后拖拽错乱--节点消失keyed-join)
    - [1.10 拖拽事件重复绑定（bindNodeDrag）](#110-拖拽事件重复绑定bindnodedrag)
    - [1.11 合并层级规则（canSiblingMerge）](#111-合并层级规则cansiblingmerge)
2. [视觉样式问题](#2-视觉样式问题)
3. [数据结构问题](#3-数据结构问题)
4. [下载功能问题](#4-下载功能问题)
    - [4.1 下载功能实现（借鉴 org-tree-lib）](#41-下载功能实现借鉴-org-tree-lib)
    - [4.2 下载图片偏右](#42-下载图片偏右)
    - [4.3 下载图片偏下](#43-下载图片偏下)
    - [4.4 背景灰色（灰上加白）](#44-背景灰色灰上加白)
    - [4.5 Canvas 污染错误](#45-canvas-污染错误)
    - [4.6 线条宽度异常](#46-线条宽度异常)
    - [4.7 下载按钮触发](#47-下载按钮触发)
    - [4.8 下载格式选择（Modal 模态框）](#48-下载格式选择modal-模态框)

---

## 1. 交互功能问题

### 1.1 拖拽节点不在鼠标位置（含 zoom 缩放）

**问题根因**：`event.dx / zoomTransform.k` 未覆盖 viewBox + zoom 完整矩阵；旧版 `dataset.deltaX/deltaY` 累加有漂移

**当前方案**：`clientToGraphLocal` 将指针映射到 zoom 容器 `g` 的局部坐标

```typescript
// d3Tree.ts — clientToGraphLocal
function clientToGraphLocal(graphG: SVGGElement, clientX: number, clientY: number) {
    const pt = graphG.ownerSVGElement!.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const local = pt.matrixTransform(graphG.getScreenCTM()!.inverse());
    return { x: local.x, y: local.y };
}

// dragstart
const { tx, ty } = nodeScreenPosition(d, orientation);
gEl.dataset.nodeStartX = String(tx);
gEl.dataset.nodeStartY = String(ty);
const local = clientToGraphLocal(graphG, clientX, clientY);
gEl.dataset.pointerStartX = String(local.x);
gEl.dataset.pointerStartY = String(local.y);
setNodePointerEvents(gEl, false);

// drag
const local = clientToGraphLocal(graphG, clientX, clientY);
const curTX = nodeStartX + (local.x - pointerStartX);
const curTY = nodeStartY + (local.y - pointerStartY);
d3.select(gEl).attr('transform', `translate(${curTX},${curTY})`);
```

---

### 1.2 落点检测（DOM + 坐标回退）

> **当前实现**：优先 DOM（`elementsFromPoint` + `getBoundingClientRect`）；未命中时用 `clientToGraphLocal` + 同级卡片矩形回退。拖拽中被拖节点设 `pointer-events: none`，避免遮挡命中。

```typescript
// findSameLevelNodeAtDOM — DOM 未命中时
if (graphG) {
    return findSameLevelNodeByCoord(root, source, clientX, clientY, ctx, orientation, graphG);
}

// findSameLevelNodeByCoord — 必须用 HierarchyNode
const sourceNodeId = source?.data ? hNodeId(ctx, source) : ''; // ✓ 不是 source.data
const local = clientToGraphLocal(graphG, clientX, clientY);
const { width, height } = getNodeDimensions(orientation);
// 检测 local 是否在 sibling 的 nodeScreenPosition 矩形内
```

---

### 1.3 非同级节点响应拖拽

**问题根因**：缺少同级判定逻辑

**解决方案**：添加 `n.parent.data.id === sourceParentId` 判定

```typescript
// d3Tree.ts - findSameLevelNodeByCoord() 函数
const siblings = root.descendants().filter(
    (n) =>
        n.parent &&
        n.parent.data.id === sourceParentId && // 同级判定
        n.data.id !== source.data.id // 排除自己
);
```

---

### 1.4 拖拽到自己触发整合

**问题根因**：未排除自身检测

**解决方案**：三重检查机制

```typescript
// d3Tree.ts - dragEnded() 函数
const hit = findSameLevelNodeAtDOM(root, d, clientX, clientY);

// 检查1: 未命中任何节点
if (!hit) {
    return;
}

// 检查2: 命中的是自己
if (hit.data.id === d.data.id) {
    return;
}

// 检查3: 在 DOM 命中时已排除自己
// findSameLevelNodeAtDOM 中: if (id && id !== source.data.id)

// 触发父组件合并弹框
onDropToTarget(d.data.id, hit.data.id, d.data, hit.data);
```

---

### 1.5 画布边缘不自动平移

**问题根因**：缺少边缘检测和平移逻辑

**解决方案**：添加 `zoom.translateBy` 自动平移

```typescript
// d3Tree.ts - dragged() 函数
const edgeMargin = 100; // 边缘区域宽度
const panSpeed = 8; // 平移速度

const svgEl = svg.node();
if (svgEl) {
    const rect = svgEl.getBoundingClientRect();
    const canvasWidth = rect.width;
    const canvasHeight = rect.height;
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    let panDX = 0;
    let panDY = 0;

    // 检测四个边缘
    if (relativeX < edgeMargin) panDX = panSpeed;
    else if (relativeX > canvasWidth - edgeMargin) panDX = -panSpeed;
    if (relativeY < edgeMargin) panDY = panSpeed;
    else if (relativeY > canvasHeight - edgeMargin) panDY = -panSpeed;

    // 执行平移
    if (panDX !== 0 || panDY !== 0) {
        svg.transition()
            .duration(10)
            .call(zoom.translateBy as any, panDX, panDY);
    }
}
```

---

### 1.6 平移方向相反

**问题根因**：平移方向逻辑错误

**解决方案**：修正方向逻辑

```typescript
// d3Tree.ts - 边缘平移方向修正
// 左边边缘：鼠标在左边时，画布向右平移（显示左边的内容）
if (relativeX < edgeMargin) {
    panDX = panSpeed; // 向右
}
// 右边边缘：鼠标在右边时，画布向左平移（显示右边的内容）
else if (relativeX > canvasWidth - edgeMargin) {
    panDX = -panSpeed; // 向左
}

// 顶部边缘：鼠标在顶部时，画布向下平移（显示顶部的内容）
if (relativeY < edgeMargin) {
    panDY = panSpeed; // 向下
}
// 底部边缘：鼠标在底部时，画布向上平移（显示底部的内容）
else if (relativeY > canvasHeight - edgeMargin) {
    panDY = -panSpeed; // 向上
}
```

---

### 1.7 坐标回退落点（zoom 适配，当前启用）

> `findSameLevelNodeByCoord` 在 DOM 未命中时作为回退，使用 **zoom 容器 g** 的 CTM（不是 svg 根上的第一个 g），并与 `nodeScreenPosition` 卡片矩形对齐。

```typescript
function clientToGraphLocal(graphG: SVGGElement, clientX: number, clientY: number) {
    const svg = graphG.ownerSVGElement!;
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    return pt.matrixTransform(graphG.getScreenCTM()!.inverse());
}

function findSameLevelNodeByCoord(root, source, clientX, clientY, ctx, orientation, graphG) {
    const sourceNodeId = hNodeId(ctx, source); // HierarchyNode，勿传 source.data
    const local = clientToGraphLocal(graphG, clientX, clientY);
    const { width, height } = getNodeDimensions(orientation);
    // 遍历同级，检测 local 是否在 [tx±width/2, ty±height/2] 内
}
```

---

### 1.8 连线连接点位置不对（线从节点中心开始）

**问题根因**：运算符优先级错误，`d.source.y ?? 0 + NODE_WIDTH / 2` 被解析为 `d.source.y ?? (0 + NODE_WIDTH / 2)`，导致偏移量未正确应用

**解决方案**：添加括号确保正确运算顺序，并使用自定义 `.source()` 和 `.target()` 函数约束连接点位置

```typescript
// d3Tree.ts - renderTree() / updateLinks() 函数
const linkGenerator = d3
    .linkHorizontal<d3.HierarchyLink<TreeData>, d3.HierarchyNode<TreeData>>()
    .x((d) => d.y ?? 0)
    .y((d) => d.x ?? 0)
    // 自定义源节点连接点：右侧中间位置
    .source(
        (d) =>
            ({
                x: d.source.x ?? 0, // 垂直坐标（传给 .y()）
                y: (d.source.y ?? 0) + NODE_WIDTH / 2 // 水平坐标（传给 .x()），向右偏移到右侧边缘
            }) as unknown as d3.HierarchyNode<TreeData>
    )
    // 自定义目标节点连接点：左侧中间位置
    .target(
        (d) =>
            ({
                x: d.target.x ?? 0, // 垂直坐标（传给 .y()）
                y: (d.target.y ?? 0) - NODE_WIDTH / 2 // 水平坐标（传给 .x()），向左偏移到左侧边缘
            }) as unknown as d3.HierarchyNode<TreeData>
    );

// 使用连线生成器
const path = link.append('path').attr('class', 'link').attr('d', linkGenerator);
```

**关键说明**：

| 节点类型       | 连接点位置 | 计算方式                             |
| -------------- | ---------- | ------------------------------------ |
| 父节点（源）   | 右侧中间   | `(d.source.y ?? 0) + NODE_WIDTH / 2` |
| 子节点（目标） | 左侧中间   | `(d.target.y ?? 0) - NODE_WIDTH / 2` |

> **注意**：由于 `d3.linkHorizontal()` 使用 `.x((d) => d.y)` 和 `.y((d) => d.x)` 交换了坐标，所以 `.source()` 和 `.target()` 返回的对象需要反向设置：
>
> -   `x` 属性存储垂直坐标（传给 `.y()` 函数）
> -   `y` 属性存储水平坐标（传给 `.x()` 函数）

---

### 1.9 合并后拖拽错乱 / 节点消失（keyed join）

**问题根因**：`join()` 无 key → DOM 复用后 `data-id` 与 datum 不一致；拖拽中 transition 覆盖 transform

**解决方案**：

```typescript
// renderTree() - 连线与节点都必须带 key
const linkUpdate = link
    .data(linkData, (d) => `${d.source.data.id}__${d.target.data.id}`)
    .join(enter, update, (exit) => exit.remove());

const nodeUpdate = node.data(nodeData, (d) => d.data.id).join(
    (enter) =>
        enter
            .attr('class', 'node')
            .attr('data-id', (d) => d.data.id)
            .attr('transform', (d) => `translate(${d.y ?? 0},${d.x ?? 0})`),
    (update) =>
        update
            .attr('data-id', (d) => d.data.id) // update 必须同步
            .attr('transform', function (d) {
                const el = this as SVGGElement;
                if (el.classList.contains('dragging')) {
                    return el.getAttribute('transform') || `translate(${d.y ?? 0},${d.x ?? 0})`;
                }
                return `translate(${d.y ?? 0},${d.x ?? 0})`;
            }),
    (exit) => exit.remove()
);

instance.root = root; // 重绑拖拽前更新 root
```

---

### 1.10 拖拽事件重复绑定（bindNodeDrag）

**问题根因**：每次 `renderTree` 调用 `call(d3.drag())` 未清除旧监听

**解决方案**：

```typescript
function bindNodeDrag(nodeSelection, instance, onDropToTarget) {
    nodeSelection.call(d3.drag().on('start', null).on('drag', null).on('end', null));
    nodeSelection.call(
        d3
            .drag()
            .on('start', function (event) {
                if ((event.sourceEvent?.target as HTMLElement)?.classList.contains('more-btn')) return;
                const nodeId = this.getAttribute('data-id');
                const currentNode = getCurrentNode(instance, nodeId!);
                if (currentNode) dragStarted(instance, currentNode, this);
            })
            .on('drag', function (event) {
                if (!instance.currentDraggingNodeId) return;
                dragged(this, event, instance, instance.svg, instance.zoom);
            })
            .on('end', function (event) {
                const currentNode = getCurrentNode(instance, this.getAttribute('data-id')!);
                if (currentNode) dragEnded(instance, event, currentNode, instance.root, onDropToTarget);
            })
    );
}

// initD3 与 renderTree 末尾均调用
bindNodeDrag(node, instance, onDropToTarget);
```

**单一数据源**：

```typescript
function getCurrentNode(instance, nodeId: string) {
    return instance.root?.descendants().find((n) => n.data.id === nodeId) ?? null;
}

function findNodeGElementInSvg(svg, nodeId: string) {
    return svg.select(`g.node[data-id="${CSS.escape(nodeId)}"]`).node();
}
```

---

### 1.11 合并层级规则（canSiblingMerge）

**业务规则**：父层级已整合后，子层级才允许同级拖拽合并。

```typescript
// types/index.ts
export const ROOT_DEFAULT_MERGE_MARKER = '__root__';

export function isMergedNode(node: Pick<TreeData, 'integratedFrom'>, depth = 0): boolean {
    if (depth === 0) return true;
    return !!(node.integratedFrom && node.integratedFrom.length > 0);
}

export function canSiblingMerge(node: {
    depth: number;
    parent?: { depth: number; data: TreeData } | null;
}): boolean {
    if (node.depth <= 0) return false;
    const parent = node.parent;
    if (!parent) return false;
    return isMergedNode(parent.data, parent.depth);
}
```

```typescript
// mockData.ts 根节点
integratedFrom: [ROOT_DEFAULT_MERGE_MARKER],

// d3Tree.ts dragEnded
if (!canSiblingMerge(d)) return;

// index.vue confirmMergeNodes
if (!canMergeNodesInTree(data.sourceId)) {
    return alert('合并失败：需先完成上一层级节点合并后，当前层级才可合并');
}

// 合并产物
integratedFrom: [sourceNode.id, targetNode.id],
```

---

## 2. 视觉样式问题

### 2.1 连线颜色不生效

**问题根因**：CSS `.link { stroke: #ccc; }` 覆盖内联样式

**解决方案**：移除 CSS 中的 stroke 属性

```scss
// index.scss - 移除覆盖样式
.link {
    fill: none;
    stroke-width: 2;
    // stroke: #ccc;  // 删除此行
}
```

---

### 2.2 连线颜色不随整合方式变化

**问题根因**：未使用 `EDGE_STYLES` 映射

**解决方案**：使用 `EDGE_STYLES[d.target.data.integrationType]`

```typescript
// d3Tree.ts - renderTree() 函数
const path = link
    .append('path')
    .attr('class', 'link')
    .attr('stroke', (d) => {
        const type = d.target.data.integrationType as IntegrationTypeKey;
        return EDGE_STYLES[type] || '#ccc';
    });
```

---

### 2.3 停用下线无虚线

**问题根因**：缺少 dasharray 设置

**解决方案**：添加 `stroke-dasharray: '6,4'`

```typescript
// d3Tree.ts - renderTree() 函数
const path = link.append('path')
    .attr('class', 'link')
    .attr('stroke', ...)
    .attr('stroke-dasharray', (d) =>
        d.target.data.integrationType === IntegrationTypeKey.deprecate
            ? '6,4'
            : 'none'
    );
```

---

### 2.4 节点间距过短

**问题根因**：`nodeSize` 参数值过小

**解决方案**：调整为 `[NODE_HEIGHT+40, NODE_WIDTH+180]`

```typescript
// d3Tree.ts - initD3() 函数
const NODE_WIDTH: number = 160;
const NODE_HEIGHT: number = 40;

const treeLayout = d3
    .tree<TreeData>()
    .nodeSize([NODE_HEIGHT + 40, NODE_WIDTH + 180]) // [垂直间距, 水平间距]
    .separation((a, b) => (a.parent == b.parent ? 1.2 : 1.5));
```

---

### 2.5 默认 scale 不是 1

**问题根因**：初始化调用 `fitView` 自动计算缩放

**解决方案**：改用 `resetZoom` 固定 scale=1

```typescript
// d3Tree.ts - resetZoom() 函数
export function resetZoom(svg, g, width, height, zoom) {
    const bounds = g.node().getBBox();
    const translate = [
        width / 2 - (bounds.x + bounds.width / 2),
        height / 2 - (bounds.y + bounds.height / 2)
    ];
    // 固定 scale = 1
    svg.call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(1));
}

// initD3() 中调用
resetZoom(svg, g, width, height, zoom); // 替代 fitView()
```

---

## 3. 数据结构问题

### 3.1 integrationType 使用汉字

**问题根因**：违反数据规范，不利于国际化

**解决方案**：定义 `IntegrationTypeKey` 枚举

```typescript
// types/index.ts
export enum IntegrationTypeKey {
    merge = 'merge', // 合并
    migrate = 'migrate', // 迁移
    integration = 'integration', // 接口对接
    deprecate = 'deprecate', // 停用下线
    module_merge = 'module_merge' // 模块整合
}
```

---

### 3.2 缺少中文名存储

**问题根因**：前端显示需要中文

**解决方案**：新增 `integrationTypeName` 字段

```typescript
// types/index.ts - TreeData 接口
export interface TreeData {
    id: string;
    label: string;
    level: string;
    dept: string;
    owner: string;
    children?: TreeData[];
    modules?: TreeData[];
    integrationType?: IntegrationTypeKey; // 整合方式 key
    integrationTypeName?: string; // 整合方式中文名（新增）
    relations?: Array<{
        targetId: string;
        targetName: string;
        type: IntegrationTypeKey;
    }>;
}

// 中文名映射
export const INTEGRATION_TYPE_NAME: Record<IntegrationTypeKey, string> = {
    merge: '合并',
    migrate: '迁移',
    integration: '接口对接',
    deprecate: '停用下线',
    module_merge: '模块整合'
};
```

---

### 3.3 类型不匹配错误

**问题根因**：字符串字面量与枚举类型不兼容

**解决方案**：全局替换为枚举值

```typescript
// Modals.vue - 使用枚举值
import { IntegrationTypeKey } from '../types';

const newNodeIntegrationType = ref<IntegrationTypeKey>(IntegrationTypeKey.integration);
const integrateType = ref<IntegrationTypeKey>(IntegrationTypeKey.merge);
const relationType = ref<IntegrationTypeKey>(IntegrationTypeKey.integration);

// mockData.ts - 使用枚举值
import { IntegrationTypeKey, INTEGRATION_TYPE_NAME } from '../types';

export const initialTreeData: TreeData = {
    id: 'edu',
    label: '教育局',
    level: '领域级应用',
    dept: '教育局',
    owner: '管理员',
    children: [
        {
            id: 'app1',
            label: '教育管理一体化平台',
            level: '领域级应用',
            dept: '教育局',
            owner: '李XX',
            integrationType: IntegrationTypeKey.merge,           // 使用枚举
            integrationTypeName: INTEGRATION_TYPE_NAME.merge,    // 存储中文名
            children: [...]
        }
    ]
};
```

---

## 4. 下载功能问题

### 4.1 下载功能实现（借鉴 org-tree-lib）

**实现原理**：借鉴 `_templates/org-tree-lib/src/index.js` 的 download 方法，实现 SVG 转 PNG 下载

**解决方案**：

```typescript
// d3Tree.ts - 新增下载相关函数

/**
 * 计算下载所需的平移和尺寸
 * 使用实际渲染的 DOM 尺寸（而非 D3 节点坐标）
 */
function calculateDownloadTranslate(svg: SvgSelection, elemWidth: number) {
    const svgNode = svg.node();
    const gEl = svgNode?.querySelector('g');
    if (!svgNode || !gEl) {
        return { width: elemWidth, height: 800, baseTranslate: [0, MARGIN.top] };
    }

    const bounds = gEl.getBBox();
    const width = Math.max(bounds.width + MARGIN.left + MARGIN.right, elemWidth);
    const height = Math.max(bounds.height + MARGIN.top + MARGIN.bottom, 800);

    // 计算平移量：让内容从左上角开始（带 margin）
    const transX = MARGIN.left - bounds.x;
    const transY = MARGIN.top - bounds.y;
    const baseTranslate = [transX, transY];

    return { width, height, baseTranslate };
}

/**
 * 获取 SVG 字符串（包含内联 CSS 样式）
 */
function getSVGString(
    svgNodeOri: SVGSVGElement,
    baseTranslate: [number, number],
    options: { width: number; height: number; nodeWidth: number; margin: typeof MARGIN }
) {
    const { width, height } = options;
    const svgNode = svgNodeOri.cloneNode(true) as SVGSVGElement;

    svgNode.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svgNode.setAttribute('width', String(width));
    svgNode.setAttribute('height', String(height));

    // 移除可能导致布局问题的属性
    svgNode.removeAttribute('viewBox');
    svgNode.removeAttribute('preserveAspectRatio');

    // 添加白色背景矩形（在最前面）
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', '0');
    bgRect.setAttribute('width', String(width));
    bgRect.setAttribute('height', String(height));
    bgRect.setAttribute('fill', '#ffffff');
    svgNode.insertBefore(bgRect, svgNode.firstChild);

    // 调整 g 元素的 transform
    const gEl = svgNode.querySelector('g');
    if (gEl) {
        gEl.removeAttribute('transform');
        gEl.setAttribute('transform', `translate(${baseTranslate[0]}, ${baseTranslate[1]})`);
    }

    // 提取并内联 CSS 样式
    const cssStyleText = getCSSStyles(svgNode);
    appendCSS(cssStyleText, svgNode);

    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgNode);
}

/**
 * 将 SVG 字符串转换为图片 Blob
 */
function svgString2Image(
    svgString: string,
    width: number,
    height: number,
    format: string = 'png'
): Promise<Blob> {
    const { promise, resolve, reject } = createPromise<Blob>();
    const imgsrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        reject(new Error('[svgString2Image] Failed to get canvas context'));
        return promise;
    }

    canvas.width = width;
    canvas.height = height;

    const image = new Image();
    image.onload = function () {
        // 先填充白色背景
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        // 然后绘制 SVG 图像
        context.drawImage(image, 0, 0, width, height);

        canvas.toBlob(function (blob) {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('[svgString2Image] Failed to create blob'));
            }
        }, `image/${format}`);
    };

    image.onerror = function () {
        reject(new Error('[svgString2Image] Failed to load image'));
    };

    image.src = imgsrc;
    return promise;
}

/**
 * 下载树形图为 PNG 图片
 */
export async function downloadTree(
    svg: SvgSelection,
    root: d3.HierarchyNode<TreeData>,
    elemWidth: number,
    name: string = 'tree-diagram'
) {
    const svgNode = svg.node();
    if (!svgNode) return;

    const { width, height, baseTranslate } = calculateDownloadTranslate(svg, elemWidth);
    const svgString = getSVGString(svgNode, baseTranslate as [number, number], {
        width,
        height,
        nodeWidth: NODE_WIDTH,
        margin: MARGIN
    });
    const blob = await svgString2Image(svgString, width, height, 'png');
    saveAs(blob, `${name}-${Date.now()}.png`, true);
}
```

---

### 4.2 下载图片偏右

**问题根因**：居中计算逻辑错误，使用了复杂的 D3 节点坐标计算

**解决方案**：使用实际渲染的 bounding box 计算平移量

```typescript
// 错误：使用 D3 节点坐标
const box = getTreeBox(root);
const disX = 2 * Math.max(Math.abs(box.right.x ?? 0), Math.abs(box.left.x ?? 0));
const trans = Math.round(width / 2 - (width - elemWidth - NODE_WIDTH) / 2);

// 正确：使用实际渲染的 DOM 尺寸
const bounds = gEl.getBBox();
const transX = MARGIN.left - bounds.x; // 左边界对齐左边距
```

---

### 4.3 下载图片偏下

**问题根因**：`transY` 计算错误，导致内容被向下偏移过多

**解决方案**：让内容上边界对齐上边距

```typescript
// 错误：复杂的居中计算
const transY = MARGIN.top - bounds.y; // 计算逻辑有误

// 正确：直接对齐上边距
const transY = MARGIN.top - bounds.y; // 让内容上边界移到上边距位置
```

---

### 4.4 背景灰色（灰上加白）

**问题根因**：

1. SVG 的 `viewBox` 和 `preserveAspectRatio` 属性导致布局错乱
2. canvas 绘制时未填充背景

**解决方案**：

```typescript
// 移除可能导致布局问题的属性
svgNode.removeAttribute('viewBox');
svgNode.removeAttribute('preserveAspectRatio');

// 添加白色背景矩形
const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
bgRect.setAttribute('x', '0');
bgRect.setAttribute('y', '0');
bgRect.setAttribute('width', String(width));
bgRect.setAttribute('height', String(height));
bgRect.setAttribute('fill', '#ffffff');
svgNode.insertBefore(bgRect, svgNode.firstChild);

// canvas 绘制前先填充白色背景
context.fillStyle = '#ffffff';
context.fillRect(0, 0, width, height);
context.drawImage(image, 0, 0, width, height);
```

---

### 4.5 Canvas 污染错误

**问题描述**：`Uncaught SecurityError: Failed to execute 'toBlob' on 'HTMLCanvasElement': Tainted canvases may not be exported.`

**问题根因**：SVG 中可能包含外部资源（如外部图片）

**解决方案**：使用 base64 编码的 SVG 数据 URL

```typescript
const imgsrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
```

---

### 4.6 线条宽度异常

**问题根因**：CSS 样式未正确内联

**解决方案**：提取并内联所有相关 CSS 样式

```typescript
function getCSSStyles(parentElement: Element) {
    const selectorTextArr: string[] = [];
    // 收集所有相关样式选择器...
}

function appendCSS(cssText: string, element: Element) {
    const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    styleElement.textContent = cssText;
    element.appendChild(styleElement);
}
```

---

### 4.7 下载按钮触发

**问题根因**：`downloadTree` 是 async 函数，但调用时未 await

**解决方案**：

```typescript
// GraphCanvas.vue
async function handleDownload() {
    await downloadTree(d3Instance.svg, d3Instance.root, container.clientWidth);
}
```

### 4.8 下载格式选择（Modal 模态框）

**需求**：点击下载按钮时弹出美观的模态框，让用户选择下载格式（PNG/SVG），并支持自定义文件名。

**解决方案**：

```vue
<!-- GraphCanvas.vue - 下载格式选择模态框 -->
<div class="modal-overlay" :class="{ show: showDownloadModal }" @click.self="showDownloadModal = false">
    <div class="modal download-modal">
        <h3>📥 选择下载格式</h3>

        <!-- 文件名输入 -->
        <div class="form-group">
            <label>文件名称</label>
            <input type="text" v-model="downloadFileName" placeholder="请输入文件名" />
        </div>

        <div class="download-options">
            <div class="download-option" @click="selectDownloadFormat('png')">
                <div class="option-icon">🖼️</div>
                <div class="option-info">
                    <div class="option-title">PNG 图片</div>
                    <div class="option-desc">适合分享和打印</div>
                </div>
            </div>
            <div class="download-option" @click="selectDownloadFormat('svg')">
                <div class="option-icon">📐</div>
                <div class="option-info">
                    <div class="option-title">SVG 矢量图</div>
                    <div class="option-desc">适合编辑和缩放</div>
                </div>
            </div>
        </div>
        <div class="modal-actions">
            <button @click="showDownloadModal = false">取消</button>
        </div>
    </div>
</div>
```

```typescript
// GraphCanvas.vue - 下载逻辑
const showDownloadModal = ref<boolean>(false);
const downloadFileName = ref<string>('tree-diagram');

async function handleDownload() {
    // 显示下载格式选择模态框
    showDownloadModal.value = true;
}

async function selectDownloadFormat(format: 'png' | 'svg') {
    const inputFileName = downloadFileName.value.trim();

    // 如果用户没有修改（使用默认值），添加时间戳；否则使用用户输入的名称
    const fileName =
        inputFileName === 'tree-diagram'
            ? `tree-diagram-${Date.now()}` // 默认名称添加时间戳
            : inputFileName || 'tree-diagram'; // 用户自定义名称不添加时间戳

    showDownloadModal.value = false;
    await downloadTree(svg, root, container.clientWidth, fileName, format);
}
```

```typescript
// d3Tree.ts - 支持多种格式下载
export async function downloadTree(
    svg: SvgSelection,
    root: d3.HierarchyNode<TreeData>,
    elemWidth: number,
    name: string = 'tree-diagram',
    format: 'png' | 'svg' = 'png' // 新增参数
) {
    // ... 获取 SVG 字符串 ...

    if (format === 'svg') {
        // 下载 SVG 文件
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        saveAs(blob, `${name}.svg`, true);
    } else {
        // 转换为 PNG 图片并下载
        const blob = await svgString2Image(svgString, width, height, 'png');
        saveAs(blob, `${name}.png`, true);
    }
}
```

**文件名生成规则**：

| 用户输入              | 判断条件 | 下载文件名                                   |
| --------------------- | -------- | -------------------------------------------- |
| 默认值 `tree-diagram` | 未修改   | `tree-diagram-1781075920479.png`（带时间戳） |
| 用户输入 `my-tree`    | 自定义   | `my-tree.png`（不带时间戳）                  |
| 用户清空输入框        | 空值     | `tree-diagram.png`（不带时间戳）             |
