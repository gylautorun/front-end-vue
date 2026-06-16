/**
 * @d3-tree-sdk
 * =============================================================================
 * 框架无关的 D3 树形图 SDK。
 * 数据结构通过 schema 参数传入，不写死字段名。
 *
 * 核心模块：
 * - D3TreeGraph：SDK 主类，封装 D3 树形图的创建、渲染、销毁等
 * - TreeContext：树操作上下文，提供所有树操作方法
 * - EventEmitter：事件总线，用于事件监听
 * - HistoryStack：历史记录栈，用于撤销/重做
 * - tree-operations：树操作纯函数封装
 *
 * 使用示例：
 * ```ts
 * import { D3TreeGraph, defineTreeConfig, initialTreeData } from '@/lib/d3-tree-sdk';
 *
 * // 1. 定义 schema
 * const schema = defineTreeConfig({
 *   rootId: 'edu',
 *   fields: { id: 'nodeId', label: 'title', children: 'subNodes' },
 *   defaults: { dept: '默认单位' }
 * });
 *
 * // 2. 创建实例
 * const graph = new D3TreeGraph({
 *   container: '#graph',
 *   data: initialTreeData,
 *   schema
 * });
 *
 * // 3. 挂载
 * graph.mount();
 *
 * // 4. 监听事件
 * graph.on('node:click', (node) => console.log('点击', node));
 * graph.on('node:drop-target', ({ sourceId, targetId }) => {
 *   console.log(`拖拽 ${sourceId} 到 ${targetId}`);
 * });
 *
 * // 5. 操作数据
 * const ctx = graph.getContext();
 * ctx.addChildNode(graph.mutateData(), {
 *   parentId: 'root',
 *   name: '新节点',
 *   level: 'domain',
 *   integrationType: 'base'
 * });
 * graph.commit();
 *
 * // 6. 销毁
 * graph.destroy();
 * ```
 *
 * 更多信息请参考：
 * - 完整业务示例：/data-d3 页面
 * - SDK 演示：/data-d3/sdk-demo
 * - 设计文档：docs/SDK-CORE.md
 */

// ============================================================================
// 主类导出
// ============================================================================

/** D3 树形图 SDK 主类 */
export { D3TreeGraph } from './D3TreeGraph';

/** SDK 实例化选项类型 */
export type { D3TreeGraphOptions, D3TreeGraphEventMap, SetDataOptions } from './D3TreeGraph';

// ============================================================================
// TreeContext 导出
// ============================================================================

/**
 * 树操作上下文类
 * @description 封装所有树操作方法，提供配置驱动的数据访问
 */
export { TreeContext, defaultTreeContext } from './TreeContext';

/** 节点元信息类型 */
export type { TreeNodeMeta } from './TreeContext';

// ============================================================================
// Schema 配置导出
// ============================================================================

/**
 * 配置输入类型
 * @description 定义树结构的字段映射、默认值、样式等
 */
export type {
    TreeConfigInput,
    TreeFieldSchema,
    SelectionFieldSchema,
    TreeStyleConfig,
    TreeSchema
} from './schema/TreeConfig';

/**
 * 配置解析函数
 * @description 将用户输入的配置与默认配置合并
 */
export { resolveTreeConfig, DEFAULT_TREE_CONFIG, defineTreeConfig } from './schema/TreeConfig';

/**
 * 节点数据类型
 * @description 与 TreeData 兼容，但字段名由配置决定
 */
export type { TreeNodeData, TreeAccessors } from './schema/TreeAccessors';

/**
 * 创建数据访问器
 * @description 根据配置创建统一的字段访问接口
 */
export { createTreeAccessors } from './schema/TreeAccessors';

/**
 * 选中项数据处理
 * @description 在树节点与 SelectedNode 之间转换，支持自定义字段映射
 */
export {
    toSelectedNode, // 树节点 → SelectedNode
    fromSelectedNode, // SelectedNode → 外部格式
    normalizeSelectedItem, // 外部数据 → SelectedNode
    readSelectionId, // 读取选中项 ID
    readSelectionParentId // 读取选中项父节点 ID
} from './schema/selection';

// ============================================================================
// 事件系统导出
// ============================================================================

/**
 * 轻量事件总线
 * @description 基于发布/订阅模式的事件系统
 */
export { EventEmitter } from './EventEmitter';

// ============================================================================
// 历史记录导出
// ============================================================================

/**
 * 撤销/重做历史栈
 * @description 记录数据变更历史，支持撤销和重做
 */
