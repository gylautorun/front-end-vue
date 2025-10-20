import { Login } from '@/api/interface/index';
import { PORT } from '@/api/config/service-port';
import Axios from '@/api';
import { Menu } from '@/types/global';

/**
 * @name 登录模块
 */
// * 用户登录
export const loginApi = (params: Login.ReqLoginForm) => {
	// 正常 post json 请求
	return Axios.post<Login.ResLogin>(PORT + `/login`, params, { noLoading: true });
};

// * 获取菜单列表
export const getAuthMenuListApi = () => {
	return Axios.get<Menu.MenuOptions[]>(PORT + `/menu/list`, {}, { noLoading: true });
};

// * 获取按钮权限
export const getAuthButtonListApi = () => {
	return Axios.get<Login.ResAuthButtons>(PORT + `/auth/buttons`, {}, { noLoading: true });
};

// * 用户退出登录
export const logoutApi = () => {
	return Axios.post(PORT + `/logout`);
};
