# Promise 状态吸收 Demo 1～6 输出解析

```TypeScript
const delay = <T>(value: T, ms = 0): Promise<T> => {
  return new Promise((resolve) => {
      setTimeout(() => resolve(value), ms);
  });
}
```

## Demo 1：`resolve` 吸收内层 Promise

```ts
const innerPromise = delay('内层成功', 100);

const outerPromise = new Promise<string>((resolve) => {
    resolve(innerPromise);
});

outerPromise.then((value) => {
    console.log('Demo 1:', value);
});
```

约 100ms 后输出：

```text
Demo 1: 内层成功
```

执行 `resolve(innerPromise)` 时，外层不会把 `innerPromise` 对象当成普通值交给 `.then()`，而是跟随它的状态。

执行过程：

1. `innerPromise` 初始为 pending。
2. `outerPromise` 被锁定为跟随 `innerPromise`，也还没有结果。
3. 约 100ms 后，`innerPromise` fulfilled，值为 `'内层成功'`。
4. `outerPromise` 吸收这个状态和值。
5. `outerPromise.then()` 的回调作为微任务执行，输出字符串。

因此 `.then()` 收到的是 `'内层成功'`，不是 `innerPromise` 对象。

## Demo 2：内层 rejected 传递失败原因

```ts
const rejectedInner = Promise.reject(new Error('内层失败'));
const adoptedRejection = Promise.resolve(rejectedInner);

adoptedRejection.catch((error: Error) => {
    console.log('Demo 2:', error.message);
});
```

输出：

```text
Demo 2: 内层失败
```

`rejectedInner` 创建后已经是 rejected，拒绝原因是 `Error('内层失败')`。

这里还有一个容易忽略的特例：传给 `Promise.resolve()` 的已经是同一个构造器创建的原生 Promise，所以它会直接返回原 Promise：

```ts
console.log(adoptedRejection === rejectedInner); // true
```

因此这个例子中没有创建新的外层 Promise。`.catch()` 实际注册在 `rejectedInner` 上，它的回调在同步代码结束后作为微任务执行。

`catch` 收到的是 Error 对象，`error.message` 才是 `'内层失败'`。

## Demo 3：`.then()` 吸收回调返回的 Promise

```ts
Promise.resolve(1)
    .then((value) => delay(value + 1, 100))
    .then((value) => {
        console.log('Demo 3:', value);
    });
```

约 100ms 后输出：

```text
Demo 3: 2
```

执行过程：

1. `Promise.resolve(1)` 得到一个 fulfilled Promise，值为 `1`。
2. 第一个 `.then()` 的回调在微任务中执行，`value` 是 `1`。
3. `delay(value + 1, 100)` 返回一个 pending Promise，它约 100ms 后以 `2` fulfilled。
4. 第一个 `.then()` 创建的 Promise 会吸收 `delay()` 返回的 Promise。
5. 吸收完成后，第二个 `.then()` 才能执行，最终收到 `2`。

如果没有状态吸收，第二个 `.then()` 收到的将是 Promise 对象。正是因为 `.then()` 会吸收回调返回的 Promise，Promise 链才能继续向后传递普通值。

## Demo 4：`async` 吸收 `return` 的 Promise

```ts
async function getAsyncResult(): Promise<string> {
    return delay('async 完成', 100);
}

getAsyncResult().then((value) => {
    console.log('Demo 4:', value);
});
```

约 100ms 后输出：

```text
Demo 4: async 完成
```

`async` 函数调用后一定返回 Promise。当函数 `return` 另一个 Promise 时，不会得到一个需要手动解开的 `Promise<Promise<string>>`，函数返回的外层 Promise 会吸收 `delay()` Promise 的状态。

执行过程：

1. `delay()` 返回 pending Promise。
2. `getAsyncResult()` 返回的 Promise 跟随它。
3. 约 100ms 后，`delay()` 以 `'async 完成'` fulfilled。
4. `getAsyncResult()` 返回的 Promise 也以该字符串 fulfilled。
5. `.then()` 收到最终的字符串。

## Demo 5：吸收 thenable

```ts
const thenable = {
    then(resolve: (value: string) => void) {
        resolve('thenable 完成');
    }
};

Promise.resolve(thenable).then((value) => {
    console.log('Demo 5:', value);
});
```

输出：

```text
Demo 5: thenable 完成
```

thenable 是一个带有可调用 `then` 方法的对象。它不是通过 `new Promise()` 创建的原生 Promise，但 Promise 解析过程仍会吸收它。

执行过程：

1. `Promise.resolve(thenable)` 发现对象存在可调用的 `then` 方法。
2. 引擎安排微任务调用 `thenable.then(resolve, reject)`。
3. `thenable.then` 调用 `resolve('thenable 完成')`。
4. `Promise.resolve()` 创建的 Promise 因此 fulfilled。
5. 已注册的 `.then()` 回调被加入微任务队列，最终输出字符串。

这是为了兼容其他 Promise 实现和第三方 Promise-like 对象。

## Demo 6：状态跟随被锁定

```ts
const lockedPromise = new Promise<string>((resolve, reject) => {
    resolve(delay('跟随内层结果', 100));
    resolve('这次 resolve 无效');
    reject(new Error('这次 reject 也无效'));
});

lockedPromise.then((value) => {
    console.log('Demo 6:', value);
});
```

约 100ms 后输出：

```text
Demo 6: 跟随内层结果
```

第一次调用：

```ts
resolve(delay('跟随内层结果', 100));
```

会立即锁定 `lockedPromise` 的命运：它之后只能跟随 `delay()` 返回的 Promise。虽然内层 Promise 还是 pending，外层也还没有 fulfilled，但 executor 中后续的 `resolve` 和 `reject` 已经无法改变它：

```ts
resolve('这次 resolve 无效');
reject(new Error('这次 reject 也无效'));
```

约 100ms 后，内层 Promise fulfilled，外层吸收它的值，所以最终输出 `'跟随内层结果'`。

这说明：

> Promise “已 resolve”不一定表示它已经 fulfilled，也可能表示它已被锁定为跟随另一个 pending Promise。

## 将 6 个 Demo 放在一起运行

按输出时机可以分成两类：

| Demo   | 大致时机       | 原因                                        |
| ------ | -------------- | ------------------------------------------- |
| Demo 2 | 同步代码结束后 | rejected Promise 的`catch` 回调是微任务     |
| Demo 5 | 同步代码结束后 | thenable 吸收和`.then()` 回调通过微任务完成 |
| Demo 1 | 约 100ms 后    | 等待内层定时器 Promise                      |
| Demo 3 | 约 100ms 后    | 第一个`.then()` 执行后才创建定时器 Promise  |
| Demo 4 | 约 100ms 后    | 等待`async` 函数返回的定时器 Promise        |
| Demo 6 | 约 100ms 后    | 等待被锁定跟随的定时器 Promise              |

Demo 2 和 Demo 5 不用等定时器，所以通常会先于 Demo 1、3、4、6 输出。

Demo 1、3、4、6 都使用了约 100ms 的定时器。不应把它们之间的精确输出先后当成 Promise 规范保证的顺序，因为定时器只保证达到最小延迟后才有资格执行，实际时机还受运行环境和当时任务影响。

## 一句话总结

Demo 1～6 展示的都是同一条规则：

> 当 `resolve`、`.then()` 回调或 `async return` 得到 Promise/thenable 时，当前 Promise 不会把它当成普通值，而会跟随它的最终状态和结果；这个跟随一旦被锁定，后续再调用 `resolve` 或 `reject` 也不能改变。
