/**
 * Mock 数据（教育局应用体系）
 * ----------------------------------------------------------------------------
 * @deprecated 页面已改用 SDK 的 initialTreeData（@/lib/d3-tree-sdk）
 * 本文件保留完整 mock 供参考；新代码请：
 *   import { initialTreeData } from '@/lib/d3-tree-sdk';
 */
import {
    TreeData,
    INTEGRATION_TYPE_NAME,
    IntegrationTypeKey,
    ROOT_DEFAULT_MERGE_MARKER
} from '../types';

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
 *
 * - 默认无 integrationType，所有连线显示灰色
 * - 当用户操作整合方式后，会动态添加 integrationType 和 integrationTypeName
 * 子节点示例（app1 - 教育管理一体化平台）：
 *   - integrationType: 'merge' → 连线用 EDGE_STYLES.merge = 红色
 *   - integrationTypeName: '合并'
 *   - modules: 该节点下的功能模块（叶子节点）
 *
 * 兄弟节点示例（app2 - 学生学籍管理系统）：
 *   - integrationType: 'migrate' → 连线用 EDGE_STYLES.migrate = 蓝色
 *   - integrationTypeName: '迁移'
 */
export const initialTreeData: TreeData = {
    id: 'edu',
    label: '教育局',
    level: 'domain',
    dept: '教育局',
    owner: '管理员',
    integratedFrom: [ROOT_DEFAULT_MERGE_MARKER],
    children: [
        {
            id: 'app1',
            label: '教育管理一体化平台',
            level: 'domain',
            dept: '教育局',
            owner: '李XX',
            integrationType: IntegrationTypeKey.base,
            integrationTypeName: INTEGRATION_TYPE_NAME.base,
            modules: [
                {
                    id: 'app1-m1',
                    label: '用户管理',
                    level: 'module',
                    dept: '教育局',
                    owner: '王XX'
                },
                {
                    id: 'app1-m2',
                    label: '权限管理',
                    level: 'module',
                    dept: '教育局',
                    owner: '王XX'
                },
                {
                    id: 'app1-m3',
                    label: '数据统计',
                    level: 'module',
                    dept: '教育局',
                    owner: '赵XX'
                }
            ],
            children: [
                {
                    id: 'app1-c1',
                    label: '数据中心',
                    level: 'office_single',
                    dept: '教育局',
                    owner: '刘XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app1-c1-m1',
                            label: '数据同步',
                            level: 'module',
                            dept: '教育局',
                            owner: '陈XX'
                        },
                        {
                            id: 'app1-c1-m2',
                            label: '数据备份',
                            level: 'module',
                            dept: '教育局',
                            owner: '陈XX'
                        },
                        {
                            id: 'app1-c1-m3',
                            label: '数据分析',
                            level: 'module',
                            dept: '教育局',
                            owner: '陈XX'
                        }
                    ],
                    // 第4层：团队级应用
                    children: [
                        {
                            id: 'app1-c1-d4-1',
                            label: '数据采集团队',
                            level: 'office_single',
                            dept: '数据中心',
                            owner: '张三',
                            integrationType: IntegrationTypeKey.base,
                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                            modules: [
                                {
                                    id: 'app1-c1-d4-1-m1',
                                    label: '采集任务',
                                    level: 'module',
                                    dept: '数据中心',
                                    owner: '李四'
                                },
                                {
                                    id: 'app1-c1-d4-1-m2',
                                    label: '采集配置',
                                    level: 'module',
                                    dept: '数据中心',
                                    owner: '李四'
                                }
                            ],
                            // 第5层：项目级应用
                            children: [
                                {
                                    id: 'app1-c1-d5-1',
                                    label: '实时采集项目',
                                    level: 'office_single',
                                    dept: '数据中心',
                                    owner: '王五',
                                    integrationType: IntegrationTypeKey.base,
                                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                    modules: [
                                        {
                                            id: 'app1-c1-d5-1-m1',
                                            label: '实时同步',
                                            level: 'module',
                                            dept: '数据中心',
                                            owner: '赵六'
                                        },
                                        {
                                            id: 'app1-c1-d5-1-m2',
                                            label: '增量同步',
                                            level: 'module',
                                            dept: '数据中心',
                                            owner: '赵六'
                                        }
                                    ],
                                    // 第6层：任务级应用
                                    children: [
                                        {
                                            id: 'app1-c1-d6-1',
                                            label: '数据清洗任务',
                                            level: 'office_single',
                                            dept: '数据中心',
                                            owner: '钱七',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app1-c1-d6-1-m1',
                                                    label: '清洗规则',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '孙八'
                                                },
                                                {
                                                    id: 'app1-c1-d6-1-m2',
                                                    label: '清洗日志',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '孙八'
                                                }
                                            ]
                                        },
                                        {
                                            id: 'app1-c1-d6-2',
                                            label: '数据验证任务',
                                            level: 'office_single',
                                            dept: '数据中心',
                                            owner: '周九',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app1-c1-d6-2-m1',
                                                    label: '验证规则',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '吴十'
                                                },
                                                {
                                                    id: 'app1-c1-d6-2-m2',
                                                    label: '验证报告',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '吴十'
                                                }
                                            ]
                                        },
                                        {
                                            id: 'app1-c1-d6-3',
                                            label: '数据转换任务',
                                            level: 'office_single',
                                            dept: '数据中心',
                                            owner: '郑一',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app1-c1-d6-3-m1',
                                                    label: '转换脚本',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '冯二'
                                                },
                                                {
                                                    id: 'app1-c1-d6-3-m2',
                                                    label: '转换日志',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '冯二'
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    id: 'app1-c1-d5-2',
                                    label: '批量采集项目',
                                    level: 'office_single',
                                    dept: '数据中心',
                                    owner: '陈三',
                                    integrationType: IntegrationTypeKey.base,
                                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                    modules: [
                                        {
                                            id: 'app1-c1-d5-2-m1',
                                            label: '批量导入',
                                            level: 'module',
                                            dept: '数据中心',
                                            owner: '褚四'
                                        },
                                        {
                                            id: 'app1-c1-d5-2-m2',
                                            label: '批量导出',
                                            level: 'module',
                                            dept: '数据中心',
                                            owner: '褚四'
                                        }
                                    ],
                                    children: [
                                        {
                                            id: 'app1-c1-d6-4',
                                            label: 'Excel导入任务',
                                            level: 'office_single',
                                            dept: '数据中心',
                                            owner: '卫五',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app1-c1-d6-4-m1',
                                                    label: '模板管理',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '蒋六'
                                                },
                                                {
                                                    id: 'app1-c1-d6-4-m2',
                                                    label: '导入日志',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '蒋六'
                                                }
                                            ]
                                        },
                                        {
                                            id: 'app1-c1-d6-5',
                                            label: 'CSV导入任务',
                                            level: 'office_single',
                                            dept: '数据中心',
                                            owner: '沈七',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app1-c1-d6-5-m1',
                                                    label: 'CSV解析',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '韩八'
                                                },
                                                {
                                                    id: 'app1-c1-d6-5-m2',
                                                    label: 'CSV验证',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '韩八'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'app1-c1-d4-2',
                            label: '数据存储团队',
                            level: 'office_single',
                            dept: '数据中心',
                            owner: '杨九',
                            integrationType: IntegrationTypeKey.base,
                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                            modules: [
                                {
                                    id: 'app1-c1-d4-2-m1',
                                    label: '存储配置',
                                    level: 'module',
                                    dept: '数据中心',
                                    owner: '朱十'
                                },
                                {
                                    id: 'app1-c1-d4-2-m2',
                                    label: '存储监控',
                                    level: 'module',
                                    dept: '数据中心',
                                    owner: '朱十'
                                }
                            ],
                            children: [
                                {
                                    id: 'app1-c1-d5-3',
                                    label: '主存储项目',
                                    level: 'office_single',
                                    dept: '数据中心',
                                    owner: '秦一',
                                    integrationType: IntegrationTypeKey.base,
                                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                    modules: [
                                        {
                                            id: 'app1-c1-d5-3-m1',
                                            label: '主库管理',
                                            level: 'module',
                                            dept: '数据中心',
                                            owner: '尤二'
                                        },
                                        {
                                            id: 'app1-c1-d5-3-m2',
                                            label: '主库备份',
                                            level: 'module',
                                            dept: '数据中心',
                                            owner: '尤二'
                                        }
                                    ],
                                    children: [
                                        {
                                            id: 'app1-c1-d6-6',
                                            label: 'MySQL存储任务',
                                            level: 'office_single',
                                            dept: '数据中心',
                                            owner: '许三',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app1-c1-d6-6-m1',
                                                    label: 'MySQL配置',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '何四'
                                                },
                                                {
                                                    id: 'app1-c1-d6-6-m2',
                                                    label: 'MySQL监控',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '何四'
                                                }
                                            ]
                                        },
                                        {
                                            id: 'app1-c1-d6-7',
                                            label: 'PostgreSQL存储任务',
                                            level: 'office_single',
                                            dept: '数据中心',
                                            owner: '吕五',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app1-c1-d6-7-m1',
                                                    label: 'PG配置',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '施六'
                                                },
                                                {
                                                    id: 'app1-c1-d6-7-m2',
                                                    label: 'PG监控',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '施六'
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    id: 'app1-c1-d5-4',
                                    label: '备份存储项目',
                                    level: 'office_single',
                                    dept: '数据中心',
                                    owner: '张七',
                                    integrationType: IntegrationTypeKey.base,
                                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                    modules: [
                                        {
                                            id: 'app1-c1-d5-4-m1',
                                            label: '备库管理',
                                            level: 'module',
                                            dept: '数据中心',
                                            owner: '孔八'
                                        },
                                        {
                                            id: 'app1-c1-d5-4-m2',
                                            label: '备库同步',
                                            level: 'module',
                                            dept: '数据中心',
                                            owner: '孔八'
                                        }
                                    ],
                                    children: [
                                        {
                                            id: 'app1-c1-d6-8',
                                            label: '异地备份任务',
                                            level: 'office_single',
                                            dept: '数据中心',
                                            owner: '曹九',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app1-c1-d6-8-m1',
                                                    label: '异地同步',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '严十'
                                                },
                                                {
                                                    id: 'app1-c1-d6-8-m2',
                                                    label: '异地恢复',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '严十'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'app1-c1-d4-3',
                            label: '数据治理团队',
                            level: 'office_single',
                            dept: '数据中心',
                            owner: '华一',
                            integrationType: IntegrationTypeKey.base,
                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                            modules: [
                                {
                                    id: 'app1-c1-d4-3-m1',
                                    label: '质量检查',
                                    level: 'module',
                                    dept: '数据中心',
                                    owner: '金二'
                                },
                                {
                                    id: 'app1-c1-d4-3-m2',
                                    label: '标准管理',
                                    level: 'module',
                                    dept: '数据中心',
                                    owner: '金二'
                                }
                            ],
                            children: [
                                {
                                    id: 'app1-c1-d5-5',
                                    label: '数据质量项目',
                                    level: 'office_single',
                                    dept: '数据中心',
                                    owner: '魏三',
                                    integrationType: IntegrationTypeKey.base,
                                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                    modules: [
                                        {
                                            id: 'app1-c1-d5-5-m1',
                                            label: '质量评估',
                                            level: 'module',
                                            dept: '数据中心',
                                            owner: '陶四'
                                        },
                                        {
                                            id: 'app1-c1-d5-5-m2',
                                            label: '质量报告',
                                            level: 'module',
                                            dept: '数据中心',
                                            owner: '陶四'
                                        }
                                    ],
                                    children: [
                                        {
                                            id: 'app1-c1-d6-9',
                                            label: '质量监控任务',
                                            level: 'office_single',
                                            dept: '数据中心',
                                            owner: '姜五',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app1-c1-d6-9-m1',
                                                    label: '监控配置',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '戚六'
                                                },
                                                {
                                                    id: 'app1-c1-d6-9-m2',
                                                    label: '监控告警',
                                                    level: 'module',
                                                    dept: '数据中心',
                                                    owner: '戚六'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'app1-c2',
                    label: '系统监控',
                    level: 'office_single',
                    dept: '信息中心',
                    owner: '杨XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app1-c2-m1',
                            label: '性能监控',
                            level: 'module',
                            dept: '信息中心',
                            owner: '黄XX'
                        },
                        {
                            id: 'app1-c2-m2',
                            label: '日志管理',
                            level: 'module',
                            dept: '信息中心',
                            owner: '黄XX'
                        },
                        {
                            id: 'app1-c2-m3',
                            label: '告警通知',
                            level: 'module',
                            dept: '信息中心',
                            owner: '黄XX'
                        }
                    ],
                    children: [
                        {
                            id: 'app1-c2-d4-1',
                            label: '服务器监控团队',
                            level: 'office_single',
                            dept: '信息中心',
                            owner: '监控一',
                            integrationType: IntegrationTypeKey.base,
                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                            modules: [
                                {
                                    id: 'app1-c2-d4-1-m1',
                                    label: 'CPU监控',
                                    level: 'module',
                                    dept: '信息中心',
                                    owner: '监控二'
                                }
                            ],
                            children: [
                                {
                                    id: 'app1-c2-d5-1',
                                    label: 'Linux服务器监控',
                                    level: 'office_single',
                                    dept: '信息中心',
                                    owner: '监控三',
                                    integrationType: IntegrationTypeKey.base,
                                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                    modules: [
                                        {
                                            id: 'app1-c2-d5-1-m1',
                                            label: '系统日志',
                                            level: 'module',
                                            dept: '信息中心',
                                            owner: '监控四'
                                        }
                                    ],
                                    children: [
                                        {
                                            id: 'app1-c2-d6-1',
                                            label: 'CentOS监控任务',
                                            level: 'office_single',
                                            dept: '信息中心',
                                            owner: '监控五',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app1-c2-d6-1-m1',
                                                    label: 'CentOS配置',
                                                    level: 'module',
                                                    dept: '信息中心',
                                                    owner: '监控六'
                                                }
                                            ]
                                        },
                                        {
                                            id: 'app1-c2-d6-2',
                                            label: 'Ubuntu监控任务',
                                            level: 'office_single',
                                            dept: '信息中心',
                                            owner: '监控七',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app1-c2-d6-2-m1',
                                                    label: 'Ubuntu配置',
                                                    level: 'module',
                                                    dept: '信息中心',
                                                    owner: '监控八'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'app1-c2-d4-2',
                            label: '应用监控团队',
                            level: 'office_single',
                            dept: '信息中心',
                            owner: '应用一',
                            integrationType: IntegrationTypeKey.base,
                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                            modules: [
                                {
                                    id: 'app1-c2-d4-2-m1',
                                    label: '应用状态',
                                    level: 'module',
                                    dept: '信息中心',
                                    owner: '应用二'
                                }
                            ],
                            children: [
                                {
                                    id: 'app1-c2-d5-2',
                                    label: 'Java应用监控',
                                    level: 'office_single',
                                    dept: '信息中心',
                                    owner: '应用三',
                                    integrationType: IntegrationTypeKey.base,
                                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                    modules: [
                                        {
                                            id: 'app1-c2-d5-2-m1',
                                            label: 'JVM监控',
                                            level: 'module',
                                            dept: '信息中心',
                                            owner: '应用四'
                                        }
                                    ],
                                    children: [
                                        {
                                            id: 'app1-c2-d6-3',
                                            label: 'Tomcat监控任务',
                                            level: 'office_single',
                                            dept: '信息中心',
                                            owner: '应用五',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app1-c2-d6-3-m1',
                                                    label: 'Tomcat配置',
                                                    level: 'module',
                                                    dept: '信息中心',
                                                    owner: '应用六'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'app1-c3',
                    label: '权限中心',
                    level: 'office_single',
                    dept: '信息中心',
                    owner: '周XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app1-c3-m1',
                            label: '角色管理',
                            level: 'module',
                            dept: '信息中心',
                            owner: '吴XX'
                        },
                        {
                            id: 'app1-c3-m2',
                            label: '权限配置',
                            level: 'module',
                            dept: '信息中心',
                            owner: '吴XX'
                        },
                        {
                            id: 'app1-c3-m3',
                            label: '审计日志',
                            level: 'module',
                            dept: '信息中心',
                            owner: '吴XX'
                        }
                    ]
                }
            ]
        },
        {
            id: 'app2',
            label: '学生学籍管理系统',
            level: 'dept_composite',
            dept: '教育局',
            owner: '张XX',
            integrationType: IntegrationTypeKey.base,
            integrationTypeName: INTEGRATION_TYPE_NAME.base,
            modules: [
                {
                    id: 'app2-m1',
                    label: '学籍录入',
                    level: 'module',
                    dept: '教育局',
                    owner: '孙XX'
                },
                {
                    id: 'app2-m2',
                    label: '学籍变更',
                    level: 'module',
                    dept: '教育局',
                    owner: '孙XX'
                },
                {
                    id: 'app2-m3',
                    label: '毕业管理',
                    level: 'module',
                    dept: '教育局',
                    owner: '李XX'
                },
                {
                    id: 'app2-m4',
                    label: '学籍查询',
                    level: 'module',
                    dept: '教育局',
                    owner: '周XX'
                }
            ],
            children: [
                {
                    id: 'app2-c1',
                    label: '学籍异动',
                    level: 'office_single',
                    dept: '教育局',
                    owner: '郑XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app2-c1-m1',
                            label: '转学管理',
                            level: 'module',
                            dept: '教育局',
                            owner: '王XX'
                        },
                        {
                            id: 'app2-c1-m2',
                            label: '休学管理',
                            level: 'module',
                            dept: '教育局',
                            owner: '王XX'
                        },
                        {
                            id: 'app2-c1-m3',
                            label: '复学管理',
                            level: 'module',
                            dept: '教育局',
                            owner: '王XX'
                        }
                    ],
                    children: [
                        {
                            id: 'app2-c1-d4-1',
                            label: '转学办理团队',
                            level: 'office_single',
                            dept: '教育局',
                            owner: '转学一',
                            integrationType: IntegrationTypeKey.base,
                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                            modules: [
                                {
                                    id: 'app2-c1-d4-1-m1',
                                    label: '转学申请',
                                    level: 'module',
                                    dept: '教育局',
                                    owner: '转学二'
                                }
                            ],
                            children: [
                                {
                                    id: 'app2-c1-d5-1',
                                    label: '跨省转学项目',
                                    level: 'office_single',
                                    dept: '教育局',
                                    owner: '转学三',
                                    integrationType: IntegrationTypeKey.base,
                                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                    modules: [
                                        {
                                            id: 'app2-c1-d5-1-m1',
                                            label: '跨省审核',
                                            level: 'module',
                                            dept: '教育局',
                                            owner: '转学四'
                                        }
                                    ],
                                    children: [
                                        {
                                            id: 'app2-c1-d6-1',
                                            label: '跨省转学任务A',
                                            level: 'office_single',
                                            dept: '教育局',
                                            owner: '转学五',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app2-c1-d6-1-m1',
                                                    label: '任务配置',
                                                    level: 'module',
                                                    dept: '教育局',
                                                    owner: '转学六'
                                                }
                                            ]
                                        },
                                        {
                                            id: 'app2-c1-d6-2',
                                            label: '跨省转学任务B',
                                            level: 'office_single',
                                            dept: '教育局',
                                            owner: '转学七',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app2-c1-d6-2-m1',
                                                    label: '任务审核',
                                                    level: 'module',
                                                    dept: '教育局',
                                                    owner: '转学八'
                                                }
                                            ]
                                        }
                                    ]
                                },
                                {
                                    id: 'app2-c1-d5-2',
                                    label: '省内转学项目',
                                    level: 'office_single',
                                    dept: '教育局',
                                    owner: '省内一',
                                    integrationType: IntegrationTypeKey.base,
                                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                    modules: [
                                        {
                                            id: 'app2-c1-d5-2-m1',
                                            label: '省内审核',
                                            level: 'module',
                                            dept: '教育局',
                                            owner: '省内二'
                                        }
                                    ],
                                    children: [
                                        {
                                            id: 'app2-c1-d6-3',
                                            label: '省内转学任务',
                                            level: 'office_single',
                                            dept: '教育局',
                                            owner: '省内三',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app2-c1-d6-3-m1',
                                                    label: '省内配置',
                                                    level: 'module',
                                                    dept: '教育局',
                                                    owner: '省内四'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'app2-c1-d4-2',
                            label: '休学办理团队',
                            level: 'office_single',
                            dept: '教育局',
                            owner: '休学一',
                            integrationType: IntegrationTypeKey.base,
                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                            modules: [
                                {
                                    id: 'app2-c1-d4-2-m1',
                                    label: '休学申请',
                                    level: 'module',
                                    dept: '教育局',
                                    owner: '休学二'
                                }
                            ],
                            children: [
                                {
                                    id: 'app2-c1-d5-3',
                                    label: '病假休学项目',
                                    level: 'office_single',
                                    dept: '教育局',
                                    owner: '病假一',
                                    integrationType: IntegrationTypeKey.base,
                                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                    modules: [
                                        {
                                            id: 'app2-c1-d5-3-m1',
                                            label: '病假审核',
                                            level: 'module',
                                            dept: '教育局',
                                            owner: '病假二'
                                        }
                                    ],
                                    children: [
                                        {
                                            id: 'app2-c1-d6-4',
                                            label: '病假休学任务',
                                            level: 'office_single',
                                            dept: '教育局',
                                            owner: '病假三',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app2-c1-d6-4-m1',
                                                    label: '病假配置',
                                                    level: 'module',
                                                    dept: '教育局',
                                                    owner: '病假四'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'app2-c2',
                    label: '毕业升学',
                    level: 'office_single',
                    dept: '教育局',
                    owner: '冯XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app2-c2-m1',
                            label: '毕业审核',
                            level: 'module',
                            dept: '教育局',
                            owner: '许XX'
                        },
                        {
                            id: 'app2-c2-m2',
                            label: '升学录取',
                            level: 'module',
                            dept: '教育局',
                            owner: '许XX'
                        },
                        {
                            id: 'app2-c2-m3',
                            label: '学籍档案',
                            level: 'module',
                            dept: '教育局',
                            owner: '许XX'
                        }
                    ]
                },
                {
                    id: 'app2-c3',
                    label: '数据上报',
                    level: 'office_single',
                    dept: '信息中心',
                    owner: '何XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app2-c3-m1',
                            label: '数据校验',
                            level: 'module',
                            dept: '信息中心',
                            owner: '曹XX'
                        },
                        {
                            id: 'app2-c3-m2',
                            label: '数据上报',
                            level: 'module',
                            dept: '信息中心',
                            owner: '曹XX'
                        },
                        {
                            id: 'app2-c3-m3',
                            label: '报表生成',
                            level: 'module',
                            dept: '信息中心',
                            owner: '曹XX'
                        }
                    ]
                }
            ]
        },
        {
            id: 'app3',
            label: '教师资格认定系统',
            level: 'dept_single',
            dept: '教育局',
            owner: '王XX',
            integrationType: IntegrationTypeKey.base,
            integrationTypeName: INTEGRATION_TYPE_NAME.base,
            modules: [
                {
                    id: 'app3-m1',
                    label: '资格申请',
                    level: 'module',
                    dept: '人事处',
                    owner: '吴XX'
                },
                {
                    id: 'app3-m2',
                    label: '资格审核',
                    level: 'module',
                    dept: '人事处',
                    owner: '郑XX'
                }
            ],
            children: [
                {
                    id: 'app5',
                    label: '招生录取管理',
                    level: 'dept_single',
                    dept: '招生办',
                    owner: '孙XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app5-m1',
                            label: '报名管理',
                            level: 'module',
                            dept: '招生办',
                            owner: '钱XX'
                        },
                        {
                            id: 'app5-m2',
                            label: '录取公示',
                            level: 'module',
                            dept: '招生办',
                            owner: '钱XX'
                        }
                    ]
                },
                {
                    id: 'app6',
                    label: '课题申报系统',
                    level: 'office_single',
                    dept: '科研处',
                    owner: '周XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app6-m1',
                            label: '课题申报',
                            level: 'module',
                            dept: '科研处',
                            owner: '吴XX'
                        },
                        {
                            id: 'app6-m2',
                            label: '课题评审',
                            level: 'module',
                            dept: '科研处',
                            owner: '郑XX'
                        }
                    ]
                },
                {
                    id: 'app3-c3',
                    label: '继续教育',
                    level: 'office_single',
                    dept: '人事处',
                    owner: '冯XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app3-c3-m1',
                            label: '培训管理',
                            level: 'module',
                            dept: '人事处',
                            owner: '许XX'
                        },
                        {
                            id: 'app3-c3-m2',
                            label: '学时认定',
                            level: 'module',
                            dept: '人事处',
                            owner: '许XX'
                        },
                        {
                            id: 'app3-c3-m3',
                            label: '证书管理',
                            level: 'module',
                            dept: '人事处',
                            owner: '许XX'
                        }
                    ]
                }
            ]
        },
        {
            id: 'app4',
            label: '教研成果登记',
            level: 'office_single',
            dept: '教研室',
            owner: '赵XX',
            integrationType: IntegrationTypeKey.base,
            integrationTypeName: INTEGRATION_TYPE_NAME.base,
            modules: [
                {
                    id: 'app4-m1',
                    label: '成果申报',
                    level: 'module',
                    dept: '教研室',
                    owner: '冯XX'
                }
            ],
            children: []
        },
        {
            id: 'app7',
            label: '校园安全管理',
            level: 'dept_composite',
            dept: '安保处',
            owner: '陈XX',
            integrationType: IntegrationTypeKey.base,
            integrationTypeName: INTEGRATION_TYPE_NAME.base,
            modules: [
                {
                    id: 'app7-m1',
                    label: '门禁管理',
                    level: 'module',
                    dept: '安保处',
                    owner: '杨XX'
                },
                {
                    id: 'app7-m2',
                    label: '视频监控',
                    level: 'module',
                    dept: '安保处',
                    owner: '杨XX'
                }
            ],
            children: [
                {
                    id: 'app7-c1',
                    label: '消防系统',
                    level: 'office_single',
                    dept: '安保处',
                    owner: '黄XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app7-c1-m1',
                            label: '火灾报警',
                            level: 'module',
                            dept: '安保处',
                            owner: '林XX'
                        },
                        {
                            id: 'app7-c1-m2',
                            label: '消防设施',
                            level: 'module',
                            dept: '安保处',
                            owner: '林XX'
                        },
                        {
                            id: 'app7-c1-m3',
                            label: '应急预案',
                            level: 'module',
                            dept: '安保处',
                            owner: '林XX'
                        }
                    ],
                    children: [
                        {
                            id: 'app7-c1-d4-1',
                            label: '火灾报警团队',
                            level: 'office_single',
                            dept: '安保处',
                            owner: '消防一',
                            integrationType: IntegrationTypeKey.base,
                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                            modules: [
                                {
                                    id: 'app7-c1-d4-1-m1',
                                    label: '报警配置',
                                    level: 'module',
                                    dept: '安保处',
                                    owner: '消防二'
                                }
                            ],
                            children: [
                                {
                                    id: 'app7-c1-d5-1',
                                    label: '烟雾报警项目',
                                    level: 'office_single',
                                    dept: '安保处',
                                    owner: '烟雾一',
                                    integrationType: IntegrationTypeKey.base,
                                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                    modules: [
                                        {
                                            id: 'app7-c1-d5-1-m1',
                                            label: '烟雾检测',
                                            level: 'module',
                                            dept: '安保处',
                                            owner: '烟雾二'
                                        }
                                    ],
                                    children: [
                                        {
                                            id: 'app7-c1-d6-1',
                                            label: '烟雾报警任务A',
                                            level: 'office_single',
                                            dept: '安保处',
                                            owner: '烟雾三',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app7-c1-d6-1-m1',
                                                    label: '烟雾配置',
                                                    level: 'module',
                                                    dept: '安保处',
                                                    owner: '烟雾四'
                                                }
                                            ]
                                        },
                                        {
                                            id: 'app7-c1-d6-2',
                                            label: '烟雾报警任务B',
                                            level: 'office_single',
                                            dept: '安保处',
                                            owner: '烟雾五',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app7-c1-d6-2-m1',
                                                    label: '烟雾通知',
                                                    level: 'module',
                                                    dept: '安保处',
                                                    owner: '烟雾六'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'app7-c1-d4-2',
                            label: '消防设施团队',
                            level: 'office_single',
                            dept: '安保处',
                            owner: '设施一',
                            integrationType: IntegrationTypeKey.base,
                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                            modules: [
                                {
                                    id: 'app7-c1-d4-2-m1',
                                    label: '设施巡检',
                                    level: 'module',
                                    dept: '安保处',
                                    owner: '设施二'
                                }
                            ],
                            children: [
                                {
                                    id: 'app7-c1-d5-2',
                                    label: '灭火器项目',
                                    level: 'office_single',
                                    dept: '安保处',
                                    owner: '灭火一',
                                    integrationType: IntegrationTypeKey.base,
                                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                    modules: [
                                        {
                                            id: 'app7-c1-d5-2-m1',
                                            label: '灭火器管理',
                                            level: 'module',
                                            dept: '安保处',
                                            owner: '灭火二'
                                        }
                                    ],
                                    children: [
                                        {
                                            id: 'app7-c1-d6-3',
                                            label: '灭火器巡检任务',
                                            level: 'office_single',
                                            dept: '安保处',
                                            owner: '灭火三',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app7-c1-d6-3-m1',
                                                    label: '巡检记录',
                                                    level: 'module',
                                                    dept: '安保处',
                                                    owner: '灭火四'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'app7-c2',
                    label: '值班管理',
                    level: 'office_single',
                    dept: '安保处',
                    owner: '梁XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app7-c2-m1',
                            label: '排班管理',
                            level: 'module',
                            dept: '安保处',
                            owner: '谢XX'
                        },
                        {
                            id: 'app7-c2-m2',
                            label: '考勤记录',
                            level: 'module',
                            dept: '安保处',
                            owner: '谢XX'
                        },
                        {
                            id: 'app7-c2-m3',
                            label: '交接班',
                            level: 'module',
                            dept: '安保处',
                            owner: '谢XX'
                        }
                    ]
                },
                {
                    id: 'app7-c3',
                    label: '访客管理',
                    level: 'office_single',
                    dept: '安保处',
                    owner: '宋XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app7-c3-m1',
                            label: '预约登记',
                            level: 'module',
                            dept: '安保处',
                            owner: '唐XX'
                        },
                        {
                            id: 'app7-c3-m2',
                            label: '证件扫描',
                            level: 'module',
                            dept: '安保处',
                            owner: '唐XX'
                        },
                        {
                            id: 'app7-c3-m3',
                            label: '访客记录',
                            level: 'module',
                            dept: '安保处',
                            owner: '唐XX'
                        }
                    ]
                }
            ]
        },
        {
            id: 'app8',
            label: '教育资源平台',
            level: 'dept_composite',
            dept: '信息中心',
            owner: '许XX',
            integrationType: IntegrationTypeKey.base,
            integrationTypeName: INTEGRATION_TYPE_NAME.base,
            modules: [
                {
                    id: 'app8-m1',
                    label: '资源上传',
                    level: 'module',
                    dept: '信息中心',
                    owner: '邓XX'
                },
                {
                    id: 'app8-m2',
                    label: '资源检索',
                    level: 'module',
                    dept: '信息中心',
                    owner: '邓XX'
                }
            ],
            children: [
                {
                    id: 'app8-c1',
                    label: '数字图书馆',
                    level: 'office_single',
                    dept: '图书馆',
                    owner: '韩XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app8-c1-m1',
                            label: '图书检索',
                            level: 'module',
                            dept: '图书馆',
                            owner: '曹XX'
                        },
                        {
                            id: 'app8-c1-m2',
                            label: '借阅管理',
                            level: 'module',
                            dept: '图书馆',
                            owner: '曹XX'
                        },
                        {
                            id: 'app8-c1-m3',
                            label: '电子资源',
                            level: 'module',
                            dept: '图书馆',
                            owner: '曹XX'
                        }
                    ]
                },
                {
                    id: 'app8-c2',
                    label: '在线课程',
                    level: 'office_single',
                    dept: '信息中心',
                    owner: '曾XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app8-c2-m1',
                            label: '课程发布',
                            level: 'module',
                            dept: '信息中心',
                            owner: '彭XX'
                        },
                        {
                            id: 'app8-c2-m2',
                            label: '视频点播',
                            level: 'module',
                            dept: '信息中心',
                            owner: '彭XX'
                        },
                        {
                            id: 'app8-c2-m3',
                            label: '学习记录',
                            level: 'module',
                            dept: '信息中心',
                            owner: '彭XX'
                        }
                    ]
                },
                {
                    id: 'app8-c3',
                    label: '题库系统',
                    level: 'office_single',
                    dept: '教研处',
                    owner: '肖XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app8-c3-m1',
                            label: '题目管理',
                            level: 'module',
                            dept: '教研处',
                            owner: '田XX'
                        },
                        {
                            id: 'app8-c3-m2',
                            label: '试卷生成',
                            level: 'module',
                            dept: '教研处',
                            owner: '田XX'
                        },
                        {
                            id: 'app8-c3-m3',
                            label: '成绩分析',
                            level: 'module',
                            dept: '教研处',
                            owner: '田XX'
                        }
                    ]
                }
            ]
        },
        {
            id: 'app9',
            label: '财务管理系统',
            level: 'dept_composite',
            dept: '财务处',
            owner: '董XX',
            integrationType: IntegrationTypeKey.base,
            integrationTypeName: INTEGRATION_TYPE_NAME.base,
            modules: [
                {
                    id: 'app9-m1',
                    label: '预算管理',
                    level: 'module',
                    dept: '财务处',
                    owner: '余XX'
                },
                {
                    id: 'app9-m2',
                    label: '报销管理',
                    level: 'module',
                    dept: '财务处',
                    owner: '余XX'
                }
            ],
            children: [
                {
                    id: 'app9-c1',
                    label: '工资管理',
                    level: 'office_single',
                    dept: '财务处',
                    owner: '吕XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app9-c1-m1',
                            label: '工资核算',
                            level: 'module',
                            dept: '财务处',
                            owner: '苏XX'
                        },
                        {
                            id: 'app9-c1-m2',
                            label: '社保公积金',
                            level: 'module',
                            dept: '财务处',
                            owner: '苏XX'
                        },
                        {
                            id: 'app9-c1-m3',
                            label: '个税申报',
                            level: 'module',
                            dept: '财务处',
                            owner: '苏XX'
                        }
                    ],
                    children: [
                        {
                            id: 'app9-c1-d4-1',
                            label: '工资核算团队',
                            level: 'office_single',
                            dept: '财务处',
                            owner: '核算一',
                            integrationType: IntegrationTypeKey.base,
                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                            modules: [
                                {
                                    id: 'app9-c1-d4-1-m1',
                                    label: '核算配置',
                                    level: 'module',
                                    dept: '财务处',
                                    owner: '核算二'
                                }
                            ],
                            children: [
                                {
                                    id: 'app9-c1-d5-1',
                                    label: '月度核算项目',
                                    level: 'office_single',
                                    dept: '财务处',
                                    owner: '月度一',
                                    integrationType: IntegrationTypeKey.base,
                                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                    modules: [
                                        {
                                            id: 'app9-c1-d5-1-m1',
                                            label: '月度计算',
                                            level: 'module',
                                            dept: '财务处',
                                            owner: '月度二'
                                        }
                                    ],
                                    children: [
                                        {
                                            id: 'app9-c1-d6-1',
                                            label: '月度核算任务A',
                                            level: 'office_single',
                                            dept: '财务处',
                                            owner: '月度三',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app9-c1-d6-1-m1',
                                                    label: '任务审核',
                                                    level: 'module',
                                                    dept: '财务处',
                                                    owner: '月度四'
                                                }
                                            ]
                                        },
                                        {
                                            id: 'app9-c1-d6-2',
                                            label: '月度核算任务B',
                                            level: 'office_single',
                                            dept: '财务处',
                                            owner: '月度五',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app9-c1-d6-2-m1',
                                                    label: '任务发布',
                                                    level: 'module',
                                                    dept: '财务处',
                                                    owner: '月度六'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        {
                            id: 'app9-c1-d4-2',
                            label: '社保管理团队',
                            level: 'office_single',
                            dept: '财务处',
                            owner: '社保一',
                            integrationType: IntegrationTypeKey.base,
                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                            modules: [
                                {
                                    id: 'app9-c1-d4-2-m1',
                                    label: '社保配置',
                                    level: 'module',
                                    dept: '财务处',
                                    owner: '社保二'
                                }
                            ],
                            children: [
                                {
                                    id: 'app9-c1-d5-2',
                                    label: '社保缴纳项目',
                                    level: 'office_single',
                                    dept: '财务处',
                                    owner: '缴纳一',
                                    integrationType: IntegrationTypeKey.base,
                                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                    modules: [
                                        {
                                            id: 'app9-c1-d5-2-m1',
                                            label: '缴纳计算',
                                            level: 'module',
                                            dept: '财务处',
                                            owner: '缴纳二'
                                        }
                                    ],
                                    children: [
                                        {
                                            id: 'app9-c1-d6-3',
                                            label: '社保缴纳任务',
                                            level: 'office_single',
                                            dept: '财务处',
                                            owner: '缴纳三',
                                            integrationType: IntegrationTypeKey.base,
                                            integrationTypeName: INTEGRATION_TYPE_NAME.base,
                                            modules: [
                                                {
                                                    id: 'app9-c1-d6-3-m1',
                                                    label: '缴纳记录',
                                                    level: 'module',
                                                    dept: '财务处',
                                                    owner: '缴纳四'
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    id: 'app9-c2',
                    label: '资产管理',
                    level: 'office_single',
                    dept: '财务处',
                    owner: '卢XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app9-c2-m1',
                            label: '资产登记',
                            level: 'module',
                            dept: '财务处',
                            owner: '蒋XX'
                        },
                        {
                            id: 'app9-c2-m2',
                            label: '折旧计算',
                            level: 'module',
                            dept: '财务处',
                            owner: '蒋XX'
                        },
                        {
                            id: 'app9-c2-m3',
                            label: '资产盘点',
                            level: 'module',
                            dept: '财务处',
                            owner: '蒋XX'
                        }
                    ]
                },
                {
                    id: 'app9-c3',
                    label: '采购管理',
                    level: 'office_single',
                    dept: '采购办',
                    owner: '蔡XX',
                    integrationType: IntegrationTypeKey.base,
                    integrationTypeName: INTEGRATION_TYPE_NAME.base,
                    modules: [
                        {
                            id: 'app9-c3-m1',
                            label: '采购申请',
                            level: 'module',
                            dept: '采购办',
                            owner: '丁XX'
                        },
                        {
                            id: 'app9-c3-m2',
                            label: '招标管理',
                            level: 'module',
                            dept: '采购办',
                            owner: '丁XX'
                        },
                        {
                            id: 'app9-c3-m3',
                            label: '合同管理',
                            level: 'module',
                            dept: '采购办',
                            owner: '丁XX'
                        }
                    ]
                }
            ]
        }
    ]
};
