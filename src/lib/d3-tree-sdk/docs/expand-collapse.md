# 展开收起功能文档

## 目录

-   [功能概述](#功能概述)
-   [核心设计](#核心设计)
-   [类型定义](#类型定义)
-   [按钮渲染](#按钮渲染)
-   [事件绑定](#事件绑定)
-   [状态管理](#状态管理)
-   [代码实现](#代码实现)
-   [状态转换](#状态转换)
-   [完整流程](#完整流程)

---

## 功能概述

### 功能描述

展开收起功能允许用户通过点击节点旁边的展开/收起按钮来显示或隐藏子节点。该功能支持：

-   **同步模式**：子节点已存在，直接展开/收起
-   **异步模式**：子节点需要从服务器加载，支持缓存和实时两种策略
-   **叶子节点识别**：通过 `isLeaf` 字段判断是否为叶子节点
-   **状态缓存**：收起时保存子节点到 `_children`，展开时恢复

### 核心特性

| 特性     | 说明                                           |
| -------- | ---------------------------------------------- |
| 图标     | PlusCircleOutlined / MinusCircleOutlined       |
| 按钮位置 | 水平布局在节点右侧中间，垂直布局在节点下方中间 |
| 状态指示 | 图标区分展开/收起状态                          |
| 事件隔离 | 点击按钮不触发拖拽和节点点击事件               |

---

## 核心设计

### 展开收起判断逻辑

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              节点数据判断流程                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  1. 获取节点数据                                                                 │
│     const hasChildren = children && children.length > 0                         │
│     const hasCachedChildren = !!_children && _children.length > 0                │
│     const isLeaf = data.isLeaf === true                                         │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  2. 判断是否可以展开（显示展开按钮）                                               │
│     ┌───────────────────────────────────────────────────────────────────────┐   │
│     │ - isLeaf === true  → 叶子节点，不显示展开按钮                          │   │
│     │ - hasChildren      → 有已加载的子节点，显示展开按钮                    │   │
│     │ - hasCachedChildren→ 有缓存的子节点（收起状态），显示展开按钮          │   │
│     │ - isLeaf === false && children.length === 0 → 异步加载节点，显示展开按钮│   │
│     └───────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  3. 判断当前状态（显示哪种图标）                                                   │
│     ┌───────────────────────────────────────────────────────────────────────┐   │
│     │ const isExpanded = hasChildren && !hasCachedChildren                  │   │
│     │                                                                       │   │
│     │ - isExpanded = true  → 显示 MinusCircleOutlined（减号/收起图标）      │   │
│     │ - isExpanded = false → 显示 PlusCircleOutlined（加号/展开图标）       │   │
│     └───────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
│     场景分析：                                                                   │
│     ┌───────────────────────────────────────────────────────────────────────┐   │
│     │ 场景                      │ hasChildren │ hasCached │ isExpanded │ 图标 │   │
│     │ ─────────────────────────────────────────────────────────────────────│   │
│     │ 叶子节点                  │    false    │   false   │   false    │  无  │   │
│     │ 已展开的非叶子节点        │    true     │   false   │   true     │  减  │   │
│     │ 已收起的非叶子节点        │    false    │   true    │   false    │  加  │   │
│     │ 异步加载节点（未加载）    │    false    │   false   │   false    │  加  │   │
│     │ 异步加载节点（已加载）    │    true     │   false   │   true     │  减  │   │
│     └───────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 状态转换

```
展开状态                                    收起状态
┌──────────────────────┐                  ┌──────────────────────┐
│ 节点 A               │                  │ 节点 A               │
│  ├─ 子节点1          │   点击收起按钮    │  ├─ [+ 展开按钮]      │
│  ├─ 子节点2          │ ────────────────► │                      │
│  └─ 子节点3          │                  │                      │
└──────────────────────┘                  └──────────────────────┘
        │                                          │
        │                                          │
        ▼                                          ▼
┌──────────────────────┐                  ┌──────────────────────┐
│  children: [子节点]   │                  │  children: []        │
│  _children: undefined │                  │  _children: [子节点] │
└──────────────────────┘                  └──────────────────────┘
```

---

## 类型定义

### TreeData 扩展

```typescript
// src/lib/d3-tree-sdk/types/index.ts
export interface TreeData {
    id: string;
    label?: string;
    children?: TreeData[];

    /** 内部字段：缓存收起状态下的子节点 */
    _children?: TreeData[];

    /** 是否叶子节点（用于异步加载场景） */
    isLeaf?: boolean;
}
```

### TreeAccessors 接口

```typescript
// src/lib/d3-tree-sdk/schema/TreeAccessors.ts
export interface TreeAccessors {
    /**
     * 获取缓存的子节点（收起状态下保存的子节点）
     * @description 用于展开/收起功能，收起时将 children 移到 _children 缓存
     * @returns 缓存的子节点数组，如果没有缓存则返回 undefined
     */
    getCachedChildren(node: TreeNodeData): TreeNodeData[] | undefined;

    /**
     * 检查节点是否有缓存的子节点
     * @description 用于判断节点是否处于收起状态
     */
    hasCachedChildren(node: TreeNodeData): boolean;

    /**
     * 检查节点是否为叶子节点
     * @description 通过 isLeaf 字段判断，适用于异步加载场景
     * @returns true 表示是叶子节点，false 表示有子节点（可能需要异步加载）
     */
    isLeaf(node: TreeNodeData): boolean;
}
```

### TreeContext 方法

```typescript
// src/lib/d3-tree-sdk/TreeContext.ts
export class TreeContext {
    /**
     * 切换节点的展开/收起状态
     * - 如果节点已展开（children 存在），则收起
     * - 如果节点已收起（_children 存在），则展开
     */
    toggleNodeChildren(root: TreeData, nodeId: string): TreeData | null;

    /**
     * 切换节点展开状态（支持异步加载）
     * @param root - 树根节点
     * @param nodeId - 要切换的节点 ID
     * @param asyncConfig - 异步加载配置（可选）
     */
    async toggleNodeExpansion(
        root: TreeData,
        nodeId: string,
        asyncConfig?: {
            loadChildren: (nodeId: string) => Promise<TreeData[]>;
            strategy: AsyncLoadStrategy;
        }
    ): Promise<TreeData | null>;
}
```

---

## 按钮渲染

### 按钮 HTML 结构

```typescript
// src/lib/d3-tree-sdk/core/d3Tree.ts - buildNodeCardHtml 函数
const expandBtn = canExpand
    ? `
    <button class="expand-btn" data-id="${id}" title="${isExpanded ? '收起' : '展开'}">
        <svg class="expand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${
                isExpanded
                    ? `
                <!-- MinusCircleOutlined（收起） -->
                <circle cx="12" cy="12" r="10"/>
                <line x1="8" y1="12" x2="16" y2="12" stroke-linecap="round"/>
            `
                    : `
                <!-- PlusCircleOutlined（展开） -->
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16" stroke-linecap="round"/>
                <line x1="8" y1="12" x2="16" y2="12" stroke-linecap="round"/>
            `
            }
        </svg>
    </button>`
    : '';
```

### 按钮样式

```css
/* 展开/收起按钮样式 */
.expand-btn {
    position: absolute;
    width: 24px;
    height: 24px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: var(--ant-primary-color, #1890ff);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    z-index: 10;
}

.expand-btn:hover {
    background: var(--ant-primary-color-hover, #40a9ff);
    transform: scale(1.1);
}

.expand-icon {
    width: 16px;
    height: 16px;
}

/* 水平布局：按钮在节点右侧中间 */
.horizontal .expand-btn {
    right: -12px;
    top: 50%;
    transform: translateY(-50%);
}

/* 垂直布局：按钮在节点下方中间 */
.vertical .expand-btn {
    bottom: -12px;
    left: 50%;
    transform: translateX(-50%);
}
```

### 按钮定位逻辑

```
水平布局 (horizontal)：
┌──────────────────────────┐
│                          │
│   节点卡片                │────[+]────
│                          │
│                          │
└──────────────────────────┘
        │
        │
     按钮在右侧中间 (right: -12px, top: 50%)

垂直布局 (vertical)：
┌──────────────────────────┐
│                          │
│   节点卡片                │
│                          │
│                          │
└──────────────────────────┘
           [+]
           │
        按钮在下方中间 (bottom: -12px, left: 50%)
```

---

## 事件绑定

### 事件绑定代码

```typescript
// src/lib/d3-tree-sdk/core/d3Tree.ts - bindNodeEvents 函数

// 绑定"展开/收起"按钮事件
fo.selectAll('.expand-btn').on('click', function (event) {
    event.stopPropagation(); // 阻止事件冒泡
    const nodeId = d3.select(this).attr('data-id');
    if (nodeId) {
        onExpandClick(nodeId); // 调用回调函数
    }
});
```

### 事件隔离机制

```typescript
// 拖拽事件中排除按钮点击
const DRAG_EXCLUDE_BUTTONS = ['more-btn', 'expand-btn'] as const;

function isDragExcludeButton(target: EventTarget | null): boolean {
    if (!target) return false;
    let element: HTMLElement | null = target as HTMLElement;

    // 向上遍历 DOM 树，检查是否包含排除的按钮类名
    while (element) {
        if (DRAG_EXCLUDE_BUTTONS.some((cls) => element!.classList.contains(cls))) {
            return true;
        }
        element = element.parentElement;
    }

    return false;
}

// 拖拽开始时检查
drag.on('start', function (event, d) {
    // 如果点击的是排除按钮，不触发拖拽
    if (isDragExcludeButton(event.sourceEvent.target)) return;
    // ... 其他拖拽逻辑
});

// 节点点击时检查
.on('click', function (event, d) {
    // 如果点击的是排除按钮，不触发节点点击
    if (isDragExcludeButton(event.target)) return;
    event.stopPropagation();
    onNodeClick(d.data);
})
```

### 完整的事件隔离代码

```typescript
// src/lib/d3-tree-sdk/core/d3Tree.ts

/**
 * 需要排除拖拽的按钮类名
 * 如果以后需要修改点击行为（比如添加新的排除按钮类型），只需修改：
 * 1. DRAG_EXCLUDE_BUTTONS 数组（添加新按钮类名）
 * 2. bindNodeCardClick 函数（修改点击逻辑）
 * ----------------------------------------------------------------------------
 * 当点击这些按钮时，不会触发拖拽事件
 */
const DRAG_EXCLUDE_BUTTONS = ['more-btn', 'expand-btn'] as const;

/**
 * 检查点击目标是否是需要排除拖拽的按钮
 * ----------------------------------------------------------------------------
 * @param target - 点击目标元素
 * @returns 如果是排除的按钮则返回 true
 *
 * @description
 * 由于点击按钮内部的子元素（如 SVG 图标）时，event.target 可能是子元素而非按钮本身，
 * 因此需要向上遍历 DOM 树，检查目标元素及其祖先元素是否包含排除的类名
 */
function isDragExcludeButton(target: EventTarget | null): boolean {
    if (!target) return false;
    let element: HTMLElement | null = target as HTMLElement;

    // 向上遍历 DOM 树，检查是否包含排除的按钮类名
    while (element) {
        if (DRAG_EXCLUDE_BUTTONS.some((cls) => element!.classList.contains(cls))) {
            return true;
        }
        element = element.parentElement;
    }

    return false;
}

/**
 * 绑定节点卡片的点击事件
 * ----------------------------------------------------------------------------
 * @param selection - 节点卡片的 D3 selection
 * @param onNodeClick - 单击回调
 * @param onNodeDoubleClick - 双击回调
 */
function bindNodeCardClick<ParentElement extends d3.BaseType, PDatum>(
    selection: d3.Selection<HTMLElement, d3.HierarchyNode<TreeData>, ParentElement, PDatum>,
    onNodeClick: (data: TreeData) => void,
    onNodeDoubleClick: (data: TreeData) => void
) {
    /**
     * 1. 首次初始化 时绑定节点点击事件
     * 2. 数据更新后重新渲染 时绑定节点点击事件，节点数据变化（增删改）后重新设置点击行为
     *
     * 当用户点击节点卡片时，应该触发 onNodeClick 等回调；
     * 但如果点击的是卡片内的按钮（展开收起按钮或更多按钮），则 不应该 触发节点点击事件，否则会导致：
     * - 点击展开按钮时，同时触发展开和节点点击
     * - 点击更多按钮时，同时弹出菜单和触发节点点击
     */
    selection
        .on('click', function (event, d) {
            // 排除按钮点击
            if (isDragExcludeButton(event.target)) return;
            event.stopPropagation();
            onNodeClick(d.data);
        })
        .on('dblclick', function (event, d) {
            // 排除按钮点击
            if (isDragExcludeButton(event.target)) return;
            event.stopPropagation();
            onNodeDoubleClick(d.data);
        });
}
```

### 拖拽事件中的冲突处理

```typescript
// src/lib/d3-tree-sdk/core/d3Tree.ts - setupDragBehavior 函数

// 步骤 2：创建新的 d3.drag() 行为并绑定事件
nodeSelection.call(
    d3
        .drag<SVGGElement, d3.HierarchyNode<TreeData>>()
        // 步骤 3：绑定 dragstart 事件
        .on('start', function (this: SVGGElement, event) {
            // 忽略点击按钮的情况（使用统一的排除列表）：检查点击目标是否是排除的按钮，如果是则不触发拖拽
            if (isDragExcludeButton(event.sourceEvent?.target)) return;

            // 解析当前节点 ID
            const nodeId = resolveNodeIdFromElement(this, instance.treeContext);
            if (!nodeId) return;

            // 获取最新的节点数据（单一数据源）
            const currentNode = getCurrentNode(instance, nodeId);
            if (!currentNode) return;

            // 调用拖拽开始处理函数
            dragStarted(instance, currentNode, this, event);
        })
        // 步骤 4：绑定 drag 事件（拖拽过程中）
        .on('drag', function (this: SVGGElement, event) {
            // 解析当前节点 ID
            const nodeId = resolveNodeIdFromElement(this, instance.treeContext);
            if (!nodeId) return;
            // 检查是否正在拖拽
            if (!instance.currentDraggingNodeId) return;
            // 调用拖拽中处理函数
            dragged(this, event, instance, instance.svg, instance.zoom);
        })
        // 步骤 5：绑定 dragend 事件（拖拽结束）
        .on('end', function (this: SVGGElement, event) {
            // 解析当前节点 ID
            const nodeId = resolveNodeIdFromElement(this, instance.treeContext);
            if (!nodeId) return;
            // 获取最新的节点数据（单一数据源）
            const currentNode = getCurrentNode(instance, nodeId);
            if (!currentNode) return;
            // 调用拖拽结束处理函数
            dragEnded(instance, event, currentNode, instance.root, onDropToTarget);
        })
);
```

### GraphCanvas 中的处理函数

```typescript
// src/pages/data-d3/components/GraphCanvas.vue

/**
 * 处理展开/收起按钮点击
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 调用 graph.toggleNodeExpansion() 切换节点状态
 *   2. 该方法会自动处理同步/异步模式
 *   3. 完成后自动重新渲染树
 */
async function handleExpandClick(nodeId: string) {
    if (!graph) return;

    try {
        // 切换节点展开状态（支持异步加载）
        // 直接使用全局变量 asyncLoadStrategy
        await graph.toggleNodeExpansion(nodeId, asyncLoadStrategy.value);
    } catch (error) {
        console.error('展开/收起节点失败:', error);
    }
}
```

### 事件冲突场景及解决方案

#### 场景 1：点击展开/收起按钮

| 问题                   | 原因                                       | 解决方案                                          |
| ---------------------- | ------------------------------------------ | ------------------------------------------------- |
| 点击按钮时触发拖拽     | `event.target` 可能是 SVG 图标而非按钮本身 | `isDragExcludeButton` 向上遍历 DOM 树检查         |
| 点击按钮时触发节点点击 | 事件冒泡                                   | `event.stopPropagation()` + `isDragExcludeButton` |

**代码：**

```typescript
// 按钮点击事件
fo.selectAll('.expand-btn').on('click', function (event) {
    event.stopPropagation();  // 阻止冒泡
    // ... 处理展开/收起
});

// 节点点击事件
.on('click', function (event, d) {
    if (isDragExcludeButton(event.target)) return;  // 排除按钮
    event.stopPropagation();
    // ... 处理节点点击
});

// 拖拽开始事件
.on('dragstart', function (event) {
    if (isDragExcludeButton(event.sourceEvent?.target)) return;  // 排除按钮
    // ... 处理拖拽开始
});
```

#### 场景 2：点击更多按钮

| 问题                   | 原因     | 解决方案 |
| ---------------------- | -------- | -------- |
| 点击按钮时触发拖拽     | 同上     | 同上     |
| 点击按钮时触发节点点击 | 同上     | 同上     |
| 点击按钮时弹出菜单     | 正常行为 | 无需处理 |

#### 场景 3：拖拽过程中释放

| 问题                   | 原因                           | 解决方案                                 |
| ---------------------- | ------------------------------ | ---------------------------------------- |
| 拖拽释放时触发节点点击 | `mouseup` 事件同时触发 `click` | `dragEnded` 中检查 `isDragExcludeButton` |

**代码：**

```typescript
.on('dragend', function (event) {
    if (isDragExcludeButton(event.sourceEvent?.target)) return;  // 排除按钮
    // ... 处理拖拽结束
});
```

### 事件隔离原理

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DOM 事件层级                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  <div class="node-card">                                                   │
│      │                                                                     │
│      ├── <span class="label">节点名称</span>                               │
│      │                                                                     │
│      └── <button class="expand-btn">                                       │
│              │                                                             │
│              └── <svg class="expand-icon">  ← event.target 可能是这里     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           事件目标检查流程                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  用户点击 SVG 图标                                                          │
│         │                                                                  │
│         ▼                                                                  │
│  event.target = <svg class="expand-icon">                                 │
│         │                                                                  │
│         ▼                                                                  │
│  isDragExcludeButton(event.target)                                         │
│         │                                                                  │
│         ├── 检查 .expand-icon 是否在 DRAG_EXCLUDE_BUTTONS 中 → false       │
│         │                                                                  │
│         ▼                                                                  │
│  向上遍历 DOM 树                                                            │
│         │                                                                  │
│         ├── 检查 .expand-icon.parentElement (button.expand-btn)             │
│         │      是否在 DRAG_EXCLUDE_BUTTONS 中 → true ✓                      │
│         │                                                                  │
│         ▼                                                                  │
│  返回 true（排除按钮点击）                                                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 添加新的排除按钮

如果以后需要添加新的排除按钮，只需修改 `DRAG_EXCLUDE_BUTTONS` 数组：

```typescript
// 修改前
const DRAG_EXCLUDE_BUTTONS = ['more-btn', 'expand-btn'] as const;

// 修改后（添加新按钮）
const DRAG_EXCLUDE_BUTTONS = ['more-btn', 'expand-btn', 'custom-btn', 'new-button'] as const;
```

无需修改任何事件处理逻辑，`isDragExcludeButton` 函数会自动向上遍历 DOM 树检查。

---

## 状态管理

### 数据结构

```typescript
// 展开状态
{
    id: 'node1',
    label: '父节点',
    children: [
        { id: 'child1', label: '子节点1' },
        { id: 'child2', label: '子节点2' }
    ],
    _children: undefined  // 展开状态无缓存
}

// 收起状态
{
    id: 'node1',
    label: '父节点',
    children: [],          // 收起时清空
    _children: [           // 缓存子节点
        { id: 'child1', label: '子节点1' },
        { id: 'child2', label: '子节点2' }
    ]
}

// 叶子节点
{
    id: 'leaf',
    label: '叶子节点',
    children: [],
    _children: undefined,
    isLeaf: true           // 标记为叶子节点
}
```

### TreeAccessors 实现

```typescript
// src/lib/d3-tree-sdk/schema/TreeAccessors.ts

getCachedChildren: (node) => {
    const cache = (node as any)._children;
    return Array.isArray(cache) && cache.length > 0 ? cache : undefined;
},

hasCachedChildren: (node) => {
    const cache = (node as any)._children;
    return Array.isArray(cache) && cache.length > 0;
},

isLeaf: (node) => {
    const isLeafField = config.asyncLoad?.isLeafField ?? 'isLeaf';
    const value = (node as any)[isLeafField];

    // 如果字段不存在，默认认为不是叶子节点
    if (value === undefined || value === null) {
        return false;
    }

    // 如果字段值不是 boolean 类型，发出警告
    if (typeof value !== 'boolean') {
        console.warn(
            `TreeAccessors.isLeaf: ${isLeafField} field should be boolean type, but got ${typeof value}.`
        );
    }

    // 确保返回 boolean 类型
    return Boolean(value);
},
```

---

## 代码实现

### TreeContext.toggleNodeChildren

```typescript
// src/lib/d3-tree-sdk/TreeContext.ts
/**
 * 切换节点的展开/收起状态：
 * - 如果节点已展开（children 存在），则收起（将 children 移动到 _children）
 * - 如果节点已收起（_children 存在），则展开（将 _children 恢复到 children）
 */
toggleNodeChildren(root: TreeData, nodeId: string): TreeData | null {
    const meta = this.findNodeInTree(root, nodeId);
    if (!meta) return null;

    const node = meta.node;
    const acc = this.accessors;

    // 获取当前子节点列表
    const children = acc.getChildren(node);

    // 检查是否有缓存的子节点（收起状态）
    const cachedChildren = (node as any)._children || [];

    if (children.length > 0) {
        // 当前是展开状态，需要收起
        // 将 children 移动到 _children
        (node as any)._children = children;
        // 清空 children
        acc.setChildren(node, []);
    } else if (cachedChildren.length > 0) {
        // 当前是收起状态，需要展开
        // 将 _children 恢复到 children
        acc.setChildren(node, cachedChildren);
        // 清空 _children
        delete (node as any)._children;
    }

    return node;
}
```

### TreeContext.toggleNodeExpansion

```typescript
// src/lib/d3-tree-sdk/TreeContext.ts
/**
 * 切换节点展开状态（支持异步加载）
 * ----------------------------------------------------------------------------
 * @param root - 树根节点
 * @param nodeId - 要切换的节点 ID
 * @param asyncConfig - 异步加载配置（可选）
 */
async toggleNodeExpansion(
    root: TreeData,
    nodeId: string,
    asyncConfig?: {
        loadChildren: (nodeId: string) => Promise<TreeData[]>;
        strategy: AsyncLoadStrategy;
    }
): Promise<TreeData | null> {
    const meta = this.findNodeInTree(root, nodeId);
    if (!meta) return null;

    const node = meta.node;
    const acc = this.accessors;
    const children = acc.getChildren(node);
    const cachedChildren = acc.getCachedChildren(node);

    // 检查是否需要异步加载
    const needsAsyncLoad =
        asyncConfig &&
        !acc.isLeaf(node) &&
        children.length === 0 &&
        (!cachedChildren || cachedChildren.length === 0);

    if (needsAsyncLoad) {
        const { loadChildren, strategy } = asyncConfig;

        // 实时模式或缓存模式下未加载过
        if (strategy === 'realtime' || !acc.hasLoadedChildren(node)) {
            // 异步加载子节点
            const newChildren = await loadChildren(nodeId);

            // 设置子节点
            acc.setChildren(node, newChildren);

            // 缓存模式下标记已加载
            if (strategy === 'cache-first') {
                acc.markChildrenLoaded(node);
            }
        }

        return node;
    }

    // 普通展开/收起逻辑
    return this.toggleNodeChildren(root, nodeId);
}
```

### D3TreeGraph.toggleNodeExpansion

```typescript
// src/lib/d3-tree-sdk/D3TreeGraph.ts
/**
 * 切换节点展开状态（支持异步加载）
 * @param nodeId - 要切换的节点 ID
 * @param strategy - 缓存策略（可选，默认使用实例的 asyncLoadStrategy）
 */
async toggleNodeExpansion(nodeId: string, strategy?: AsyncLoadStrategy): Promise<void> {
    const ctx = this.getContext();
    const config = ctx.getConfig();

    // 获取加载函数
    const loadChildren = config.asyncLoad?.loadChildren;

    // 使用指定的策略或全局策略
    const loadStrategy = strategy ?? this.asyncLoadStrategy ?? AsyncLoadStrategy.CacheFirst;

    // 执行异步展开
    await ctx.toggleNodeExpansion(
        this.treeData,
        nodeId,
        loadChildren ? { loadChildren, strategy: loadStrategy } : undefined
    );

    // 提交变更并重新渲染
    this.commit();
}
```

---

## 状态转换

### 同步模式状态转换

```
用户点击展开按钮
        │
        ▼
┌───────────────────────────────────────┐
│ 1. 检查 children.length > 0           │
│    ├─ 是 → 进入展开流程                │
│    └─ 否 → 检查 _children.length > 0  │
│           ├─ 是 → 进入收起流程         │
│           └─ 否 → 不处理（叶子节点）   │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 展开流程：                             │
│   children → _children（缓存）         │
│   children = []                       │
│   显示 PlusCircleOutlined 图标        │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 收起流程：                             │
│   _children → children（恢复）        │
│   delete _children                    │
│   显示 MinusCircleOutlined 图标       │
└───────────────────────────────────────┘
        │
        ▼
    重新渲染树
```

### 异步模式状态转换

```
用户点击展开按钮
        │
        ▼
┌───────────────────────────────────────┐
│ 1. 检查 isLeaf 字段                   │
│    ├─ true → 不处理（叶子节点）       │
│    └─ false → 继续                     │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 2. 检查 children.length > 0           │
│    ├─ 是 → 同步展开/收起               │
│    └─ 否 → 检查 _children.length > 0   │
│           ├─ 是 → 检查缓存策略         │
│           │   ├─ cache-first → 展开    │
│           │   └─ realtime → 重新加载    │
│           └─ 否 → 检查 loadChildren   │
│                  ├─ 存在 → 异步加载    │
│                  └─ 不存在 → 不处理    │
└───────────────────────────────────────┘
        │
        ▼
┌───────────────────────────────────────┐
│ 异步加载流程：                         │
│   1. 调用 loadChildren(nodeId)        │
│   2. 设置 children = newChildren      │
│   3. 标记 _childrenLoaded = true      │
│   4. 展开节点                         │
└───────────────────────────────────────┘
        │
        ▼
    重新渲染树
```

### 状态转换表

| 当前状态       | 操作 | children   | \_children  | 按钮图标            |
| -------------- | ---- | ---------- | ----------- | ------------------- |
| 展开           | 收起 | `[]`       | `[子节点]`  | PlusCircleOutlined  |
| 收起（无缓存） | 展开 | `[子节点]` | `undefined` | MinusCircleOutlined |
| 收起（有缓存） | 展开 | `[子节点]` | `undefined` | MinusCircleOutlined |
| 叶子节点       | -    | `[]`       | `undefined` | 不显示              |

---

## 完整流程

### 从渲染到交互的完整流程

```
1. 数据渲染阶段
┌─────────────────────────────────────────────────────────────┐
│ buildNodeCardHtml(node)                                    │
│                                                             │
│ ├─ 1. 获取 children 和 _children                           │
│ │   const children = getChildren(node)                      │
│ │   const cachedChildren = getCachedChildren(node)          │
│ │                                                             │
│ ├─ 2. 判断是否有子节点                                       │
│ │   const canExpand = children.length > 0 ||                │
│ │                      cachedChildren.length > 0             │
│ │                                                             │
│ ├─ 3. 判断当前状态                                           │
│ │   const isExpanded = children.length > 0                  │
│ │                                                             │
│ └─ 4. 生成按钮 HTML                                          │
│     if (canExpand) {                                         │
│         return `<button class="expand-btn">...</button>`    │
│     }                                                       │
└─────────────────────────────────────────────────────────────┘

2. 事件绑定阶段
┌─────────────────────────────────────────────────────────────┐
│ fo.selectAll('.expand-btn').on('click', function(event) {  │
│     event.stopPropagation();                                │
│     const nodeId = d3.select(this).attr('data-id');       │
│     onExpandClick(nodeId);                                  │
│ });                                                         │
└─────────────────────────────────────────────────────────────┘

3. 用户交互阶段
┌─────────────────────────────────────────────────────────────┐
│ 用户点击展开/收起按钮                                        │
│         │                                                    │
│         ▼                                                    │
│ handleExpandClick(nodeId)                                   │
│         │                                                    │
│         ▼                                                    │
│ graph.toggleNodeExpansion(nodeId, strategy)                 │
│         │                                                    │
│         ▼                                                    │
│ ctx.toggleNodeExpansion(root, nodeId, asyncConfig)         │
│         │                                                    │
│         ├─→ 同步模式：toggleNodeChildren()                   │
│         │       │                                            │
│         │       └─→ 修改 children / _children               │
│         │                                                    │
│         └─→ 异步模式：loadChildren() + toggleNodeChildren()  │
│                 │                                            │
│                 └─→ 调用 API → 设置 children → 展开          │
│                                                             │
│         │                                                    │
│         ▼                                                    │
│ graph.commit() → 重新渲染树                                  │
└─────────────────────────────────────────────────────────────┘

4. 重新渲染阶段
┌─────────────────────────────────────────────────────────────┐
│ renderTree()                                                │
│         │                                                    │
│         ▼                                                    │
│ updateNodeCard(selection)                                   │
│         │                                                    │
│         ├─→ 更新节点位置                                     │
│         │                                                    │
│         ├─→ 更新连线                                         │
│         │                                                    │
│         └─→ 更新展开/收起按钮状态                            │
│             const hasChildren = children && children.length > 0 │
│             const hasCachedChildren = !!_children && _children.length > 0 │
│             const canExpand = canNodeExpand(data, hasChildren, hasCachedChildren) │
│             const isExpanded = hasChildren && !hasCachedChildren │
│             if (canExpand) {                                 │
│                 // 显示按钮                                  │
│                 if (isExpanded) {                            │
│                     // 显示 MinusCircleOutlined（减号/收起） │
│                 } else {                                    │
│                     // 显示 PlusCircleOutlined（加号/展开）  │
│                 }                                           │
│             }                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 最佳实践

### 1. 合理使用 isLeaf 字段

```typescript
// ✅ 推荐：明确标记叶子节点
{
    id: 'leaf',
    label: '叶子节点',
    isLeaf: true,
    children: []
}

// ❌ 不推荐：大量节点都标记为 isLeaf: false
// 会导致不必要的展开按钮显示
```

### 2. 避免频繁展开收起

```typescript
// ❌ 不推荐：在循环中频繁展开收起
nodes.forEach((node) => {
    graph.toggleNodeExpansion(node.id);
});

// ✅ 推荐：批量操作后统一渲染
graph.mutateData();
nodes.forEach((node) => {
    // 批量修改数据
});
graph.commit(); // 一次性渲染
```

### 3. 处理异步加载错误

```typescript
async function handleExpandClick(nodeId: string) {
    try {
        await graph.toggleNodeExpansion(nodeId, asyncLoadStrategy.value);
    } catch (error) {
        console.error('展开/收起节点失败:', error);
        // 可以显示错误提示
        message.error('加载子节点失败，请重试');
    }
}
```

### 4. 性能优化

```typescript
// ✅ 推荐：使用缓存策略减少网络请求
const schema = defineTreeConfig({
    asyncLoad: {
        loadChildren: fetchChildren
        // 默认使用 cache-first 策略
    }
});

// ✅ 推荐：预加载关键节点
const criticalNodes = ['dept-1', 'dept-2'];
criticalNodes.forEach(async (nodeId) => {
    await graph.toggleNodeExpansion(nodeId);
});
```

---

## 注意事项

1. **事件隔离**：点击展开/收起按钮不会触发拖拽和节点点击事件
2. **状态持久化**：收起状态的子节点保存在 `_children` 中，不随 D3 层级变化
3. **叶子节点**：`isLeaf: true` 的节点不显示展开按钮
4. **异步加载**：只有在 `children` 为空且 `_children` 不存在时才触发异步加载
5. **缓存策略**：cache-first 策略会标记 `_childrenLoaded`，避免重复请求

---

## 相关文件

| 文件                      | 说明                                              |
| ------------------------- | ------------------------------------------------- |
| `core/d3Tree.ts`          | 按钮渲染、事件绑定、图标生成                      |
| `TreeContext.ts`          | toggleNodeChildren、toggleNodeExpansion 方法      |
| `D3TreeGraph.ts`          | 对外暴露的展开/收起 API                           |
| `schema/TreeAccessors.ts` | getCachedChildren、hasCachedChildren、isLeaf 方法 |
| `schema/TreeConfig.ts`    | asyncLoad 配置定义                                |
| `types/index.ts`          | TreeData 类型定义、AsyncLoadStrategy 枚举         |
| `GraphCanvas.vue`         | handleExpandClick 事件处理                        |
