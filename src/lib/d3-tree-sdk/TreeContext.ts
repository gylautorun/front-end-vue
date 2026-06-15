/**
 * TreeContext.ts - 树操作上下文
 * =============================================================================
 * 本文件负责：
 * 1. 封装所有树数据操作（CRUD、合并、整合、关联等）
 * 2. 提供基于 schema 的字段访问器（accessors）
 * 3. 维护配置状态（config）和数据访问逻辑
 *
 * 核心概念：
 * - TreeContext：树操作的上下文，封装了配置（schema）和操作方法
 * - TreeAccessors：统一的数据访问接口，屏蔽字段名差异
 * - TreeNodeMeta：节点元信息，包含节点本身、父节点和深度
 *
 * 为什么需要 TreeContext？
 * SDK 需要支持不同的后端数据结构，每个项目的字段名可能不同：
 * - A 项目：{ nodeId, name, children }
 * - B 项目：{ id, label, subNodes }
 *
 * TreeContext 接收配置后，生成 Accessors，之后所有操作都通过 Accessors 完成，
 * 不再关心实际字段名是什么。
 *
 * 使用示例：
 * ```ts
 * // 1. 创建上下文（传入 schema）
 * const ctx = new TreeContext({
 *   fields: { id: 'nodeId', label: 'title', children: 'subNodes' }
 * });
 *
 * // 2. 执行操作
 * const newNode = ctx.addChildNode(treeData, {
 *   parentId: 'root',
 *   name: '新节点',
 *   level: 'dept_single',
 *   integrationType: 'base'
 * });
 *
 * // 3. 提交变更
 * graph.commit();
 * ```
 */

// ============================================================================
// 依赖导入
// ============================================================================
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
import { readSelectionId, readSelectionParentId } from './schema/selection';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 树节点元信息
 * ----------------------------------------------------------------------------
 * findNodeInTree 返回的结果，包含节点及其上下文信息。
 *
 * @example
 * const result = ctx.findNodeInTree(root, 'node123');
 * if (result) {
 *   console.log('节点:', result.node);
 *   console.log('父节点:', result.parent);
 *   console.log('深度:', result.depth);
 * }
 */
export interface TreeNodeMeta {
    /** 节点本身 */
    node: TreeData;
    /** 父节点，没有父节点时为 null（根节点） */
    parent: TreeData | null;
    /** 节点深度，根节点 depth = 0 */
    depth: number;
}

// ============================================================================
// TreeContext 类
// ============================================================================

/**
 * 树操作上下文
 * ----------------------------------------------------------------------------
 * 封装配置解析、数据访问和所有树操作方法。
 *
 * 设计原则：
 * 1. **配置驱动**：所有字段名由 schema 配置，不硬编码
 * 2. **单一数据源**：树操作直接修改传入的 root 对象（原地修改）
 * 3. **返回新引用**：返回新创建的节点，但不克隆整个树
 *
 * @example
 * // 基本用法
 * const ctx = new TreeContext(schema);
 * ctx.addChildNode(root, { parentId: 'x', name: 'A', level: 'domain', integrationType: 'base' });
 *
 * @example
 * // 合并节点
 * const result = ctx.mergeSiblingNodes(root, {
 *   name: '合并后的节点',
 *   integrationType: 'merge',
 *   sourceId: 'node1',
 *   targetId: 'node2'
 * });
 * if (result.ok) {
 *   console.log('合并成功', result.node);
 * } else {
 *   console.error('合并失败', result.message);
 * }
 *
 * @example
 * // 整合选中模块
 * const newModule = ctx.integrateSelectedModules(root, {
 *   selected: [{ id: 'm1', parentId: 'p1' }, { id: 'm2', parentId: 'p1' }],
 *   name: '整合模块',
 *   type: 'base'
 * });
 */
export class TreeContext {
    /**
     * 解析后的完整配置
     * @description 包含字段映射、默认值、样式等所有配置
     */
    readonly config: ResolvedTreeConfig;

    /**
     * 数据访问器
     * @description 提供统一的 get/set 方法读写树节点数据
     *
     * @example
     * const id = ctx.accessors.getId(node);       // 读取节点 ID
     * ctx.accessors.setLabel(node, '新名称');    // 设置节点名称
     * const children = ctx.accessors.getChildren(node);  // 获取子节点
     */
    readonly accessors: TreeAccessors;

