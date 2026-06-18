/**
 * Mock 数据（教育局应用体系）
 * ----------------------------------------------------------------------------
 * 提供一个完整的初始树形结构用于演示 D3 树形图：
 *   - 根节点：教育局
 *   - 子节点：教育管理一体化平台 / 学生学籍管理系统 / 教师资格认定系统 / 教研成果登记
 *   - 兄弟节点：招生录取管理 / 课表申报系统（用于展示"整合/迁移/对接"关系）
 *
 * 步骤：
 *   1. 根组件 index.vue 启动时调用 deepClone(initialTreeData) 得到当前树
 *   2. 通过 props 传给 GraphCanvas → d3Tree.initD3()
 *   3. d3.tree() 用此数据构建 Hierarchy 模型并渲染
 *   4. 节点上的 integrationType (key) 决定连线颜色（参考 EDGE_STYLES）
 *      中文名通过 INTEGRATION_TYPE_NAME[key] 获取，写入 integrationTypeName
 *
 * isLeaf 字段说明：
 *   - isLeaf: true → 叶子节点，无子节点，不显示展开按钮
 *   - isLeaf: false + children: [...] → 非叶子节点，有子节点，正常展开/收起
 *   - isLeaf: false + children: [] → 非叶子节点，需要异步加载子节点
 */
