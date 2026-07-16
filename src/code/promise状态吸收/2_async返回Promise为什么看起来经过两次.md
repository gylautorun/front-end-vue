# `async` 返回 Promise 为什么看起来经过两次

## 结论

`async` 函数返回另一个 Promise 时，确实会涉及两个 Promise 对象：

1. 函数内部返回的 Promise。
2. 调用 `async` 函数得到的外层 Promise。

但结果不是一个需要手动解开的 `Promise<Promise<T>>`。外层 Promise 会吸收内层 Promise 的状态和结果，因此调用者最终直接得到 `T`。

> 所谓“经过两次 Promise”，容易把“存在两个 Promise 对象”和“固定执行两轮微任务”混为一谈。前者通常成立，后者不是通用规则。

## 示例

```ts
const innerPromise = Promise.resolve('done');

async function getResult() {
    return innerPromise;
}

const outerPromise = getResult();

console.log(outerPromise === innerPromise); // false

outerPromise.then((value) => {
    console.log(value); // done
});
```

`getResult()` 会返回一个新的外层 Promise，所以 `outerPromise !== innerPromise`。

可以用下面的概念模型理解这个过程：

```ts
const outerPromise = new Promise((resolve) => {
    resolve(innerPromise);
});
```

这只是便于理解的简化模型，不是 `async` 函数的完整规范实现。

## 什么是状态吸收

如果内层 Promise 还是 pending，外层 Promise 也要继续等待；内层的状态确定后，外层跟随它的最终结果：

```text
inner pending    -> outer 继续等待
inner fulfilled  -> outer 以同一个值 fulfilled
inner rejected   -> outer 以同一个原因 rejected
```

因此：

```ts
async function getResult() {
    return Promise.resolve(1);
}

const value = await getResult();
console.log(value); // 1
```

`await` 得到的是 `1`，不是 Promise 对象。TypeScript 也会将这类结果展平为 `Promise<number>`，而不是可观察的 `Promise<Promise<number>>`。

## “两次”错觉从哪里来

通常有三个原因：

1. `async` 函数调用会产生外层 Promise。
2. `return` 的值是 Promise 或 thenable 时，外层需要解析并跟随它的状态。
3. 状态确定后，`.then()` 或 `await` 的后续代码仍通过微任务继续执行。

因此从日志顺序看，好像多“跳”了一次。但不应把它记成“遇到 `async` 一定经过两个微任务”。实际顺序还会受返回值是否为 Promise/thenable、它当时的状态，以及后续注册了哪些回调影响。

## 与普通值对比

```ts
async function returnValue() {
    return 1;
}

async function returnPromise() {
    return Promise.resolve(1);
}
```

两个函数的调用结果都是 `Promise<number>`，但内部过程不同：

-   `returnValue()` 用普通值 `1` 完成外层 Promise。
-   `returnPromise()` 需要先让外层 Promise 吸收所返回 Promise 的状态。

对调用者而言，两者都可以用同样的方式消费：

```ts
console.log(await returnValue()); // 1
console.log(await returnPromise()); // 1
```

## 准确表述

> `async` 函数总会返回一个 Promise。当函数返回另一个 Promise 或 thenable 时，外层 Promise 会吸收它的最终状态和结果，而不是把该 Promise 对象作为普通值交给调用者。所谓“经过两次”的感觉，主要来自外层包装、状态吸收和微任务调度，不代表存在需要手动解开的嵌套 Promise。
