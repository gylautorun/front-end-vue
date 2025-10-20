import { ResPage, User } from '@/api/interface/index';
import { PORT } from '@/api/config/service-port';
import Axios from '@/api';

/**
 * @name 用户管理模块
 */
// 获取用户列表
export const getUserList = (params: User.ReqUserParams) => {
	return Axios.post<ResPage<User.ResUserList>>(PORT + `/user/list`, params);
};

// 批量添加用户
export const BatchAddUser = (params: FormData) => {
	return Axios.post(PORT + `/user/import`, params);
};

// 导出用户数据
export const exportUserInfo = (params: User.ReqUserParams) => {
	return Axios.download(PORT + `/user/export`, params);
};

// 重置用户密码
export const resetUserPassWord = (params: { id: string }) => {
	return Axios.post(PORT + `/user/rest_password`, params);
};

// 删除用户
export const deleteUser = (params: { id: string[] }) => {
	return Axios.post(PORT + `/user/delete`, params);
};

// 切换用户状态
export const changeUserStatus = (params: { id: string; status: number }) => {
	return Axios.post(PORT + `/user/change`, params);
};
