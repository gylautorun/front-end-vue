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
 */
import type { TreeData } from '../types';
import { INTEGRATION_TYPE_NAME, IntegrationTypeKey } from '../types';

/**
 * 初始树数据
 * ----------------------------------------------------------------------------
 * 字段与 TreeData 类型对应：
 *   id                   'edu'        - 根节点固定 ID，index.vue 用它过滤
 *   label                '教育局'     - 根节点显示名
 *   level                '领域级应用' - 对应 NODE_COLORS['领域级应用'] = 红色
 *   dept                 '教育局'     - 所属部门
 *   owner                '管理员'     - 负责人
 *   integrationType      缺省         - 根节点不画连线，无此属性
 *   integrationTypeName  缺省         - 同上
 *   children             [...]        - 第一层子节点
 *   modules              缺省         - 根节点下没有功能模块
 *
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
    level: '领域级应用',
    dept: '教育局',
    owner: '管理员',
    children: [
        {
            id: 'app1',
            label: '教育管理一体化平台',
            level: '领域级应用',
            dept: '教育局',
            owner: '李XX',
            integrationType: IntegrationTypeKey.merge,
            integrationTypeName: INTEGRATION_TYPE_NAME.merge,
            modules: [
                {
                    id: 'app1-m1',
                    label: '用户管理',
                    level: '功能模块',
                    dept: '教育局',
                    owner: '王XX'
                },
                {
                    id: 'app1-m2',
                    label: '权限管理',
                    level: '功能模块',
                    dept: '教育局',
                    owner: '王XX'
                },
                {
                    id: 'app1-m3',
                    label: '数据统计',
                    level: '功能模块',
                    dept: '教育局',
                    owner: '赵XX'
                }
            ],
            children: [
                {
                    id: 'app1-c1',
                    label: '数据中心',
                    level: '处室级单点应用',
                    dept: '教育局',
                    owner: '刘XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        { id: 'app1-c1-m1', label: '数据同步', level: '功能模块', dept: '教育局', owner: '陈XX' },
                        { id: 'app1-c1-m2', label: '数据备份', level: '功能模块', dept: '教育局', owner: '陈XX' },
                        { id: 'app1-c1-m3', label: '数据分析', level: '功能模块', dept: '教育局', owner: '陈XX' }
                    ]
                },
                {
                    id: 'app1-c2',
                    label: '系统监控',
                    level: '处室级单点应用',
                    dept: '信息中心',
                    owner: '杨XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        { id: 'app1-c2-m1', label: '性能监控', level: '功能模块', dept: '信息中心', owner: '黄XX' },
                        { id: 'app1-c2-m2', label: '日志管理', level: '功能模块', dept: '信息中心', owner: '黄XX' },
                        { id: 'app1-c2-m3', label: '告警通知', level: '功能模块', dept: '信息中心', owner: '黄XX' }
                    ]
                },
                {
                    id: 'app1-c3',
                    label: '权限中心',
                    level: '处室级单点应用',
                    dept: '信息中心',
                    owner: '周XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        { id: 'app1-c3-m1', label: '角色管理', level: '功能模块', dept: '信息中心', owner: '吴XX' },
                        { id: 'app1-c3-m2', label: '权限配置', level: '功能模块', dept: '信息中心', owner: '吴XX' },
                        { id: 'app1-c3-m3', label: '审计日志', level: '功能模块', dept: '信息中心', owner: '吴XX' }
                    ]
                }
            ],
            relations: [
                {
                    targetId: 'app2',
                    targetName: '学生学籍管理系统',
                    type: IntegrationTypeKey.integration
                }
            ]
        },
        {
            id: 'app2',
            label: '学生学籍管理系统',
            level: '部门级综合应用',
            dept: '教育局',
            owner: '张XX',
            integrationType: IntegrationTypeKey.migrate,
            integrationTypeName: INTEGRATION_TYPE_NAME.migrate,
            modules: [
                {
                    id: 'app2-m1',
                    label: '学籍录入',
                    level: '功能模块',
                    dept: '教育局',
                    owner: '孙XX'
                },
                {
                    id: 'app2-m2',
                    label: '学籍变更',
                    level: '功能模块',
                    dept: '教育局',
                    owner: '孙XX'
                },
                {
                    id: 'app2-m3',
                    label: '毕业管理',
                    level: '功能模块',
                    dept: '教育局',
                    owner: '李XX'
                },
                {
                    id: 'app2-m4',
                    label: '学籍查询',
                    level: '功能模块',
                    dept: '教育局',
                    owner: '周XX'
                }
            ],
            children: [
                {
                    id: 'app2-c1',
                    label: '学籍异动',
                    level: '处室级单点应用',
                    dept: '教育局',
                    owner: '郑XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        { id: 'app2-c1-m1', label: '转学管理', level: '功能模块', dept: '教育局', owner: '王XX' },
                        { id: 'app2-c1-m2', label: '休学管理', level: '功能模块', dept: '教育局', owner: '王XX' },
                        { id: 'app2-c1-m3', label: '复学管理', level: '功能模块', dept: '教育局', owner: '王XX' }
                    ]
                },
                {
                    id: 'app2-c2',
                    label: '毕业升学',
                    level: '处室级单点应用',
                    dept: '教育局',
                    owner: '冯XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        { id: 'app2-c2-m1', label: '毕业审核', level: '功能模块', dept: '教育局', owner: '许XX' },
                        { id: 'app2-c2-m2', label: '升学录取', level: '功能模块', dept: '教育局', owner: '许XX' },
                        { id: 'app2-c2-m3', label: '学籍档案', level: '功能模块', dept: '教育局', owner: '许XX' }
                    ]
                },
                {
                    id: 'app2-c3',
                    label: '数据上报',
                    level: '处室级单点应用',
                    dept: '信息中心',
                    owner: '何XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        { id: 'app2-c3-m1', label: '数据校验', level: '功能模块', dept: '信息中心', owner: '曹XX' },
                        { id: 'app2-c3-m2', label: '数据上报', level: '功能模块', dept: '信息中心', owner: '曹XX' },
                        { id: 'app2-c3-m3', label: '报表生成', level: '功能模块', dept: '信息中心', owner: '曹XX' }
                    ]
                }
            ],
            relations: [
                {
                    targetId: 'app1',
                    targetName: '教育管理一体化平台',
                    type: IntegrationTypeKey.integration
                }
            ]
        },
        {
            id: 'app3',
            label: '教师资格认定系统',
            level: '部门级单点应用',
            dept: '教育局',
            owner: '王XX',
            integrationType: IntegrationTypeKey.integration,
            integrationTypeName: INTEGRATION_TYPE_NAME.integration,
            modules: [
                {
                    id: 'app3-m1',
                    label: '资格申请',
                    level: '功能模块',
                    dept: '人事处',
                    owner: '吴XX'
                },
                {
                    id: 'app3-m2',
                    label: '资格审核',
                    level: '功能模块',
                    dept: '人事处',
                    owner: '郑XX'
                }
            ],
            children: [
                {
                    id: 'app5',
                    label: '招生录取管理',
                    level: '部门级单点应用',
                    dept: '招生办',
                    owner: '孙XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        {
                            id: 'app5-m1',
                            label: '报名管理',
                            level: '功能模块',
                            dept: '招生办',
                            owner: '钱XX'
                        },
                        {
                            id: 'app5-m2',
                            label: '录取公示',
                            level: '功能模块',
                            dept: '招生办',
                            owner: '钱XX'
                        }
                    ]
                },
                {
                    id: 'app6',
                    label: '课题申报系统',
                    level: '处室级单点应用',
                    dept: '科研处',
                    owner: '周XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        {
                            id: 'app6-m1',
                            label: '课题申报',
                            level: '功能模块',
                            dept: '科研处',
                            owner: '吴XX'
                        },
                        {
                            id: 'app6-m2',
                            label: '课题评审',
                            level: '功能模块',
                            dept: '科研处',
                            owner: '郑XX'
                        }
                    ]
                },
                {
                    id: 'app3-c3',
                    label: '继续教育',
                    level: '处室级单点应用',
                    dept: '人事处',
                    owner: '冯XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        { id: 'app3-c3-m1', label: '培训管理', level: '功能模块', dept: '人事处', owner: '许XX' },
                        { id: 'app3-c3-m2', label: '学时认定', level: '功能模块', dept: '人事处', owner: '许XX' },
                        { id: 'app3-c3-m3', label: '证书管理', level: '功能模块', dept: '人事处', owner: '许XX' }
                    ]
                }
            ]
        },
        {
            id: 'app4',
            label: '教研成果登记',
            level: '处室级单点应用',
            dept: '教研室',
            owner: '赵XX',
            integrationType: IntegrationTypeKey.deprecate,
            integrationTypeName: INTEGRATION_TYPE_NAME.deprecate,
            modules: [
                {
                    id: 'app4-m1',
                    label: '成果申报',
                    level: '功能模块',
                    dept: '教研室',
                    owner: '冯XX'
                }
            ],
            children: []
        },
        {
            id: 'app7',
            label: '校园安全管理',
            level: '部门级综合应用',
            dept: '安保处',
            owner: '陈XX',
            integrationType: IntegrationTypeKey.module_merge,
            integrationTypeName: INTEGRATION_TYPE_NAME.module_merge,
            modules: [
                {
                    id: 'app7-m1',
                    label: '门禁管理',
                    level: '功能模块',
                    dept: '安保处',
                    owner: '杨XX'
                },
                {
                    id: 'app7-m2',
                    label: '视频监控',
                    level: '功能模块',
                    dept: '安保处',
                    owner: '杨XX'
                }
            ],
            children: [
                {
                    id: 'app7-c1',
                    label: '消防系统',
                    level: '处室级单点应用',
                    dept: '安保处',
                    owner: '黄XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        { id: 'app7-c1-m1', label: '火灾报警', level: '功能模块', dept: '安保处', owner: '林XX' },
                        { id: 'app7-c1-m2', label: '消防设施', level: '功能模块', dept: '安保处', owner: '林XX' },
                        { id: 'app7-c1-m3', label: '应急预案', level: '功能模块', dept: '安保处', owner: '林XX' }
                    ]
                },
                {
                    id: 'app7-c2',
                    label: '值班管理',
                    level: '处室级单点应用',
                    dept: '安保处',
                    owner: '梁XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        { id: 'app7-c2-m1', label: '排班管理', level: '功能模块', dept: '安保处', owner: '谢XX' },
                        { id: 'app7-c2-m2', label: '考勤记录', level: '功能模块', dept: '安保处', owner: '谢XX' },
                        { id: 'app7-c2-m3', label: '交接班', level: '功能模块', dept: '安保处', owner: '谢XX' }
                    ]
                },
                {
                    id: 'app7-c3',
                    label: '访客管理',
                    level: '处室级单点应用',
                    dept: '安保处',
                    owner: '宋XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        { id: 'app7-c3-m1', label: '预约登记', level: '功能模块', dept: '安保处', owner: '唐XX' },
                        { id: 'app7-c3-m2', label: '证件扫描', level: '功能模块', dept: '安保处', owner: '唐XX' },
                        { id: 'app7-c3-m3', label: '访客记录', level: '功能模块', dept: '安保处', owner: '唐XX' }
                    ]
                }
            ]
        },
        {
            id: 'app8',
            label: '教育资源平台',
            level: '部门级综合应用',
            dept: '信息中心',
            owner: '许XX',
            integrationType: IntegrationTypeKey.integration,
            integrationTypeName: INTEGRATION_TYPE_NAME.integration,
            modules: [
                {
                    id: 'app8-m1',
                    label: '资源上传',
                    level: '功能模块',
                    dept: '信息中心',
                    owner: '邓XX'
                },
                {
                    id: 'app8-m2',
                    label: '资源检索',
                    level: '功能模块',
                    dept: '信息中心',
                    owner: '邓XX'
                }
            ],
            children: [
                {
                    id: 'app8-c1',
                    label: '数字图书馆',
                    level: '处室级单点应用',
                    dept: '图书馆',
                    owner: '韩XX',
                    integrationType: IntegrationTypeKey.merge,
                    integrationTypeName: INTEGRATION_TYPE_NAME.merge,
                    modules: [
                        { id: 'app8-c1-m1', label: '图书检索', level: '功能模块', dept: '图书馆', owner: '曹XX' },
                        { id: 'app8-c1-m2', label: '借阅管理', level: '功能模块', dept: '图书馆', owner: '曹XX' },
                        { id: 'app8-c1-m3', label: '电子资源', level: '功能模块', dept: '图书馆', owner: '曹XX' }
                    ]
                },
                {
                    id: 'app8-c2',
                    label: '在线课程',
                    level: '处室级单点应用',
                    dept: '信息中心',
                    owner: '曾XX',
                    integrationType: IntegrationTypeKey.merge,
                    integrationTypeName: INTEGRATION_TYPE_NAME.merge,
                    modules: [
                        { id: 'app8-c2-m1', label: '课程发布', level: '功能模块', dept: '信息中心', owner: '彭XX' },
                        { id: 'app8-c2-m2', label: '视频点播', level: '功能模块', dept: '信息中心', owner: '彭XX' },
                        { id: 'app8-c2-m3', label: '学习记录', level: '功能模块', dept: '信息中心', owner: '彭XX' }
                    ]
                },
                {
                    id: 'app8-c3',
                    label: '题库系统',
                    level: '处室级单点应用',
                    dept: '教研处',
                    owner: '肖XX',
                    integrationType: IntegrationTypeKey.merge,
                    integrationTypeName: INTEGRATION_TYPE_NAME.merge,
                    modules: [
                        { id: 'app8-c3-m1', label: '题目管理', level: '功能模块', dept: '教研处', owner: '田XX' },
                        { id: 'app8-c3-m2', label: '试卷生成', level: '功能模块', dept: '教研处', owner: '田XX' },
                        { id: 'app8-c3-m3', label: '成绩分析', level: '功能模块', dept: '教研处', owner: '田XX' }
                    ]
                }
            ]
        },
        {
            id: 'app9',
            label: '财务管理系统',
            level: '部门级综合应用',
            dept: '财务处',
            owner: '董XX',
            integrationType: IntegrationTypeKey.migrate,
            integrationTypeName: INTEGRATION_TYPE_NAME.migrate,
            modules: [
                {
                    id: 'app9-m1',
                    label: '预算管理',
                    level: '功能模块',
                    dept: '财务处',
                    owner: '余XX'
                },
                {
                    id: 'app9-m2',
                    label: '报销管理',
                    level: '功能模块',
                    dept: '财务处',
                    owner: '余XX'
                }
            ],
            children: [
                {
                    id: 'app9-c1',
                    label: '工资管理',
                    level: '处室级单点应用',
                    dept: '财务处',
                    owner: '吕XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        { id: 'app9-c1-m1', label: '工资核算', level: '功能模块', dept: '财务处', owner: '苏XX' },
                        { id: 'app9-c1-m2', label: '社保公积金', level: '功能模块', dept: '财务处', owner: '苏XX' },
                        { id: 'app9-c1-m3', label: '个税申报', level: '功能模块', dept: '财务处', owner: '苏XX' }
                    ]
                },
                {
                    id: 'app9-c2',
                    label: '资产管理',
                    level: '处室级单点应用',
                    dept: '财务处',
                    owner: '卢XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        { id: 'app9-c2-m1', label: '资产登记', level: '功能模块', dept: '财务处', owner: '蒋XX' },
                        { id: 'app9-c2-m2', label: '折旧计算', level: '功能模块', dept: '财务处', owner: '蒋XX' },
                        { id: 'app9-c2-m3', label: '资产盘点', level: '功能模块', dept: '财务处', owner: '蒋XX' }
                    ]
                },
                {
                    id: 'app9-c3',
                    label: '采购管理',
                    level: '处室级单点应用',
                    dept: '采购办',
                    owner: '蔡XX',
                    integrationType: IntegrationTypeKey.integration,
                    integrationTypeName: INTEGRATION_TYPE_NAME.integration,
                    modules: [
                        { id: 'app9-c3-m1', label: '采购申请', level: '功能模块', dept: '采购办', owner: '丁XX' },
                        { id: 'app9-c3-m2', label: '招标管理', level: '功能模块', dept: '采购办', owner: '丁XX' },
                        { id: 'app9-c3-m3', label: '合同管理', level: '功能模块', dept: '采购办', owner: '丁XX' }
                    ]
                }
            ]
        }
    ]
};
