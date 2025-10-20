import axios, {AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig} from 'axios';
import router from '@/router';
import {ElMessage} from 'element-plus';

const request: AxiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL, // API 请求的默认前缀，可根据环境变量自行配置
    timeout: 60 * 1000, // 请求超时时间
});

// 异常拦截处理器
const errorHandler = (error: AxiosError) => {
    if (error.response) {
        switch (error.response.status) {
            case 401:
                // 登录过期错误处理
                router.push('/login')
                break;
            case 500:
                // 服务器错误处理
                break;
            default:
                ElMessage.error(`${error}`);
        }
    }
    return Promise.reject(error);
};

// 前置拦截器（发起请求之前的拦截）
request.interceptors.request.use((config: InternalAxiosRequestConfig<any>) => {
    /**
     * 如果token 存在，则给请求头加token
     */
    const token = sessionStorage.getItem('token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${JSON.parse(token)}`;
    }
    return config;
}, errorHandler);

// 后置拦截器（获取到响应时的拦截）
request.interceptors.response.use((response: AxiosResponse) => {
    /**
     * 根据你的项目实际情况来对 response 和 error 做处理
     * 这里对 response 和 error 不做任何处理，直接返回
     */
    const res = response.data;
    if (!res.success) {
        // ElMessage.error(res.message)
        return Promise.reject(res.message);
    }
    return res;
}, errorHandler);

export default request;
