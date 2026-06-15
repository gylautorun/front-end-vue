/**
 * tree-operations.ts - 树操作纯函数（SDK 导出层）
 * 默认使用 defaultTreeContext；自定义字段请通过 TreeContext / D3TreeGraph.treeConfig 传入
 * =============================================================================
 * 本文件负责：
 * 1. 封装 TreeContext 的方法为纯函数，方便外部调用
 * 2. 提供向后兼容的 API（默认使用 defaultTreeContext）
 * 3. 导出所有树操作相关的类型定义
 *
 * 核心概念：
 * - 纯函数：相同的输入总是产生相同的输出，不依赖外部状态
 * - 默认上下文：使用 defaultTreeContext 作为默认配置
 * - 可选上下文：所有函数都接受可选的 ctx 参数，用于自定义配置
 *
 * 设计原则：
 * - 向后兼容：与旧版 API 保持一致
 * - 灵活配置：通过 ctx 参数支持自定义 schema
 * - 单一职责：每个函数只做一件事
 *
 * 使用示例：
 * ```ts
 * import { addChildNode, mergeSiblingNodes } from '@/lib/d3-tree-sdk';
 *
 * // 使用默认配置
 * const node = addChildNode(treeData, { parentId: 'root', name: 'A', level: 'domain', integrationType: 'base' });
 *
 * // 使用自定义配置
 * const ctx = new TreeContext({ fields: { id: 'nodeId' } });
 * const node = addChildNode(treeData, { parentId: 'root', name: 'A', level: 'domain', integrationType: 'base' }, ctx);
 * ```
 */

// ============================================================================
// 依赖导入
// ============================================================================
import { defaultTreeContext, TreeContext } from './TreeContext';
import type { TreeNodeMeta } from './TreeContext';
import type { TreeNodeData } from './schema/TreeAccessors';
import type { IntegrationTypeKey, LevelKey, TreeData } from './types';

// ============================================================================
// 类型导出
// ============================================================================

/**
 * 节点元信息类型
 * @description 包含节点、其父节点和深度
 */
export type { TreeNodeMeta };

// ============================================================================
// 节点查找
// ============================================================================

/**
 * 在树中查找节点
 * ----------------------------------------------------------------------------
 * @param root - 树根节点
 * @param nodeId - 要查找的节点 ID
 * @param parent - 父节点引用（可选）
 * @param depth - 当前深度（默认 0）
 * @param ctx - 树上下文（可选，默认使用 defaultTreeContext）
 * @returns 节点元信息，未找到返回 null
 *
 * @description
 * 使用 TreeContext.findNodeInTree 进行节点查找。
 *
 * @example
 * const result = findNodeInTree(treeData, 'node123');
 * if (result) {
 *   console.log(result.node);     // 节点数据
 *   console.log(result.parent);   // 父节点
 *   console.log(result.depth);    // 深度
 * }
 */
export function findNodeInTree(
    root: TreeData,
    nodeId: string,
    parent: TreeData | null = null,
    depth = 0,
    ctx: TreeContext = defaultTreeContext
): TreeNodeMeta | null {
    return ctx.findNodeInTree(root, nodeId, parent, depth);
}

/**
 * 收集所有后代节点
 * ----------------------------------------------------------------------------
 * @param root - 树根节点
 * @param excludeRootId - 要排除的根节点 ID（可选）
 * @param ctx - 树上下文（可选）
 * @returns 所有后代节点数组
 *
 * @description
 * 深度优先遍历树，返回所有子节点。
 *
 * @example
 * const allNodes = collectDescendantApps(treeData, 'root');
 */
export function collectDescendantApps(
    root: TreeData,
    excludeRootId?: string,
    ctx: TreeContext = defaultTreeContext
): TreeData[] {
    return ctx.collectDescendantApps(root, excludeRootId);
}

/**
 * 判断节点是否可以被合并
 * ----------------------------------------------------------------------------
 * @param root - 树根节点
 * @param nodeId - 节点 ID
 * @param ctx - 树上下文（可选）
 * @returns 可以合并返回 true
 *
 * @description
 * 判断是否满足同级合并条件。
 */
export function canMergeNodesInTree(
    root: TreeData,
    nodeId: string,
    ctx: TreeContext = defaultTreeContext
): boolean {
    return ctx.canMergeNodesInTree(root, nodeId);
}

// ============================================================================
// 输入类型定义
// ============================================================================

