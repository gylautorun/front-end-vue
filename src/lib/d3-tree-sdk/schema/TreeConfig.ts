/**
 * TreeConfig.ts - 树形图配置 Schema
 * =============================================================================
 * 本文件负责：
 * 1. 定义树配置接口（TreeConfigInput）
 * 2. 提供配置默认值（DEFAULT_TREE_CONFIG）
 * 3. 解析和合并配置（resolveTreeConfig）
 *
 * 核心概念：
 * - TreeFieldSchema：节点字段映射，如 { id: 'nodeId', label: 'title' }
 * - SelectionFieldSchema：选中项字段映射，如 { parentId: 'pid' }
 * - ResolvedTreeConfig：解析后的完整配置，SDK 内部使用此配置
 *
 * 使用示例：
 * ```ts
 * const schema = defineTreeConfig({
 *   rootId: 'root',
 *   fields: { id: 'key', label: 'name', children: 'subList', modules: 'funcList' },
 *   selection: { parentId: 'pid' },
 *   defaults: { dept: '默认部门' }
 * });
 * ```
 */

// ============================================================================
// 依赖导入
// ============================================================================
import {
    ROOT_DEFAULT_MERGE_MARKER,
    EDGE_STYLES,
    INTEGRATION_TYPE_NAME,
    LEVEL_CONFIG
} from '../types';
import type { LevelKey, TreeData } from '../types';

// ============================================================================
// 字段映射接口 - 定义树节点 JSON 字段与逻辑字段的映射关系
// 树节点字段映射（逻辑名 → 你数据里的实际 JSON 属性名）
// ============================================================================

/**
 * 树节点字段映射配置
 * ----------------------------------------------------------------------------
 * 用于适配不同后端返回的数据结构。
 * 只需配置与默认值不同的字段，其余使用 SDK 默认值。
 *
 * @example
 * // 后端字段名与 SDK 默认一致，无需配置
 * fields: { id: 'id', label: 'label', children: 'children' }
 *
 * // 后端使用不同字段名
 * fields: { id: 'nodeId', label: 'title', children: 'subNodes' }
 * 
 * 示例：后端子节点叫 nodes、id 叫 key
 * ```ts
 * defineTreeConfig({
 *   fields: { id: 'key', label: 'title', children: 'nodes' }
 * })
 * ```
 */
export interface TreeFieldSchema {
    /** 节点唯一标识字段，默认 `id` */
    id?: string;

    /** 显示名称字段，默认 `label` */
    label?: string;

    /** 子节点数组字段，默认 `children` */
    children?: string;

    /** 功能模块数组字段，默认 `modules` */
    modules?: string;

    /** 层级类型字段，默认 `level` */
    level?: string;

    /** 所属部门字段，默认 `dept` */
    dept?: string;

    /** 负责人字段，默认 `owner` */
    owner?: string;

    /** 整合方式字段，默认 `integrationType` */
    integrationType?: string;

    /** 整合方式名称字段，默认 `integrationTypeName` */
    integrationTypeName?: string;

    /** 整合来源字段（存储被合并的节点 ID 数组），默认 `integratedFrom` */
    integratedFrom?: string;

    /** 关联关系数组字段，默认 `relations` */
    relations?: string;

    /** 关联目标 ID 字段，默认 `targetId` */
    relationTargetId?: string;

    /** 关联目标名称字段，默认 `targetName` */
    relationTargetName?: string;

    /** 关联类型字段，默认 `type` */
    relationType?: string;

    /** 关联名称字段，默认 `name` */
    relationName?: string;
}

// ============================================================================
// 选择相关字段映射
// ============================================================================

/**
 * 多选/整合模块时的选中项字段映射
 * ----------------------------------------------------------------------------
 * 用于将外部选中项（如页面选中的节点）映射到 SDK 内部标准字段。
 *
 * @example
 * // 默认配置
 * selection: { id: 'id', label: 'label', parentId: 'parentId' }
 *
 * // 外部使用 pid 作为父节点 ID
 * selection: { id: 'id', label: 'label', parentId: 'pid' }
 */
export interface SelectionFieldSchema {
    /** 节点 ID 字段，默认 `id` */
    id?: string;

    /** 节点名称字段，默认 `label` */
    label?: string;

    /** 父节点 id，默认 `parentId`，可改为 `pid` 等 */
    parentId?: string;
}

// ============================================================================
// 默认值配置
// ============================================================================

/**
 * 新建节点时的默认值配置
 */
export interface TreeDefaultsConfig {
    /** 默认部门名称 */
    dept?: string;

    /** 默认负责人 */
    owner?: string;

    /** 功能模块的默认层级类型 */
    moduleLevel?: LevelKey | string;
}

/**
 * 新建节点 ID 前缀配置
 * ----------------------------------------------------------------------------
 * 用于生成唯一 ID，可按业务需求修改前缀
 */
export interface TreeIdPrefixConfig {
    /** 普通节点 ID 前缀，默认 `node_` */
    node?: string;

