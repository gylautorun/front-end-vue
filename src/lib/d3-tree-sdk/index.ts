/**
 * @d3-tree-sdk
 * 框架无关 D3 树形图 SDK。数据结构通过 schema 参数传入，不写死字段名。
 *
 * ```ts
 * import { D3TreeGraph, defineTreeConfig, initialTreeData } from '@/lib/d3-tree-sdk';
 *
 * const schema = defineTreeConfig({
 *   fields: { id: 'nodeId', label: 'title', children: 'subNodes' }
 * });
 * const graph = new D3TreeGraph({ container: '#graph', data: initialTreeData, schema });
 * graph.mount();
 * ```
 */

export { D3TreeGraph } from './D3TreeGraph';
export type { D3TreeGraphOptions, D3TreeGraphEventMap, SetDataOptions } from './D3TreeGraph';

export { TreeContext, defaultTreeContext } from './TreeContext';

export type { TreeConfigInput, TreeFieldSchema, SelectionFieldSchema, TreeStyleConfig, TreeSchema } from './schema/TreeConfig';
export { resolveTreeConfig, DEFAULT_TREE_CONFIG, defineTreeConfig } from './schema/TreeConfig';
export type { TreeNodeData, TreeAccessors } from './schema/TreeAccessors';
export { createTreeAccessors } from './schema/TreeAccessors';
export {
    toSelectedNode,
    fromSelectedNode,
    normalizeSelectedItem,
    readSelectionId,
    readSelectionParentId
} from './schema/selection';

export { EventEmitter } from './EventEmitter';
export { HistoryStack } from './HistoryStack';
export type { HistoryState } from './HistoryStack';

export * from './tree-operations';

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
    type D3TreeInstance,
    type TreeLayoutOrientation
} from './core/d3Tree';

export { TreeLogger, logDragState } from './core/treeLogger';

export type { TreeData, SelectedNode, LevelKey, IntegrationTypeOption } from './types';

export {
    IntegrationTypeKey,
    EDGE_STYLES,
    LEVEL_CONFIG,
    INTEGRATION_TYPE_NAME,
    INTEGRATION_TYPE_OPTIONS,
    NODE_LEVELS,
    ROOT_DEFAULT_MERGE_MARKER,
    isMergedNode,
    canSiblingMerge
} from './types';

/** SDK 内置示例数据（与 data-d3 页面一致） */
export { initialTreeData } from './data/initialTreeData';
