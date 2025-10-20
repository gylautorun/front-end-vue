import { defineStore } from "pinia";
import { MenuType } from "./type";
export const useMenuStoreHook = defineStore({
  id: "menuStore",
  state: (): MenuType => ({
    sidebarRouters: [],
    accessedRoutes: []
  }),
  actions: {
    setSidebarRouters(router: unknown[]) {
      this.sidebarRouters = router;
    },
    setAccessedRoutes(accessedRoutes: unknown[]) {
      this.accessedRoutes = accessedRoutes;
    }
  }
});
