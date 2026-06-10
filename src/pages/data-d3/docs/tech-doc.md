# D3 树形图技术文档

---

## 目录

1. [问题解决清单](#一问题解决清单)

    - 1.1 交互功能问题
    - 1.2 视觉样式问题
    - 1.3 数据结构问题
    - 1.4 UI 功能问题

2. [D3 树形图设计思路](#二d3树形图设计思路)

    - 2.1 整体架构设计
    - 2.2 核心技术选型
    - 2.3 关键设计决策

3. [实现说明](#三实现说明)

    - 3.1 初始化流程
    - 3.2 拖拽交互实现
    - 3.3 连线样式实现
    - 3.4 视图控制实现

4. [注意事项](#四注意事项)

    - 4.1 D3 版本兼容性
    - 4.2 坐标系说明
    - 4.3 性能优化策略
    - 4.4 防御性编程

## 一、问题解决清单

### 1.1 交互功能问题

| 序号 | 问题描述             | 根因分析                         | 解决方案                                   | 代码位置            |
| ---- | -------------------- | -------------------------------- | ------------------------------------------ | ------------------- |
| 1    | 拖拽节点不在鼠标位置 | `event.dx/dy` 是增量，未正确累加 | 使用 `dataset` 维护累计 transform          | `d3Tree.ts:419-444` |
| 2    | 拖拽到其他节点无反应 | DOM 命中检测无法识别可视区外节点 | 添加坐标计算回退机制                       | `d3Tree.ts:633-730` |
| 3    | 非同级节点响应拖拽   | 缺少同级判定逻辑                 | 添加 `n.parent.data.id === sourceParentId` | `d3Tree.ts:663`     |
| 4    | 拖拽到自己触发整合   | 未排除自身检测                   | 三重检查：DOM/坐标/dragended               | `d3Tree.ts:606-624` |
| 5    | 画布边缘不自动平移   | 缺少边缘检测和平移逻辑           | 添加 `zoom.translateBy` 自动平移           | `d3Tree.ts:465-510` |
| 6    | 平移方向相反         | 平移方向逻辑错误                 | 修正方向：鼠标左边缘→画布右移              | `d3Tree.ts:486-502` |
| 7    | 可视区外节点无法命中 | 手动解析 transform 不准确        | 使用 SVG 矩阵变换 API                      | `d3Tree.ts:677-703` |

### 1.2 视觉样式问题

| 序号 | 问题描述                 | 根因分析                                   | 解决方案                                          | 代码位置            |
| ---- | ------------------------ | ------------------------------------------ | ------------------------------------------------- | ------------------- |
| 8    | 连线颜色不生效           | CSS `.link { stroke: #ccc; }` 覆盖内联样式 | 移除 CSS 中的 stroke 属性                         | `index.scss`        |
| 9    | 连线颜色不随整合方式变化 | 未使用 `EDGE_STYLES` 映射                  | 使用 `EDGE_STYLES[d.target.data.integrationType]` | `d3Tree.ts:207-219` |
| 10   | 停用下线无虚线           | 缺少 dasharray 设置                        | 添加 `stroke-dasharray: '6,4'`                    | `d3Tree.ts:213-215` |
| 11   | 节点间距过短             | `nodeSize` 参数值过小                      | 调整为 `[NODE_HEIGHT+40, NODE_WIDTH+180]`         | `d3Tree.ts:177`     |
| 12   | 默认 scale 不是 1        | 初始化调用 `fitView` 自动计算缩放          | 改用 `resetZoom` 固定 scale=1                     | `d3Tree.ts:341`     |

### 1.3 数据结构问题

| 序号 | 问题描述                   | 根因分析                     | 解决方案                        | 代码位置                    |
| ---- | -------------------------- | ---------------------------- | ------------------------------- | --------------------------- |
| 13   | `integrationType` 使用汉字 | 违反数据规范，不利于国际化   | 定义 `IntegrationTypeKey` 枚举  | `types/index.ts:1-10`       |
| 14   | 缺少中文名存储             | 前端显示需要中文             | 新增 `integrationTypeName` 字段 | `types/index.ts:31`         |
| 15   | 类型不匹配错误             | 字符串字面量与枚举类型不兼容 | 全局替换为枚举值                | `Modals.vue`、`mockData.ts` |

### 1.4 UI 功能问题

| 序号 | 问题描述         | 解决方案                            | 代码位置             |
| ---- | ---------------- | ----------------------------------- | -------------------- |
| 16   | 缺少重置缩放按钮 | 添加"🔍 100%"按钮 +`resetZoom` 函数 | `GraphCanvas.vue:25` |

## 二、D3 树形图设计思路

### 2.1 整体架构设计

```
┌─────────────────────────────────────────────────────────────┐
│                      index.vue (主页面)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • 响应式数据 (treeData, root)                      │   │
│  │  • 事件处理器 (onNodeClick, onDropToTarget)         │   │
│  │  • 模态框控制 (Modals.vue)                          │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    GraphCanvas.vue (画布组件)                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • SVG 容器管理                                     │   │
│  │  • 工具栏 (放大/缩小/重置/适应)                      │   │
│  │  • D3 实例封装与暴露                                │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    d3Tree.ts (核心逻辑)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • initD3()        - 初始化 SVG + 布局 + 绑定       │   │
│  │  • renderTree()    - 渲染节点和连线                 │   │
│  │  • dragged()       - 拖拽过程处理                   │   │
│  │  • dragended()     - 拖拽结束处理                   │   │
│  │  • 落点检测函数     - DOM 命中 + 坐标计算            │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                    types/index.ts (类型定义)                 │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  • TreeData 接口                                    │   │
│  │  • IntegrationTypeKey 枚举                          │   │
│  │  • EDGE_STYLES / INTEGRATION_TYPE_NAME 映射         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心技术选型

| 技术           | 版本 | 选型理由                                 |
| -------------- | ---- | ---------------------------------------- |
| D3.js          | v7   | 成熟的可视化库，支持复杂的树形布局和交互 |
| Vue 3          | 3.x  | 响应式框架，便于组件化开发               |
| TypeScript     | 5.x  | 类型安全，提升代码质量                   |
| Ant Design Vue | 4.x  | 提供模态框、抽屉等 UI 组件               |

### 2.3 关键设计决策

#### 2.3.1 数据与视图分离

**设计原则**：拖拽时只修改视觉位置，不修改 `d.x/d.y`

```typescript
// 使用 dataset 存储临时位置
gEl.dataset.curTX = String(curTX); // 累计平移 X
gEl.dataset.curTY = String(curTY); // 累计平移 Y
d3.select(gEl).attr('transform', `translate(${curTX},${curTY})`);
```

**优势**：

-   避免污染 D3 hierarchy 数据结构
-   便于后续重绘时恢复原始布局
-   支持多次拖拽而不累积误差

#### 2.3.2 双重落点检测机制

```typescript
function findSameLevelNodeAtDOM(root, source, clientX, clientY) {
    // 优先使用 DOM 命中（简单直接）
    const elements = document.elementsFromPoint(clientX, clientY);
    // ... 遍历找 g.node

    // 回退到坐标计算（支持可视区外节点）
    return findSameLevelNodeByCoord(root, source, clientX, clientY);
}
```

**优势**：

-   DOM 命中：无需坐标转换，直接可靠
-   坐标计算：支持可视区外节点检测

#### 2.3.3 枚举化整合方式

```typescript
export enum IntegrationTypeKey {
    merge = 'merge',
    migrate = 'migrate',
    integration = 'integration',
    deprecate = 'deprecate',
    module_merge = 'module_merge'
}
```

**优势**：

-   类型安全，避免拼写错误
-   IDE 自动补全
-   运行时可用（可遍历、可比较）

## 三、实现说明

### 3.1 初始化流程

```typescript
export function initD3(containerId, treeData, onNodeClick, ...) {
    // 1. 获取容器尺寸
    const width = container.clientWidth;
    const height = container.clientHeight;

    // 2. 创建 SVG 和 g 容器
    const svg = d3.select(`#${containerId}`).append('svg');
    const g = svg.append('g');

    // 3. 配置 zoom 行为
    const zoom = d3.zoom().on('zoom', (event) => {
        g.attr('transform', event.transform);
    });
    svg.call(zoom);

    // 4. 配置树形布局
    const treeLayout = d3.tree<TreeData>()
        .nodeSize([NODE_HEIGHT + 40, NODE_WIDTH + 180]);

    // 5. 转换数据并计算布局
    const root = d3.hierarchy(treeData);
    treeLayout(root);

    // 6. 渲染节点和连线
    renderTree(root, g, ...);

    // 7. 绑定拖拽事件
    node.call(d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));

    // 8. 初始化视图
    resetZoom(svg, g, width, height, zoom);
}
```

### 3.2 拖拽交互实现

#### 3.2.1 三阶段处理

| 阶段  | 函数          | 核心逻辑                                      |
| ----- | ------------- | --------------------------------------------- |
| start | `dragstarted` | 记录初始位置到 `dataset`                      |
| drag  | `dragged`     | 累加增量 + 更新视觉位置 + 边缘平移 + 实时高亮 |
| end   | `dragended`   | 检测落点 + 触发整合弹框 + 重置位置            |

#### 3.2.2 边缘自动平移

```typescript
const edgeMargin = 100; // 边缘触发区域
const panSpeed = 8; // 平移速度

// 检测四个边缘
if (relativeX < edgeMargin) panDX = panSpeed; // 左边→右移
if (relativeX > canvasWidth - edgeMargin) panDX = -panSpeed; // 右边→左移
if (relativeY < edgeMargin) panDY = panSpeed; // 顶部→下移
if (relativeY > canvasHeight - edgeMargin) panDY = -panSpeed; // 底部→上移

// 执行平移
svg.transition().duration(10).call(zoom.translateBy, panDX, panDY);
```

### 3.3 连线样式实现

#### 3.3.1 颜色映射

```typescript
export const EDGE_STYLES: Record<IntegrationTypeKey, string> = {
    [IntegrationTypeKey.merge]: '#f5222d', // 红色
    [IntegrationTypeKey.migrate]: '#1890ff', // 蓝色
    [IntegrationTypeKey.integration]: '#52c41a', // 绿色
    [IntegrationTypeKey.deprecate]: '#d9d9d9', // 灰色
    [IntegrationTypeKey.module_merge]: '#722ed1' // 紫色
};
```

#### 3.3.2 连线渲染

```typescript
const path = link
    .append('path')
    .attr('class', 'link')
    .attr('stroke', (d) => {
        const type = d.target.data.integrationType as IntegrationTypeKey;
        return EDGE_STYLES[type] || '#ccc';
    })
    .attr('stroke-dasharray', (d) =>
        d.target.data.integrationType === IntegrationTypeKey.deprecate ? '6,4' : 'none'
    )
    .attr('d', linkGenerator);
```

### 3.4 视图控制实现

```typescript
// 放大
export function zoomIn(svg, zoom) {
    svg.transition().duration(300).call(zoom.scaleBy, 1.25);
}

// 缩小
export function zoomOut(svg, zoom) {
    svg.transition().duration(300).call(zoom.scaleBy, 0.8);
}

// 重置缩放 (scale = 1)
export function resetZoom(svg, g, width, height, zoom) {
    const bounds = g.node().getBBox();
    const translate = [
        width / 2 - (bounds.x + bounds.width / 2),
        height / 2 - (bounds.y + bounds.height / 2)
    ];
    svg.call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(1));
}

// 适应屏幕
export function fitView(svg, g, width, height, zoom) {
    const bounds = g.node().getBBox();
    const scale = Math.min(width / (bounds.width + 100), height / (bounds.height + 100));
    const translate = [
        width / 2 - scale * (bounds.x + bounds.width / 2),
        height / 2 - scale * (bounds.y + bounds.height / 2)
    ];
    svg.call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale));
}
```

## 四、注意事项

### 4.1 D3 版本兼容性

-   **D3 v7** 与旧版本 API 有差异，注意 `d3.drag()` 的 `this` 指向问题
-   使用闭包传递 DOM 元素，避免依赖 `event.sourceEvent.currentTarget`
-   `d3.pointers()` 返回的是相对 SVG 的坐标，需要正确处理

### 4.2 坐标系说明

| 坐标系       | 获取方式                               | 用途         |
| ------------ | -------------------------------------- | ------------ |
| clientX/Y    | `event.sourceEvent.clientX/Y`          | DOM 命中检测 |
| SVG 内部坐标 | `createSVGPoint() + matrixTransform()` | 节点定位     |
| d.x/d.y      | D3 hierarchy 布局                      | 连线生成     |

### 4.3 性能优化策略

1. **避免频繁重绘**：拖拽时只更新被拖拽节点的 transform
2. **事件节流**：边缘平移使用 `transition().duration(10)` 控制频率
3. **批量 DOM 操作**：使用 D3 的 enter/update/exit 模式
4. **避免内存泄漏**：组件卸载时清理事件监听器

### 4.4 防御性编程

```typescript
// 检查 d 是否为 HierarchyNode
if (!d || typeof d.parent === 'undefined') {
    const nodeId = gEl.getAttribute('data-id');
    const realNode = root.descendants().find((n) => n.data.id === nodeId);
    if (realNode) d = realNode;
}

// 检查 DOM 元素
const svgEl = document.querySelector('svg');
if (!svgEl) return;

// 检查数值有效性
if (!Number.isFinite(curTX)) curTX = initialTX;
```

## 五、文件结构

```
src/pages/data-d3/
├── components/
│   ├── GraphCanvas.vue    # 画布组件（SVG 容器、工具栏）
│   └── Modals.vue         # 模态框组件（新增/编辑/整合）
├── data/
│   └── mockData.ts        # Mock 数据（树形结构）
├── docs/
│   ├── fix-code-snippets.md    # D3 树形图问题修复代码片段
│   └── tech-doc.md        # 技术文档
├── types/
│   └── index.ts           # 类型定义（TreeData、枚举、常量）
├── utils/
│   └── d3Tree.ts          # D3 核心逻辑（初始化、渲染、交互）
├── index.vue              # 主页面（数据管理、事件处理）
└── index.scss             # 样式文件
```
