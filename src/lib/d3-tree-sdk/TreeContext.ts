import { cloneDeep } from 'lodash-es';
import type { IntegrationTypeKey, LevelKey, TreeData } from './types';
import {
    resolveTreeConfig,
    resolveRootId,
    resolveProtectedRootId,
    type TreeConfigInput,
    type ResolvedTreeConfig
} from './schema/TreeConfig';
import { createTreeAccessors, type TreeAccessors } from './schema/TreeAccessors';
import {
    readSelectionId,
    readSelectionParentId
} from './schema/selection';

export interface TreeNodeMeta {
    node: TreeData;
    parent: TreeData | null;
    depth: number;
}

export class TreeContext {
    readonly config: ResolvedTreeConfig;
    readonly accessors: TreeAccessors;

    constructor(input?: TreeConfigInput) {
        this.config = resolveTreeConfig(input);
        this.accessors = createTreeAccessors(this.config);
    }

    getRootId(root: TreeData): string {
        return resolveRootId(root, this.config);
    }

    getProtectedRootId(root?: TreeData): string {
        return resolveProtectedRootId(this.config, root);
    }

    /** 整合方式显示名（优先 schema.styles.integrationTypeNames） */
    integrationTypeName(type: IntegrationTypeKey): string {
        return this.config.integrationTypeNames[type] ?? '';
    }

    findNodeInTree(
        root: TreeData,
        nodeId: string,
        parent: TreeData | null = null,
        depth = 0
    ): TreeNodeMeta | null {
        const acc = this.accessors;
        if (acc.getId(root) === nodeId) {
            return { node: root, parent, depth };
        }
        for (const child of acc.getChildren(root)) {
            const found = this.findNodeInTree(child, nodeId, root, depth + 1);
            if (found) return found;
        }
        return null;
    }

    collectDescendantApps(root: TreeData, excludeRootId?: string): TreeData[] {
        const acc = this.accessors;
        const apps: TreeData[] = [];
        const walk = (node: TreeData) => {
            const id = acc.getId(node);
            if (!excludeRootId || id !== excludeRootId) apps.push(node);
            acc.getChildren(node).forEach(walk);
        };
        walk(root);
        return apps;
    }

    isMergedNode(node: TreeData, depth = 0): boolean {
        if (depth === 0) return true;
        const from = this.accessors.getIntegratedFrom(node);
        return !!(from && from.length > 0);
    }

    canSiblingMerge(meta: { depth: number; parent: TreeData | null }): boolean {
        if (meta.depth <= 0) return false;
        if (!meta.parent) return false;
        return this.isMergedNode(meta.parent, meta.depth - 1);
    }

    canMergeNodesInTree(root: TreeData, nodeId: string): boolean {
        const meta = this.findNodeInTree(root, nodeId);
        if (!meta) return false;
        return this.canSiblingMerge({ depth: meta.depth, parent: meta.parent });
    }

    addChildNode(
        root: TreeData,
        input: {
            parentId: string;
            name: string;
            level: LevelKey;
            integrationType: IntegrationTypeKey;
            dept?: string;
        }
    ): TreeData | null {
        const acc = this.accessors;
        const parentResult = this.findNodeInTree(root, input.parentId);
        if (!parentResult) return null;

        const f = this.config.fields;
        const node = {
            [f.id]: acc.generateId('node'),
            [f.label]: input.name,
            [f.level]: input.level,
            [f.dept]: input.dept ?? this.config.defaults.dept,
            [f.owner]: this.config.defaults.owner,
            [f.integrationType]: input.integrationType,
            [f.integrationTypeName]: this.integrationTypeName(input.integrationType),
            [f.children]: [],
            [f.modules]: []
        } as TreeData;
        acc.ensureChildren(parentResult.node).push(node);
        return node;
    }

    addModule(
        root: TreeData,
        input: { parentId: string; name: string; dept?: string }
    ): TreeData | null {
        const acc = this.accessors;
        const f = this.config.fields;
        const parentResult = this.findNodeInTree(root, input.parentId);
        if (!parentResult) return null;

        const mod = {
            [f.id]: acc.generateId('module'),
            [f.label]: input.name,
            [f.level]: this.config.defaults.moduleLevel,
            [f.dept]: input.dept || acc.getDept(parentResult.node),
            [f.owner]: this.config.defaults.owner
        } as TreeData;
        acc.ensureModules(parentResult.node).push(mod);
        return mod;
    }

