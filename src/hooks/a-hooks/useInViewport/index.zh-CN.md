---
map:
  path: /use-in-viewport
---

# useInViewport

一个用于判断 dom 元素是否在可视范围之内的 Hook。

::: tip
Api 与[ahooks](https://ahooks.js.org/zh-CN/hooks/dom/use-in-viewport)一致。
:::

## 代码演示

### 基本用法

<demo src="./demo/demo1.vue"
  title="基本用法"
  desc="使用 ref 监听节点在视图变化或者滚动时是否在可视范围之内">
</demo>

## API

```ts
const inViewPort = useInViewport(target);
```

### 参数

| 参数   | 说明                      | 类型                                                         | 默认值 |
| ------ | ------------------------- | ------------------------------------------------------------ | ------ |
| target | DOM element or Ref Object | HTMLElement \| (() => HTMLElement) \| React.MutableRefObject | -      |

### 结果

| 参数       | 说明                                  | 类型    |
| ---------- | ------------------------------------- | ------- |
| inViewPort | 判断 dom 元素是否在可视范围之内的标志 | boolean |
