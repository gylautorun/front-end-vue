import { defineConfig, loadEnv } from "vite";

import { resolve } from "path";
import pkg from "./package.json";
// import dayjs from "dayjs";
import { getPluginsList } from "./build/plugins";
// import {loadEnv,} from 'vite'

const pathResolve = (path: string) => {
  return resolve(__dirname, path);
};

const root: string = process.cwd();

const { dependencies, devDependencies, name, version } = pkg;
const __APP_INFO__ = {
  pkg: { dependencies, devDependencies, name, version },
  lastBuildTime: ""
};

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const { VITE_PORT, VITE_PROXY_DOMAIN, VITE_PROXY_DOMAIN_REAL, VITE_APP_START_HOST } = loadEnv(
    mode,
    pathResolve("./.env")
  );
  console.log(mode, "---env");
  return {
    base: "/",
    root,
    envDir: "./.env",
    resolve: {
      alias: {
        "/@": pathResolve("./src"),
        views: pathResolve("./src/views"),
        "/components": pathResolve("./src/components"),
        "/store": pathResolve("./src/store")
      },
      extensions: [".ts", ".js", ".vue"]
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@use "./src/assets/style/common.scss" as *;`,
          javascriptEnabled: true
        }
      }
    },
    plugins: getPluginsList(command),
    build: {
      sourcemap: mode === "production" ? "hidden" : true,
      brotliSize: false,
      // 消除打包大小超过500kb警告
      chunkSizeWarningLimit: 4000
    },
    esbuild: {
      pure: ["console.log"]
    },
    optimizeDeps: {
      include: ["pinia"]
    },
    server: {
      // 是否开启 https
      https: false,
      port: VITE_PORT as unknown as number,
      host: VITE_APP_START_HOST,
      proxy: VITE_PROXY_DOMAIN_REAL?.length
        ? {
            [VITE_PROXY_DOMAIN]: {
              target: VITE_PROXY_DOMAIN_REAL,
              // ws: true,
              changeOrigin: true
            },
            cas: {
              target: `http://cas.dadp-sit.crcloud.com`,
              changeOrigin: true,
              logLevel: "debug"
            },
            v3: {
              target: `https://restapi.amap.com`,
              changeOrigin: true,
              logLevel: "debug"
            }
          }
        : null
    }
  };
});