export { HistoryStack } from './HistoryStack';

/** 历史状态类型 */
export type { HistoryState } from './HistoryStack';

// ============================================================================
// 树操作函数导出
// ============================================================================

/**
 * 树操作纯函数
 * @description 封装 TreeContext 的方法为纯函数，方便外部调用
 *
 * @example
 * // 添加子节点
 * import { addChildNode } from '@/lib/d3-tree-sdk';
 * addChildNode(treeData, {
 *   parentId: 'root',
 *   name: '新节点',
 *   level: 'domain',
 *   integrationType: 'base'
 * });
 *
 * @example
 * // 合并同级节点
 * import { mergeSiblingNodes } from '@/lib/d3-tree-sdk';
 * const result = mergeSiblingNodes(treeData, {
 *   name: '合并节点',
 *   integrationType: 'merge',
 *   sourceId: 'node1',
 *   targetId: 'node2'
 * });
 * if (result.ok) {
 *   console.log('合并成功', result.node);
 * }
 */
export * from './tree-operations';

// ============================================================================
// D3 核心导出
// ============================================================================

/**
 * D3 核心功能
 * @description 包括初始化、渲染、缩放平移、导出等功能
 *
 * 主要函数：
 * - initD3：初始化 D3 树形图
 * - renderTree：渲染树形图
 * - updateLinks：更新连线
 * - updateLinkLabels：更新连线标签
 * - zoomIn/zoomOut：缩放
 * - fitView/resetZoom：适应视图/重置缩放
 * - downloadTree：导出图片
 * - setTreeOrientation：设置布局方向
 * - applyTreeLayoutNodeSize：应用节点尺寸
 *
 * @example
 * import { zoomIn, zoomOut, fitView } from '@/lib/d3-tree-sdk';
 *
 * // 放大
 * zoomIn(svg, zoom);
 *
 * // 缩小
 * zoomOut(svg, zoom);
 *
 * // 自适应视图
 * fitView(svg, g, width, height, zoom);
 */
export {
    initD3,
    renderTree,
    updateLinks,
    updateLinkLabels,
    zoomIn,
    zoomOut,
    fitView,
    resetZoom,
    downloadTree,
    setTreeOrientation,
    applyTreeLayoutNodeSize,
    setDepthNodeDimensions,
    getDepthNodeDimensions,
    type D3TreeInstance,
    type TreeLayoutOrientation
} from './core/d3Tree';

// ============================================================================
// 日志导出
// ============================================================================

/**
 * 树形图日志工具
 * @description 用于调试和日志记录
 */
export { TreeLogger, logDragState } from './core/treeLogger';

// ============================================================================
// 类型导出
// ============================================================================

/**
 * 树节点数据类型
 * @description SDK 内部使用的标准树节点结构
 *
 * @example
 * interface TreeData {
 *   id: string;
 *   label: string;
 *   level?: LevelKey;
 *   dept?: string;
 *   owner?: string;
 *   integrationType?: IntegrationTypeKey;
 *   integrationTypeName?: string;
 *   integratedFrom?: string[];
 *   children?: TreeData[];
 *   modules?: TreeData[];
 *   relations?: Relation[];
 * }
 */
export type { TreeData, SelectedNode, LevelKey, IntegrationTypeOption } from './types';

/**
 * 整合方式 key
 * @description base=基础, interface=接口对接, migrate=迁移, merge=合并
 */

/**
 * 整合方式相关常量
 */
export {
    IntegrationTypeKey, // 整合方式枚举
    EDGE_STYLES, // 连线样式
    LEVEL_CONFIG, // 层级配置
    INTEGRATION_TYPE_NAME, // 整合方式名称
    INTEGRATION_TYPE_OPTIONS, // 整合方式选项列表
    NODE_LEVELS, // 节点层级列表
    ROOT_DEFAULT_MERGE_MARKER, // 根层默认合并标记
    isMergedNode, // 判断是否是合并节点
    canSiblingMerge // 判断是否可以同级合并
} from './types';

// ============================================================================
// 示例数据导出
// ============================================================================

/**
 * SDK 内置示例数据
 * @description 与 data-d3 页面一致的初始树数据
 *
 * @example
 * import { initialTreeData } from '@/lib/d3-tree-sdk';
 *
 * const graph = new D3TreeGraph({
 *   container: '#graph',
 *   data: initialTreeData
 * });
 * graph.mount();
 */
export { initialTreeData } from './data/initialTreeData';
