import {BuildOptions} from 'vite';
import path from 'path';
import { env } from 'node:process';
// 配置gzip压缩插件
import viteCompression from 'vite-plugin-compression';
/**
 * 
 * @returns https://vitejs.dev/config/build-options.html
 */
export function createViteBuild(): BuildOptions {
    return {
        // 规定触发警告的 chunk 大小, 当某个代码分块的大小超过该限制时，Vite 会发出警告
        // chunkSizeWarningLimit: 2000, // 消除打包大小超过500kb警告
        // 用于指定使用的代码压缩工具。在这里，minify 被设置为 'terser'，表示使用 Terser 进行代码压缩。默认值terser
        // esbuild 打包更快，但是不能去除 console.log，terser打包慢，但能去除 console.log
        // chunkSizeWarningLimit: 2000,
        chunkSizeWarningLimit: 500,
        minify: 'terser', // esbuild // 指定使用哪种混淆器
        terserOptions: {
            compress: {
                keep_infinity: true, // 防止 Infinity 被压缩成 1/0，这可能会导致 Chrome 上的性能问题
                drop_console: true, // 生产环境去除 console
                drop_debugger: true, // 生产环境去除 debugger
            },
            format: {
                comments: true, // 删除注释
            },
        },
        emptyOutDir: true, // 打包前清空输出目录
        cssTarget: 'chrome61', // 允许用户为 CSS 的压缩设置一个不同的浏览器 target 与 build.target 一致
        // lib: {}, // 构建为库时使用
        manifest: true, // 当设置为 true，构建后将会生成 manifest.json 文件
        // 禁用 gzip 压缩大小报告，可略微减少打包时间
        reportCompressedSize: false,
        // 用于指定是否生成源映射文件。源映射文件可以帮助调试和定位源代码中的错误。
        // 当设置为false时，构建过程不会生成源映射文件
        sourcemap: false, // 构建后是否生成 source map 文件
        // 用于配置 CommonJS 模块的选项
        commonjsOptions: {
            // 用于指定是否忽略 CommonJS 模块中的 try-catch 语句。
            // 当设置为false时，构建过程会保留 CommonJS 模块中的 try-catch 语句
            ignoreTryCatch: false
        },
        rollupOptions: {
            output: {
                manualChunks: {
                    gyl_vue: ['vue'],
                    gyl_vuePlugin: ['vue-router', 'pinia', 'mitt'],
                    gyl_lodash: ['lodash-es', 'lodash'],
                    gyl_dayjs: ['dayjs'],
                    gyl_axios: ['axios'],
                    gyl_i18n: ['vue-i18n'],
                    // gyl_pinyin_pro: ['pinyin-pro'],
                    gyl_vueuse: ['@vueuse/core'],
                },
                chunkFileNames: 'assets/js/[name].[hash].js',
                entryFileNames: 'assets/js/[name].[hash].js',
                assetFileNames: 'assets/[ext]/[name].[hash].[ext]',
                // 较小的模块没有合并，rollup 在3.3之后的版本提供了一个实验性质的配置项 output.experimentalMinChunkSize，来合并小chunk
                // 它只对纯函数有作用，如果是 console.log 就会失效
                experimentalMinChunkSize: 10 * 1024,
                minifyInternalExports: true,
            },
            // output: {
            //     // 用于从入口点创建的块的打包输出格式[name]表示文件名,[hash]表示该文件内容hash值
            //     entryFileNames: 'assets/js/[name].[hash].js',
            //     // 用于命名代码拆分时创建的共享块的输出命名
            //     chunkFileNames: 'assets/js/[name].[hash].js',
            //     // 用于指定静态资源的输出文件名格式
            //     // assetFileNames: 'assets/[ext]/[name].[hash].[ext]',
            //     // 用于输出静态资源的命名，[ext]表示文件扩展名
            //     assetFileNames: (assetInfo: any) => {
            //         const info = assetInfo.name.split('.');
            //         let extType = info[info.length - 1];
            //         // console.log('文件信息', assetInfo.name)
            //         if (
            //             /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/i.test(assetInfo.name)
            //         ) {
            //             extType = "assets/media";
            //         }
            //         else if (/\.(png|jpe?g|gif|svg)(\?.*)?$/.test(assetInfo.name)) {
            //             extType = "assets/img";
            //         }
            //         else if (/\.(woff2?|eot|ttf|otf)(\?.*)?$/i.test(assetInfo.name)) {
            //             extType = "assets/fonts";
            //         }
            //         return `assets/${extType}/[name].[hash].[ext]`;
            //     },
            //     // manualChunks: {
            //     //   'vue-i18n': ['vue-i18n'],
            //     // },
            //     manualChunks(id) {
            //         if (id.includes('node_modules')) {
            //             return 'vendors'; // 所有的第三方包汇总
            //         }
            //     },
            // },
            // plugins 移动到 vite.config.ts plugins 数组中
            // plugins: [
            //     viteCompression({
            //         verbose: true, // 是否在控制台中输出压缩结果
            //         disable: false,
            //         threshold: 10240, // 如果体积大于阈值，将被压缩，单位为b，体积过小时请不要压缩，以免适得其反
            //         algorithm: 'gzip', // 压缩算法，可选['gzip'，' brotliccompress '，'deflate '，'deflateRaw']
            //         ext: '.gz', // 压缩后的文件扩展名，不配置默认为 .gz
            //         deleteOriginFile: false, // 源文件压缩后是否删除(看压缩后的效果，请设置为true)
            //     }),
            // ],
        },
    };
};
