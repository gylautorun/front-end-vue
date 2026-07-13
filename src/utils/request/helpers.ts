import type {InternalAxiosRequestConfig} from 'axios';
import {IGNORE_PARAMS_KEYS, INCLUDE_HEADERS} from './config';
import type {ConsecutiveRequestConfig} from './types';

type NormalizedValue = null | boolean | number | string | NormalizedValue[] | {[key: string]: NormalizedValue};
let binaryRequestSequence = 0;

function isBinaryBody(value: unknown): boolean {
    return (
        (typeof FormData !== 'undefined' && value instanceof FormData) ||
        (typeof File !== 'undefined' && value instanceof File) ||
        (typeof Blob !== 'undefined' && value instanceof Blob) ||
        value instanceof ArrayBuffer ||
        ArrayBuffer.isView(value)
    );
}

/**
 * 将请求数据转成可稳定序列化的结构：对象 key 排序，数组保留顺序，并过滤忽略参数。
 */
export function normalizeValue(value: unknown, ancestors = new WeakSet<object>()): NormalizedValue {
    if (value === null || typeof value === 'boolean' || typeof value === 'string') return value;
    if (typeof value === 'number') return Number.isFinite(value) ? value : String(value);
    if (value === undefined || typeof value === 'function' || typeof value === 'symbol') return null;
    if (value instanceof Date) return value.toISOString();
    if (value instanceof URLSearchParams) return [...value.entries()].sort();
    if (isBinaryBody(value)) return '__BINARY_BODY__';
    if (typeof value !== 'object') return String(value);

    if (ancestors.has(value)) throw new TypeError('请求参数不能包含循环引用');
    ancestors.add(value);

    try {
        if (Array.isArray(value)) return value.map((item) => normalizeValue(item, ancestors));

        return Object.keys(value as Record<string, unknown>)
            .filter((key) => !IGNORE_PARAMS_KEYS.has(key))
            .sort()
            .reduce<Record<string, NormalizedValue>>((result, key) => {
                const item = (value as Record<string, unknown>)[key];
                if (item !== undefined && item !== null) result[key] = normalizeValue(item, ancestors);
                return result;
            }, {});
    } finally {
        ancestors.delete(value);
    }
}

function normalizeHeaders(config: InternalAxiosRequestConfig): Record<string, string> {
    const headers = config.headers.toJSON() as Record<string, unknown>;

    return Object.keys(headers)
        .filter((key) => INCLUDE_HEADERS.has(key.toLowerCase()))
        .sort()
        .reduce<Record<string, string>>((result, key) => {
            result[key.toLowerCase()] = String(headers[key]);
            return result;
        }, {});
}

/**
 * 生成请求身份。标记过的连续请求使用业务分组；普通请求使用完整请求内容。
 */
export function getRequestKey(config: InternalAxiosRequestConfig & ConsecutiveRequestConfig): string {
    // 步骤 1：createCancellableApi 标记的请求按接口分组，参数变化仍视为同类请求。
    if (config.consecutiveRequestKey) return `CONSECUTIVE::${config.consecutiveRequestKey}`;

    // 步骤 2：二进制请求不可稳定比较，每次生成唯一 key，避免误取消上传。
    if (isBinaryBody(config.data)) return `BINARY::${++binaryRequestSequence}`;

    // 步骤 3：普通请求把方法、地址、参数、数据和关键请求头组合成稳定 key。
    return [
        config.method?.toUpperCase() || 'GET',
        config.baseURL || '',
        config.url || '',
        JSON.stringify(normalizeValue(config.params)),
        JSON.stringify(normalizeValue(config.data)),
        JSON.stringify(normalizeHeaders(config)),
        config.responseType || 'json',
    ].join('::');
}
