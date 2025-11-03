import { ServerOptions } from 'vite';

export function createViteServer(): ServerOptions {
    return {
        hmr: true, // 启用热模块替换
        port: 3000, // 设置开发服务器的端口号
        // 默认的origin是http://localhost:3000，这里可以自定义设置, 但是 web worker 会跨域问题, 需要和端口一致
        // origin: 'http://localhost:6666',
        // host: 'localhost', // 设置开发服务器的主机地址
        host: '0.0.0.0', // 监听所有网络接口
        open: true, // 是否在服务器启动时自动在浏览器中打开应用
        // https: {
        //   // 配置开发服务器的https选项
        //   key: '', // 配置开发服务器的https的key
        //   cert: '', // 配置开发服务器的https的cert
        //   // ca: '', // 配置开发服务器的https的ca
        // },
        cors: true, // 是否启用开发服务器的跨域资源共享
        // 服务器代理配置
        proxy: {
            '/api': {
                target: 'http://localhost:8083', // https://mock.mengxuegu.com/mock/64112a1afe77f949bc0d6ec6/antd
                changeOrigin: true
                // rewrite: (path) => path.replace(/\/api/, '')
            }
        },
        warmup: {
            // 只预热必要的客户端文件
            clientFiles: ['./src/main.ts', './src/router/index.ts']
        }
    };
}