/**
 * 添加子节点的输入参数
 */
export interface AddNodeInput {
    /** 父节点 ID */
    parentId: string;
    /** 节点名称 */
    name: string;
    /** 层级类型 */
    level: LevelKey;
    /** 整合方式 */
    integrationType: IntegrationTypeKey;
    /** 所属部门（可选） */
    dept?: string;
}

/**
 * 添加功能模块的输入参数
 */
export interface AddModuleInput {
    /** 父节点 ID */
    parentId: string;
    /** 模块名称 */
    name: string;
    /** 所属部门（可选） */
    dept?: string;
}

/**
 * 合并同级节点的输入参数
 */
export interface MergeNodesInput {
    /** 合并后的新节点名称 */
    name: string;
    /** 整合方式 */
    integrationType: IntegrationTypeKey;
    /** 源节点 ID（会被删除） */
    sourceId: string;
    /** 目标节点 ID（会被删除） */
    targetId: string;
}

/**
 * 合并节点的结果
 */
export interface MergeNodesResult {
    /** 是否成功 */
    ok: boolean;
    /** 错误消息（失败时） */
    message?: string;
    /** 新创建的节点（成功时） */
    node?: TreeData;
}

/**
 * 编辑节点的输入参数
 */
export interface EditNodeInput {
    /** 节点 ID */
    nodeId: string;
    /** 新名称 */
    name: string;
    /** 新部门 */
    dept: string;
    /** 新层级（可选） */
    level?: LevelKey;
    /** 新负责人 */
    owner: string;
}

/**
 * 绑定关联关系的输入参数
 */
export interface BindRelationInput {
    /** 源节点 ID */
    sourceId: string;
    /** 目标节点 ID */
    targetId: string;
    /** 关联类型 */
    type: IntegrationTypeKey;
    /** 关联名称 */
    name: string;
}

/**
 * 整合选中模块的输入参数
 */
export interface IntegrateModulesInput {
    /** 选中的节点列表（需包含 id 和 parentId） */
    selected: Record<string, unknown>[];
    /** 整合后的模块名称 */
    name: string;
    /** 所属部门（可选） */
    dept?: string;
    /** 整合类型 */
    type: IntegrationTypeKey;
}

// ============================================================================
// 节点操作
// ============================================================================

/**
 * 添加子节点
 * ----------------------------------------------------------------------------
 * @param root - 树根节点
 * @param input - 添加参数
 * @param ctx - 树上下文（可选）
 * @returns 新创建的节点，失败返回 null
 *
 * @description
 * 在指定父节点下创建一个新子节点。
 *
 * @example
 * const newNode = addChildNode(treeData, {
 *   parentId: 'root',
 *   name: '新部门',
 *   level: 'dept_composite',
 *   integrationType: 'base'
 * });
 */
export function addChildNode(
    root: TreeData,
    input: AddNodeInput,
    ctx: TreeContext = defaultTreeContext
): TreeData | null {
    return ctx.addChildNode(root, input);
}

/**
 * 添加功能模块
 * ----------------------------------------------------------------------------
 * @param root - 树根节点
 * @param input - 添加参数
 * @param ctx - 树上下文（可选）
 * @returns 新创建的模块，失败返回 null
 *
 * @description
 * 在指定节点下创建一个新功能模块。
 *
 * @example
 * const module = addModule(treeData, {
 *   parentId: 'dept1',
 *   name: '用户管理模块'
 * });
 */
export function addModule(
    root: TreeData,
    input: AddModuleInput,
    ctx: TreeContext = defaultTreeContext
): TreeData | null {
    return ctx.addModule(root, input);
}

/**
 * 合并同级节点
 * ----------------------------------------------------------------------------
 * @param root - 树根节点
 * @param input - 合并参数
 * @param ctx - 树上下文（可选）
 * @returns 合并结果
 *
 * @description
 * 将两个同级节点合并为一个新节点。
 *
 * @example
 * const result = mergeSiblingNodes(treeData, {
 *   name: '教育综合平台',
 *   integrationType: 'merge',
 *   sourceId: 'edu1',
 *   targetId: 'edu2'
 * });
 * if (result.ok) {
 *   console.log('合并成功', result.node);
 * } else {
 *   console.error('合并失败', result.message);
 * }
 */
export function mergeSiblingNodes(
    root: TreeData,
    input: MergeNodesInput,
    ctx: TreeContext = defaultTreeContext
): MergeNodesResult {
    return ctx.mergeSiblingNodes(root, input);
}

