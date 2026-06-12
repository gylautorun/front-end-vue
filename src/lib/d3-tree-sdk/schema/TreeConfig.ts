import { ROOT_DEFAULT_MERGE_MARKER, EDGE_STYLES, INTEGRATION_TYPE_NAME, LEVEL_CONFIG } from '../types';
import type { LevelKey, TreeData } from '../types';

/**
 * 树节点字段映射（逻辑名 → 你数据里的实际 JSON 属性名）
 *
 * 示例：后端子节点叫 nodes、id 叫 key
 * ```ts
 * defineTreeConfig({
 *   fields: { id: 'key', label: 'title', children: 'nodes' }
 * })
 * ```
 */
export interface TreeFieldSchema {
    /** 节点唯一标识，默认 `id` */
    id?: string;
    /** 显示名称，默认 `label` */
    label?: string;
    /** 子节点数组，默认 `children` */
    children?: string;
    /** 功能模块数组，默认 `modules` */
    modules?: string;
    level?: string;
    dept?: string;
    owner?: string;
    integrationType?: string;
    integrationTypeName?: string;
    integratedFrom?: string;
    relations?: string;
    relationTargetId?: string;
    relationTargetName?: string;
    relationType?: string;
    relationName?: string;
}

/** 多选/整合模块时的选中项字段映射 */
export interface SelectionFieldSchema {
    id?: string;
    label?: string;
    /** 父节点 id，默认 `parentId`，可改为 `pid` 等 */
    parentId?: string;
}

export interface TreeDefaultsConfig {
    dept?: string;
    owner?: string;
    moduleLevel?: LevelKey | string;
}

export interface TreeIdPrefixConfig {
    node?: string;
    module?: string;
    merge?: string;
    integrated?: string;
}

/** 样式与枚举映射（均可覆盖，避免写死业务常量） */
export interface TreeStyleConfig {
    /** level 值 → 节点卡片背景色 */
    levelColors?: Record<string, string>;
    /** integrationType 值 → 连线颜色 */
    edgeColors?: Record<string, string>;
    /** integrationType 值 → 中文/显示名 */
    integrationTypeNames?: Record<string, string>;
}

/**
 * SDK 树配置 —— **使用时通过参数传入**，SDK 内部不假设固定字段名
 *
 * ```ts
 * const schema = defineTreeConfig({
 *   rootId: 'root',
 *   fields: { id: 'nodeId', label: 'name', children: 'subList', modules: 'funcList' },
 *   selection: { parentId: 'pid' },
 *   defaults: { dept: '默认部门' }
 * });
 * new D3TreeGraph({ container, data, schema });
 * ```
 */
export interface TreeConfigInput {
    /** 根节点 id；不传则取数据根节点 id 字段 */
    rootId?: string;
    /** 不可删除的节点 id，默认同 rootId */
    protectedRootId?: string;
    /** 根层默认合并标记，用于 canSiblingMerge */
    rootMergeMarker?: string;
    /** 节点字段名映射（children / modules / relations 等均可改） */
    fields?: TreeFieldSchema;
    /** 多选、整合模块时的选中项字段映射 */
    selection?: SelectionFieldSchema;
    /** 新建节点时的默认值 */
    defaults?: TreeDefaultsConfig;
    /** 合并时 level 优先级 */
    levelPriority?: Record<string, number>;
    /** 新建节点 id 前缀 */
    idPrefix?: TreeIdPrefixConfig;
    /** 节点/连线样式映射 */
    styles?: TreeStyleConfig;
}

/** @deprecated 使用 schema / TreeConfigInput */
export type TreeSchema = TreeConfigInput;

export interface ResolvedTreeFieldSchema {
    id: string;
    label: string;
    children: string;
    modules: string;
    level: string;
    dept: string;
    owner: string;
    integrationType: string;
    integrationTypeName: string;
    integratedFrom: string;
    relations: string;
    relationTargetId: string;
    relationTargetName: string;
    relationType: string;
    relationName: string;
}

export interface ResolvedSelectionFieldSchema {
    id: string;
    label: string;
    parentId: string;
}

