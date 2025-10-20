import {isNil} from 'lodash-es';

export function storageHandler(key: string, val?: Object | string) {
    if (isNil(val)) {
        const data = localStorage.getItem(key);
        if (typeof data === 'string') {
            try {
                const res = JSON.parse(data);
                if (res && typeof res === 'object') {
                    return res;
                }
                else {
                    return data;
                }
            } catch (e) {
                return data;
            }
        }
    }
    if (typeof val === 'object') {
        localStorage.setItem(key, JSON.stringify(val));
    }
    else if (typeof val === 'string') {
        localStorage.setItem(key, val);
    }
    return undefined;
}