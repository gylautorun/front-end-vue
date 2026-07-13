import type {AxiosRequestConfig} from 'axios';

// 步骤 1：定义 Axios 实例的基础配置。
export const axiosConfig: AxiosRequestConfig = {
    baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 15_000,
    headers: {
        'Content-Type': 'application/json;charset=UTF-8',
    },
};

// 步骤 2：生成请求标识时忽略只用于防缓存、不会影响响应内容的参数。
export const IGNORE_PARAMS_KEYS = new Set(['_t', 'timestamp', 'random', 'nonce', 'v']);

// 步骤 3：只把会影响响应内容的请求头纳入请求标识。
export const INCLUDE_HEADERS = new Set([
    'content-type',
    'x-tenant-id',
    'x-lang',
    'x-api-version',
]);
