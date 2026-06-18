/**
 * 模拟数据请求工具
 * ----------------------------------------------------------------------------
 * 用于模拟从后端获取子节点数据的异步请求。
 * 结合 Mock.js 生成器生成专业的模拟数据。
 *
 * 核心功能：
 *   - 模拟网络延迟（500-1500ms）
 *   - 使用 Mock.js 生成随机但真实的数据
 *   - 支持异步加载场景（isLeaf: false, children: []）
 *   - 自动生成功能模块和子节点
 */

import type { TreeData } from '../../../lib/d3-tree-sdk/types';
import { IntegrationTypeKey, LevelKey } from '../../../lib/d3-tree-sdk/types';
import Mock from 'mockjs';
import { generateOwner, generateDept } from './mockGenerator';

const Random = Mock.Random;

/**
 * 生成模拟子节点数据
 * @param parentId - 父节点 ID
 * @param count - 子节点数量
 * @returns TreeData[] - 子节点数据数组
 */
function generateMockChildren(parentId: string, count: number = 2): TreeData[] {
    const children: TreeData[] = [];

    for (let i = 0; i < count; i++) {
        const hasChildren = Random.boolean(3, 7, false); // 30% 概率有子节点
        const moduleCount = Random.integer(1, 3);

        children.push({
            id: `async-${parentId}-child-${i + 1}`,
            label: `异步子节点-${Random.pick(['子系统', '子模块', '子应用', '子服务'])}${i + 1}-${Random.integer(10, 99)}`,
            level: LevelKey.OfficeSingle,
            dept: generateDept(),
            owner: generateOwner(),
            isLeaf: !hasChildren,
            integrationType: IntegrationTypeKey.base,
            integrationTypeName: '',
            modules: Array.from({ length: moduleCount }, (_, j) => ({
                id: `${parentId}-child-${i + 1}-m${j + 1}`,
                label: `${Random.pick(['功能', '模块', '组件', '服务'])}${j + 1}`,
                level: LevelKey.Module,
                dept: generateDept(),
                owner: generateOwner(),
                isLeaf: true
            })),
            children: hasChildren
                ? generateMockChildren(`${parentId}-child-${i + 1}`, Random.integer(1, 2))
                : []
        });
    }

    return children;
}

/**
 * 模拟异步请求子节点数据
 * @param parentId - 父节点 ID
 * @returns Promise<TreeData[]> - 子节点数据数组
 * @description
 * 模拟从后端获取子节点数据的过程，包含随机延迟（500-1500ms）。
 * 使用 Mock.js 生成专业的模拟数据，支持多层级递归生成。
 */
export function fetchChildrenData(parentId: string): Promise<TreeData[]> {
    return new Promise((resolve) => {
        // 模拟网络延迟（500-1500ms）
        const delay = Random.integer(500, 1500);

        setTimeout(() => {
            // 使用 Mock.js 生成子节点数据
            const childCount = Random.integer(2, 4);
            const mockChildren = generateMockChildren(parentId, childCount);

            resolve(mockChildren);
        }, delay);
    });
}

/**
 * 模拟获取节点详情数据
 * @param nodeId - 节点 ID
 * @returns Promise<TreeData> - 节点详情数据
 */
export function fetchNodeDetail(nodeId: string): Promise<TreeData> {
    return new Promise((resolve) => {
        const delay = Random.integer(300, 800);

        setTimeout(() => {
            resolve({
                id: nodeId,
                label: `${Random.pick(['系统', '平台', '服务', '应用'])}详情`,
                level: LevelKey.OfficeSingle,
                dept: generateDept(),
                owner: generateOwner(),
                isLeaf: true,
                integrationType: Random.pick([
                    IntegrationTypeKey.base,
                    IntegrationTypeKey.merge,
                    IntegrationTypeKey.migrate,
                    IntegrationTypeKey.integration
                ]),
                integrationTypeName: '',
                modules: Array.from({ length: Random.integer(2, 5) }, (_, i) => ({
                    id: `${nodeId}-m${i + 1}`,
                    label: `功能模块${i + 1}`,
                    level: LevelKey.Module,
                    dept: generateDept(),
                    owner: generateOwner(),
                    isLeaf: true
                })),
                children: []
            });
        }, delay);
    });
}

/**
 * 模拟批量获取节点数据
 * @param nodeIds - 节点 ID 数组
 * @returns Promise<TreeData[]> - 节点数据数组
 */
export function fetchNodesBatch(nodeIds: string[]): Promise<TreeData[]> {
    return new Promise((resolve) => {
        const delay = Random.integer(400, 1200);

        setTimeout(() => {
            const nodes = nodeIds.map((id, index) => ({
                id,
                label: `批量节点${index + 1}-${Random.integer(100, 999)}`,
                level: LevelKey.DeptSingle,
                dept: generateDept(),
                owner: generateOwner(),
                isLeaf: Random.boolean(6, 4, true), // 60% 概率是叶子节点
                integrationType: IntegrationTypeKey.base,
                integrationTypeName: '',
                modules: [],
                children: []
            }));

            resolve(nodes);
        }, delay);
    });
}

/**
 * 模拟搜索节点
 * @param keyword - 搜索关键词
 * @returns Promise<TreeData[]> - 匹配的节点数组
 */
export function searchNodes(keyword: string): Promise<TreeData[]> {
    return new Promise((resolve) => {
        const delay = Random.integer(300, 1000);

        setTimeout(() => {
            const resultCount = Random.integer(1, 5);
            const results = Array.from({ length: resultCount }, (_, i) => ({
                id: `search-result-${i + 1}`,
                label: `${keyword}${Random.pick(['系统', '模块', '服务', '平台'])}${i + 1}`,
                level: Random.pick([LevelKey.Domain, LevelKey.DeptComposite, LevelKey.DeptSingle]),
                dept: generateDept(),
                owner: generateOwner(),
                isLeaf: Random.boolean(5, 5, true),
                integrationType: IntegrationTypeKey.base,
                integrationTypeName: '',
                modules: [],
                children: []
            }));

            resolve(results);
        }, delay);
    });
}
