# 树形图操作模式对比

本文档详细说明 `applyTreeChange + bindRelation` 和 `applyTreeChangeWithResult + mergeMultipleNodes` 两种操作模式的区别。

## 1. 核心区别概览

| 维度           | `applyTreeChange + bindRelation` | `applyTreeChangeWithResult + mergeMultipleNodes` |
| -------------- | -------------------------------- | ------------------------------------------------ |
| **操作性质**   | 关联绑定（非破坏性）             | 节点合并（破坏性）                               |
| **返回值**     | void（无返回值）                 | T\| null（执行结果）                             |
| **原节点状态** | 保持不变                         | 被删除                                           |
| **适用场景**   | 建立业务关系、依赖关系           | 整合节点、合并节点                               |

## 2. applyTreeChange vs applyTreeChangeWithResult

### 2.1 applyTreeChange

**特性**：单向操作，调用后直接提交变更并重绘，不关心执行结果。

**适用场景**：

-   确定性操作，不需要知道执行结果
-   操作失败影响较小的场景

**执行流程**：

```
用户操作 → 执行变更 → applyTreeChange() → 直接重绘 → 结束
```

### 2.2 applyTreeChangeWithResult

**特性**：双向操作，会捕获并返回操作结果，允许根据结果做出不同处理。

**适用场景**：

-   需要知道操作是否成功
-   需要返回值进行后续处理
-   破坏性操作需要错误提示

**执行流程**：

```
用户操作 → 执行变更 → applyTreeChangeWithResult()
    ↓
成功 → 返回结果 → 后续处理 → 重绘 → 结束
    ↓
失败 → 返回错误 → 显示提示 → 保持原状态 → 结束
```

## 3. bindRelation vs mergeMultipleNodes

### 3.1 bindRelation

**作用**：在两个节点之间添加一个"关联关系"（relation）

**特点**：

-   非破坏性操作
-   原节点保持完整
-   只是多了一条关系记录

**结果**：在两个节点间建立关系连线

### 3.2 mergeMultipleNodes

**作用**：将多个节点物理合并为一个新节点

**特点**：

-   破坏性操作
-   原节点被删除
-   子节点、模块、关系都迁移到新节点

**结果**：创建新节点，继承优先级最高的层级

## 4. 使用场景对比

| 场景                 | 推荐方案                                         | 说明                     |
| -------------------- | ------------------------------------------------ | ------------------------ |
| 绑定"父子"关系       | `applyTreeChange + bindRelation`                 | 非破坏性，保持原结构     |
| 建立业务依赖关系     | `applyTreeChange + bindRelation`                 | 记录关系但不改变节点结构 |
| 整合选中节点为新节点 | `applyTreeChangeWithResult + mergeMultipleNodes` | 破坏性，需要知道是否成功 |
| 拖拽合并两个节点     | `applyTreeChangeWithResult + mergeMultipleNodes` | 破坏性，需要处理失败情况 |
| 删除节点操作         | `applyTreeChangeWithResult + xxx`                | 需要确认是否删除成功     |

## 5. 代码示例

### 5.1 applyTreeChange + bindRelation

```typescript
// 绑定关联关系，不关心结果
applyTreeChange((root, ctx) =>
    ctx.bindRelation(root, {
        sourceId: 'node-1',
        targetId: 'node-2',
        type: IntegrationTypeKey.merge,
        name: '关联名称'
    })
);
```

### 5.2 applyTreeChangeWithResult + mergeMultipleNodes

```typescript
// 合并节点，需要知道是否成功
const mergedNode = applyTreeChangeWithResult((root, ctx) => {
    const result = ctx.mergeMultipleNodes(root, {
        name: '新节点名称',
        integrationType: IntegrationTypeKey.merge,
        nodeIds: ['node-1', 'node-2', 'node-3']
    });

    if (!result.ok) {
        message.error(result.message ?? '合并失败');
        return null;
    }

    return result.node ?? null;
});

if (mergedNode) {
    selectNode(mergedNode);
    clearSelection();
}
```

## 6. 选择建议

| 判断条件         | 推荐操作                                                   |
| ---------------- | ---------------------------------------------------------- |
| 是否需要返回值   | 需要 → applyTreeChangeWithResult；不需要 → applyTreeChange |
| 是否破坏原节点   | 是 → mergeMultipleNodes；否 → bindRelation                 |
| 是否需要错误处理 | 需要 → applyTreeChangeWithResult；不需要 → applyTreeChange |
| 操作是否可逆     | 不可逆 → applyTreeChangeWithResult；可逆 → applyTreeChange |

## 7. 最佳实践

1. **关联关系场景**：使用 `applyTreeChange + bindRelation`，保持节点结构不变
2. **节点整合场景**：使用 `applyTreeChangeWithResult + mergeMultipleNodes`，确保操作成功并处理失败情况
3. **错误处理**：对于可能失败的操作，始终使用 `applyTreeChangeWithResult` 并检查返回结果
4. **用户反馈**：使用 `applyTreeChangeWithResult` 时，为用户提供清晰的成功/失败反馈
