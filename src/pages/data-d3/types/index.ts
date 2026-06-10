/**
 * 类型定义 + 业务常量
 * ----------------------------------------------------------------------------
 * 定义 D3 树形图所用到的 TypeScript 类型和颜色/枚举常量
 *
 * 步骤：
 *   1. TreeData 描述 D3 树节点的递归结构
 *   2. SelectedNode 描述右侧 Drawer 中显示的选中节点信息
 *   3. NODE_COLORS / EDGE_STYLES 控制节点和连线的颜色
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
    module_merge = 'module_merge'
}

/**
 * 树节点数据类型（递归结构，children/modules 是其下级节点）
 * ----------------------------------------------------------------------------
 * 字段说明：
 *   id                   节点唯一标识（D3 数据绑定的 key / 业务查找的 key）
 *   label                节点显示名称（节点卡片上显示的文字）
 *   level                节点层级（决定背景色，参考 NODE_COLORS 映射表）
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
export interface TreeData {
    id: string;
    label: string;
    level: string;
    dept: string;
    owner: string;
    children?: TreeData[];
    modules?: TreeData[];
    integrationType?: IntegrationTypeKey;
    integrationTypeName?: string;
    relations?: Array<{ targetId: string; targetName: string; type: IntegrationTypeKey }>;
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
 * 节点层级 → 背景色（领域级 = 红、部门级 = 橙/蓝、处室级 = 灰）
 * ----------------------------------------------------------------------------
 * 在 d3Tree.ts 的 initD3 中：
 *   - 节点卡片的 style.backgroundColor = NODE_COLORS[level]
 *   - 实现了"颜色随层级变化"的效果
 */
export const NODE_COLORS: Record<string, string> = {
    领域级应用: '#f5222d',
    部门级综合应用: '#fa8c16',
    部门级单点应用: '#1890ff',
    处室级单点应用: '#8c8c8c',
    功能模块: '#722ed1'
};

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
    module_merge: '#722ed1'
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
    module_merge: '模块整合'
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
export const NODE_LEVELS = [
    '领域级应用',
    '部门级综合应用',
    '部门级单点应用',
    '处室级单点应用',
    '功能模块'
];
