import { onUnmounted, reactive, watch, watchSyncEffect } from 'vue';

interface Fetch<T> {
    loading: boolean,
    value?: T, // 具体的返回类型是泛型
    error?: string
}

export const useFetch = <T, Params>(
    fn: (args: Params) => Promise<T>,
    initParams: Params
): [Fetch<T>, (params: Params) => Promise<T>] => {
    
    // 定义基础的数据格式
    const data = reactive<Fetch<T>>({
        loading: true,
    }) as Fetch<T>;
    
    // 定义请求回调
    const callback = (params: Params): Promise<T> => new Promise((resolve, reject) => {
        data.loading = true;
        fn(params)
            .then(result => {
                data.value = result;
                resolve(result);
            })
            .catch(error => {
                data.error = error;
                reject(error);
            })
            .finally(() => data.loading = false);
    })

    // 立即执行
    watchSyncEffect(() => {
        callback(initParams);
    });
    // callback 是手动执行

    return [data, callback];
};

export const useAutoFetch = <T, Params>(
    fn: (args: Params) => Promise<T>,
    initParams: Params  
): Fetch<T> => {
    
    const data = reactive<Fetch<T>>({
        loading: true,
        value: undefined,
        error: undefined
    }) as Fetch<T>;

    const callback = (params: Params): Promise<T> => new Promise((resolve, reject) => {
        data.loading = true
        fn(params)
            .then(result => {
                data.value = result as any
                resolve(result)
            })
            .catch(error => {
                data.error = error
                reject(error)
            })
            .finally(() => data.loading = false)
    })

    // 如果不需要立即执行，可没有这步
    // watchSyncEffect(() => {
    //     callback(initParams);;
    // });
    
    // 自动监听参数变化
    const effects = watch([initParams], () => callback(initParams));
    // 卸载页面时，关闭监听
    onUnmounted(() => effects());

    return data
}


