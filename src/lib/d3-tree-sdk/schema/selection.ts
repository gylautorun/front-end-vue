/**
 * selection.ts - 选中节点数据处理
 * =============================================================================
 * 本文件负责：
 * 1. 从任意选中项对象中读取 id/label/parentId
 * 2. 在树节点与 SelectedNode 之间转换
 * 3. 对接外部 API 时的字段映射
 *
 * 核心概念：
 * - SelectedNode：页面选中节点的标准格式 { id, label, parentId }
 * - SelectionFieldSchema：外部选中项字段映射，如 { parentId: 'pid' }
 * - normalizeSelectedItem：将外部数据转换为 SelectedNode
 *
 * 为什么需要 Selection Schema？
 * 不同后端/页面的选中项数据结构可能不同：
 * - 后端返回：{ nodeId: 'xxx', name: 'xxx', pid: 'xxx' }
 * - 前端选中项：{ id: 'xxx', label: 'xxx', parentId: 'xxx' }
 *
 * 通过 selection.ts，可以灵活映射任意字段结构。
 */

// ============================================================================
// 依赖导入
// ============================================================================
import type { TreeContext } from '../TreeContext';
import type { TreeNodeData } from './TreeAccessors';
import type { SelectedNode } from '../types';

// ============================================================================
// 选中项读取函数 （从任意选中项对象读取 id（支持 pid / parentId 等配置））
// ----------------------------------------------------------------------------
// 从任意 Record<string, unknown> 对象中读取指定字段
// 字段名由 config.selection.* 配置决定
// ============================================================================

/**
 * 从选中项对象读取节点 ID
 * ----------------------------------------------------------------------------
 * @param ctx - TreeContext 实例，包含配置信息
 * @param item - 选中项对象（如用户点击选中的节点数据）
 * @returns 节点 ID 字符串
 *
 * @example
 * // 配置: selection: { id: 'nodeId' }
 * // 选中项: { nodeId: 'app1', label: '教育平台' }
 * const id = readSelectionId(ctx, item);  // 'app1'
 */
export function readSelectionId(ctx: TreeContext, item: Record<string, unknown>): string {
    return String(item[ctx.config.selection.id] ?? '');
}

/**
 * 从选中项对象读取节点名称
 * ----------------------------------------------------------------------------
 * @param ctx - TreeContext 实例
 * @param item - 选中项对象
 * @returns 节点名称字符串
 *
 * @example
 * // 配置: selection: { label: 'name' }
 * // 选中项: { id: 'app1', name: '教育平台' }
 * const label = readSelectionLabel(ctx, item);  // '教育平台'
 */
export function readSelectionLabel(ctx: TreeContext, item: Record<string, unknown>): string {
    return String(item[ctx.config.selection.label] ?? '');
}

/**
 * 从选中项对象读取父节点 ID
 * ----------------------------------------------------------------------------
 * @param ctx - TreeContext 实例
 * @param item - 选中项对象
 * @returns 父节点 ID 字符串
 *
 * @example
 * // 配置: selection: { parentId: 'pid' }
 * // 选中项: { id: 'app1', parentId: 'edu' }
 * const parentId = readSelectionParentId(ctx, item);  // 'edu'
 *
 * @description
 * 这个函数非常重要！整合选中模块时，需要知道被选中节点的父节点是谁，
 * 才能确定新模块应该挂载到哪个父节点下面。
 */
export function readSelectionParentId(ctx: TreeContext, item: Record<string, unknown>): string {
    return String(item[ctx.config.selection.parentId] ?? '');
}

// ============================================================================
// 树节点 ↔ SelectedNode 转换
// ============================================================================

/**
 * 将树节点转换为 页面SelectedNode（逻辑字段 id/label/parentId）
 * ----------------------------------------------------------------------------
 * @param ctx - TreeContext 实例
 * @param node - 树节点数据
 * @param parentNodeId - 父节点 ID（需要外部传入，因为 TreeNodeData 中没有父节点引用）
 * @returns 标准选中节点对象
 *
 * @example
 * // 树节点: { id: 'app1', label: '教育平台', children: [...] }
 * // 父节点 ID: 'edu'
 * const selected = toSelectedNode(ctx, node, 'edu');
 * // 结果: { id: 'app1', label: '教育平台', parentId: 'edu' }
 *
 * @description
 * TreeNodeData 本身只包含子节点引用，不包含父节点引用。
 * 所以从树节点转换时，需要外部传入父节点 ID（如通过 findNodeInTree 获取）。
 */
export function toSelectedNode(
    ctx: TreeContext,
    node: TreeNodeData,
    parentNodeId: string
): SelectedNode {
    return {
        id: ctx.accessors.getId(node),
        label: ctx.accessors.getLabel(node),
        parentId: parentNodeId
    };
}

/**
 * 将 SelectedNode 转换为外部格式 （SelectedNode → 按 selection 配置命名的 plain 对象（对接外部 API））
 * ----------------------------------------------------------------------------
 * @param ctx - TreeContext 实例
 * @param item - 标准选中节点对象
 * @returns 按 selection 配置映射的普通对象（用于对接外部 API）
 *
 * @example
 * // 配置: selection: { id: 'nodeId', label: 'name', parentId: 'pid' }
 * // SelectedNode: { id: 'app1', label: '教育平台', parentId: 'edu' }
 * const apiData = fromSelectedNode(ctx, item);
 * // 结果: { nodeId: 'app1', name: '教育平台', pid: 'edu' }
 *
 * @description
 * 用于将页面标准格式转换为后端期望的格式，便于提交到服务器。
 */
export function fromSelectedNode(ctx: TreeContext, item: SelectedNode): Record<string, string> {
    const s = ctx.config.selection;
    return {
        [s.id]: item.id,
        [s.label]: item.label,
        [s.parentId]: item.parentId
    };
}

/**
 * 标准化外部选中项为 SelectedNode
 * ----------------------------------------------------------------------------
 * @param ctx - TreeContext 实例
 * @param raw - 外部原始选中项数据
 * @returns 标准格式的 SelectedNode
 *
 * @example
 * // 配置: selection: { id: 'nodeId', label: 'name', parentId: 'pid' }
 * // 外部数据: { nodeId: 'app1', name: '教育平台', pid: 'edu' }
 * const selected = normalizeSelectedItem(ctx, raw);
 * // 结果: { id: 'app1', label: '教育平台', parentId: 'edu' }
 *
 * @description
 * 用于将后端返回的选中项数据（或外部组件传递的选中项）转换为页面标准格式。
 * 支持任意字段结构，只需配置 selection 映射即可。
 *
 * @example
 * // 场景1：后端返回的选中项列表
 * const apiResponse = [{ nodeId: '1', name: 'A' }, { nodeId: '2', name: 'B' }];
 * const selectedNodes = apiResponse.map(raw => normalizeSelectedItem(ctx, raw));
 *
 * // 场景2：第三方组件选中的节点
 * const thirdPartyData = { key: 'app1', title: '教育平台', parent: 'edu' };
 * const config = resolveTreeConfig({ selection: { id: 'key', label: 'title', parentId: 'parent' } });
 * const ctx = new TreeContext(config);
 * const selected = normalizeSelectedItem(ctx, thirdPartyData);
 */
export function normalizeSelectedItem(
    ctx: TreeContext,
    raw: Record<string, unknown>
): SelectedNode {
    return {
        id: readSelectionId(ctx, raw),
        label: readSelectionLabel(ctx, raw),
        parentId: readSelectionParentId(ctx, raw)
    };
}
