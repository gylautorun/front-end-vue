import axios from 'axios';
import {axiosConfig} from './config';
import {setupInterceptors} from './interceptors';

// 步骤 1：创建独立 Axios 实例，避免修改全局 axios 默认行为。
const request = axios.create(axiosConfig);

// 步骤 2：安装请求登记、相邻取消和完成清理拦截器。
setupInterceptors(request);

// 步骤 3：统一导出实例及请求生命周期控制能力。
export default request;
export {cancelAllRequests, getPendingRequestCount} from './pending';
export {createCancellableApi} from './createCancellableApi';
export type {CancellableAxiosConfig, ConsecutiveRequestConfig} from './types';
