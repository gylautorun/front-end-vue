import { UserBaseInfo } from "@/api/common/type";
import {RouteRecord} from 'vue-router'
import {Permissions} from '@/api/common/type'

interface UserType {
    roles: string[],
    token: string,
    permissions: Permissions, // 角色权限
    // avatar: "",
    expires_in: 0,
    userInfo: UserBaseInfo
}

interface MenuType {
    sidebarRouters:any[],
    accessedRoutes: RouteRecord[] 
}

export {
    UserType,
    MenuType 
}