    /** 功能模块 ID 前缀，默认 `module_` */
    module?: string;

    /** 合并节点 ID 前缀，默认 `merge_` */
    merge?: string;

    /** 整合模块 ID 前缀，默认 `integrated_` */
    integrated?: string;
}

// ============================================================================
// 样式配置，样式与枚举映射（均可覆盖，避免写死业务常量）
// ============================================================================

/**
 * 节点/连线样式映射配置
 * ----------------------------------------------------------------------------
 * 用于自定义节点颜色、连线颜色、整合方式名称等展示效果。
 */
export interface TreeStyleConfig {
    /** 层级类型 → 节点卡片背景色映射 （level 值 → 节点卡片背景色） */
    levelColors?: Record<string, string>;

    /** 整合类型 → 连线颜色映射 （integrationType 值 → 连线颜色） */
    edgeColors?: Record<string, string>;

    /** 整合类型 → 显示名称映射 （integrationType 值 → 中文/显示名） */
    integrationTypeNames?: Record<string, string>;
}

// ============================================================================
// 主配置接口
// ============================================================================

/**
 * SDK 树配置输入接口 （SDK 树配置 —— **使用时通过参数传入**，SDK 内部不假设固定字段名）
 * ----------------------------------------------------------------------------
 * **推荐使用 defineTreeConfig() 函数创建配置**，只传与默认值不同的字段即可。
 *
 * @example
 * const schema = defineTreeConfig({
 *   rootId: 'edu',                        // 根节点 ID
 *   protectedRootId: 'edu',               // 受保护根节点（不可删除）
 *   fields: {                             // 字段映射
 *     id: 'id',
 *     label: 'label',
 *     children: 'children',
 *     modules: 'modules'
 *   },
 *   selection: { parentId: 'parentId' },  // 选中项父节点字段
 *   defaults: { dept: '默认部门' },          // 新建节点默认值
 *   idPrefix: { node: 'node_', module: 'module_' }, // ID 前缀
 *   styles: { levelColors: {...} }         // 样式映射
 * });
 *
 * new D3TreeGraph({ container, data, schema });
 */
export interface TreeConfigInput {
    /** 根节点 ID；不传则取数据根节点的 id 字段值 */
    rootId?: string;

    /** 不可删除的节点 ID，默认同 rootId */
    protectedRootId?: string;

    /** 根层默认合并标记，用于判断 canSiblingMerge */
    rootMergeMarker?: string;

    /** 节点字段名映射（children / modules / relations 等均可改） */
    fields?: TreeFieldSchema;

    /** 多选、整合模块时的选中项字段映射 */
    selection?: SelectionFieldSchema;

    /** 新建节点时的默认值 */
    defaults?: TreeDefaultsConfig;

    /**
     * 合并时 level 优先级
     * @description 数值越大优先级越高，用于合并两个不同层级的节点时确定新节点层级
     * @example { domain: 5, dept_composite: 4, dept_single: 3, office_single: 2, module: 1 }
     */
    levelPriority?: Record<string, number>;

    /** 新建节点 ID 前缀 */
    idPrefix?: TreeIdPrefixConfig;

    /** 节点/连线样式映射 */
    styles?: TreeStyleConfig;
}

/** @deprecated 使用 schema / TreeConfigInput */
export type TreeSchema = TreeConfigInput;

// ============================================================================
// 解析后的配置接口（SDK 内部使用）
// ============================================================================

/**
 * 解析后的节点字段映射（保证所有字段都有值）
 */
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

/**
 * 解析后的选中项字段映射
 */
export interface ResolvedSelectionFieldSchema {
    id: string;
    label: string;
    parentId: string;
}

/**
 * 解析后的完整树配置（SDK 内部使用）
 * ----------------------------------------------------------------------------
 * 所有可选字段都会被赋予默认值，保证配置完整性。
 */
export interface ResolvedTreeConfig {
    /** 根节点 ID */
    rootId?: string;

    /** 受保护根节点 ID */
    protectedRootId?: string;

    /** 根层默认合并标记 */
    rootMergeMarker: string;

    /** 节点字段映射 */
    fields: ResolvedTreeFieldSchema;

    /** 选中项字段映射 */
    selection: ResolvedSelectionFieldSchema;

    /** 默认值配置 */
    defaults: Required<TreeDefaultsConfig>;

    /** 层级优先级 */
    levelPriority: Record<string, number>;

    /** ID 前缀配置 */
    idPrefix: Required<TreeIdPrefixConfig>;

    /** 层级颜色映射 */
    levelColors: Record<string, string>;

    /** 连线颜色映射 */
    edgeColors: Record<string, string>;

    /** 整合类型名称映射 */
    integrationTypeNames: Record<string, string>;
}

// ============================================================================
// 默认值定义
// ============================================================================

/**
 * 从 LEVEL_CONFIG 生成层级颜色映射
 */
function defaultLevelColors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const [key, val] of Object.entries(LEVEL_CONFIG)) {
        map[key] = val.color;
    }
    return map;
}