    // =========================================================================
    // 构造函数
    // =========================================================================

    /**
     * 构造函数
     * ----------------------------------------------------------------------------
     * @param input - 配置输入（可选，不传则使用默认配置）
     *
     * @description
     * 解析配置并创建数据访问器。配置可以通过 defineTreeConfig() 定义，
     * 也可以直接传入部分配置。
     *
     * @example
     * // 使用默认配置
     * const ctx = new TreeContext();
     *
     * @example
     * // 使用自定义配置
     * const ctx = new TreeContext({
     *   rootId: 'root',
     *   fields: { id: 'nodeId', label: 'title' },
     *   defaults: { dept: '默认部门' }
     * });
     */
    constructor(input?: TreeConfigInput) {
        this.config = resolveTreeConfig(input);
        this.accessors = createTreeAccessors(this.config);
    }

    // =========================================================================
    // 根节点操作
    // =========================================================================

    /**
     * 获取根节点 ID
     * ----------------------------------------------------------------------------
     * @param root - 树根节点数据
     * @returns 根节点 ID 字符串
     *
     * @description
     * 优先级：config.rootId > root 节点的 id 字段
     */
    getRootId(root: TreeData): string {
        return resolveRootId(root, this.config);
    }

    /**
     * 获取受保护根节点 ID
     * ----------------------------------------------------------------------------
     * @param root - 树根节点数据（可选）
     * @returns 受保护根节点 ID
     *
     * @description
     * 受保护根节点不可删除。优先使用 config.protectedRootId，
     * 其次使用 rootId，最后 fallback 到空字符串。
     */
    getProtectedRootId(root?: TreeData): string {
        return resolveProtectedRootId(this.config, root);
    }

    /**
     * 获取整合方式显示名 （优先 schema.styles.integrationTypeNames）
     * ----------------------------------------------------------------------------
     * @param type - 整合类型 key
     * @returns 整合类型的显示名称
     *
     * @description
     * 优先从 schema.styles.integrationTypeNames 获取，
     * 未配置则返回空字符串。
     *
     * @example
     * ctx.integrationTypeName('merge');  // '合并'
     * ctx.integrationTypeName('base');   // '基础'
     */
    integrationTypeName(type: IntegrationTypeKey): string {
        return this.config.integrationTypeNames[type] ?? '';
    }

    // =========================================================================
    // 节点查找
    // =========================================================================

    /**
     * 在树中查找节点
     * ----------------------------------------------------------------------------
     * @param root - 树根节点
     * @param nodeId - 要查找的节点 ID
     * @param parent - 父节点引用（递归时自动传入）
     * @param depth - 当前深度（递归时自动计数）
     * @returns 节点元信息，未找到返回 null
     *
     * @description
     * 深度优先遍历树，找到指定 ID 的节点并返回其元信息。
     * **重要**：同时遍历 children 和 modules 数组。
     *
     * @example
     * const result = ctx.findNodeInTree(root, 'node123');
     * if (result) {
     *   console.log(result.node);      // 节点数据
     *   console.log(result.parent);    // 父节点
     *   console.log(result.depth);     // 深度
     * }
     */
    findNodeInTree(
        root: TreeData,
        nodeId: string,
        parent: TreeData | null = null,
        depth = 0
    ): TreeNodeMeta | null {
        const acc = this.accessors;

        // 检查根节点是否为目标节点
        if (acc.getId(root) === nodeId) {
            return { node: root, parent, depth };
        }

        // 遍历 children
        for (const child of acc.getChildren(root)) {
            const found = this.findNodeInTree(child, nodeId, root, depth + 1);
            if (found) return found;
        }

        // 遍历 modules（功能模块）
        // for (const module of acc.getModules(root)) {
        //     if (acc.getId(module) === nodeId) {
        //         return { node: module, parent: root, depth: depth + 1 };
        //     }
        // }

        return null;
    }

