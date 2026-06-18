import type { TreeData } from '../types/index';

/**
 * 树数据变化日志工具
 * 统一记录树结构和数据的变化，方便调试
 */
export class TreeLogger {
    private static enabled = true;
    private static logCount = 0;

    /**
     * 设置是否启用日志
     */
    static setEnabled(enabled: boolean) {
        this.enabled = enabled;
    }

    /**
     * 记录树数据变化
     * @param action 操作名称
     * @param treeData 当前树数据
     * @param details 额外详情信息
     */
    static log(action: string, treeData: TreeData, details?: Record<string, unknown>) {
        if (!this.enabled) return;

        this.logCount++;
        const timestamp = new Date().toLocaleTimeString();

        console.group(`🌲 [${this.logCount}] ${action} - ${timestamp}`);

        // 打印树结构摘要
        const summary = this.getTreeSummary(treeData);
        console.log('📊 树结构摘要:', summary);

        // 打印节点详情
        const nodeDetails = this.getNodeDetails(treeData);
        console.log('📋 节点详情:', nodeDetails);

        // 打印额外详情
        if (details) {
            console.log('📌 操作详情:', details);
        }

        // 打印完整数据（可展开查看）
        console.log('🔍 完整树数据:', JSON.parse(JSON.stringify(treeData)));

        console.groupEnd();
    }

    /**
     * 记录操作开始
     */
    static logStart(action: string, details?: Record<string, unknown>) {
        if (!this.enabled) return;
        this.logCount++;
        const timestamp = new Date().toLocaleTimeString();
        console.group(`🚀 [${this.logCount}] ${action} 开始 - ${timestamp}`);
        if (details) {
            console.log('📌 操作详情:', details);
        }
        console.groupEnd();
    }

    /**
     * 记录操作结果
     */
    static logResult(action: string, success: boolean, message?: string) {
        if (!this.enabled) return;
        const icon = success ? '✅' : '❌';
        const status = success ? '成功' : '失败';
        console.log(`${icon} ${action} ${status}${message ? ': ' + message : ''}`);
    }

    /**
     * 获取树结构摘要
     */
    private static getTreeSummary(treeData: TreeData): Record<string, unknown> {
        const summary: Record<string, unknown> = {
            根节点: treeData.label,
            层级: treeData.level,
            总节点数: 0,
            各层级节点数: {} as Record<string, number>
        };

        const countNodes = (node: TreeData, depth = 0) => {
            summary['总节点数'] = (summary['总节点数'] as number) + 1;
            const levelKey = node.level || `level_${depth}`;
            const levelCount = (summary['各层级节点数'] as Record<string, number>)[levelKey] || 0;
            (summary['各层级节点数'] as Record<string, number>)[levelKey] = levelCount + 1;

            if (node.children) {
                node.children.forEach((child) => countNodes(child, depth + 1));
            }
        };

        countNodes(treeData);
        return summary;
    }

    /**
     * 获取节点详情列表
     */
    private static getNodeDetails(treeData: TreeData): Array<Record<string, unknown>> {
        const details: Array<Record<string, unknown>> = [];

        const traverse = (node: TreeData, depth = 0, parentId?: string) => {
            const nodeInfo: Record<string, unknown> = {
                // ...node,
                id: node.id,
                label: node.label,
                level: node.level,
                depth: depth,
                parentId: parentId,
                isLeaf: node.isLeaf,
                hasChildren: !!(node.children && node.children.length > 0),
                childrenCount: node.children?.length || 0
            };

            if (node.integrationType) {
                nodeInfo.integrationType = node.integrationType;
            }
            if (node.integratedFrom) {
                nodeInfo.integratedFrom = node.integratedFrom;
            }
            if (node.relations) {
                nodeInfo.relationsCount = node.relations.length;
            }

            details.push(nodeInfo);

            if (node.children) {
                node.children.forEach((child) => traverse(child, depth + 1, node.id));
            }
        };

        traverse(treeData);
        return details;
    }

    /**
     * 打印当前拖拽状态
     */
    static logDragState(state: {
        nodeId: string;
        nodeLabel: string;
        sourceX?: number;
        sourceY?: number;
        targetNodeId?: string;
        targetNodeLabel?: string;
    }) {
        if (!this.enabled) return;
        console.log('🎯 拖拽状态:', state);
    }
}

/**
 * 简化的日志函数（用于快速调用）
 */
export function logTreeChange(
    action: string,
    treeData: TreeData,
    details?: Record<string, unknown>
) {
    TreeLogger.log(action, treeData, details);
}

/**
 * 打印拖拽状态
 */
export function logDragState(state: {
    nodeId: string;
    nodeLabel: string;
    sourceX?: number;
    sourceY?: number;
    targetNodeId?: string;
    targetNodeLabel?: string;
}) {
    TreeLogger.logDragState(state);
}
