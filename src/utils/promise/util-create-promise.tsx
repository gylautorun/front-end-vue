export function createPromise<Result = any>() {
    let resolve: (result: Result) => void;
    let reject: (error: Error) => void;
    const promise = new Promise<Result>((_resolve, _reject) => {
        resolve = _resolve;
        reject = _reject;
    });

    return {
        promise,
        // @ts-expect-error ensured
        resolve,
        // @ts-expect-error ensured
        reject,
    };
}
