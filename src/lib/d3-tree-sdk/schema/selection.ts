import type { TreeContext } from '../TreeContext';
import type { TreeNodeData } from './TreeAccessors';
import type { SelectedNode } from '../types';

/** 从任意选中项对象读取 id（支持 pid / parentId 等配置） */
export function readSelectionId(ctx: TreeContext, item: Record<string, unknown>): string {
    return String(item[ctx.config.selection.id] ?? '');
}

export function readSelectionLabel(ctx: TreeContext, item: Record<string, unknown>): string {
    return String(item[ctx.config.selection.label] ?? '');
}

export function readSelectionParentId(ctx: TreeContext, item: Record<string, unknown>): string {
    return String(item[ctx.config.selection.parentId] ?? '');
}

/** 树节点 → 页面 SelectedNode（逻辑字段 id/label/parentId） */
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

/** SelectedNode → 按 selection 配置命名的 plain 对象（对接外部 API） */
export function fromSelectedNode(ctx: TreeContext, item: SelectedNode): Record<string, string> {
    const s = ctx.config.selection;
    return {
        [s.id]: item.id,
        [s.label]: item.label,
        [s.parentId]: item.parentId
    };
}

/** 外部 API 选中项 → SelectedNode */
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
