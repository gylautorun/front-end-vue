# D3 Tree 树状图问题修复文档

**日期**: 2026-06-11

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

## 文件修改清单

| 文件              | 修改内容                                                                |
| ----------------- | ----------------------------------------------------------------------- |
| `index.vue`       | 抽离公共函数、修复撤销/重做、合并节点关系引用更新                       |
| `GraphCanvas.vue` | initialTreeData 改为 ref、renderTree 接收参数                           |
| `d3Tree.ts`       | renderTree 使用 join() 处理 enter/update/exit；修复连线标签默认显示问题 |
| `SidebarLeft.vue` | 使用 EDGE_STYLES 和 LEVEL_CONFIG 统一管理颜色配置                       |

---

## 测试验证

1. **刷新功能**：点击刷新按钮，树状图应恢复到初始状态
2. **撤销/重做**：
    - 执行操作（如新增节点）
    - 点击撤销，应恢复到上一步
    - 点击重做，应前进到下一步
    - 按钮应在无法操作时禁用
3. **合并节点**：
    - 选择两个节点合并
    - 合并后连线数量应正确（不增不减）