    mergeSiblingNodes(
        root: TreeData,
        input: {
            name: string;
            integrationType: IntegrationTypeKey;
            sourceId: string;
            targetId: string;
        }
    ): { ok: boolean; message?: string; node?: TreeData } {
        const acc = this.accessors;
        const f = this.config.fields;
        const sourceResult = this.findNodeInTree(root, input.sourceId);
        const targetResult = this.findNodeInTree(root, input.targetId);

        if (!sourceResult || !targetResult) {
            return { ok: false, message: '合并失败：源/目标节点未找到' };
        }
        if (!this.canMergeNodesInTree(root, input.sourceId)) {
            return { ok: false, message: '合并失败：需先完成上一层级节点合并后，当前层级才可合并' };
        }

        const sourceNode = sourceResult.node;
        const targetNode = targetResult.node;
        const sourceParent = sourceResult.parent;
        const targetParent = targetResult.parent;

        if (!sourceParent || !targetParent) {
            return { ok: false, message: '合并失败：源/目标节点没有父节点' };
        }
        if (acc.getId(sourceParent) !== acc.getId(targetParent)) {
            return { ok: false, message: '合并失败：源/目标不是同级节点' };
        }

        const mergedChildren = this.mergeById(acc.getChildren(sourceNode), acc.getChildren(targetNode));
        const mergedModules = this.mergeById(acc.getModules(sourceNode), acc.getModules(targetNode));
        const mergedRelations = this.mergeById(
            acc.getRelations(sourceNode),
            acc.getRelations(targetNode),
            (r) => `${acc.getRelationTargetId(r)}__${acc.getRelationType(r)}`
        );

        const lp = this.config.levelPriority;
        const sourceLevel = acc.getLevel(sourceNode);
        const targetLevel = acc.getLevel(targetNode);
        const mergedLevel =
            (lp[sourceLevel] ?? 0) >= (lp[targetLevel] ?? 0) ? sourceLevel : targetLevel;

        const newId = acc.generateId('merge');
        const newNode = {
            [f.id]: newId,
            [f.label]: input.name,
            [f.level]: mergedLevel,
            [f.dept]: acc.getDept(sourceNode) || acc.getDept(targetNode),
            [f.owner]: acc.getOwner(sourceNode) || acc.getOwner(targetNode),
            [f.integrationType]: input.integrationType,
            [f.integrationTypeName]: this.integrationTypeName(input.integrationType),
            [f.children]: mergedChildren,
            [f.modules]: mergedModules,
            [f.relations]: mergedRelations,
            [f.integratedFrom]: [acc.getId(sourceNode), acc.getId(targetNode)]
        } as TreeData;

        const sourceId = acc.getId(sourceNode);
        const targetId = acc.getId(targetNode);
        const newParentChildren: TreeData[] = [];
        for (const child of acc.getChildren(sourceParent)) {
            const cid = acc.getId(child);
            if (cid === sourceId) {
                newParentChildren.push(newNode);
            } else if (cid === targetId) {
                continue;
            } else {
                newParentChildren.push(child);
            }
        }
        acc.setChildren(sourceParent, newParentChildren);

        this.updateRelationsInTree(root, [sourceId, targetId], newId, acc.getLabel(newNode));
        return { ok: true, node: newNode };
    }

    editNode(
        root: TreeData,
        input: {
            nodeId: string;
            name: string;
            dept: string;
            level?: LevelKey;
            owner: string;
        }
    ): TreeData | null {
        const acc = this.accessors;
        const result = this.findNodeInTree(root, input.nodeId);
        if (!result) return null;
        acc.setLabel(result.node, input.name);
        acc.setDept(result.node, input.dept);
        if (input.level) acc.setLevel(result.node, input.level);
        acc.setOwner(result.node, input.owner);
        return result.node;
    }

