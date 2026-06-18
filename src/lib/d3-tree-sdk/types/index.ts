/**
 * 类型定义 + 业务常量
 * ----------------------------------------------------------------------------
 * 定义 D3 树形图所用到的 TypeScript 类型和颜色/枚举常量
 *
 * 步骤：
 *   1. TreeData 描述 D3 树节点的递归结构
 *   2. SelectedNode 描述右侧 Drawer 中显示的选中节点信息
 *   3. LEVEL_CONFIG / EDGE_STYLES 控制节点和连线的颜色
 *   4. INTEGRATION_TYPES / NODE_LEVELS 给出业务枚举（用于下拉选项、节点操作）
 */

/**
 * 整合方式枚举（推荐用 enum 作为强类型常量）
 * ----------------------------------------------------------------------------
 * 字段说明：
 *   merge           合并
 *   migrate         迁移
 *   integration     接口对接
 *   deprecate       停用下线
 *   module_merge    模块整合
 *
 * 注意：
 *   - integrationType 字段保存的是枚举值（字符串）
 *   - 中文名称通过 INTEGRATION_TYPE_NAME[key] 读取
 */
export enum IntegrationTypeKey {
    merge = 'merge',
    migrate = 'migrate',
    integration = 'integration',
    deprecate = 'deprecate',
    module_merge = 'module_merge',
    base = 'base'
}

/**
 * 树节点数据类型（递归结构，children/modules 是其下级节点）
 * ----------------------------------------------------------------------------
 * 字段说明：
 *   id                   节点唯一标识（D3 数据绑定的 key / 业务查找的 key）
 *   label                节点显示名称（节点卡片上显示的文字）
 *   level                节点层级（决定背景色，参考 LEVEL_CONFIG 映射表）
 *   dept                 所属部门（业务字段，Drawer 详情面板显示）
 *   owner                负责人（业务字段，可在线编辑）
 *   children             子节点（应用/系统层级）
 *   modules              功能模块（叶子节点）
 *   integrationType      整合方式 key（决定连线样式，参考 EDGE_STYLES 映射表）
 *   integrationTypeName  整合方式中文名（冗余存储，避免界面渲染时反复查表）
 *   relations            关联关系列表（与目标节点的关系）
 *                            - targetId   目标节点 ID
 *                            - targetName 目标节点显示名（冗余存储）
 *                            - type       整合方式 key
 */
export interface TreeData extends Record<string, unknown> {
    id: string;
    label: string;
    level: LevelKey;
    dept: string;
    owner: string;
    children?: TreeData[];
    modules?: TreeData[];
    integrationType?: IntegrationTypeKey;
    integrationTypeName?: string;
    relations?: Array<{
        targetId: string;
        targetName: string;
        type: IntegrationTypeKey;
        name: string;
    }>;
    /**
     * 标记此节点是否是由多个节点整合而成
     * 如果有值，数组中存储被整合的原始节点 ID
     * 用于判断子层级是否可以触发下一层级节点之间的合并
     */
    integratedFrom?: string[];

    /**
     * 标记节点是否为叶子节点（适用于异步加载场景）
     * @description isXXX 开头的字段应为布尔类型
     * - true: 叶子节点（无子节点）
     * - false: 非叶子节点（可能需要异步加载子节点）
     */
    isLeaf?: boolean;
}

/**
 * 带有缓存子节点的树数据类型（用于展开/收起功能）
 * ----------------------------------------------------------------------------
 * `_children` 是内部实现细节，用于缓存收起状态下的子节点
 * 展开时：children = 子节点，_children = undefined
 * 收起时：children = []，_children = 原始子节点
 */
export type TreeDataWithCache = TreeData & { _children?: TreeData[] };

/** 根节点默认整合标记（表示顶层已"合并"，其直接子节点所在层级可继续向下合并） */
export const ROOT_DEFAULT_MERGE_MARKER = '__root__';

/**
 * 判断节点是否已完成整合（或视为已整合）
 * - depth=0 的根节点始终视为已整合
 * - 其他节点需有 integratedFrom 记录
 */
export function isMergedNode(node: Pick<TreeData, 'integratedFrom'>, depth = 0): boolean {
    if (depth === 0) return true;
    return !!(node.integratedFrom && node.integratedFrom.length > 0);
}

/**
 * 判断同级节点是否允许拖拽合并
 * 规则：父节点必须已整合，子层级才能进行同级合并
 */
export function canSiblingMerge(node: {
    depth: number;
    parent?: { depth: number; data: TreeData } | null;
}): boolean {
    if (node.depth <= 0) return false;
    const parent = node.parent;
    if (!parent) return false;
    return isMergedNode(parent.data, parent.depth);
}

/**
 * 多选模式下被选中节点的简化结构（用于右侧 Drawer 展示）
 * ----------------------------------------------------------------------------
 * 字段说明：
 *   id        节点 ID
 *   label     节点显示名
 *   parentId  父节点 ID（用于整合模块时确定新模块挂载到哪个父节点下）
 */
export interface SelectedNode {
    id: string;
    label: string;
    parentId: string;
}

