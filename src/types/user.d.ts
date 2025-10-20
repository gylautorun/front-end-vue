// 登录参数
export type LoginForm = {
    mobile: string,
    password: string
}


type roles = {
    menus: string[],
    points: string[],
    apis: string[]
}

export type UserProfile = {
    userId: string,
    mobile: string,
    username: string,
    roles: roles,
    companyId: string,
    company: string
}


export type UserInfo = {
    staffPhoto: string,
    id: string,
    mobile: string,
    username: string,
    password: string,
    timeOfEntry: string,
    workNumber: string,
    correctionTime: string,
    departmentName: string,
    roleIds: string[],
    companyId: string,
    companyName: string
}