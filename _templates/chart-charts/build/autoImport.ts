/*
 * @Description:
 * @Version: 2.0
 * @Autor: GUOCHAO82
 * @Date: 2022-07-26 14:36:17
 * @LastEditors: GUOCHAO82
 * @LastEditTime: 2022-07-26 14:38:07
 */
import AutoImport from "unplugin-auto-import/vite";

export const autoImport = [
  AutoImport({
    // Auto import functions from Vue, e.g. ref, reactive, toRef...
    // 自动导入 Vue 相关函数，如：ref, reactive, toRef 等
    imports: ["vue", "vue-router", "pinia"],

    // Auto import functions from Element Plus, e.g. ElMessage, ElMessageBox... (with style)
    // 自动导入 Element Plus 相关函数，如：ElMessage, ElMessageBox... (带样式)
    // resolvers: [
    //   ElementPlusResolver(),

    //   // Auto import icon components
    //   // 自动导入图标组件
    //   IconsResolver()
    // ],
    dts: "types/auto-imports.d.ts"
  })
];
