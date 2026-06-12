import { defineTreeConfig } from '@/lib/d3-tree-sdk';

/**
 * data-d3 页面 schema（通过参数传入 SDK，不写死在 SDK 内核）
 *
 * 对接你的后端时，只改此文件中的 fields / selection / defaults / styles：
 *
 * ```ts
 * export const DATA_D3_TREE_SCHEMA = defineTreeConfig({
 *   rootId: 'root',
 *   fields: {
 *     id: 'nodeId',
 *     label: 'name',
 *     children: 'subList',      // 不是 children 就改这里
 *     modules: 'funcModules',
 *   },
 *   selection: { parentId: 'pid' },
 * });
 * ```
 */
export const DATA_D3_TREE_SCHEMA = defineTreeConfig({
    rootId: 'edu',
    protectedRootId: 'edu',
    fields: {
        id: 'id',
        label: 'label',
        children: 'children',
        modules: 'modules',
        level: 'level',
        dept: 'dept',
        owner: 'owner',
        integrationType: 'integrationType',
        integrationTypeName: 'integrationTypeName',
        integratedFrom: 'integratedFrom',
        relations: 'relations',
        relationTargetId: 'targetId',
        relationTargetName: 'targetName',
        relationType: 'type',
        relationName: 'name'
    },
    selection: {
        id: 'id',
        label: 'label',
        parentId: 'parentId'
    },
    defaults: {
        dept: '教育局',
        owner: '',
        moduleLevel: 'module'
    },
    idPrefix: {
        node: 'node_',
        module: 'module_',
        merge: 'merge_',
        integrated: 'integrated_'
    }
});

/** @deprecated 使用 DATA_D3_TREE_SCHEMA */
export const DATA_D3_TREE_CONFIG = DATA_D3_TREE_SCHEMA;

export const DATA_D3_ROOT_ID = DATA_D3_TREE_SCHEMA.rootId!;
