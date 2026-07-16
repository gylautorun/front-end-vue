/**
 * Promise 状态吸收（Promise Resolution）
 *
 * 简单理解：外层 Promise resolve(内层 Promise) 时，不会把“内层 Promise 对象”
 * 当成普通结果交出去，而是让外层等待内层。内层成功，外层才成功；
 * 内层失败，外层也失败。这种“跟随内层状态”就是状态吸收。
 * 内层返回什么， 外层也返回什么
 *
 * 执行 resolve(innerPromise) 时，可以分成三个阶段理解：
 *
 * 1. 同步锁定：外层立即锁定为“要跟随 innerPromise”，之后再调外层的
 *    resolve/reject 都无效。但外层此时还没有 fulfilled，通常仍是 pending。
 * 2. 准备吸收：引擎把“让外层跟随内层”的工作放入微任务队列。
 * 3. 传递状态：准备工作执行后，等内层有了最终结果，才会再安排用于把
 *    状态传给外层的微任务。
 *
 * 重点：可以把它看成“准备吸收”和“传递结果”两步，但并不是调用
 * resolve(innerPromise) 时就一次性把两个微任务都加入队列。后一步要等
 * 前一步执行、并且内层状态可用后，才有条件入队。
 *
 * 常见触发位置：
 * 1. resolve(otherPromise)
 * 2. Promise.resolve(otherPromise)
 * 3. then / catch / finally 的回调返回 Promise
 * 4. async 函数 return Promise
 *
 * 所以，“已经调用 resolve”不等于“已经 fulfilled”。resolve 还可能只是让外层
 * 进入等待、跟随内层的过程。
 *
 * const p1 = new Promise((resolve) => {
 *    resolve('p1 fulfilled');
 * });
 * const p2 = new Promise((resolve) => {
 *    resolve(p1);
 * });
 * p2 ---> p1
 * 准备、吸收
 * - p2 要吸收 p1 的状态，p2 先进入准备， 放入微任务队列，等待 p1 的状态。
 * - 吸收：p1 fulfilled，p2放入微任务， 返回也是 fulfilled，p2 的值就是 p1 的值
 */

const delay = <T>(value: T, ms = 0): Promise<T> =>
    new Promise((resolve) => {
        setTimeout(() => resolve(value), ms);
    });

// 微任务顺序 Demo：用 thenable 把原本由引擎完成的“准备吸收”显示出来。
// 完整执行过程见：./thenable吸收与微任务顺序.md
console.log('顺序 Demo 1：同步开始');

const observableThenable = {
    then(resolve: (value: string) => void) {
        console.log('顺序 Demo 3：准备吸收');
        resolve('吸收完成');
    }
};

const observablePromise = Promise.resolve(observableThenable);

observablePromise.then((value) => {
    console.log('顺序 Demo 5：', value);
});

// queueMicrotask 是浏览器和 Node.js 提供的 API，用于手动把一个函数加入“微任务队列”
queueMicrotask(() => {
    console.log('顺序 Demo 4：手动添加的微任务');
});

console.log('顺序 Demo 2：同步结束');

// 输出顺序为
// 顺序 Demo 1：同步开始
// 顺序 Demo 2：同步结束
// 顺序 Demo 3：准备吸收
// 顺序 Demo 4：手动添加的微任务
// 顺序 Demo 5：吸收完成

// Demo 1～6 的输出和原因见：./Demo1-6输出解析.md

// Demo 1：resolve 吸收另一个 Promise 的状态。
const innerPromise = delay('内层成功', 100);

const outerPromise = new Promise<string>((resolve) => {
    resolve(innerPromise);
});

outerPromise.then((value) => {
    console.log('Demo 1:', value); // 100ms 后输出：内层成功
});

// Demo 2：内层 rejected，外层也会 rejected。
const rejectedInner = Promise.reject(new Error('内层失败'));
const adoptedRejection = Promise.resolve(rejectedInner);

adoptedRejection.catch((error: Error) => {
    console.log('Demo 2:', error.message); // 内层失败
});

// Demo 3：then 回调返回 Promise，新 Promise 会等待它。
Promise.resolve(1)
    .then((value) => delay(value + 1, 100))
    .then((value) => {
        console.log('Demo 3:', value); // 2，不是 Promise 对象
    });

// Demo 4：async 函数始终返回 Promise，并吸收 return 的 Promise 状态。
async function getAsyncResult(): Promise<string> {
    return delay('async 完成', 100);
}

getAsyncResult().then((value) => {
    console.log('Demo 4:', value); // async 完成
});

// Demo 5：普通 thenable 也会被吸收，不必须是原生 Promise。
const thenable = {
    then(resolve: (value: string) => void) {
        resolve('thenable 完成');
    }
};

Promise.resolve(thenable).then((value) => {
    console.log('Demo 5:', value); // thenable 完成
});

// Demo 6：外层一旦 resolve 为内层 Promise，后续再 resolve/reject 都无效。
const lockedPromise = new Promise<string>((resolve, reject) => {
    resolve(delay('跟随内层结果', 100));
    resolve('这次 resolve 无效');
    reject(new Error('这次 reject 也无效'));
});

lockedPromise.then((value) => {
    console.log('Demo 6:', value); // 跟随内层结果
});

/**
 * 面试表述：
 *
 * Promise 状态吸收是指，当 resolve、then 回调或 async return 得到另一个
 * Promise/thenable 时，外层 Promise 会跟随它的最终状态：对方 fulfilled，
 * 外层就 fulfilled 并取得同一个值；对方 rejected，外层就以同一原因 rejected。
 * 这个机制会递归展开嵌套 Promise，所以 then 链最终拿到的是普通值，
 * 而不是 Promise<Promise<T>>。
 *
 * 边界：Promise 不能 resolve 它自己，否则会以 TypeError 拒绝，避免循环等待。
 */

export {};
