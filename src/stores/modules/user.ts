import { defineStore } from 'pinia';
import { UserState } from '@/stores/type';
import piniaPersistConfig from '@/config/pinia-persist';

export const useUserStore = defineStore({
	id: 'gyl-user',
	state: (): UserState => {
		return {
			token: '',
			userInfo: {
				name: 'gyl',
				password: '',
			}
		};
	},
	getters: {},
	actions: {
		setToken(token: string) {
			this.token = token;
		},
		setUserInfo(userInfo: UserState['userInfo']) {
			this.userInfo = userInfo;
		}
	},
	persist: piniaPersistConfig('gyl-user')
});
