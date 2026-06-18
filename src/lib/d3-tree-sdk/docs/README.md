# D3 Tree SDK 文档

## 快速链接

| 文档                                       | 说明                                   |
| ------------------------------------------ | -------------------------------------- |
| [../README.md](../README.md)               | **API 速查 + defineTreeConfig 示例**   |
| [SDK-CORE.md](./SDK-CORE.md)               | 完整设计（架构、schema、集成、可分享） |
| [async-load.md](./async-load.md)           | **异步加载子节点功能**                 |
| [expand-collapse.md](./expand-collapse.md) | **展开收起按钮及逻辑**                 |
| [event-logger.md](./event-logger.md)      | **事件记录器（EventLogger）**          |

## 演示

| 页面         | 路径                   |
| ------------ | ---------------------- |
| 完整业务     | 菜单「数据-d3-可视化」 |
| SDK 最小演示 | `/data-d3/sdk-demo`    |

## 最小示例（复制即用）

```typescript
import { D3TreeGraph, defineTreeConfig, initialTreeData } from '@/lib/d3-tree-sdk';

const schema = defineTreeConfig({
    rootId: 'edu',
    fields: { id: 'id', label: 'label', children: 'children' }
});

const graph = new D3TreeGraph({
    container: '#graph-container',
    data: initialTreeData,
    schema
});

graph.on('node:click', (node) => console.log(node.label));
graph.mount();
```

业务页 schema 见：`src/pages/data-d3/config/treeConfig.ts`
