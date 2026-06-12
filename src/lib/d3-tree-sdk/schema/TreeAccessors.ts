import type { IntegrationTypeKey } from '../types';
import type { TreeData } from '../types';
import type { ResolvedTreeConfig } from './TreeConfig';

/** 任意树节点对象（与 TreeData 兼容，字段名由 TreeConfig 决定） */
export type TreeNodeData = TreeData;

export interface TreeAccessors {
    getId(node: TreeNodeData): string;
    setId(node: TreeNodeData, value: string): void;
    getLabel(node: TreeNodeData): string;
    setLabel(node: TreeNodeData, value: string): void;
    getLevel(node: TreeNodeData): string;
    setLevel(node: TreeNodeData, value: string): void;
    getDept(node: TreeNodeData): string;
    setDept(node: TreeNodeData, value: string): void;
    getOwner(node: TreeNodeData): string;
    setOwner(node: TreeNodeData, value: string): void;
    getIntegrationType(node: TreeNodeData): IntegrationTypeKey | undefined;
    getIntegrationTypeName(node: TreeNodeData): string;
    setIntegrationType(node: TreeNodeData, type: IntegrationTypeKey, typeName: string): void;
    getIntegratedFrom(node: TreeNodeData): string[] | undefined;
    setIntegratedFrom(node: TreeNodeData, ids: string[]): void;
    getChildren(node: TreeNodeData): TreeNodeData[];
    setChildren(node: TreeNodeData, children: TreeNodeData[]): void;
    ensureChildren(node: TreeNodeData): TreeNodeData[];
    getModules(node: TreeNodeData): TreeNodeData[];
    setModules(node: TreeNodeData, modules: TreeNodeData[]): void;
    ensureModules(node: TreeNodeData): TreeNodeData[];
    getRelations(node: TreeNodeData): Record<string, unknown>[];
    ensureRelations(node: TreeNodeData): Record<string, unknown>[];
    getRelationTargetId(relation: Record<string, unknown>): string;
    setRelationTargetId(relation: Record<string, unknown>, id: string): void;
    getRelationTargetName(relation: Record<string, unknown>): string;
    setRelationTargetName(relation: Record<string, unknown>, name: string): void;
    getRelationType(relation: Record<string, unknown>): IntegrationTypeKey;
    setRelationType(relation: Record<string, unknown>, type: IntegrationTypeKey): void;
    getRelationName(relation: Record<string, unknown>): string;
    setRelationName(relation: Record<string, unknown>, name: string): void;
    /** d3.hierarchy 的 children 访问器 */
    hierarchyChildren(node: TreeNodeData): TreeNodeData[] | undefined;
    generateId(kind: 'node' | 'module' | 'merge' | 'integrated'): string;
}

export function createTreeAccessors(config: ResolvedTreeConfig): TreeAccessors {
    const f = config.fields;
    const p = config.idPrefix;

    const readArr = (node: TreeNodeData, key: string): TreeNodeData[] => {
        const val = node[key];
        return Array.isArray(val) ? (val as TreeNodeData[]) : [];
    };

    return {
        getId: (node) => String(node[f.id] ?? ''),
        setId: (node, value) => {
            node[f.id] = value;
        },
        getLabel: (node) => String(node[f.label] ?? ''),
        setLabel: (node, value) => {
            node[f.label] = value;
        },
        getLevel: (node) => String(node[f.level] ?? ''),
        setLevel: (node, value) => {
            node[f.level] = value;
        },
        getDept: (node) => String(node[f.dept] ?? ''),
        setDept: (node, value) => {
            node[f.dept] = value;
        },
        getOwner: (node) => String(node[f.owner] ?? ''),
        setOwner: (node, value) => {
            node[f.owner] = value;
        },
        getIntegrationType: (node) => node[f.integrationType] as IntegrationTypeKey | undefined,
        getIntegrationTypeName: (node) => String(node[f.integrationTypeName] ?? ''),
        setIntegrationType: (node, type, typeName) => {
            node[f.integrationType] = type;
            node[f.integrationTypeName] = typeName;
        },
        getIntegratedFrom: (node) => node[f.integratedFrom] as string[] | undefined,
        setIntegratedFrom: (node, ids) => {
            node[f.integratedFrom] = ids;
        },
        getChildren: (node) => readArr(node, f.children),
        setChildren: (node, children) => {
            node[f.children] = children;
        },
        ensureChildren: (node) => {
            if (!Array.isArray(node[f.children])) node[f.children] = [];
            return node[f.children] as TreeNodeData[];
        },
        getModules: (node) => readArr(node, f.modules),
        setModules: (node, modules) => {
            node[f.modules] = modules;
        },
        ensureModules: (node) => {
            if (!Array.isArray(node[f.modules])) node[f.modules] = [];
            return node[f.modules] as TreeNodeData[];
        },
        getRelations: (node) => readArr(node, f.relations) as Record<string, unknown>[],
        ensureRelations: (node) => {
            if (!Array.isArray(node[f.relations])) node[f.relations] = [];
            return node[f.relations] as Record<string, unknown>[];
        },
        getRelationTargetId: (r) => String(r[f.relationTargetId] ?? ''),
        setRelationTargetId: (r, id) => {
            r[f.relationTargetId] = id;
        },
        getRelationTargetName: (r) => String(r[f.relationTargetName] ?? ''),
        setRelationTargetName: (r, name) => {
            r[f.relationTargetName] = name;
        },
        getRelationType: (r) => r[f.relationType] as IntegrationTypeKey,
        setRelationType: (r, type) => {
            r[f.relationType] = type;
        },
        getRelationName: (r) => String(r[f.relationName] ?? ''),
        setRelationName: (r, name) => {
            r[f.relationName] = name;
        },
        hierarchyChildren: (node) => {
            const c = node[f.children];
            return Array.isArray(c) && c.length > 0 ? (c as TreeNodeData[]) : undefined;
        },
        generateId: (kind) => `${p[kind]}${Date.now()}`
    };
}
