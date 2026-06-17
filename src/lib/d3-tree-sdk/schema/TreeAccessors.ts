/**
 * TreeAccessors.ts - 树节点数据访问器
 * =============================================================================
 * 本文件负责：
 * 1. 定义 TreeAccessors 接口 - 通过配置的字段名读写树节点数据
 * 2. 实现 createTreeAccessors() - 创建符合配置的访问器实例
 *
 * 核心概念：
 * - TreeAccessors：统一的树节点数据访问接口，屏蔽字段名差异
 * - TreeNodeData：树节点类型，与 TreeData 兼容但字段名由配置决定
 *
 * 为什么需要 Accessors？
 * SDK 需要支持不同的后端数据结构，但内部逻辑不希望写死字段名。
 * 通过 Accessors，SDK 可以用统一的 getId()、getChildren() 等方法
 * 访问任意字段名的树数据，而不需要关心实际字段是 id 还是 nodeId。
 *
 * 使用示例：
 * ```ts
 * const acc = createTreeAccessors(config);
 *
 * // 即使 config.fields.id = 'nodeId'，SDK 内部仍使用 acc.getId(node)
 * const nodeId = acc.getId(node);
 * const children = acc.getChildren(node);
 * ```
 */

// ============================================================================
// 依赖导入
// ============================================================================
import type { IntegrationTypeKey } from '../types';
import type { TreeData } from '../types';
import type { ResolvedTreeConfig } from './TreeConfig';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 树节点数据类型 （任意树节点对象）
 * ----------------------------------------------------------------------------
 * 与 TreeData 兼容，但字段名由 TreeConfig 决定。
 * 实际使用时，TreeNodeData 可能包含 id/nodeId/key 等不同字段。
 */
export type TreeNodeData = TreeData;

// ============================================================================
// TreeAccessors 接口定义
// ----------------------------------------------------------------------------
// SDK 内部统一使用 Accessors 接口访问树节点数据，而非直接访问字段。
// 通过 createTreeAccessors(config) 创建的实例，会根据配置自动映射字段名。
// ============================================================================

/**
 * 树节点数据访问器接口
 * ----------------------------------------------------------------------------
 * 提供统一的 get/set 方法读写树节点数据，屏蔽字段名差异。
 * SDK 内部所有对树数据的读写都通过 Accessors 完成。
 *
 * @example
 * const acc = createTreeAccessors(config);
 *
 * // 读取节点基本信息
 * const id = acc.getId(node);           // 等同于 node[config.fields.id]
 * const label = acc.getLabel(node);     // 等同于 node[config.fields.label]
 * const level = acc.getLevel(node);     // 等同于 node[config.fields.level]
 *
 * // 读写子节点数组
 * const children = acc.getChildren(node);
 * acc.setChildren(node, newChildren);
 * acc.ensureChildren(node);  // 确保 children 存在，不存在则初始化为空数组
 *
 * // 读写功能模块数组
 * const modules = acc.getModules(node);
 * acc.setModules(node, newModules);
 * acc.ensureModules(node);   // 确保 modules 存在
 *
 * // 读写关联关系
 * const relations = acc.getRelations(node);
 * acc.ensureRelations(node); // 确保 relations 存在
 *
 * // 读写关系字段
 * const targetId = acc.getRelationTargetId(relation);
 * acc.setRelationTargetId(relation, 'xxx');
 *
 * // ID 生成
 * const newId = acc.generateId('node');    // 'node_' + timestamp
 * const newId = acc.generateId('module');   // 'module_' + timestamp
 * ```
 */
export interface TreeAccessors {
    // -------------------------------------------------------------------------
    // 基本信息读写
    // -------------------------------------------------------------------------

    /** 获取节点唯一标识 */
    getId(node: TreeNodeData): string;

    /** 设置节点唯一标识 */
    setId(node: TreeNodeData, value: string): void;

    /** 获取节点显示名称 */
    getLabel(node: TreeNodeData): string;

    /** 设置节点显示名称 */
    setLabel(node: TreeNodeData, value: string): void;

    /** 获取节点层级类型（如 domain/dept_composite/module 等） */
    getLevel(node: TreeNodeData): string;

    /** 设置节点层级类型 */
    setLevel(node: TreeNodeData, value: string): void;

    /** 获取节点所属部门 */
    getDept(node: TreeNodeData): string;

    /** 设置节点所属部门 */
    setDept(node: TreeNodeData, value: string): void;

    /** 获取节点负责人 */
    getOwner(node: TreeNodeData): string;