/**
 * 编辑节点
 * ----------------------------------------------------------------------------
 * @param root - 树根节点
 * @param input - 编辑参数
 * @param ctx - 树上下文（可选）
 * @returns 编辑后的节点，失败返回 null
 *
 * @description
 * 修改节点的基本属性。
 *
 * @example
 * ctx.editNode(treeData, {
 *   nodeId: 'node123',
 *   name: '新名称',
 *   dept: '新部门',
 *   level: 'dept_composite',
 *   owner: '张三'
 * });
 */
export function editNode(
    root: TreeData,
    input: EditNodeInput,
    ctx: TreeContext = defaultTreeContext
): TreeData | null {
    return ctx.editNode(root, input);
}

/**
 * 绑定关联关系
 * ----------------------------------------------------------------------------
 * @param root - 树根节点
 * @param input - 关联参数
 * @param ctx - 树上下文（可选）
 * @returns 绑定成功返回 true
 *
 * @description
 * 在源节点上添加一条指向目标节点的关联关系。
 *
 * @example
 * bindRelation(treeData, {
 *   sourceId: 'node1',
 *   targetId: 'node2',
 *   type: 'interface',
 *   name: '数据同步'
 * });
 */
export function bindRelation(
    root: TreeData,
    input: BindRelationInput,
    ctx: TreeContext = defaultTreeContext
): boolean {
    return ctx.bindRelation(root, input);
}

/**
 * 设置节点整合方式
 * ----------------------------------------------------------------------------
 * @param root - 树根节点
 * @param nodeId - 节点 ID
 * @param type - 整合类型
 * @param ctx - 树上下文（可选）
 * @returns 设置成功返回 true
 *
 * @example
 * setNodeIntegration(treeData, 'node123', 'interface');
 */
export function setNodeIntegration(
    root: TreeData,
    nodeId: string,
    type: IntegrationTypeKey,
    ctx: TreeContext = defaultTreeContext
): boolean {
    return ctx.setNodeIntegration(root, nodeId, type);
}

/**
 * 移除节点的所有关系引用
 * ----------------------------------------------------------------------------
 * @param node - 起始节点
 * @param deletedId - 被删除的节点 ID
 * @param ctx - 树上下文（可选）
 *
 * @description
 * 递归遍历子树，删除所有指向 deletedId 的关系。
 *
 * @example
 * removeRelationsToNode(treeData, 'deletedNodeId');
 */
export function removeRelationsToNode(
    node: TreeData,
    deletedId: string,
    ctx: TreeContext = defaultTreeContext
): void {
    ctx.removeRelationsToNode(node, deletedId);
}

/**
 * 从树中删除节点
 * ----------------------------------------------------------------------------
 * @param root - 树根节点
 * @param nodeId - 要删除的节点 ID
 * @param protectedRootId - 受保护根节点 ID（可选）
 * @param ctx - 树上下文（可选）
 * @returns 删除成功返回 true
 *
 * @description
 * 从父节点中移除指定节点及其所有后代。
 *
 * @example
 * const success = deleteNodeFromTree(treeData, 'node123');
 * if (success) {
 *   console.log('删除成功');
 * }
 */
export function deleteNodeFromTree(
    root: TreeData,
    nodeId: string,
    protectedRootId?: string,
    ctx: TreeContext = defaultTreeContext
): boolean {
    if (protectedRootId && nodeId === protectedRootId) return false;
    return ctx.deleteNodeFromTree(root, nodeId);
}

/**
 * 整合选中的模块
 * ----------------------------------------------------------------------------
 * @param root - 树根节点
 * @param input - 整合参数
 * @param ctx - 树上下文（可选）
 * @returns 新创建的整合模块，失败返回 null
 *
 * @description
 * 将多个选中模块整合为一个新模块。
 *
 * @example
 * const result = integrateSelectedModules(treeData, {
 *   selected: [
 *     { id: 'm1', parentId: 'p1' },
 *     { id: 'm2', parentId: 'p1' }
 *   ],
 *   name: '综合管理模块',
 *   type: 'base'
 * });
 * if (result) {
 *   console.log('整合成功', result);
 * }
 */
export function integrateSelectedModules(
    root: TreeData,
    input: IntegrateModulesInput,
    ctx: TreeContext = defaultTreeContext
): TreeData | null {
    return ctx.integrateSelectedModules(root, input);
}
