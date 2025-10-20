---
map:
  path: /use-throttle
---

# useThrottle

用来处理节流值的 Hook。

::: tip
Api 与[ahooks](https://ahooks.js.org/hooks/side-effect/use-throttle)一致。
:::

## 代码演示

### 基础使用

<demo src="./demo/demo.vue"
  language="vue"
  title="基础用法"
  desc="连续点击按钮，查看throlledCount值变化">
</demo>

## API

```javascript
const throttledValue = useThrottle(
  value: any,
  options?: object
);
```

### 参数

| 参数    | 说明                               | 类型   | 默认值 |
| ------- | ---------------------------------- | ------ | ------ |
| value   | 需要节流的值                       | any    | -      |
| options | 配置节流的行为，详见下面的 Options | object | {}     |

### Options

| 参数     | 说明                       | 类型    | 默认值 |
| -------- | -------------------------- | ------- | ------ |
| wait     | 超时时间，单位为毫秒       | number  | 1000   |
| leading  | 是否在上升沿触发副作用函数 | boolean | true   |
| trailing | 是否在下降沿触发副作用函数 | boolean | true   |