    /** 设置节点负责人 */
    setOwner(node: TreeNodeData, value: string): void;

    // -------------------------------------------------------------------------
    // 整合相关
    // -------------------------------------------------------------------------

    /** 获取节点整合方式（base/interface/migrate/merge） */
    getIntegrationType(node: TreeNodeData): IntegrationTypeKey | undefined;

    /** 获取节点整合方式名称（如"基础"/"接口对接"/"迁移"/"合并"） */
    getIntegrationTypeName(node: TreeNodeData): string;

    /** 设置节点整合方式及名称 */
    setIntegrationType(node: TreeNodeData, type: IntegrationTypeKey, typeName: string): void;

    /** 获取整合来源列表（被合并的源节点 ID 数组） */
    getIntegratedFrom(node: TreeNodeData): string[] | undefined;

    /** 设置整合来源列表 */
    setIntegratedFrom(node: TreeNodeData, ids: string[]): void;

    // -------------------------------------------------------------------------
    // 子节点操作
    // -------------------------------------------------------------------------

    /** 获取子节点数组 */
    getChildren(node: TreeNodeData): TreeNodeData[];

    /** 设置子节点数组 */
    setChildren(node: TreeNodeData, children: TreeNodeData[]): void;

    /**
     * 确保子节点数组存在
     * @returns 如果 node.children 不存在或非数组，初始化为空数组后返回
     */
    ensureChildren(node: TreeNodeData): TreeNodeData[];

    // -------------------------------------------------------------------------
    // 功能模块操作
    // -------------------------------------------------------------------------

    /** 获取功能模块数组 */
    getModules(node: TreeNodeData): TreeNodeData[];

    /** 设置功能模块数组 */
    setModules(node: TreeNodeData, modules: TreeNodeData[]): void;

    /**
     * 确保功能模块数组存在
     * @returns 如果 node.modules 不存在或非数组，初始化为空数组后返回
     */
    ensureModules(node: TreeNodeData): TreeNodeData[];

    // -------------------------------------------------------------------------
    // 关联关系操作
    // -------------------------------------------------------------------------

    /** 获取关联关系数组 */
    getRelations(node: TreeNodeData): Record<string, unknown>[];

    /**
     * 确保关联关系数组存在
     * @returns 如果 node.relations 不存在或非数组，初始化为空数组后返回
     */
    ensureRelations(node: TreeNodeData): Record<string, unknown>[];

    /** 获取关联目标 ID */
    getRelationTargetId(relation: Record<string, unknown>): string;

    /** 设置关联目标 ID */
    setRelationTargetId(relation: Record<string, unknown>, id: string): void;

    /** 获取关联目标名称 */
    getRelationTargetName(relation: Record<string, unknown>): string;

    /** 设置关联目标名称 */
    setRelationTargetName(relation: Record<string, unknown>, name: string): void;

    /** 获取关联类型 */
    getRelationType(relation: Record<string, unknown>): IntegrationTypeKey;

    /** 设置关联类型 */
    setRelationType(relation: Record<string, unknown>, type: IntegrationTypeKey): void;

    /** 获取关联类型名称 */
    getRelationTypeName(relation: Record<string, unknown>): string;

    /** 设置关联类型名称 */
    setRelationTypeName(relation: Record<string, unknown>, typeName: string): void;

    /** 获取关联名称 */
    getRelationName(relation: Record<string, unknown>): string;

    /** 设置关联名称 */
    setRelationName(relation: Record<string, unknown>, name: string): void;

    // -------------------------------------------------------------------------
    // 展开/收起相关（缓存子节点）
    // -------------------------------------------------------------------------

    /**
     * 获取缓存的子节点（收起状态下保存的子节点）
     * @description 用于展开/收起功能，收起时将 children 移到 _children 缓存
     * @returns 缓存的子节点数组，如果没有缓存则返回 undefined
     */
    getCachedChildren(node: TreeNodeData): TreeNodeData[] | undefined;

    /**
     * 设置缓存的子节点
     * @description 将子节点缓存到 _children 属性
     */
    setCachedChildren(node: TreeNodeData, children: TreeNodeData[]): void;

    /**
     * 检查节点是否有缓存的子节点
     * @description 用于判断节点是否处于收起状态
     */
    hasCachedChildren(node: TreeNodeData): boolean;

    // -------------------------------------------------------------------------
    // D3 布局相关
    // -------------------------------------------------------------------------