/**
 * 从 EDGE_STYLES 生成连线颜色映射
 */
function defaultEdgeColors(): Record<string, string> {
    return { ...EDGE_STYLES } as Record<string, string>;
}

/**
 * 从 INTEGRATION_TYPE_NAME 生成整合类型名称映射
 */
function defaultIntegrationTypeNames(): Record<string, string> {
    return { ...INTEGRATION_TYPE_NAME } as Record<string, string>;
}

/**
 * 默认节点字段映射
 * ----------------------------------------------------------------------------
 * 对应标准 TreeData 结构的字段名
 */
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

/**
 * 默认选中项字段映射
 */
export const DEFAULT_SELECTION_SCHEMA: ResolvedSelectionFieldSchema = {
    id: 'id',
    label: 'label',
    parentId: 'parentId'
};

/**
 * 默认层级优先级
 * ----------------------------------------------------------------------------
 * domain（领域级）最高，module（功能模块）最低
 */
const DEFAULT_LEVEL_PRIORITY: Record<string, number> = {
    domain: 5, // 领域级应用
    dept_composite: 4, // 部门级综合应用
    dept_single: 3, // 部门级单点应用
    office_single: 2, // 处室级单点应用
    module: 1 // 功能模块
};

/**
 * 默认树配置
 * ----------------------------------------------------------------------------
 * 所有可选字段都有默认值，保证配置完整性。
 * SDK 内部通过 resolveTreeConfig() 将用户配置与默认配置合并。
 */
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

// ============================================================================
// 配置工厂函数
// ============================================================================

/**
 * 定义树配置（推荐入口）
 * ----------------------------------------------------------------------------
 * 只传与你数据结构不一致的字段即可，其余走 SDK 默认值。
 *
 * @param input - 部分配置，不传的字段使用默认值
 * @returns 树配置对象
 *
 * @example
 * const schema = defineTreeConfig({
 *   rootId: 'edu',
 *   fields: { modules: 'funcModules' },  // 只改 modules 字段
 *   defaults: { dept: '默认部门' }
 * });
 */
export function defineTreeConfig(input?: TreeConfigInput): TreeConfigInput {
    return input ?? {};
}

/**
 * 解析并合并树配置
 * ----------------------------------------------------------------------------
 * 将用户输入的配置与默认配置合并，生成完整的 ResolvedTreeConfig。
 * SDK 内部使用此函数生成最终配置。
 *
 * @param input - 用户配置（可选）
 * @returns 解析后的完整配置
 */
export function resolveTreeConfig(input?: TreeConfigInput): ResolvedTreeConfig {
    const base = DEFAULT_TREE_CONFIG;
    const styles = input?.styles;

    return {
        // 根节点 ID：优先使用输入值，否则使用默认值
        rootId: input?.rootId ?? base.rootId,

        // 受保护根节点 ID
        protectedRootId: input?.protectedRootId ?? input?.rootId ?? base.protectedRootId,

        // 根层合并标记
        rootMergeMarker: input?.rootMergeMarker ?? base.rootMergeMarker,

        // 字段映射：合并用户输入与默认值
        fields: { ...base.fields, ...input?.fields },

        // 选中项字段映射
        selection: { ...base.selection, ...input?.selection },

        // 默认值配置
        defaults: { ...base.defaults, ...input?.defaults },

        // 层级优先级
        levelPriority: { ...base.levelPriority, ...input?.levelPriority },

        // ID 前缀
        idPrefix: { ...base.idPrefix, ...input?.idPrefix },

        // 样式配置：合并基础样式与用户自定义样式
        levelColors: { ...base.levelColors, ...styles?.levelColors },
        edgeColors: { ...base.edgeColors, ...styles?.edgeColors },
        integrationTypeNames: { ...base.integrationTypeNames, ...styles?.integrationTypeNames }
    };
}

// ============================================================================
// 辅助函数
// ============================================================================

/**
 * 从树数据解析根节点 ID
 * ----------------------------------------------------------------------------
 * 优先级：配置 rootId > 数据根节点的 id 字段
 *
 * @param root - 树根节点数据
 * @param config - 已解析的配置
 * @returns 根节点 ID
 */
export function resolveRootId(root: TreeData, config: ResolvedTreeConfig): string {
    // 优先使用配置的 rootId
    if (config.rootId) return config.rootId;

    // 否则从数据根节点读取 id 字段
    const idKey = config.fields.id;
    return String(root[idKey] ?? '');
}

/**
 * 获取受保护根节点 ID
 * ----------------------------------------------------------------------------
 * @param config - 已解析的配置
 * @param root - 树根节点数据（可选，用于 fallback）
 * @returns 受保护根节点 ID
 */
export function resolveProtectedRootId(config: ResolvedTreeConfig, root?: TreeData): string {
    // 优先使用配置的 protectedRootId
    if (config.protectedRootId) return config.protectedRootId;

    // 其次尝试从数据根节点获取
    if (root) return resolveRootId(root, config);

    // 最后 fallback
    return '';
}
