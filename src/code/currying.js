// // 浏览器下运行
// window.name = 'window_name';
// const obj = {
//     name: 'currying',
//     sayHi1: () => {
//         // 指向window
//         console.log(`sayHi1, ${this.name}`);
//     },
//     sayHi2() {
//         // 指向这里的this
//         (() => {
//             console.log(`sayHi2, ${this.name}`);
//         })();
//     }
// };
// obj.sayHi1(); // window_name 
// obj.sayHi2(); // currying
// const sayHi2 = obj.sayHi2;
// sayHi2(); // window_name 


/**
 * @description 函数柯里化
 * @param {Function} fn 函数 ---> 必传, 第一个参数为函数
 * @param {Array} args 函数参数 ---> 可选
 * @returns {Function}

 */
function currying(fn, ...args) {
    return function (...result) {
        const newArgs = args.concat(result);
        // 如果参数数量不足，继续返回柯里化函数
        if (newArgs.length < fn.length) {
            return currying(fn, ...newArgs);
        }
        return fn.apply(this, newArgs);
    };
}
const sum = (a, b, c, d) => a + b + c + d;
console.log(currying(sum)(1)(2)(3)(4)); // 10
console.log(currying(sum, 1)(2, 3)(4)); // 10
console.log(currying(sum, 1)(2)(3, 4)); // 10
console.log(currying(sum, 1, 2)(3)(4)); // 10
console.log(currying(sum, 1, 2)(3, 4)); // 10
console.log(currying(sum, 1, 2, 3)(4)); // 10
console.log(currying(sum, 1, 2, 3, 4)); // 10
