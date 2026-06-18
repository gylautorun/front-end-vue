/**
 * Mock 数据（教育局应用体系）
 * ----------------------------------------------------------------------------
 * @deprecated 页面已改用 SDK 的 initialTreeData（@/lib/d3-tree-sdk）
 * 本文件保留完整 mock 供参考；新代码请：
 *   import { initialTreeData } from '@/lib/d3-tree-sdk';
 *
 * 使用智能 mock 生成器生成数据，支持：
 *   - 自动生成树形结构
 *   - 智能判断叶子节点 (isLeaf)
 *   - 支持异步加载场景模拟
 */

/**
 * 类型与常量导入说明：
 * ----------------------------------------------------------------------------
 * TreeData             - 树节点数据类型（递归结构）
 * INTEGRATION_TYPE_NAME - 整合方式中文名映射表
 * IntegrationTypeKey    - 整合方式枚举（merge/migrate/integration等）
 * ROOT_DEFAULT_MERGE_MARKER - 根节点默认整合标记
 * LevelKey             - 节点层级枚举（domain/dept_composite/dept_single等）
 */
import {
    TreeData,
    INTEGRATION_TYPE_NAME,
    IntegrationTypeKey,
    ROOT_DEFAULT_MERGE_MARKER,
    LevelKey
} from '../types';

import { generateTreeData, addIsLeafToTree } from './mockGenerator';

/**
 * 初始树数据
 * ----------------------------------------------------------------------------
 * 字段与 TreeData 类型对应：
 *   id                   'edu'        - 根节点固定 ID，index.vue 用它过滤
 *   label                '教育局'     - 根节点显示名
 *   level                'domain'     - 对应 LEVEL_CONFIG['domain'] = 红色
 *   dept                 '教育局'     - 所属部门
 *   owner                '管理员'     - 负责人
 *   integrationType      缺省         - 根节点不画连线，无此属性
 *   integrationTypeName  缺省         - 同上
 *   children             [...]        - 第一层子节点
 *   modules              缺省         - 根节点下没有功能模块
 *   isLeaf               true/false   - 是否叶子节点
 *
 * - 默认无 integrationType，所有连线显示灰色
 * - 当用户操作整合方式后，会动态添加 integrationType 和 integrationTypeName
 *
 * 异步加载逻辑（isLeaf + children）：
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ isLeaf = true                                               │
 *   │   → 叶子节点，无论 children 是否有值，都不显示展开按钮       │
 *   │   → 不触发异步加载                                          │
 *   ├─────────────────────────────────────────────────────────────┤
 *   │ isLeaf = false（或不设置）                                  │
 *   │   ├─ children 有数据                                         │
 *   │   │   → 正常展开/收起，不触发异步加载                        │
 *   │   │                                                         │
 *   │   └─ children 为空 []                                       │
 *   │       → 显示展开按钮，点击时触发异步加载                      │
 *   │       → 加载后 children = [子节点...]                        │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * 示例：
 *   - { id: 'x', isLeaf: true, children: [] }           → 叶子节点，不显示展开按钮
 *   - { id: 'x', isLeaf: false, children: [...] }       → 有子节点，正常展开
 *   - { id: 'x', isLeaf: false, children: [] }          → 需要异步加载，显示展开按钮
 *
 * 子节点示例（app1 - 教育管理一体化平台）：
 *   - integrationType: 'merge' → 连线用 EDGE_STYLES.merge = 红色
 *   - integrationTypeName: '合并'
 *   - modules: 该节点下的功能模块（叶子节点）
 *
 * 兄弟节点示例（app2 - 学生学籍管理系统）：
 *   - integrationType: 'migrate' → 连线用 EDGE_STYLES.migrate = 蓝色
 *   - integrationTypeName: '迁移'
 *
 * 生成配置：
 *   - asyncRate: 0.2  → 20% 的节点为异步加载节点（isLeaf: false, children: []）
 *   - maxDepth: 3     → 最大深度为 3 层
 *   - childCount: 5   → 5 个一级子节点
 */
const rawTreeData = generateTreeData({
    asyncRate: 0.2, // 20% 节点为异步加载
    maxDepth: 3, // 最大深度 3 层
    childCount: 5 // 5 个一级子节点
});

/**
 * 确保所有节点都有 isLeaf 字段
 * ----------------------------------------------------------------------------
 * 递归遍历树结构，为每个节点添加 isLeaf 字段：
 *   - 如果节点有子节点（children.length > 0），isLeaf = false
 *   - 如果节点无子节点，isLeaf = true
 */
export const initialTreeData = addIsLeafToTree(rawTreeData);

/**
 * 异步加载演示数据（模拟从服务器获取的子节点）
 * ----------------------------------------------------------------------------
 * 当用户点击异步节点（isLeaf: false, children: []）的展开按钮时，
 * 模拟从服务器获取的子节点数据结构示例。
 */
export const asyncLoadedChildren = [
    {
        id: 'async-demo-c1',
        label: '异步子节点1',
        level: LevelKey.DeptSingle,
        dept: '演示部门',
        owner: '演示用户A',
        isLeaf: false,
        integrationType: IntegrationTypeKey.base,
        integrationTypeName: INTEGRATION_TYPE_NAME.base,
        modules: [
            {
                id: 'async-demo-c1-m1',
                label: '功能模块A',
                level: LevelKey.Module,
                dept: '演示部门',
                owner: '演示用户A'
            }
        ]
    },
    {
        id: 'async-demo-c2',
        label: '异步子节点2',
        level: LevelKey.DeptSingle,
        dept: '演示部门',
        owner: '演示用户B',
        isLeaf: true,
        integrationType: IntegrationTypeKey.base,
        integrationTypeName: INTEGRATION_TYPE_NAME.base,
        modules: [
            {
                id: 'async-demo-c2-m1',
                label: '功能模块B',
                level: LevelKey.Module,
                dept: '演示部门',
                owner: '演示用户B'
            }
        ]
    }
];