    /**
     * 获取 D3 hierarchy 使用的 children （d3.hierarchy 的 children 访问器）
     * @description 返回 undefined 时，D3 认为该节点是叶子节点
     */
    hierarchyChildren(node: TreeNodeData): TreeNodeData[] | undefined;

    // -------------------------------------------------------------------------
    // ID 生成
    // -------------------------------------------------------------------------

    /**
     * 生成唯一 ID
     * @param kind - ID 类型：node/module/merge/integrated
     * @returns 格式为 `{prefix}_{timestamp}` 的唯一 ID
     */
    generateId(kind: 'node' | 'module' | 'merge' | 'integrated'): string;
}

// ============================================================================
// Accessors 工厂函数
// ============================================================================

/**
 * 创建树访问器实例
 * ----------------------------------------------------------------------------
 * 根据传入的 ResolvedTreeConfig 创建符合配置的 Accessors 实例。
 * 创建后，SDK 内部通过 acc.getId(node) 等方法访问数据，
 * 而不直接使用 node.id 或 node.nodeId 等硬编码字段名。
 *
 * @param config - 已解析的树配置（通过 resolveTreeConfig() 生成）
 * @returns 树访问器实例
 *
 * @example
 * const config = resolveTreeConfig({
 *   fields: { id: 'nodeId', children: 'subNodes' },
 *   idPrefix: { node: 'n_', module: 'm_' }
 * });
 * const acc = createTreeAccessors(config);
 *
 * // 即使字段名是 nodeId 和 subNodes，SDK 内部仍使用统一接口
 * const nodeId = acc.getId(node);              // 实际访问 node['nodeId']
 * const children = acc.getChildren(node);      // 实际访问 node['subNodes']
 * const newId = acc.generateId('module');       // 生成格式为 'm_{timestamp}' 的 ID
 */