/**
 * 整合方式 key → 连线颜色（用于 5 种整合方式的连线颜色区分）
 * ----------------------------------------------------------------------------
 * 在 d3Tree.ts 的 initD3 中：
 *   - 连线 path 的 stroke = EDGE_STYLES[source.data.integrationType]
 *   - 实现了"颜色随整合方式变化"的效果
 */
export const EDGE_STYLES: Record<IntegrationTypeKey, string> = {
    merge: '#f5222d',
    migrate: '#1890ff',
    integration: '#52c41a',
    deprecate: '#d9d9d9',
    module_merge: '#722ed1',
    base: '#CCC'
};

/**
 * 节点层级枚举
 * ----------------------------------------------------------------------------
 * 使用枚举替代联合类型的优势：
 *   1. 类型安全：IDE 自动补全，避免拼写错误
 *   2. 统一管理：所有层级值集中定义
 *   3. 支持反向映射：LevelKey.domain === 'domain'
 */
export enum LevelKey {
    Domain = 'domain',
    DeptComposite = 'dept_composite',
    DeptSingle = 'dept_single',
    OfficeSingle = 'office_single',
    Module = 'module',
    Base = 'base'
}

/**
 * 异步加载缓存策略枚举
 * ----------------------------------------------------------------------------
 * CacheFirst - 首次加载后缓存，后续使用缓存（适用于数据变化不频繁的场景）
 * Realtime - 每次都重新请求，不使用缓存（适用于数据实时变化的场景）
 */
export enum AsyncLoadStrategy {
    CacheFirst = 'cache-first',
    Realtime = 'realtime'
}

/**
 * 层级配置映射（key → { name: 中文名称, color: 颜色 }）
 */
export const LEVEL_CONFIG: Record<LevelKey, { name: string; color: string }> = {
    [LevelKey.Domain]: { name: '领域级应用', color: EDGE_STYLES.merge }, // 红色
    [LevelKey.DeptComposite]: { name: '部门级综合应用', color: EDGE_STYLES.integration }, // 绿色
    [LevelKey.DeptSingle]: { name: '部门级单点应用', color: EDGE_STYLES.migrate }, // 蓝色
    [LevelKey.OfficeSingle]: { name: '处室级单点应用', color: EDGE_STYLES.base }, // 灰色
    [LevelKey.Module]: { name: '功能模块', color: EDGE_STYLES.module_merge }, // 紫色
    [LevelKey.Base]: { name: '基础', color: EDGE_STYLES.base }
};

/**
 * 整合方式 key → 中文名（用于下拉框 / 连线标签 / 详情展示）
 * ----------------------------------------------------------------------------
 * 在 Modals.vue / d3Tree.ts 中通过
 *   INTEGRATION_TYPE_NAME[integrationType]
 * 获取对应的中文名称。
 */
export const INTEGRATION_TYPE_NAME: Record<IntegrationTypeKey, string> = {
    merge: '合并',
    migrate: '迁移',
    integration: '接口对接',
    deprecate: '停用下线',
    module_merge: '模块整合',
    base: ''
};

/**
 * 整合方式下拉选项（顺序固定）
 * ----------------------------------------------------------------------------
 * 元素结构：{ key, name, color }
 *   - key:  持久化字段（写入 TreeData.integrationType）
 *   - name: 中文名（界面展示）
 *   - color: 对应 EDGE_STYLES[key] 的颜色
 *
 * 在 Modals.vue 的"标注整合方式"/"绑定关系"/"新增子节点"等下拉框中
 * 通过 v-for 遍历生成 <option>：
 *   <option v-for="opt in INTEGRATION_TYPE_OPTIONS" :key="opt.key" :value="opt.key">
 *       {{ opt.name }}
 *   </option>
 */
export interface IntegrationTypeOption {
    key: IntegrationTypeKey;
    name: string;
    color: string;
}

export const INTEGRATION_TYPE_OPTIONS: IntegrationTypeOption[] = [
    { key: IntegrationTypeKey.integration, name: '接口对接', color: EDGE_STYLES.integration },
    { key: IntegrationTypeKey.merge, name: '合并', color: EDGE_STYLES.merge },
    { key: IntegrationTypeKey.migrate, name: '迁移', color: EDGE_STYLES.migrate },
    { key: IntegrationTypeKey.deprecate, name: '停用下线', color: EDGE_STYLES.deprecate },
    { key: IntegrationTypeKey.module_merge, name: '模块整合', color: EDGE_STYLES.module_merge }
];

/**
 * 节点层级枚举（用于新增节点/编辑节点时选择层级）
 * ----------------------------------------------------------------------------
 * 在 Modals.vue 的"新增子节点" / "编辑属性" 模态框中
 * 通过 v-for 遍历生成 <option>
 */
export const NODE_LEVELS: LevelKey[] = [
    LevelKey.Domain,
    LevelKey.DeptComposite,
    LevelKey.DeptSingle,
    LevelKey.OfficeSingle,
    LevelKey.Module,
    LevelKey.Base
];
