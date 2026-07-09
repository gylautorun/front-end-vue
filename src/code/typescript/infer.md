# TypeScript infer 类型推导

## 什么是 infer

`infer` 是 TypeScript 中用于在**条件类型（Conditional Types）**中进行类型推导的关键字。它允许你从一个类型中提取出另一个类型，而不需要显式地指定它。

### infer 的语法

```typescript
type SomeType<T> = T extends TargetType<infer U> ? U : FallbackType;
```

-   `T extends ...`：这是条件判断
-   `infer U`：声明一个类型变量 `U`，TypeScript 会尝试将 `T` 匹配到 `TargetType` 的结构中，并自动推导出 `U` 的具体类型
-   `? U : xxx`：如果匹配成功（条件为 `true`），你就可以在 `?` 后面的分支中使用推导出来的 `U`

## 1. Return 类型推导

从函数类型中推导出返回值类型。

```typescript
type Return<T> = T extends (...args: any[]) => infer R ? R : T;

type sum = (a: number, b: number) => number;
type concat = (a: any[], b: any[]) => any[];
const getUser = (id: string) => ({ id, name: '张三' });
type User = Return<typeof getUser>; // { id: string; name: string }

let sumResult: Return<sum>; // number
let concatResult: Return<concat>; // any[]
```

## 2. Promise 类型推导

从 Promise 类型中提取出内部泛型类型。

```typescript
type PromiseType<T> = T extends Promise<infer R> ? R : T;

type pt = PromiseType<Promise<string>>; // string
```

## 3. 函数首个参数类型推导

从函数类型中提取出第一个参数的类型。

```typescript
type FirstParam<T> = T extends (x: infer R, ...args: any[]) => any ? R : T;

type firstParam = FirstParam<(name: string, age: number) => void>; // string
```

## 4. 数组元素类型推导

从数组类型中提取出元素类型。

```typescript
type ArrayItemType<T> = T extends Array<infer R> ? R : T;

type itemType1 = ArrayItemType<[string, number, boolean]>; // string | number | boolean
type itemType2 = ArrayItemType<string[]>; // string
type itemType3 = ArrayItemType<string[][]>; // string[]
```

## 5. 递归推导嵌套数组元素类型

递归提取嵌套数组的最内层元素类型。

```typescript
type ArrayItemRecursionType<T> = T extends Array<infer R> ? ArrayItemRecursionType<R> : T;

type itemType4 = ArrayItemRecursionType<[string, number, boolean]>; // string | number | boolean
type itemType5 = ArrayItemRecursionType<string[]>; // string
type itemType6 = ArrayItemRecursionType<string[][]>; // string
type itemType7 = ArrayItemRecursionType<string[][][]>; // string
```

## 6. 函数所有参数类型推导

从函数类型中提取出所有参数组成的元组类型。

```typescript
type Params<T> = T extends (...args: infer R) => any ? R : T;

type funcParams = Params<(name: string, age: number, active: boolean) => void>; // [name: string, age: number, active: boolean]
type emptyParams = Params<() => void>; // []

function testAdd(a: number, b: string) {}
type Args = Params<typeof testAdd>; // 推导结果: [a: number, b: string] (元组类型)
```

## 7. 元组首个元素类型推导

从元组类型中提取出第一个元素的类型。

```typescript
type First<T> = T extends [infer R, ...any[]] ? R : T;

type first1 = First<[string, number, boolean]>; // string
type first2 = First<[number]>; // number
type first3 = First<[]>; // []
```

## 8. 元组末尾元素类型推导

从元组类型中提取出最后一个元素的类型。

```typescript
type Last<T> = T extends [...any[], infer R] ? R : T;

type last1 = Last<[string, number, boolean]>; // boolean
type last2 = Last<[number]>; // number
type last3 = Last<[]>; // []
```

## 9. 提取类实例的类型

从构造函数类型中提取出实例类型（类似内置的 `InstanceType`）。

```typescript
type SelfInstanceType<T> = T extends new (...args: any[]) => infer R ? R : any;

class TestUser {
    name: string = '';
}
type UserType = SelfInstanceType<typeof TestUser>; // TestUser
```

## 10. 嵌套 Promise 类型推导

递归提取嵌套 Promise 的最终类型。

```typescript
type DeepPromiseType<T> = T extends Promise<infer R> ? DeepPromiseType<R> : T;

type deepPt1 = DeepPromiseType<Promise<string>>; // string
type deepPt2 = DeepPromiseType<Promise<Promise<string>>>; // string
type deepPt3 = DeepPromiseType<Promise<Promise<Promise<number>>>>; // number
```

## 11. 构造函数参数类型推导

从构造函数类型中提取出参数组成的元组类型。

```typescript
type ConstructorParams<T> = T extends new (...args: infer R) => any ? R : T;

class Person {
    constructor(_name: string, _age: number) {}
}
type personParams = ConstructorParams<typeof Person>; // [_name: string, _age: number]
```

## 12. 构造函数返回类型推导

从构造函数类型中提取出返回的实例类型。

```typescript
type ConstructorInstanceType<T> = T extends new (...args: any[]) => infer R ? R : T;

type personInstance = ConstructorInstanceType<typeof Person>; // Person
```

## 13. 条件类型中的 infer

提取长度为 1 的数组的元素类型。

```typescript
type SingleItem<T> = T extends [infer R] ? R : never;

type single1 = SingleItem<[string]>; // string
type single2 = SingleItem<[number]>; // number
type single3 = SingleItem<[string, number]>; // never
```

## 14. 联合类型中的 infer

从联合类型中提取函数的返回值类型。

```typescript
type ReturnTypes<T> = T extends (...args: any[]) => infer R ? R : never;

type unionFn = ((a: number) => string) | ((b: boolean) => number) | string;
type unionReturns = ReturnTypes<unionFn>; // string | number
```

## 15. 其他高级用法

### 15.1 作用域限制

`infer` 声明的类型变量只能在条件类型的真分支（`?` 后面）中使用。在假分支（`:` 后面）或其他地方使用会报错。

```typescript
// type Test<T> = T extends string ? infer U : U; // ❌ 报错：'U' 在假分支中不可用
```

### 15.2 结合 as 进行类型断言（TS 4.7+）

较新的 TS 版本中，可以在 infer 推导时直接加上约束：

```typescript
type ExtractABC<T> = T extends `${infer U extends 'a' | 'b' | 'c'}${string}` ? U : never;

type ExtractT1 = ExtractABC<'apple'>; // 'a'
type ExtractT2 = ExtractABC<'banana'>; // 'b'
type ExtractT3 = ExtractABC<'dog'>; // never
```

### 15.3 同名 infer 的推断规则（协变与逆变）

如果在同一个条件类型中，多次使用了同名的 `infer` 变量，TS 会根据位置进行不同的推导：

-   **协变位置**（如返回值、数组元素）：推断出**联合类型**（`|`）
-   **逆变位置**（如函数参数）：推断出**交叉类型**（`&`）

```typescript
// 协变位置：推断为联合类型
type Foo<T> = T extends { a: infer U; b: infer U } ? U : never;
type T1 = Foo<{ a: string; b: number }>; // string | number

// 逆变位置（函数参数）：推断为交叉类型
type Bar<T> = T extends { a: (x: infer U) => void; b: (x: infer U) => void } ? U : never;
type T2 = Bar<{ a: (x: string) => void; b: (x: number) => void }>; // string & number (即 never)
```
