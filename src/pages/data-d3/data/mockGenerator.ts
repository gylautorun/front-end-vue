/**
 * Mock 数据生成器
 * ----------------------------------------------------------------------------
 * 使用 Mock.js 提供专业的数据生成功能，支持：
 *   - 自动生成树形结构
 *   - 智能判断叶子节点 (isLeaf)
 *   - 支持异步加载场景模拟
 *   - 随机生成部门、负责人等字段
 *
 * Mock.js API 参考：
 *   - Mock.Random.cname() - 中文姓名
 *   - Mock.Random.integer(min, max) - 整数
 *   - Mock.mock(template) - 模板生成
 */
import type { TreeData } from '../types';
import {
    INTEGRATION_TYPE_NAME,
    IntegrationTypeKey,
    ROOT_DEFAULT_MERGE_MARKER,
    LevelKey
} from '../types';
import Mock from 'mockjs';

const Random = Mock.Random;

// 模拟部门列表
const DEPARTMENTS = [
    '教育局',
    '信息中心',
    '人事处',
    '财务处',
    '招生办',
    '科研处',
    '教研室',
    '安保处',
    '图书馆',
    '教研处',
    '采购办'
];

// 模块名称模板
const MODULE_TEMPLATES = [
    '管理',
    '配置',
    '监控',
    '日志',
    '统计',
    '分析',
    '同步',
    '备份',
    '查询',
    '审核',
    '报表',
    '校验'
];

// 节点标签模板
const NODE_LABELS: Record<LevelKey, string[]> = {
    [LevelKey.Domain]: ['平台', '系统', '中心', '体系'],
    [LevelKey.DeptComposite]: ['管理系统', '综合平台', '一体化'],
    [LevelKey.DeptSingle]: ['管理', '服务', '应用'],
    [LevelKey.OfficeSingle]: ['中心', '系统', '模块'],
    [LevelKey.Module]: ['功能', '模块'],
    [LevelKey.Base]: ['基础']
};

/**
 * 生成随机用户名（使用 Mock.js）
 */
export function generateOwner(): string {
    // 使用 Mock.js 生成中文姓名，截取姓+XX
    const fullName = Random.cname();
    return `${fullName.charAt(0)}XX`;
}

/**
 * 生成随机部门
 */
export function generateDept(): string {
    return Random.pick(DEPARTMENTS);
}

/**
 * 生成随机模块名称
 */
function generateModuleName(prefix: string): string {
    const template = Random.pick(MODULE_TEMPLATES);
    return `${prefix}${template}`;
}

/**
 * 生成随机整数（使用 Mock.js）
 */
function randomInt(min: number, max: number): number {
    return Random.integer(min, max);
}

/**
 * 生成功能模块
 * ----------------------------------------------------------------------------
 * modules 中的模块不需要 isLeaf 字段，它不是树的节点，只是附着在节点上的附加信息
 */
function generateModules(parentLabel: string, count: number = 3): TreeData[] {
    const modules: TreeData[] = [];
    for (let i = 0; i < count; i++) {
        modules.push({
            id: `${parentLabel.replace(/[^a-zA-Z0-9]/g, '-')}-m${i + 1}`,
            label: generateModuleName(parentLabel),
            level: LevelKey.Module,
            dept: generateDept(),
            owner: generateOwner()
            // modules 中不添加 isLeaf 字段
        });
    }
    return modules;
}

/**
 * 生成子节点
 * @param asyncMode - 是否启用异步模式（所有非叶子节点都生成空 children，模拟异步加载）
 */
function generateChildren(
    parentId: string,
    level: LevelKey,
    depth: number,
    maxDepth: number = 3,
    asyncRate: number = 0.3,
    asyncMode: boolean = false
): TreeData[] {
    if (depth >= maxDepth) return [];

    const childCount = randomInt(2, 4);
    const labels = NODE_LABELS[level] || ['子系统', '子模块'];
    const children: TreeData[] = [];

    for (let i = 0; i < childCount; i++) {
        const isAsync = Math.random() < asyncRate || asyncMode;
        const childLevel = getNextLevel(level);
        const hasChildren = Math.random() > 0.5 && depth < maxDepth - 1;

        // 异步节点：isLeaf: false, children: []
        // 表示需要异步加载子节点
        if (isAsync || (hasChildren && asyncMode)) {
            children.push({
                id: `${parentId}-c${i + 1}`,
                label: `${Random.pick(labels)}${i + 1}`,
                level: childLevel,
                dept: generateDept(),
                owner: generateOwner(),
                isLeaf: false,
                children: [],
                integrationType: IntegrationTypeKey.base,
                integrationTypeName: INTEGRATION_TYPE_NAME.base,
                modules: generateModules(`子系统${i + 1}`, randomInt(2, 4))
            });
        } else {
            // 同步节点：直接生成子节点数据
            children.push({
                id: `${parentId}-c${i + 1}`,
                label: `${Random.pick(labels)}${i + 1}`,
                level: childLevel,
                dept: generateDept(),
                owner: generateOwner(),
                isLeaf: !hasChildren,
                integrationType: IntegrationTypeKey.base,
                integrationTypeName: INTEGRATION_TYPE_NAME.base,
                modules: generateModules(`子系统${i + 1}`, randomInt(2, 4)),
                children: hasChildren
                    ? generateChildren(
                          `${parentId}-c${i + 1}`,
                          childLevel,
                          depth + 1,
                          maxDepth,
                          asyncRate,
                          asyncMode
                      )
                    : []
            });
        }
    }

    return children;
}