import type { TreeData } from '../types';
import {
    INTEGRATION_TYPE_NAME,
    IntegrationTypeKey,
    ROOT_DEFAULT_MERGE_MARKER,
    LevelKey
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
 *   isLeaf               true/false   - 是否叶子节点（用于异步加载场景）
 *
 * 子节点示例（app1 - 教育管理一体化平台）：
 *   - integrationType: 'merge' → 连线用 EDGE_STYLES.merge = 红色
 *   - integrationTypeName: '合并'
 *   - modules: 该节点下的功能模块（叶子节点）
 *   - isLeaf: false → 有子节点，需要展开/收起
 *
 * 兄弟节点示例（app2 - 学生学籍管理系统）：
 *   - integrationType: 'migrate' → 连线用 EDGE_STYLES.migrate = 蓝色
 *   - integrationTypeName: '迁移'
 */
export const initialTreeData: TreeData = {
    id: 'edu',
    label: '教育局',
    level: LevelKey.Domain,
    dept: '教育局',
    owner: '管理员',
    isLeaf: false,
    integratedFrom: [ROOT_DEFAULT_MERGE_MARKER],
    children: [
        {
            id: 'app1',
            label: '教育管理一体化平台',
            level: LevelKey.Domain,
            dept: '教育局',
            owner: '李XX',
            isLeaf: false,
            integrationType: IntegrationTypeKey.merge,
            integrationTypeName: INTEGRATION_TYPE_NAME.merge,
            modules: [
                {
                    id: 'app1-m1',
                    label: '用户管理',
                    level: LevelKey.Module,
                    dept: '教育局',
                    owner: '王XX'
                },
                {
                    id: 'app1-m2',
                    label: '权限管理',
                    level: LevelKey.Module,
                    dept: '教育局',
                    owner: '王XX'
                },
                {
                    id: 'app1-m3',
                    label: '数据统计',
                    level: LevelKey.Module,
                    dept: '教育局',
                    owner: '赵XX'
                }
            ],
            children: [
                {
                    id: 'app1-c1',
                    label: '数据中心',
                    level: LevelKey.OfficeSingle,
                    dept: '教育局',
                    owner: '刘XX',
                    isLeaf: true,
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        {
                            id: 'app1-c1-m1',
                            label: '数据同步',
                            level: LevelKey.Module,
                            dept: '教育局',
                            owner: '陈XX'
                        },
                        {
                            id: 'app1-c1-m2',
                            label: '数据备份',
                            level: LevelKey.Module,
                            dept: '教育局',
                            owner: '陈XX'
                        },
                        {
                            id: 'app1-c1-m3',
                            label: '数据分析',
                            level: LevelKey.Module,
                            dept: '教育局',
                            owner: '陈XX'
                        }
                    ]
                },
                {
                    id: 'app1-c2',
                    label: '系统监控',
                    level: LevelKey.OfficeSingle,
                    dept: '信息中心',
                    owner: '杨XX',
                    isLeaf: true,
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        {
                            id: 'app1-c2-m1',
                            label: '性能监控',
                            level: LevelKey.Module,
                            dept: '信息中心',
                            owner: '黄XX'
                        },
                        {
                            id: 'app1-c2-m2',
                            label: '日志管理',
                            level: LevelKey.Module,
                            dept: '信息中心',
                            owner: '黄XX'
                        },
                        {
                            id: 'app1-c2-m3',
                            label: '告警通知',
                            level: LevelKey.Module,
                            dept: '信息中心',
                            owner: '黄XX'
                        }
                    ]
                },
                {
                    id: 'app1-c3',
                    label: '权限中心',
                    level: LevelKey.OfficeSingle,
                    dept: '信息中心',
                    owner: '周XX',
                    isLeaf: true,
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        {
                            id: 'app1-c3-m1',
                            label: '角色管理',
                            level: LevelKey.Module,
                            dept: '信息中心',
                            owner: '吴XX'
                        },
                        {
                            id: 'app1-c3-m2',
                            label: '权限配置',
                            level: LevelKey.Module,
                            dept: '信息中心',
                            owner: '吴XX'
                        },
                        {
                            id: 'app1-c3-m3',
                            label: '审计日志',
                            level: LevelKey.Module,
                            dept: '信息中心',
                            owner: '吴XX'
                        }
                    ]
                }
            ],
            relations: [
                {
                    targetId: 'app2',
                    targetName: '学生学籍管理系统',
                    type: IntegrationTypeKey.integration,
                    name: '接口对接'
                }
            ]
        },
        {
            id: 'app2',
            label: '学生学籍管理系统',
            level: LevelKey.DeptComposite,
            dept: '教育局',
            owner: '张XX',
            isLeaf: false,
            integrationType: IntegrationTypeKey.migrate,
            integrationTypeName: INTEGRATION_TYPE_NAME.migrate,
            modules: [
                {
                    id: 'app2-m1',
                    label: '学籍录入',
                    level: LevelKey.Module,
                    dept: '教育局',
                    owner: '孙XX'
                },
                {
                    id: 'app2-m2',
                    label: '学籍变更',
                    level: LevelKey.Module,
                    dept: '教育局',
                    owner: '孙XX'
                },
                {
                    id: 'app2-m3',
                    label: '毕业管理',
                    level: LevelKey.Module,
                    dept: '教育局',
                    owner: '李XX'
                },
                {
                    id: 'app2-m4',
                    label: '学籍查询',
                    level: LevelKey.Module,
                    dept: '教育局',
                    owner: '周XX'
                }
            ],
            children: [
                {
                    id: 'app2-c1',
                    label: '学籍异动',
                    level: LevelKey.OfficeSingle,
                    dept: '教育局',
                    owner: '郑XX',
                    isLeaf: true,
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        {
                            id: 'app2-c1-m1',
                            label: '转学管理',
                            level: LevelKey.Module,
                            dept: '教育局',
                            owner: '王XX'
                        },
                        {
                            id: 'app2-c1-m2',
                            label: '休学管理',
                            level: LevelKey.Module,
                            dept: '教育局',
                            owner: '王XX'
                        },
                        {
                            id: 'app2-c1-m3',
                            label: '复学管理',
                            level: LevelKey.Module,
                            dept: '教育局',
                            owner: '王XX'
                        }
                    ]
                },
                {
                    id: 'app2-c2',
                    label: '毕业升学',
                    level: LevelKey.OfficeSingle,
                    dept: '教育局',
                    owner: '冯XX',
                    isLeaf: true,
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        {
                            id: 'app2-c2-m1',
                            label: '毕业审核',
                            level: LevelKey.Module,
                            dept: '教育局',
                            owner: '许XX'
                        },
                        {
                            id: 'app2-c2-m2',
                            label: '升学录取',
                            level: LevelKey.Module,
                            dept: '教育局',
                            owner: '许XX'
                        },
                        {
                            id: 'app2-c2-m3',
                            label: '学籍档案',
                            level: LevelKey.Module,
                            dept: '教育局',
                            owner: '许XX'
                        }
                    ]
                },
                {
                    id: 'app2-c3',
                    label: '数据上报',
                    level: LevelKey.OfficeSingle,
                    dept: '信息中心',
                    owner: '何XX',
                    isLeaf: false,
                    children: [],
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        {
                            id: 'app2-c3-m1',
                            label: '数据校验',
                            level: LevelKey.Module,
                            dept: '信息中心',
                            owner: '曹XX'
                        },
                        {
                            id: 'app2-c3-m2',
                            label: '数据上报',
                            level: LevelKey.Module,
                            dept: '信息中心',
                            owner: '曹XX'
                        },
                        {
                            id: 'app2-c3-m3',
                            label: '报表生成',
                            level: LevelKey.Module,
                            dept: '信息中心',
                            owner: '曹XX'
                        }
                    ]
                }
            ],
            relations: [
                {
                    targetId: 'app1',
                    targetName: '教育管理一体化平台',
                    type: IntegrationTypeKey.integration,
                    name: '接口对接'
                }
            ]
        },
        {
            id: 'app3',
            label: '教师资格认定系统',
            level: LevelKey.DeptSingle,
            dept: '教育局',
            owner: '王XX',
            isLeaf: false,
            integrationType: IntegrationTypeKey.integration,
            integrationTypeName: INTEGRATION_TYPE_NAME.integration,
            modules: [
                {
                    id: 'app3-m1',
                    label: '资格申请',
                    level: LevelKey.Module,
                    dept: '人事处',
                    owner: '吴XX'
                },
                {
                    id: 'app3-m2',
                    label: '资格审核',
                    level: LevelKey.Module,
                    dept: '人事处',
                    owner: '郑XX'
                }
            ],
            children: [
                {
                    id: 'app5',
                    label: '招生录取管理',
                    level: LevelKey.DeptSingle,
                    dept: '招生办',
                    owner: '孙XX',
                    isLeaf: true,
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        {
                            id: 'app5-m1',
                            label: '报名管理',
                            level: LevelKey.Module,
                            dept: '招生办',
                            owner: '钱XX'
                        },
                        {
                            id: 'app5-m2',
                            label: '录取公示',
                            level: LevelKey.Module,
                            dept: '招生办',
                            owner: '钱XX'
                        }
                    ]
                },
                {
                    id: 'app6',
                    label: '课题申报系统',
                    level: LevelKey.OfficeSingle,
                    dept: '科研处',
                    owner: '周XX',
                    isLeaf: false,
                    children: [],
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        {
                            id: 'app6-m1',
                            label: '课题申报',
                            level: LevelKey.Module,
                            dept: '科研处',
                            owner: '吴XX'
                        },
                        {
                            id: 'app6-m2',
                            label: '课题评审',
                            level: LevelKey.Module,
                            dept: '科研处',
                            owner: '郑XX'
                        }
                    ]
                },
                {
                    id: 'app3-c3',
                    label: '继续教育',
                    level: LevelKey.OfficeSingle,
                    dept: '人事处',
                    owner: '冯XX',
                    isLeaf: true,
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        {
                            id: 'app3-c3-m1',
                            label: '培训管理',
                            level: LevelKey.Module,
                            dept: '人事处',
                            owner: '许XX'
                        },
                        {
                            id: 'app3-c3-m2',
                            label: '学时认定',
                            level: LevelKey.Module,
                            dept: '人事处',
                            owner: '许XX'
                        },
                        {
                            id: 'app3-c3-m3',
                            label: '证书管理',
                            level: LevelKey.Module,
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
            level: LevelKey.OfficeSingle,
            dept: '教研室',
            owner: '赵XX',
            isLeaf: true,
            integrationType: IntegrationTypeKey.deprecate,
            integrationTypeName: INTEGRATION_TYPE_NAME.deprecate,
            modules: [
                {
                    id: 'app4-m1',
                    label: '成果申报',
                    level: LevelKey.Module,
                    dept: '教研室',
                    owner: '冯XX'
                }
            ],
            children: []
        },
        {
            id: 'app7',
            label: '校园安全管理',
            level: LevelKey.DeptComposite,
            dept: '安保处',
            owner: '陈XX',
            isLeaf: false,
            integrationType: IntegrationTypeKey.module_merge,
            integrationTypeName: INTEGRATION_TYPE_NAME.module_merge,
            modules: [
                {
                    id: 'app7-m1',
                    label: '门禁管理',
                    level: LevelKey.Module,
                    dept: '安保处',
                    owner: '杨XX'
                },
                {
                    id: 'app7-m2',
                    label: '视频监控',
                    level: LevelKey.Module,
                    dept: '安保处',
                    owner: '杨XX'
                }
            ],
            children: [
                {
                    id: 'app7-c1',
                    label: '消防系统',
                    level: LevelKey.OfficeSingle,
                    dept: '安保处',
                    owner: '黄XX',
                    isLeaf: true,
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        {
                            id: 'app7-c1-m1',
                            label: '火灾报警',
                            level: LevelKey.Module,
                            dept: '安保处',
                            owner: '林XX'
                        },
                        {
                            id: 'app7-c1-m2',
                            label: '消防设施',
                            level: LevelKey.Module,
                            dept: '安保处',
                            owner: '林XX'
                        },
                        {
                            id: 'app7-c1-m3',
                            label: '应急预案',
                            level: LevelKey.Module,
                            dept: '安保处',
                            owner: '林XX'
                        }
                    ]
                },
                {
                    id: 'app7-c2',
                    label: '值班管理',
                    level: LevelKey.OfficeSingle,
                    dept: '安保处',
                    owner: '梁XX',
                    isLeaf: true,
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        {
                            id: 'app7-c2-m1',
                            label: '排班管理',
                            level: LevelKey.Module,
                            dept: '安保处',
                            owner: '谢XX'
                        },
                        {
                            id: 'app7-c2-m2',
                            label: '考勤记录',
                            level: LevelKey.Module,
                            dept: '安保处',
                            owner: '谢XX'
                        },
                        {
                            id: 'app7-c2-m3',
                            label: '交接班',
                            level: LevelKey.Module,
                            dept: '安保处',
                            owner: '谢XX'
                        }
                    ]
                },
                {
                    id: 'app7-c3',
                    label: '访客管理',
                    level: LevelKey.OfficeSingle,
                    dept: '安保处',
                    owner: '宋XX',
                    isLeaf: true,
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        {
                            id: 'app7-c3-m1',
                            label: '预约登记',
                            level: LevelKey.Module,
                            dept: '安保处',
                            owner: '唐XX'
                        },
                        {
                            id: 'app7-c3-m2',
                            label: '证件扫描',
                            level: LevelKey.Module,
                            dept: '安保处',
                            owner: '唐XX'
                        },
                        {
                            id: 'app7-c3-m3',
                            label: '访客记录',
                            level: LevelKey.Module,
                            dept: '安保处',
                            owner: '唐XX'
                        }
                    ]
                }
            ]
        },
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
