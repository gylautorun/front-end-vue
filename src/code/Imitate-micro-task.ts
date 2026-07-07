interface ProcessLike {
    nextTick?: (callback: () => void) => void;
}

type GlobalThisWithProcess = typeof globalThis & {
    process?: ProcessLike;
};

/**
 * 模拟微任务
 *
 * @param fn 微执行函数
 * */
function imitateMicroTask(fn: () => void): void {
    const globalProcess = (globalThis as GlobalThisWithProcess).process;
    if (globalProcess && typeof globalProcess.nextTick === 'function') {
        // node 环境下使用 process.nextTick 模拟微任务
        globalProcess.nextTick(fn);
    } else if (typeof MutationObserver === 'function') {
        // 浏览器环境下使用 MutationObserver 模拟微任务
        // 利用MutationObserver模拟微任务
        const observer = new MutationObserver(() => {
            observer.disconnect();
            fn();
        });
        const textNode = document.createTextNode('1');
        observer.observe(textNode, { characterData: true });
        textNode.textContent = '2';
    } else if (typeof Promise === 'function') {
        // 浏览器环境下使用 Promise 模拟微任务
        Promise.resolve().then(fn);
    } else {
        // 兜底方案，使用 setTimeout 模拟微任务
        setTimeout(fn, 0);
    }
}
