import { createPromise } from './util-create-promise';

export function apiMockPromise<T extends unknown>(data: T, time: number = 1) {
    const {
        promise,
        resolve,
    } = createPromise<T>();

    setTimeout(() => {
        resolve(data);
    }, time * 1000);

    return promise;
}