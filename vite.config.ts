import { defineConfig, UserConfig } from 'vite';
import path from 'path';
import { env } from 'node:process';
import { createVitePlugins } from './vite-plugin/plugins';
import { createViteCss } from './vite-plugin/css';
import { createViteBuild } from './vite-plugin/build';
// 项目信息
import { createViteDefine } from './vite-plugin/define';
import { createViteServer } from './vite-plugin/server';
import { createViteResolve } from './vite-plugin/resolve';

// https://vitejs.dev/config/
export default defineConfig({
    root: process.cwd(), // 项目根目录（index.html 文件所在的位置）,
    base: '/', // 开发或生产环境服务的公共基础路径 配置引入相对路径 /gyl/
    resolve: createViteResolve(),
    define: createViteDefine(),
    plugins: createVitePlugins(),
    server: createViteServer(),
    css: createViteCss(),
    esbuild: {
        pure: env.VITE_DROP_CONSOLE ? ['console.log', 'debugger'] : [],
        drop: env.VITE_DROP_CONSOLE ? ['console', 'debugger'] : []
    },
    worker: {
        format: 'es' // 默认输出 ES 模块
    },
    // 构建配置
    build: createViteBuild(),
    // 不走打包的，静态资源目录，解决移动目录，出现没有权限
    publicDir: path.resolve(process.cwd(), 'public'), // 静态资源服务的文件夹
    cacheDir: 'temp/.vite', // 存储缓存文件的目录
    optimizeDeps: {
        entries: ['/index.html']
    }
} as UserConfig);
