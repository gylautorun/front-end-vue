import type {AxiosRequestConfig} from 'axios';

export interface ConsecutiveRequestConfig {
    /** createCancellableApi 写入的内部请求分组标识。 */
    consecutiveRequestKey?: string;
}

export type CancellableAxiosConfig = AxiosRequestConfig & ConsecutiveRequestConfig;
