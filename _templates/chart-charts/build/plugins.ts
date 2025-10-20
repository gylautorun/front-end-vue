import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
// import removeConsole from "vite-plugin-remove-console";
import { viteBuildInfo } from "./info";
import svgLoader from "vite-svg-loader";
import DefineOptions from "unplugin-vue-define-options/vite"; // 使用<script setup>时提供name, props,emits 定义
import { visualizer } from "rollup-plugin-visualizer";
import dynamicImport from "vite-plugin-dynamic-import";
import { autoImport } from "./autoImport";
import { viteMockServe } from "vite-plugin-mock";

// import { testDemoPlugin } from "./vite-plugin-test-demo";

export const getPluginsList = command => {
  // console.log(command, "----command");
  const prodMock = true;
  const lifecycle = process.env.npm_lifecycle_event;
  return [
    vue(),
    vueJsx(),
    // 线上环境删除console
    // removeConsole(),
    viteBuildInfo,
    // svg组件化支持
    svgLoader(),
    dynamicImport(/* options */),
    // 打包分析
    lifecycle === "report" ? visualizer({ open: true, brotliSize: true, filename: "report.html" }) : null,
    ...autoImport,
    DefineOptions(),
    viteMockServe({
      mockPath: "mocks",
      localEnabled: command === "serve",
      prodEnabled: command !== "serve" && prodMock,
      injectCode: `
          import { setupProdMockServer } from './mockProdServer';
          setupProdMockServer();
        `,
      logger: false
    })
    // testDemoPlugin()
  ];
};