    /**
     * 收集所有后代节点
     * ----------------------------------------------------------------------------
     * @param root - 树根节点
     * @param excludeRootId - 要排除的根节点 ID（可选）
     * @returns 所有后代节点数组（不包含自身，除非未指定排除）
     *
     * @description
     * 深度优先遍历，返回所有子节点。
     * 常用于下拉列表、数据导出等场景。
     *
     * @example
     * // 获取所有节点（不含根节点）
     * const allNodes = ctx.collectDescendantApps(treeData, 'root');
     *
     * // 获取所有节点（含根节点）
     * const allNodes = ctx.collectDescendantApps(treeData);
     */
    collectDescendantApps(root: TreeData, excludeRootId?: string): TreeData[] {
        const acc = this.accessors;
        const apps: TreeData[] = [];
        const walk = (node: TreeData) => {
            const id = acc.getId(node);
            if (!excludeRootId || id !== excludeRootId) {
                apps.push(node);
            }
            acc.getChildren(node).forEach(walk);
        };
        walk(root);
        return apps;
    }

    // =========================================================================
    // 合并判断
    // =========================================================================

    /**
     * 判断节点是否是合并节点
     * ----------------------------------------------------------------------------
     * @param node - 节点数据
     * @param depth - 当前深度
     * @returns 是否是合并节点
     *
     * @description
     * 合并节点通过 integratedFrom 属性标记。
     * depth=0 时返回 true（根节点不参与判断）。
     *
     * @example
     * if (ctx.isMergedNode(node, depth)) {
     *   // 该节点是合并节点
     * }
     */
    isMergedNode(node: TreeData, depth = 0): boolean {
        if (depth === 0) return true;
        const from = this.accessors.getIntegratedFrom(node);
        return !!(from && from.length > 0);
    }

    /**
     * 判断是否可以进行同级合并
     * ----------------------------------------------------------------------------
     * @param meta - 节点元信息
     * @param meta.depth - 节点深度
     * @param meta.parent - 父节点
     * @returns 可以合并返回 true
     *
     * @description
     * 同级合并的规则：
     * 1. 节点深度必须大于 0（根节点不能合并）
     * 2. 父节点必须存在
     * 3. 父节点必须是合并节点（level 2 及以上才可合并）
     *
     * @example
     * const result = ctx.findNodeInTree(root, nodeId);
     * if (result && ctx.canSiblingMerge({ depth: result.depth, parent: result.parent })) {
     *   // 可以合并
     * }
     */
    canSiblingMerge(meta: { depth: number; parent: TreeData | null }): boolean {
        if (meta.depth <= 0) return false;
        if (!meta.parent) return false;
        return this.isMergedNode(meta.parent, meta.depth - 1);
    }

    /**
     * 判断节点是否可以被合并
     * ----------------------------------------------------------------------------
     * @param root - 树根节点
     * @param nodeId - 节点 ID
     * @returns 可以合并返回 true
     *
     * @description
     * 便捷方法：先查找节点，再判断是否可以合并。
     */
    canMergeNodesInTree(root: TreeData, nodeId: string): boolean {
        const meta = this.findNodeInTree(root, nodeId);
        if (!meta) return false;
        return this.canSiblingMerge({ depth: meta.depth, parent: meta.parent });
    }

    // =========================================================================
    // 节点操作
    // =========================================================================

    /**
     * 添加子节点
     * ----------------------------------------------------------------------------
     * @param root - 树根节点（会被原地修改）
     * @param input - 添加参数
     * @param input.parentId - 父节点 ID
     * @param input.name - 新节点名称
     * @param input.level - 层级类型
     * @param input.integrationType - 整合方式
     * @param input.dept - 所属部门（可选，默认使用配置默认值）
     * @returns 新创建的节点，父节点不存在返回 null
     *
     * @description
     * 在指定父节点下创建一个新子节点。
     * **重要**：直接修改 root 对象，不会克隆。
     *
     * @example
     * const newNode = ctx.addChildNode(root, {
     *   parentId: 'root',
     *   name: '新部门',
     *   level: 'dept_composite',
     *   integrationType: 'base'
     * });
     */
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

        // 查找父节点
        const parentResult = this.findNodeInTree(root, input.parentId);
        if (!parentResult) return null;

        // 构建新节点
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