    bindRelation(
        root: TreeData,
        input: {
            sourceId: string;
            targetId: string;
            type: IntegrationTypeKey;
            name: string;
        }
    ): boolean {
        const acc = this.accessors;
        const f = this.config.fields;
        const source = this.findNodeInTree(root, input.sourceId);
        const target = this.findNodeInTree(root, input.targetId);
        if (!source || !target) return false;

        const relation: Record<string, unknown> = {
            [f.relationTargetId]: acc.getId(target.node),
            [f.relationTargetName]: acc.getLabel(target.node),
            [f.relationType]: input.type,
            [f.relationName]: input.name
        };
        acc.ensureRelations(source.node).push(relation);
        return true;
    }

    setNodeIntegration(
        root: TreeData,
        nodeId: string,
        type: IntegrationTypeKey
    ): boolean {
        const result = this.findNodeInTree(root, nodeId);
        if (!result) return false;
        this.accessors.setIntegrationType(
            result.node,
            type,
            this.integrationTypeName(type)
        );
        return true;
    }

    removeRelationsToNode(node: TreeData, deletedId: string): void {
        const acc = this.accessors;
        const f = this.config.fields;
        const relations = acc.getRelations(node);
        if (relations.length) {
            node[f.relations] = relations.filter((r) => acc.getRelationTargetId(r) !== deletedId);
        }
        acc.getChildren(node).forEach((child) => this.removeRelationsToNode(child, deletedId));
    }

    deleteNodeFromTree(root: TreeData, nodeId: string): boolean {
        const protectedId = this.getProtectedRootId(root);
        if (protectedId && nodeId === protectedId) return false;
        const acc = this.accessors;
        const result = this.findNodeInTree(root, nodeId);
        if (!result?.parent) return false;
        const parentChildren = acc.getChildren(result.parent).filter((c) => acc.getId(c) !== nodeId);
        acc.setChildren(result.parent, parentChildren);
        this.removeRelationsToNode(root, nodeId);
        return true;
    }

    integrateSelectedModules(
        root: TreeData,
        input: {
            selected: Record<string, unknown>[];
            name: string;
            dept?: string;
            type: IntegrationTypeKey;
        }
    ): TreeData | null {
        const acc = this.accessors;
        const f = this.config.fields;
        const parentIds = [...new Set(input.selected.map((n) => readSelectionParentId(this, n)))];
        const parentId = parentIds.length === 1 ? parentIds[0] : this.getRootId(root);

        const parentResult = this.findNodeInTree(root, parentId);
        if (!parentResult) return null;

        const newModule = {
            [f.id]: acc.generateId('integrated'),
            [f.label]: input.name,
            [f.level]: this.config.defaults.moduleLevel,
            [f.dept]: input.dept || acc.getDept(parentResult.node),
            [f.owner]: this.config.defaults.owner,
            [f.integrationType]: input.type,
            [f.integrationTypeName]: this.integrationTypeName(input.type)
        } as TreeData;
        acc.ensureModules(parentResult.node).push(newModule);

        input.selected.forEach((raw) => {
            const ownerResult = this.findNodeInTree(root, readSelectionParentId(this, raw));
            if (!ownerResult) return;
            const sid = readSelectionId(this, raw);
            const filtered = acc.getModules(ownerResult.node).filter((m) => acc.getId(m) !== sid);
            acc.setModules(ownerResult.node, filtered);
        });

        return newModule;
    }

    private mergeById<T extends TreeData | Record<string, unknown>>(
        source: T[] = [],
        target: T[] = [],
        getKeyFn: (item: T) => string = (item) =>
            this.accessors.getId(item as TreeData)
    ): T[] {
        const map = new Map<string, T>();
        (source ?? []).forEach((item) => map.set(getKeyFn(item), cloneDeep(item)));
        (target ?? []).forEach((item) => map.set(getKeyFn(item), cloneDeep(item)));
        return Array.from(map.values());
    }

    private updateRelationsInTree(
        node: TreeData,
        oldIds: string[],
        newId: string,
        newLabel: string
    ): void {
        const acc = this.accessors;
        acc.getRelations(node).forEach((relation) => {
            if (oldIds.includes(acc.getRelationTargetId(relation))) {
                acc.setRelationTargetId(relation, newId);
                acc.setRelationTargetName(relation, newLabel);
            }
        });
        acc.getChildren(node).forEach((child) =>
            this.updateRelationsInTree(child, oldIds, newId, newLabel)
        );
    }
}

/** 默认配置上下文（与历史 tree-operations 行为一致） */
export const defaultTreeContext = new TreeContext();