/**
 * 获取下一层级
 */
function getNextLevel(currentLevel: LevelKey): LevelKey {
    const levelOrder: LevelKey[] = [
        LevelKey.Domain,
        LevelKey.DeptComposite,
        LevelKey.DeptSingle,
        LevelKey.OfficeSingle,
        LevelKey.Module
    ];
    const currentIndex = levelOrder.indexOf(currentLevel);
    return levelOrder[Math.min(currentIndex + 1, levelOrder.length - 2)];
}

/**
 * 生成初始树数据
 * @param options - 配置选项
 * @param options.asyncRate - 异步节点比例 (0-1)
 * @param options.maxDepth - 最大深度
 * @param options.childCount - 第一层子节点数量
 * @param options.asyncMode - 是否启用纯异步模式（所有非叶子节点都生成空 children）
 */
export function generateTreeData(
    options: {
        asyncRate?: number;
        maxDepth?: number;
        childCount?: number;
        asyncMode?: boolean;
    } = {}
): TreeData {
    const { asyncRate = 0.2, maxDepth = 3, childCount = 5, asyncMode = false } = options;

    const mainSystems = [
        { label: '教育管理一体化平台', integrationType: IntegrationTypeKey.merge },
        { label: '学生学籍管理系统', integrationType: IntegrationTypeKey.migrate },
        { label: '教师资格认定系统', integrationType: IntegrationTypeKey.integration },
        { label: '校园安全管理', integrationType: IntegrationTypeKey.module_merge },
        { label: '财务管理系统', integrationType: IntegrationTypeKey.base }
    ];

    return {
        id: 'edu',
        label: '教育局',
        level: LevelKey.Domain,
        dept: '教育局',
        owner: '管理员',
        isLeaf: false,
        integratedFrom: [ROOT_DEFAULT_MERGE_MARKER],
        children: [
            ...mainSystems.slice(0, childCount).map((system, i) => ({
                id: `app${i + 1}`,
                label: system.label,
                level: LevelKey.Domain,
                dept: '教育局',
                owner: generateOwner(),
                isLeaf: false,
                integrationType: system.integrationType,
                integrationTypeName: INTEGRATION_TYPE_NAME[system.integrationType],
                modules: generateModules(system.label, 3),
                children: generateChildren(
                    `app${i + 1}`,
                    LevelKey.Domain,
                    1,
                    maxDepth,
                    asyncRate,
                    asyncMode
                )
            })),
            {
                id: 'async-demo',
                label: '异步加载演示',
                level: LevelKey.Domain,
                dept: '演示部门',
                owner: '演示用户',
                isLeaf: false,
                children: [],
                modules: []
            }
        ]
    };
}

/**
 * 生成单个异步加载节点
 */
export function generateAsyncNode(parentId: string, index: number): TreeData {
    return {
        id: `${parentId}-async-${index}`,
        label: `异步节点${index}`,
        level: LevelKey.OfficeSingle,
        dept: generateDept(),
        owner: generateOwner(),
        isLeaf: false,
        children: [],
        integrationType: IntegrationTypeKey.base,
        integrationTypeName: INTEGRATION_TYPE_NAME.base,
        modules: generateModules(`异步节点${index}`, randomInt(2, 4))
    };
}

/**
 * 为现有树数据添加 isLeaf 字段
 * ----------------------------------------------------------------------------
 * 规则：
 *   - 如果节点已经有 isLeaf 字段，保留它的值（用于异步加载场景）
 *   - 如果节点没有 isLeaf 字段，根据 children 推断：有子节点则 isLeaf=false，否则 isLeaf=true
 *
 * 这样可以保留异步加载节点（isLeaf: false, children: []）的状态
 */
export function addIsLeafToTree(tree: TreeData): TreeData {
    function processNode(node: TreeData): TreeData {
        const hasChildren = node.children && node.children.length > 0;

        // 如果节点已有 isLeaf 字段，保留它的值（支持异步加载场景）
        let isLeafValue: boolean;
        if ('isLeaf' in node && node.isLeaf !== undefined) {
            isLeafValue = node.isLeaf;
        } else {
            // 否则根据是否有子节点推断
            isLeafValue = !hasChildren;
        }

        return {
            ...node,
            isLeaf: isLeafValue,
            children: node.children ? node.children.map(processNode) : []
        };
    }

    return processNode(tree);
}

/**
 * 使用 Mock.js 模板生成随机树节点
 */
export function generateRandomTreeNode(parentId: string, index: number, level: LevelKey): TreeData {
    return Mock.mock({
        id: `${parentId}-${index}`,
        label: `${Random.pick(NODE_LABELS[level])}${index}`,
        level: level,
        dept: '@pick(DEPARTMENTS)',
        owner: function () {
            const name = Random.cname();
            return `${name.charAt(0)}XX`;
        },
        isLeaf: Random.boolean(3, 7, false),
        integrationType: Random.pick([
            IntegrationTypeKey.base,
            IntegrationTypeKey.merge,
            IntegrationTypeKey.migrate,
            IntegrationTypeKey.integration
        ]),
        modules: function () {
            const count = Random.integer(2, 4);
            const modules: TreeData[] = [];
            for (let i = 0; i < count; i++) {
                modules.push({
                    id: `${parentId}-${index}-m${i}`,
                    label: `模块${i + 1}`,
                    level: LevelKey.Module,
                    dept: generateDept(),
                    owner: generateOwner()
                });
            }
            return modules;
        },
        children: []
    });
}
