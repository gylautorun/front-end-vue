type AddChain = {
    [key: number]: AddChain;
} & number;

function createAdd(value = 0): AddChain {
    const handler = () => value;
    return new Proxy(
        {},
        {
            get(_target, prop) {
                /**
                 * 处理 Symbol.toPrimitive 类型的属性
                 * 系统将createAdd对象转换为原始值时，会调用该方法
                 * 为什么返回handler函数？因为读到这就会调用运行函数， 运行函数中返回value
                 */
                if (Symbol.toPrimitive === prop) {
                    return handler;
                }
                return createAdd(value + Number(prop));
            }
        }
    ) as unknown as AddChain;
}

const add = createAdd();
console.log(add[1][2][3] + 4); // 10
console.log(add[10][20][30] + 40); // 100
console.log(add[5][7][9] + 11); // 32

// npx ts-node ./add.ts
