import axios, {type AxiosError, type AxiosInstance, type AxiosResponse} from 'axios';
import {addPending, removePending} from './pending';
import type {ConsecutiveRequestConfig} from './types';

export function setupInterceptors(instance: AxiosInstance): void {
    // 步骤 1：请求发出前登记，并按“紧邻同类请求”规则取消旧请求。
    instance.interceptors.request.use((config) => {
        addPending(config as typeof config & ConsecutiveRequestConfig);
        return config;
    });

    // 步骤 2：请求成功后释放对应活动记录，并按当前约定解包 data。
    instance.interceptors.response.use(
        (response: AxiosResponse) => {
            removePending(response.config);
            return response.data;
        },
        (error: AxiosError) => {
            // 步骤 3：失败或取消同样释放记录，确保集合不会持续增长。
            if (error.config) removePending(error.config);

            // 步骤 4：取消仍然 reject，让调用方 finally 能执行，也避免永久 pending 泄漏。
            if (axios.isCancel(error)) return Promise.reject(error);

            // 可在这里继续增加 HTTP 状态码、登录过期和错误提示处理。
            return Promise.reject(error);
        },
    );
}