export function createTreeAccessors(config: ResolvedTreeConfig): TreeAccessors {
    // 从配置中提取字段映射和 ID 前缀
    const f = config.fields;
    const p = config.idPrefix;

    /**
     * 安全读取数组字段
     * @description 如果字段值不是数组，返回空数组
     */
    const readArr = (node: TreeNodeData, key: string): TreeNodeData[] => {
        const val = node[key];
        return Array.isArray(val) ? (val as TreeNodeData[]) : [];
    };

    return {
        // =====================================================================
        // 基本信息读写
        // =====================================================================

        /**
         * 获取节点 ID
         * @description 将值转换为字符串，保证返回类型一致
         */
        getId: (node) => String(node[f.id] ?? ''),

        /**
         * 设置节点 ID
         */
        setId: (node, value) => {
            node[f.id] = value;
        },

        /**
         * 获取节点名称
         */
        getLabel: (node) => String(node[f.label] ?? ''),

        /**
         * 设置节点名称
         */
        setLabel: (node, value) => {
            node[f.label] = value;
        },

        /**
         * 获取节点层级
         */
        getLevel: (node) => String(node[f.level] ?? ''),

        /**
         * 设置节点层级
         */
        setLevel: (node, value) => {
            node[f.level] = value;
        },

        /**
         * 获取部门
         */
        getDept: (node) => String(node[f.dept] ?? ''),

        /**
         * 设置部门
         */
        setDept: (node, value) => {
            node[f.dept] = value;
        },

        /**
         * 获取负责人
         */
        getOwner: (node) => String(node[f.owner] ?? ''),

        /**
         * 设置负责人
         */
        setOwner: (node, value) => {
            node[f.owner] = value;
        },

        // =====================================================================
        // 整合相关
        // =====================================================================

        /**
         * 获取整合类型
         * @returns 可能返回 undefined（节点未设置整合类型）
         */
        getIntegrationType: (node) => node[f.integrationType] as IntegrationTypeKey | undefined,

        /**
         * 获取整合类型名称
         */
        getIntegrationTypeName: (node) => String(node[f.integrationTypeName] ?? ''),

        /**
         * 设置整合类型和名称
         */
        setIntegrationType: (node, type, typeName) => {
            node[f.integrationType] = type;
            node[f.integrationTypeName] = typeName;
        },

        /**
         * 获取整合来源
         * @returns 被合并的源节点 ID 数组，未设置时返回 undefined
         */
        getIntegratedFrom: (node) => node[f.integratedFrom] as string[] | undefined,

        /**
         * 设置整合来源
         */
        setIntegratedFrom: (node, ids) => {
            node[f.integratedFrom] = ids;
        },

        // =====================================================================
        // 子节点操作
        // =====================================================================

        /**
         * 获取子节点数组
         * @description 始终返回数组，非数组字段返回空数组
         */
        getChildren: (node) => readArr(node, f.children),

        /**
         * 设置子节点数组
         */
        setChildren: (node, children) => {
            node[f.children] = children;
        },

        /**
         * 确保子节点数组存在
         * @description 如果 children 不存在或非数组，初始化为空数组
         * @returns 保证可用的 children 数组引用
         */
        ensureChildren: (node) => {
            if (!Array.isArray(node[f.children])) node[f.children] = [];
            return node[f.children] as TreeNodeData[];
        },

        // =====================================================================
        // 功能模块操作
        // =====================================================================

        /**
         * 获取功能模块数组
         */
        getModules: (node) => readArr(node, f.modules),

        /**
         * 设置功能模块数组
         */
        setModules: (node, modules) => {
            node[f.modules] = modules;
        },

        /**
         * 确保功能模块数组存在
         */
        ensureModules: (node) => {
            if (!Array.isArray(node[f.modules])) node[f.modules] = [];
            return node[f.modules] as TreeNodeData[];
        },

        // =====================================================================
        // 关联关系操作
        // =====================================================================

        /**
         * 获取关联关系数组
         */
        getRelations: (node) => readArr(node, f.relations) as Record<string, unknown>[],

        /**
         * 确保关联关系数组存在
         */
        ensureRelations: (node) => {
            if (!Array.isArray(node[f.relations])) node[f.relations] = [];
            return node[f.relations] as Record<string, unknown>[];
        },

        /**
         * 获取关联目标 ID
         */
        getRelationTargetId: (r) => String(r[f.relationTargetId] ?? ''),

        /**
         * 设置关联目标 ID
         */
        setRelationTargetId: (r, id) => {
            r[f.relationTargetId] = id;
        },

        /**
         * 获取关联目标名称
         */
        getRelationTargetName: (r) => String(r[f.relationTargetName] ?? ''),

        /**
         * 设置关联目标名称
         */
        setRelationTargetName: (r, name) => {
            r[f.relationTargetName] = name;
        },

        /**
         * 获取关联类型
         */
        getRelationType: (r) => r[f.relationType] as IntegrationTypeKey,

        /**
         * 设置关联类型
         */
        setRelationType: (r, type) => {
            r[f.relationType] = type;
        },

        /**
         * 获取关联类型名称
         */
        getRelationTypeName: (r) => String(r[f.relationTypeName] ?? ''),

        /**
         * 设置关联类型名称
         */
        setRelationTypeName: (r, typeName) => {
            r[f.relationTypeName] = typeName;
        },

        /**
         * 获取关联名称
         */
        getRelationName: (r) => String(r[f.relationName] ?? ''),

        /**
         * 设置关联名称
         */
        setRelationName: (r, name) => {
            r[f.relationName] = name;
        },

        // =====================================================================
        // 展开/收起相关（缓存子节点）
        // =====================================================================

        /**
         * 获取缓存的子节点
         * @description 收起时将 children 移到 _children 缓存
         */
        getCachedChildren: (node) => {
            const cache = (node as any)._children;
            return Array.isArray(cache) ? (cache as TreeNodeData[]) : undefined;
        },

        /**
         * 设置缓存的子节点
         */
        setCachedChildren: (node, children) => {
            (node as any)._children = children;
        },

        /**
         * 检查节点是否有缓存的子节点
         */
        hasCachedChildren: (node) => {
            const cache = (node as any)._children;
            return Array.isArray(cache) && cache.length > 0;
        },

        // =====================================================================
        // D3 布局相关
        // =====================================================================

        /**
         * 获取 D3 hierarchy 使用的 children
         * @description D3 的 d3.tree() 和 d3.hierarchy() 使用此方法确定子节点。
         *              返回 undefined 时，D3 认为该节点是叶子节点，不会继续递归。
         */
        hierarchyChildren: (node) => {
            const c = node[f.children];
            // 只有当 children 是非空数组时才返回，否则返回 undefined
            return Array.isArray(c) && c.length > 0 ? (c as TreeNodeData[]) : undefined;
        },

        // =====================================================================
        // ID 生成
        // =====================================================================

        /**
         * 生成唯一 ID
         * @param kind - ID 前缀类型
         * @returns 格式为 `{prefix}_{timestamp}` 的唯一字符串
         */
        generateId: (kind) => `${p[kind]}${Date.now()}`
    };
}
