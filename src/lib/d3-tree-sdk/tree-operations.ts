/**
 * 树操作纯函数（兼容层）
 * 默认使用 defaultTreeContext；自定义字段请通过 TreeContext / D3TreeGraph.treeConfig 传入
 */
import { defaultTreeContext, TreeContext } from './TreeContext';
import type { TreeNodeMeta } from './TreeContext';
import type { TreeNodeData } from './schema/TreeAccessors';
import type { IntegrationTypeKey, LevelKey, TreeData } from './types';

export type { TreeNodeMeta };

export function findNodeInTree(
    root: TreeData,
    nodeId: string,
    parent: TreeData | null = null,
    depth = 0,
    ctx: TreeContext = defaultTreeContext
): TreeNodeMeta | null {
    return ctx.findNodeInTree(root, nodeId, parent, depth);
}

export function collectDescendantApps(
    root: TreeData,
    excludeRootId?: string,
    ctx: TreeContext = defaultTreeContext
): TreeData[] {
    return ctx.collectDescendantApps(root, excludeRootId);
}

export function canMergeNodesInTree(
    root: TreeData,
    nodeId: string,
    ctx: TreeContext = defaultTreeContext
): boolean {
    return ctx.canMergeNodesInTree(root, nodeId);
}

export interface AddNodeInput {
    parentId: string;
    name: string;
    level: LevelKey;
    integrationType: IntegrationTypeKey;
    dept?: string;
}

export function addChildNode(
    root: TreeData,
    input: AddNodeInput,
    ctx: TreeContext = defaultTreeContext
): TreeData | null {
    return ctx.addChildNode(root, input);
}

export interface AddModuleInput {
    parentId: string;
    name: string;
    dept?: string;
}

export function addModule(
    root: TreeData,
    input: AddModuleInput,
    ctx: TreeContext = defaultTreeContext
): TreeData | null {
    return ctx.addModule(root, input);
}

export interface MergeNodesInput {
    name: string;
    integrationType: IntegrationTypeKey;
    sourceId: string;
    targetId: string;
}

export interface MergeNodesResult {
    ok: boolean;
    message?: string;
    node?: TreeData;
}

export function mergeSiblingNodes(
    root: TreeData,
    input: MergeNodesInput,
    ctx: TreeContext = defaultTreeContext
): MergeNodesResult {
    return ctx.mergeSiblingNodes(root, input);
}

export interface EditNodeInput {
    nodeId: string;
    name: string;
    dept: string;
    level?: LevelKey;
    owner: string;
}

export function editNode(
    root: TreeData,
    input: EditNodeInput,
    ctx: TreeContext = defaultTreeContext
): TreeData | null {
    return ctx.editNode(root, input);
}

export interface BindRelationInput {
    sourceId: string;
    targetId: string;
    type: IntegrationTypeKey;
    name: string;
}

export function bindRelation(
    root: TreeData,
    input: BindRelationInput,
    ctx: TreeContext = defaultTreeContext
): boolean {
    return ctx.bindRelation(root, input);
}

export function setNodeIntegration(
    root: TreeData,
    nodeId: string,
    type: IntegrationTypeKey,
    ctx: TreeContext = defaultTreeContext
): boolean {
    return ctx.setNodeIntegration(root, nodeId, type);
}

export function removeRelationsToNode(
    node: TreeData,
    deletedId: string,
    ctx: TreeContext = defaultTreeContext
): void {
    ctx.removeRelationsToNode(node, deletedId);
}

export function deleteNodeFromTree(
    root: TreeData,
    nodeId: string,
    protectedRootId?: string,
    ctx: TreeContext = defaultTreeContext
): boolean {
    if (protectedRootId && nodeId === protectedRootId) return false;
    return ctx.deleteNodeFromTree(root, nodeId);
}

export interface IntegrateModulesInput {
    selected: Record<string, unknown>[];
    name: string;
    dept?: string;
    type: IntegrationTypeKey;
}

export function integrateSelectedModules(
    root: TreeData,
    input: IntegrateModulesInput,
    ctx: TreeContext = defaultTreeContext
): TreeData | null {
    return ctx.integrateSelectedModules(root, input);
}