export interface ResolvedTreeConfig {
    rootId?: string;
    protectedRootId?: string;
    rootMergeMarker: string;
    fields: ResolvedTreeFieldSchema;
    selection: ResolvedSelectionFieldSchema;
    defaults: Required<TreeDefaultsConfig>;
    levelPriority: Record<string, number>;
    idPrefix: Required<TreeIdPrefixConfig>;
    levelColors: Record<string, string>;
    edgeColors: Record<string, string>;
    integrationTypeNames: Record<string, string>;
}

function defaultLevelColors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const [key, val] of Object.entries(LEVEL_CONFIG)) {
        map[key] = val.color;
    }
    return map;
}

function defaultEdgeColors(): Record<string, string> {
    return { ...EDGE_STYLES } as Record<string, string>;
}

function defaultIntegrationTypeNames(): Record<string, string> {
    return { ...INTEGRATION_TYPE_NAME } as Record<string, string>;
}

export const DEFAULT_FIELD_SCHEMA: ResolvedTreeFieldSchema = {
    id: 'id',
    label: 'label',
    children: 'children',
    modules: 'modules',
    level: 'level',
    dept: 'dept',
    owner: 'owner',
    integrationType: 'integrationType',
    integrationTypeName: 'integrationTypeName',
    integratedFrom: 'integratedFrom',
    relations: 'relations',
    relationTargetId: 'targetId',
    relationTargetName: 'targetName',
    relationType: 'type',
    relationName: 'name'
};

export const DEFAULT_SELECTION_SCHEMA: ResolvedSelectionFieldSchema = {
    id: 'id',
    label: 'label',
    parentId: 'parentId'
};

const DEFAULT_LEVEL_PRIORITY: Record<string, number> = {
    domain: 5,
    dept_composite: 4,
    dept_single: 3,
    office_single: 2,
    module: 1
};

export const DEFAULT_TREE_CONFIG: ResolvedTreeConfig = {
    rootMergeMarker: ROOT_DEFAULT_MERGE_MARKER,
    fields: DEFAULT_FIELD_SCHEMA,
    selection: DEFAULT_SELECTION_SCHEMA,
    defaults: {
        dept: '教育局',
        owner: '',
        moduleLevel: 'module'
    },
    levelPriority: DEFAULT_LEVEL_PRIORITY,
    idPrefix: {
        node: 'node_',
        module: 'module_',
        merge: 'merge_',
        integrated: 'integrated_'
    },
    levelColors: defaultLevelColors(),
    edgeColors: defaultEdgeColors(),
    integrationTypeNames: defaultIntegrationTypeNames()
};

/**
 * 定义树配置（推荐入口）
 * 只传与你数据结构不一致的字段即可，其余走 SDK 默认值
 */
export function defineTreeConfig(input?: TreeConfigInput): TreeConfigInput {
    return input ?? {};
}

export function resolveTreeConfig(input?: TreeConfigInput): ResolvedTreeConfig {
    const base = DEFAULT_TREE_CONFIG;
    const styles = input?.styles;
    return {
        rootId: input?.rootId ?? base.rootId,
        protectedRootId: input?.protectedRootId ?? input?.rootId ?? base.protectedRootId,
        rootMergeMarker: input?.rootMergeMarker ?? base.rootMergeMarker,
        fields: { ...base.fields, ...input?.fields },
        selection: { ...base.selection, ...input?.selection },
        defaults: { ...base.defaults, ...input?.defaults },
        levelPriority: { ...base.levelPriority, ...input?.levelPriority },
        idPrefix: { ...base.idPrefix, ...input?.idPrefix },
        levelColors: { ...base.levelColors, ...styles?.levelColors },
        edgeColors: { ...base.edgeColors, ...styles?.edgeColors },
        integrationTypeNames: { ...base.integrationTypeNames, ...styles?.integrationTypeNames }
    };
}

/** 从树数据解析 rootId（配置优先，否则读根节点 id 字段） */
export function resolveRootId(
    root: TreeData,
    config: ResolvedTreeConfig
): string {
    if (config.rootId) return config.rootId;
    const idKey = config.fields.id;
    return String(root[idKey] ?? '');
}

/** 获取受保护根 id */
export function resolveProtectedRootId(config: ResolvedTreeConfig, root?: TreeData): string {
    if (config.protectedRootId) return config.protectedRootId;
    if (root) return resolveRootId(root, config);
    return '';
}
