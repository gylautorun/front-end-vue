// 系统相关
import { defineStore } from "pinia";

import Cookies from "js-cookie";
import defaultSettings from "@/settings";
import { isFullScreen } from "@/utils/fullScreen";
const { sideTheme, showSettings, topNav, tagsView, fixedHeader, sidebarLogo, dynamicTitle } = defaultSettings;
const storageSetting = JSON.parse(localStorage.getItem("layout-setting")) || "";

interface changeSettingData {
  key: string;
  value: string;
}

type DeviceType = "mobile" | "desktop";

export const useSystemStoreHook = defineStore({
  id: "systemStore",
  state: () => ({
    title: "",
    theme: storageSetting.theme || "#409EFF",
    sideTheme: storageSetting.sideTheme || sideTheme,
    showSettings: showSettings,
    isFullScreen: isFullScreen(),
    topNav: storageSetting.topNav === undefined ? topNav : storageSetting.topNav,
    tagsView: storageSetting.tagsView === undefined ? tagsView : storageSetting.tagsView,
    fixedHeader: storageSetting.fixedHeader === undefined ? fixedHeader : storageSetting.fixedHeader,
    sidebarLogo: storageSetting.sidebarLogo === undefined ? sidebarLogo : storageSetting.sidebarLogo,
    dynamicTitle: storageSetting.dynamicTitle === undefined ? dynamicTitle : storageSetting.dynamicTitle,
    device: "desktop",
    sidebar: {
      opened: Cookies.get("sidebarStatus") === "1",
      withoutAnimation: false,
      hide: false
    }
  }),
  actions: {
    setTitle(title: string) {
      this.title = title;
    },
    changeSetting(data: changeSettingData) {
      const { key, value } = data;
      this[key] = value;
    },
    setIsFullScreen(val: boolean) {
      this.isFullScreen = val;
    },
    toggleSideBar() {
      console.log("调用饿----");
      if (this.sidebar.hide) {
        return false;
      }
      this.sidebar.opened = !this.sidebar.opened;
      this.sidebar.withoutAnimation = false;
      if (this.sidebar.opened) {
        Cookies.set("sidebarStatus", 1);
      } else {
        Cookies.set("sidebarStatus", 0);
      }
      console.log("调用完成--------", this.sidebar.opened);
    },
    closeSideBar(withoutAnimation: boolean) {
      Cookies.set("sidebarStatus", 0);
      this.sidebar.opened = false;
      this.sidebar.withoutAnimation = withoutAnimation;
    },
    toggleDevice(device: DeviceType) {
      this.device = device;
    },
    setSize(size: number) {
      this.size = size;
    },
    toggleSideBarHide(hide: boolean) {
      this.sidebar.hide = hide;
    },
    setFullScreen() {
      this.isFullScreen = !this.isFullScreen;
    }
  }
});