        // 添加到父节点
        acc.ensureChildren(parentResult.node).push(node);
        return node;
    }

    /**
     * 添加功能模块
     * ----------------------------------------------------------------------------
     * @param root - 树根节点（会被原地修改）
     * @param input - 添加参数
     * @param input.parentId - 父节点 ID
     * @param input.name - 模块名称
     * @param input.dept - 所属部门（可选，默认继承父节点）
     * @returns 新创建的模块，父节点不存在返回 null
     *
     * @description
     * 在指定节点下创建一个新功能模块（modules 数组中的节点）。
     *
     * @example
     * const module = ctx.addModule(root, {
     *   parentId: 'dept1',
     *   name: '用户管理模块'
     * });
     */
    addModule(
        root: TreeData,
        input: { parentId: string; name: string; dept?: string }
    ): TreeData | null {
        const acc = this.accessors;
        const f = this.config.fields;

        // 查找父节点
        const parentResult = this.findNodeInTree(root, input.parentId);
        if (!parentResult) return null;

        // 构建新模块
        const mod = {
            [f.id]: acc.generateId('module'),
            [f.label]: input.name,
            [f.level]: this.config.defaults.moduleLevel,
            [f.dept]: input.dept || acc.getDept(parentResult.node),
            [f.owner]: this.config.defaults.owner
        } as TreeData;

        // 添加到父节点
        acc.ensureModules(parentResult.node).push(mod);
        return mod;
    }

    // =========================================================================
    // 合并操作
    // =========================================================================

    /**
     * 合并同级节点
     * ----------------------------------------------------------------------------
     * @param root - 树根节点（会被原地修改）
     * @param input - 合并参数
     * @param input.name - 合并后的新节点名称
     * @param input.integrationType - 整合方式
     * @param input.sourceId - 源节点 ID（会被删除）
     * @param input.targetId - 目标节点 ID（会被删除）
     * @returns 合并结果
     *
     * @description
     * 将两个同级节点合并为一个新节点：
     * 1. 创建新节点，包含两个节点的 children、modules、relations 合并
     * 2. 从父节点中移除源和目标节点
     * 3. 将新节点插入父节点
     * 4. 更新所有关系引用
     *
     * **重要**：
     * - 源和目标节点必须有相同的父节点
     * - 必须满足同级合并条件（父节点是合并节点）
     * - 层级类型取优先级较高的
     *
     * @example
     * const result = ctx.mergeSiblingNodes(root, {
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

        // 查找源和目标节点
        const sourceResult = this.findNodeInTree(root, input.sourceId);
        const targetResult = this.findNodeInTree(root, input.targetId);

        // 节点不存在
        if (!sourceResult || !targetResult) {
            return { ok: false, message: '合并失败：源/目标节点未找到' };
        }

        // 不满足同级合并条件
        if (!this.canMergeNodesInTree(root, input.sourceId)) {
            return { ok: false, message: '合并失败：需先完成上一层级节点合并后，当前层级才可合并' };
        }

        const sourceNode = sourceResult.node;
        const targetNode = targetResult.node;
        const sourceParent = sourceResult.parent;
        const targetParent = targetResult.parent;

        // 父节点不存在
        if (!sourceParent || !targetParent) {
            return { ok: false, message: '合并失败：源/目标节点没有父节点' };
        }

        // 源和目标不是同级节点
        if (acc.getId(sourceParent) !== acc.getId(targetParent)) {
            return { ok: false, message: '合并失败：源/目标不是同级节点' };
        }

        // 合并 children、modules、relations（按 ID 去重）
        const mergedChildren = this.mergeById(
            acc.getChildren(sourceNode),
            acc.getChildren(targetNode)
        );
        const mergedModules = this.mergeById(
            acc.getModules(sourceNode),
            acc.getModules(targetNode)
        );
        const mergedRelations = this.mergeById(
            acc.getRelations(sourceNode),
            acc.getRelations(targetNode),
            (r) => `${acc.getRelationTargetId(r)}__${acc.getRelationType(r)}`
        );

        // 取优先级较高的层级类型
        const lp = this.config.levelPriority;
        const sourceLevel = acc.getLevel(sourceNode);
        const targetLevel = acc.getLevel(targetNode);
        const mergedLevel =
            (lp[sourceLevel] ?? 0) >= (lp[targetLevel] ?? 0) ? sourceLevel : targetLevel;

        // 创建新节点
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

        // 从父节点中移除源和目标，插入新节点
        const sourceId = acc.getId(sourceNode);
        const targetId = acc.getId(targetNode);
        const newParentChildren: TreeData[] = [];
        for (const child of acc.getChildren(sourceParent)) {
            const cid = acc.getId(child);
            if (cid === sourceId) {
                // 源节点位置替换为新节点
                newParentChildren.push(newNode);
            } else if (cid === targetId) {
                // 目标节点跳过（被合并）
                continue;
            } else {
                newParentChildren.push(child);
            }
        }
        acc.setChildren(sourceParent, newParentChildren);

        // 更新所有关系引用
        this.updateRelationsInTree(root, [sourceId, targetId], newId, acc.getLabel(newNode));

        return { ok: true, node: newNode };
    }

    /**
     * 合并多个同级节点
     * ----------------------------------------------------------------------------
     * @param root - 树根节点
     * @param input - 合并参数
     * @param input.name - 新节点名称
     * @param input.integrationType - 整合类型
     * @param input.nodeIds - 要合并的节点 ID 列表（至少2个）
     * @returns 合并结果
     *
     * @description
     * 将多个同级节点合并为一个新节点，保留所有子节点、模块和关系。
     * 适用于多选后点击"整合选中节点"的场景。
     *
     * @example
     * const result = ctx.mergeMultipleNodes(root, {
     *   name: '综合管理平台',
     *   integrationType: 'merge',
     *   nodeIds: ['node1', 'node2', 'node3']
     * });
     */
    mergeMultipleNodes(
        root: TreeData,
        input: {
            name: string;
            integrationType: IntegrationTypeKey;
            nodeIds: string[];
        }
    ): { ok: boolean; message?: string; node?: TreeData } {
        const acc = this.accessors;
        const f = this.config.fields;

        // 至少需要2个节点
        if (input.nodeIds.length < 2) {
            return { ok: false, message: '合并失败：至少选择2个节点' };
        }

        // 查找所有要合并的节点
        const nodeResults = input.nodeIds.map(id => this.findNodeInTree(root, id));
        
        // 检查是否所有节点都存在
        const missingIds = input.nodeIds.filter((id, index) => !nodeResults[index]);
        if (missingIds.length > 0) {
            return { ok: false, message: `合并失败：节点 ${missingIds.join(', ')} 未找到` };
        }

        // 检查是否所有节点都满足合并条件
        for (const id of input.nodeIds) {
            if (!this.canMergeNodesInTree(root, id)) {
                return { ok: false, message: '合并失败：需先完成上一层级节点合并后，当前层级才可合并' };
            }
        }

        // 获取节点对象和父节点
        const nodes = nodeResults.map(r => r!.node);
        const parents = nodeResults.map(r => r!.parent);

        // 检查所有节点是否有父节点
        if (parents.some(p => !p)) {
            return { ok: false, message: '合并失败：部分节点没有父节点' };
        }

        // 检查是否所有节点都是同级（有相同的父节点）
        const parentId = acc.getId(parents[0]!);
        if (!parents.every(p => acc.getId(p!) === parentId)) {
            return { ok: false, message: '合并失败：选中的节点不是同级节点' };
        }

        const parentNode = parents[0]!;

        // 合并所有节点的 children、modules、relations（按 ID 去重）
        let mergedChildren: TreeData[] = [];
        let mergedModules: Record<string, unknown>[] = [];
        let mergedRelations: Record<string, unknown>[] = [];

        for (const node of nodes) {
            mergedChildren = this.mergeById(mergedChildren, acc.getChildren(node));
            mergedModules = this.mergeById(mergedModules, acc.getModules(node));
            mergedRelations = this.mergeById(
                mergedRelations, 
                acc.getRelations(node),
                (r) => `${acc.getRelationTargetId(r)}__${acc.getRelationType(r)}`
            );
        }

        // 取优先级最高的层级类型
        const lp = this.config.levelPriority;
        const levels = nodes.map(n => acc.getLevel(n));
        let mergedLevel = levels[0];
        for (const level of levels.slice(1)) {
            if ((lp[level] ?? 0) > (lp[mergedLevel] ?? 0)) {
                mergedLevel = level;
            }
        }

        // 获取部门和负责人（取第一个非空值）
        const dept = nodes.find(n => acc.getDept(n))?.[f.dept] || '';
        const owner = nodes.find(n => acc.getOwner(n))?.[f.owner] || '';

        // 创建新节点
        const newId = acc.generateId('merge');
        const newNode = {
            [f.id]: newId,
            [f.label]: input.name,
            [f.level]: mergedLevel,
            [f.dept]: dept,
            [f.owner]: owner,
            [f.integrationType]: input.integrationType,
            [f.integrationTypeName]: this.integrationTypeName(input.integrationType),
            [f.children]: mergedChildren,
            [f.modules]: mergedModules,
            [f.relations]: mergedRelations,
            [f.integratedFrom]: input.nodeIds
        } as TreeData;

        // 从父节点中移除被合并的节点，插入新节点
        const nodeIdSet = new Set(input.nodeIds);
        let inserted = false;
        const newParentChildren: TreeData[] = [];
        
        for (const child of acc.getChildren(parentNode)) {
            const cid = acc.getId(child);
            if (nodeIdSet.has(cid)) {
                if (!inserted) {
                    // 在第一个被合并节点的位置插入新节点
                    newParentChildren.push(newNode);
                    inserted = true;
                }
                // 后续被合并节点跳过
            } else {
                newParentChildren.push(child);
            }
        }
        acc.setChildren(parentNode, newParentChildren);

        // 更新所有关系引用
        this.updateRelationsInTree(root, input.nodeIds, newId, acc.getLabel(newNode));

        return { ok: true, node: newNode };
    }

    // =========================================================================
    // 编辑操作
    // =========================================================================

    /**
     * 编辑节点
     * ----------------------------------------------------------------------------
     * @param root - 树根节点
     * @param input - 编辑参数
     * @param input.nodeId - 节点 ID
     * @param input.name - 新名称
     * @param input.dept - 新部门
     * @param input.level - 新层级（可选）
     * @param input.owner - 新负责人
     * @returns 编辑后的节点，不存在返回 null
     *
     * @description
     * 修改节点的基本属性。
     *
     * @example
     * ctx.editNode(root, {
     *   nodeId: 'node123',
     *   name: '新名称',
     *   dept: '新部门',
     *   level: 'dept_composite',
     *   owner: '张三'
     * });
     */
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

        // 更新属性
        acc.setLabel(result.node, input.name);
        acc.setDept(result.node, input.dept);
        if (input.level) acc.setLevel(result.node, input.level);
        acc.setOwner(result.node, input.owner);

        return result.node;
    }

    // =========================================================================
    // 关联关系操作
    // =========================================================================

    /**
     * 绑定关联关系
     * ----------------------------------------------------------------------------
     * @param root - 树根节点
     * @param input - 关联参数
     * @param input.sourceId - 源节点 ID
     * @param input.targetId - 目标节点 ID
     * @param input.type - 关联类型
     * @param input.name - 关联名称
     * @returns 绑定成功返回 true
     *
     * @description
     * 在源节点上添加一条指向目标节点的关联关系。
     *
     * @example
     * ctx.bindRelation(root, {
     *   sourceId: 'node1',
     *   targetId: 'node2',
     *   type: 'interface',
     *   name: '数据同步'
     * });
     */
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

        // 查找源和目标节点
        const source = this.findNodeInTree(root, input.sourceId);
        const target = this.findNodeInTree(root, input.targetId);
        if (!source || !target) return false;

        // 创建关联对象
        const relation: Record<string, unknown> = {
            [f.relationTargetId]: acc.getId(target.node),
            [f.relationTargetName]: acc.getLabel(target.node),
            [f.relationType]: input.type,
            [f.relationName]: input.name
        };

        // 添加到源节点
        acc.ensureRelations(source.node).push(relation);
        return true;
    }

    /**
     * 设置节点整合方式
     * ----------------------------------------------------------------------------
     * @param root - 树根节点
     * @param nodeId - 节点 ID
     * @param type - 整合类型
     * @returns 设置成功返回 true
     *
     * @example
     * ctx.setNodeIntegration(root, 'node123', 'interface');
     */
    setNodeIntegration(root: TreeData, nodeId: string, type: IntegrationTypeKey): boolean {
        const result = this.findNodeInTree(root, nodeId);
        if (!result) return false;
        this.accessors.setIntegrationType(result.node, type, this.integrationTypeName(type));
        return true;
    }

    /**
     * 移除节点的所有关系引用
     * ----------------------------------------------------------------------------
     * @param node - 起始节点
     * @param deletedId - 被删除的节点 ID
     *
     * @description
     * 递归遍历子树，删除所有指向 deletedId 的关系。
     * 用于删除节点时清理引用。
     *
     * @example
     * // 删除节点后清理引用
     * ctx.removeRelationsToNode(treeData, 'deletedNodeId');
     */
    removeRelationsToNode(node: TreeData, deletedId: string): void {
        const acc = this.accessors;
        const f = this.config.fields;

        // 过滤当前节点的关系
        const relations = acc.getRelations(node);
        if (relations.length) {
            node[f.relations] = relations.filter((r) => acc.getRelationTargetId(r) !== deletedId);
        }

        // 递归处理子节点
        acc.getChildren(node).forEach((child) => this.removeRelationsToNode(child, deletedId));
    }

    // =========================================================================
    // 删除操作
    // =========================================================================

    /**
     * 从树中删除节点
     * ----------------------------------------------------------------------------
     * @param root - 树根节点（会被原地修改）
     * @param nodeId - 要删除的节点 ID
     * @param protectedRootId - 受保护根节点 ID（可选，优先使用 config）
     * @returns 删除成功返回 true
     *
     * @description
     * 从父节点中移除指定节点及其所有后代。
     * 同时清理所有指向被删除节点的关系引用。
     *
     * **注意**：不会删除根节点（受保护节点）。
     *
     * @example
     * const success = ctx.deleteNodeFromTree(root, 'node123');
     * if (success) {
     *   console.log('删除成功');
     * }
     */
    deleteNodeFromTree(root: TreeData, nodeId: string, protectedRootId?: string): boolean {
        // 检查受保护节点
        const protectedId = protectedRootId ?? this.getProtectedRootId(root);
        if (protectedId && nodeId === protectedId) return false;

        const acc = this.accessors;
        const result = this.findNodeInTree(root, nodeId);

        // 节点不存在或没有父节点（根节点）
        if (!result?.parent) return false;

        // 从父节点中移除
        const parentChildren = acc
            .getChildren(result.parent)
            .filter((c) => acc.getId(c) !== nodeId);
        acc.setChildren(result.parent, parentChildren);

        // 清理关系引用
        this.removeRelationsToNode(root, nodeId);

        return true;
    }

    // =========================================================================
    // 整合操作
    // =========================================================================

    /**
     * 整合选中的模块
     * ----------------------------------------------------------------------------
     * @param root - 树根节点（会被原地修改）
     * @param input - 整合参数
     * @param input.selected - 选中的节点列表（需包含 id 和 parentId）
     * @param input.name - 整合后的模块名称
     * @param input.dept - 所属部门（可选）
     * @param input.type - 整合类型
     * @returns 新创建的整合模块，失败返回 null
     *
     * @description
     * 将多个选中模块整合为一个新模块：
     * 1. 找到选中节点的共同父节点（如果只有一个父节点则使用该父节点，否则使用根节点）
     * 2. 在父节点下创建新的整合模块
     * 3. 从各自父节点中移除被整合的模块
     *
     * **重要**：
     * - selected 中的节点必须都能在树中找到
     * - 整合后的模块添加到选中节点的共同父节点下
     * - 被整合的模块从原位置移除
     *
     * @example
     * const result = ctx.integrateSelectedModules(root, {
     *   selected: [
     *     { id: 'm1', parentId: 'p1' },
     *     { id: 'm2', parentId: 'p1' },
     *     { id: 'm3', parentId: 'p2' }
     *   ],
     *   name: '综合管理模块',
     *   type: 'base'
     * });
     * if (result) {
     *   console.log('整合成功', result);
     * }
     */
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

        // 收集所有选中的父节点 ID
        const parentIds = [...new Set(input.selected.map((n) => readSelectionParentId(this, n)))];

        // 只有一个父节点则使用该父节点，否则使用根节点
        const parentId = parentIds.length === 1 ? parentIds[0] : this.getRootId(root);

        // 查找父节点
        const parentResult = this.findNodeInTree(root, parentId);
        if (!parentResult) return null;

        // 创建新模块
        const newModule = {
            [f.id]: acc.generateId('integrated'),
            [f.label]: input.name,
            [f.level]: this.config.defaults.moduleLevel,
            [f.dept]: input.dept || acc.getDept(parentResult.node),
            [f.owner]: this.config.defaults.owner,
            [f.integrationType]: input.type,
            [f.integrationTypeName]: this.integrationTypeName(input.type)
        } as TreeData;

        // 添加到父节点
        acc.ensureModules(parentResult.node).push(newModule);

        // 从各自父节点中移除被整合的模块
        input.selected.forEach((raw) => {
            // 找到模块的父节点
            const ownerResult = this.findNodeInTree(root, readSelectionParentId(this, raw));
            if (!ownerResult) return;

            // 从 modules 数组中移除
            const sid = readSelectionId(this, raw);
            const filtered = acc.getModules(ownerResult.node).filter((m) => acc.getId(m) !== sid);
            acc.setModules(ownerResult.node, filtered);
        });

        return newModule;
    }

    // =========================================================================
    // 私有辅助方法
    // =========================================================================

    /**
     * 按 ID 合并数组（去重）
     * ----------------------------------------------------------------------------
     * @param source - 源数组
     * @param target - 目标数组
     * @param getKeyFn - 获取合并键的函数
     * @returns 合并后的数组
     *
     * @description
     * 使用 Map 按 key 去重合并两个数组。
     * 默认使用 id 作为 key，也可以自定义（如 relations 用 targetId__type 作为 key）。
     */
    private mergeById<T extends TreeData | Record<string, unknown>>(
        source: T[] = [],
        target: T[] = [],
        getKeyFn: (item: T) => string = (item) => this.accessors.getId(item as TreeData)
    ): T[] {
        const map = new Map<string, T>();
        (source ?? []).forEach((item) => map.set(getKeyFn(item), cloneDeep(item)));
        (target ?? []).forEach((item) => map.set(getKeyFn(item), cloneDeep(item)));
        return Array.from(map.values());
    }

    /**
     * 更新树中的关系引用
     * ----------------------------------------------------------------------------
     * @param node - 当前节点
     * @param oldIds - 被替换的旧 ID 列表
     * @param newId - 新 ID
     * @param newLabel - 新名称
     *
     * @description
     * 递归遍历子树，将所有指向 oldIds 中任意 ID 的关系，
     * 更新为指向 newId，并使用新名称。
     */
    private updateRelationsInTree(
        node: TreeData,
        oldIds: string[],
        newId: string,
        newLabel: string
    ): void {
        const acc = this.accessors;

        // 更新当前节点的关系
        acc.getRelations(node).forEach((relation) => {
            if (oldIds.includes(acc.getRelationTargetId(relation))) {
                acc.setRelationTargetId(relation, newId);
                acc.setRelationTargetName(relation, newLabel);
            }
        });

        // 递归处理子节点
        acc.getChildren(node).forEach((child) =>
            this.updateRelationsInTree(child, oldIds, newId, newLabel)
        );
    }
}

// ============================================================================
// 默认上下文实例 （默认配置上下文（与历史 tree-operations 行为一致））
// ----------------------------------------------------------------------------
// 使用默认配置创建的上下文，用于 tree-operations.ts 中的纯函数。
// 如果需要自定义配置，请使用 new TreeContext(config) 创建新实例。
// ============================================================================

/**
 * 默认配置的树上下文实例
 * ----------------------------------------------------------------------------
 * @description
 * 用于 tree-operations.ts 中的纯函数，避免每次调用都创建新实例。
 * 这些纯函数接受可选的 ctx 参数，不传则使用默认上下文。
 *
 * @example
 * // 不传 ctx，使用默认配置
 * const node = addChildNode(root, { parentId: 'root', name: 'A', level: 'domain', integrationType: 'base' });
 *
 * // 传 ctx，使用自定义配置
 * const ctx = new TreeContext({ fields: { id: 'nodeId' } });
 * const node = addChildNode(root, { parentId: 'root', name: 'A', level: 'domain', integrationType: 'base' }, ctx);
 */
export const defaultTreeContext = new TreeContext();
