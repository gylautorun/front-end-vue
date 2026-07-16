# thenable 吸收与微任务顺序

## 先说结论

`Promise.resolve(thenable)` 遇到带 `then` 方法的对象时，不会在当前同步代码中立即调用 `thenable.then`，而是安排一个微任务处理它。

“调用 `thenable.then`”和“执行外层 Promise 的 `.then()` 回调”是两个不同阶段。它们不是一开始就同时加入微任务队列：

1. 先加入“准备吸收 thenable”的微任务。
2. 该微任务调用 `thenable.then(resolve)`。
3. `resolve` 使外层 Promise 状态确定后，才把已注册的 `.then()` 回调加入队列。

## 示例

```ts
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

queueMicrotask(() => {
    console.log('顺序 Demo 4：手动添加的微任务');
});

console.log('顺序 Demo 2：同步结束');
```

输出：

```text
顺序 Demo 1：同步开始
顺序 Demo 2：同步结束
顺序 Demo 3：准备吸收
顺序 Demo 4：手动添加的微任务
顺序 Demo 5：吸收完成
```

## 执行过程

### 1. 输出“同步开始”

```ts
console.log('顺序 Demo 1：同步开始');
```

`console.log` 是同步代码，因此立即输出 1。

### 2. 安排“准备吸收”微任务

```ts
const observablePromise = Promise.resolve(observableThenable);
```

引擎读取到 `observableThenable.then` 是函数，便创建一个 Promise，并安排微任务去调用这个 `then` 方法。

此时微任务队列：

```text
[准备吸收：调用 observableThenable.then]
```

这一步只是入队，尚未输出 3。

### 3. 注册 `.then()` 回调

```ts
observablePromise.then((value) => {
    console.log('顺序 Demo 5：', value);
});
```

此时 `observablePromise` 还是 pending，所以只会记住这个回调，不会立即把回调加入微任务队列。

此时队列不变：

```text
[准备吸收：调用 observableThenable.then]
```

### 4. 手动添加微任务

```ts
queueMicrotask(() => {
    console.log('顺序 Demo 4：手动添加的微任务');
});
```

`queueMicrotask` 把回调直接加入微任务队列。队列按先进先出的顺序执行：

```text
[
    准备吸收：调用 observableThenable.then,
    手动添加的微任务
]
```

### 5. 输出“同步结束”

```ts
console.log('顺序 Demo 2：同步结束');
```

同步代码继续执行，因此先输出 2。当前同步任务结束后，引擎开始依次清空微任务队列。

### 6. 执行“准备吸收”

第一个微任务调用：

```ts
observableThenable.then(resolve);
```

进入 `then` 方法后先输出 3，然后执行：

```ts
resolve('吸收完成');
```

`observablePromise` 因此变为 fulfilled。前面注册的 `.then()` 回调此时才能入队。

手动微任务比它更早入队，因此当前队列是：

```text
[
    手动添加的微任务,
    observablePromise 的 .then() 回调
]
```

### 7. 执行剩余微任务

引擎按入队顺序继续执行：

1. 先执行手动微任务：输出 4。
2. 然后执行 Promise 的 `.then()` 回调：`observablePromise` 的 `.then()` 回调输出 5。

## 队列变化总结

```text
同步任务
├── 输出 1
├── Promise.resolve(thenable) 加入“准备吸收”微任务
├── observablePromise.then 只注册回调
├── queueMicrotask 加入手动微任务
└── 输出 2

微任务队列
├── 准备吸收，输出 3
│   └── resolve 使 Promise 完成，此时才加入 .then() 回调
├── 手动微任务，输出 4
└── observablePromise.then 回调，输出 5
```

## 最容易记错的点

`.then()` 只是注册回调，不代表回调已经进入微任务队列。

-   Promise 是 pending 时调用 `.then()`：先保存回调，状态确定后再入队。
-   Promise 已经 fulfilled/rejected 时调用 `.then()`：对应回调可以立即被安排进微任务队列，但仍不会同步执行。

`queueMicrotask` 在这个例子中只是一个“队列标记”，用来证明 `.then()` 回调的微任务是在准备吸收执行后才加入的。
