async function async1() {
    console.log(1);
    await async2();
    console.log('AAA');
}

async function async2() {
    return Promise.resolve(2);
}

async1();

Promise.resolve()
    .then(() => {
        console.log(3);
    })
    .then(() => {
        console.log(4);
    })
    .then(() => {
        console.log(5);
    });

/**
 * 这里补全输出逻辑过程：
 * - async1() 执行， 《打印 1》
 * - async2() 执行，返回一个 Promise， async2 标记为 async, async2 返回的promise 和 async async2 返回的不是一个函数，
 *   这里就有状态吸收，返回的 Promise<async2>要吸收 Promise.resolve(2);
 *   await async2(); 等待的是 Promise<async2>,
 *   async2 ----> Promise.resolve(2)
 *   微队列：[准备] （什么都不做， async2 还没完成，  await async2(); 后面的不执行）
 * - 执行 Promise.resolve()， 将then console.log(3) 加入微队列，微队列：[准备, console.log(3)]
 * - 微队列里面取【准备】，准备出来，吸收Promise.resolve(2)马上进入微队列，微队列：[console.log(3)， 吸收Promise.resolve(2)]
 * - 微队列里面取【console.log(3)】《打印 3》，3输出， console.log(4) 进入微队列，微队列：[吸收Promise.resolve(2)， console.log(4)]
 * - 微队列里面取【吸收Promise.resolve(2)】，吸收完成，async2完成， await async2()完成，console.log('AAA') 进入微队列，微队列：[console.log(4), console.log('AAA')]
 * - 微队列里面取【console.log(4)】《打印 4》，4输出， console.log(5) 进入微队列，微队列：[console.log('AAA'), console.log(5)]
 * - 微队列里面取【console.log('AAA')】《打印 AAA》，AAA输出，微队列：[console.log(5)]
 * - 微队列里面取【console.log(5)】《打印 5》，5输出，微队列：[]
 *
 * 最终输出顺序：1，3, 4, AAA, 5
 */

async function async_1() {
    console.log(1);
    await async_2();
    console.log('AAA');
}
function async_2() {
    return Promise.resolve(2);
}
async_1();
Promise.resolve()
    .then(() => {
        console.log(3);
    })
    .then(() => {
        console.log(4);
    })
    .then(() => {
        console.log(5);
    });
/**
 * 这个输出顺序和上面不一样， async_2 没有 async 标记， 不存在状态吸收， async_2 返回的就是Promise.resolve(2)
 * - async1() 执行， 《打印 1》
 * - async2() 执行，返回一个 Promise， async2 返回的就是 Promise.resolve(2) 完成， await async2()完成
 *   console.log('AAA') 加入微队列，微队列：[console.log('AAA')]
 * - 执行 Promise.resolve()， 将then console.log(3) 加入微队列，微队列：[console.log('AAA'), console.log(3)]
 * - 微队列里面取【console.log('AAA')】《打印 AAA》，AAA输出，微队列：[console.log(3)]
 * - 微队列里面取【console.log(3)】《打印 3》，3输出， console.log(4) 进入微队列，微队列：[console.log(4)]
 * - 微队列里面取【console.log(4)】《打印 4》，4输出， console.log(5) 进入微队列，微队列：[console.log(5)]
 * - 微队列里面取【console.log(5)】《打印 5》，5输出，微队列：[]
 *
 * 最终输出顺序：1，AAA, 3, 4, 5
 */
