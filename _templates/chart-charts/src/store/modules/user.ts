// 用户相关
import { defineStore } from "pinia";
import { setToken, setExpiresIn, getToken } from "@/utils/auth";
import { UserType } from "./type";

export const useUserStoreHook = defineStore({
  id: "userStoreHook",
  state: (): UserType => ({
    roles: [],
    token: getToken(),
    permissions: [],
    // avatar: "",
    expires_in: 0,
    userInfo: {}
  }),
  actions: {
    setRoles(roles: unknown[]) {
      this.roles = roles && roles.length ? roles : ["ROLE_DEFAULT"];
    },
    setToken(token: string) {
      this.token = token;
      setToken(token);
    },
    setExpires(expires: number) {
      this.expires_in = expires;
      localStorage.expires_in = Date.now() + expires * 1000;
      setExpiresIn(expires);
    },
    logout() {
      // 退出登录
      if (!this.token) {
        window.location.replace(import.meta.env.VITE_APP_COMMON_LOGIN_URL as string);
        return;
      }
      this.setRoles([]);
      this.setToken("");
      this.setExpires("");
      localStorage.removeItem("expires_in");
      localStorage.removeItem("");
      localStorage.removeItem("refresh_token");
      window.location.replace(import.meta.env.VITE_APP_COMMON_LOGOUT_URL as string);
    },
    setUserInfo(userInfo: UserType["userInfo"]) {
      this.userInfo = userInfo;
    },
    setPermissions(permissions: UserType["permissions"]) {
      this.state = permissions;
    }
  }
});
