import { Role } from '@/api/interface/index';
import { PORT } from '@/api/config/service-port';
import Axios from '@/api';

/**
 * @name 角色管理模块
 */
// 角色列表
export const getRolesListApi = () => {
	return Axios.get<Role.RoleList[]>(PORT + `/basicRole/list`);
};
