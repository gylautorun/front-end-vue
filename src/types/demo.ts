interface Demo {
    name: string;
    age: number;
}

type DemoKey = keyof Demo;

const demo: DemoKey = 'age';

type DemoValue = {
    name: string;
    age: number;
};

type DemoValueKey = keyof DemoValue;
const demo2: DemoValueKey = 'name';

// interface B {
//     [key in keyof Demo]: string;
// }; // 报错
// const demo3: B = {
//     name: '123',
//     age: '123'
// };
