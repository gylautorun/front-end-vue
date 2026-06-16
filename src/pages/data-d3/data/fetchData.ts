/**
 * 模拟数据请求工具
 * ----------------------------------------------------------------------------
 * 用于模拟从后端获取子节点数据的异步请求。
 * 包含随机延迟和模拟数据生成逻辑。
 */

import type { TreeData } from '../../../lib/d3-tree-sdk/types';
import { IntegrationTypeKey, LevelKey } from '../../../lib/d3-tree-sdk/types';

/**
 * 模拟异步请求子节点数据
 * @param parentId - 父节点 ID
 * @returns Promise<TreeData[]> - 子节点数据数组
 * @description
 * 模拟从后端获取子节点数据的过程，包含随机延迟（500-1000ms）。
 * 返回的子节点数据包含模拟的业务信息。
 */
export function fetchChildrenData(parentId: string): Promise<TreeData[]> {
    return new Promise((resolve) => {
        // 模拟网络延迟
        const delay = Math.random() * 500 + 500;
        setTimeout(() => {
            // 模拟生成子节点数据
            const mockChildren: TreeData[] = [
                {
                    id: `${parentId}-child-1`,
                    label: `子节点 A-${Math.floor(Math.random() * 100)}`,
                    level: LevelKey.OfficeSingle,
                    dept: '信息中心',
                    owner: '测试用户',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: '',
                    modules: [
                        {
                            id: `${parentId}-child-1-m1`,
                            label: '模块1',
                            level: LevelKey.Module,
                            dept: '信息中心',
                            owner: '测试用户'
                        },
                        {
                            id: `${parentId}-child-1-m2`,
                            label: '模块2',
                            level: LevelKey.Module,
                            dept: '信息中心',
                            owner: '测试用户'
                        }
                    ],
                    children: []
                },
                {
                    id: `${parentId}-child-2`,
                    label: `子节点 B-${Math.floor(Math.random() * 100)}`,
                    level: LevelKey.OfficeSingle,
                    dept: '教育局',
                    owner: '测试用户',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: '',
                    modules: [
                        {
                            id: `${parentId}-child-2-m1`,
                            label: '模块A',
                            level: LevelKey.Module,
                            dept: '教育局',
                            owner: '测试用户'
                        }
                    ],
                    children: []
                }
            ];
            resolve(mockChildren);
        }, delay);
    });
}
