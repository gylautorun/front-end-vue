import { isNil } from 'lodash-es';
import { create, all, ConfigOptions, BigNumber, Unit, Fraction } from 'mathjs';
import { IWorkerEvent } from '../type';

export type CountType = string | null | undefined | number;
const config: ConfigOptions = {
    number: 'BigNumber',
    precision: 20, // 精度
};
const math = create(all, config);

// 加
const numberAdd = <T extends number>(arg1: T, arg2: T) => {
    return math.number(
        math.add(
            math.bignumber(arg1),
            math.bignumber(arg2)
        )
    );
};
//减
const numberSub = <T extends number>(arg1: T, arg2: T) => {
    return math.number(
        math.subtract(
            math.bignumber(arg1), 
            math.bignumber(arg2)
        )
    );
};
//乘
const numberMultiply = <T extends number>(arg1: T, arg2: T) => {
    return math.number(
        math.multiply(
            math.bignumber(arg1) as unknown as number, 
            math.bignumber(arg2) as unknown as number
        )
    );
};
//除
const numberDivide = <T extends number>(arg1: T, arg2: T) => {
    return math.number(
        math.divide(
            math.bignumber(arg1) as unknown as number,
            math.bignumber(arg2) as unknown as number
        )
    );
};

// 数组总体标准差公式
const popVariance = (arr: number[]) => {
    return Math.sqrt(popStandardDeviation(arr));
};

// 数组总体方差公式
const popStandardDeviation = (arr: number[]) => {
    let s;
    let ave;
    let sum = 0;
    let sums = 0;
    let len = arr.length;
    for (let i = 0; i < len; i++) {
        sum = numberAdd(Number(arr[i]), sum);
    }
    ave = numberDivide(sum, len);
    for (let i = 0; i < len; i++) {
        sums = numberAdd(sums, numberMultiply(numberSub(Number(arr[i]), ave), numberSub(Number(arr[i]), ave)));
    }
    s = numberDivide(sums, len);
    return s;
};

// 数组加权公式
const weightedAverage = <T extends number>(arr1: T[], arr2: T[]) => {
    // arr1: 计算列，arr2: 选择的权重列
    let s;
    let sum = 0; // 分子的值
    let sums = 0; // 分母的值
    let len = arr1.length;
    for (let i = 0; i < len; i++) {
        sum = numberAdd(numberMultiply(Number(arr1[i]), Number(arr2[i])), sum);
        sums = numberAdd(Number(arr2[i]), sums);
    }
    s = numberDivide(sum, sums);
    return s;
};

// 数组样本方差公式
const varianceArr = (arr: number[]) => {
    let s;
    let ave;
    let sum = 0;
    let sums = 0;
    let len = arr.length;
    for (let i = 0; i < len; i++) {
        sum = numberAdd(Number(arr[i]), sum);
    }
    ave = numberDivide(sum, len);
    for (let i = 0; i < len; i++) {
        sums = numberAdd(sums, numberMultiply(numberSub(Number(arr[i]), ave), numberSub(Number(arr[i]), ave)));
    }
    s = numberDivide(sums, len - 1);
    return s;
};

// 数组中位数
const middleNum = (arr: number[]) => {
    arr.sort((a, b) => a - b);
    if (arr.length % 2 === 0) {
        //判断数字个数是奇数还是偶数
        return numberDivide(numberAdd(arr[arr.length / 2 - 1], arr[arr.length / 2]), 2); //偶数个取中间两个数的平均数
    }
    else {
        return arr[(arr.length + 1) / 2 - 1]; //奇数个取最中间那个数
    }
};

// 数组求和
const sum = (arr: CountType[]) => {
    let sum = 0;
    const len = arr.length;
    for (let i = 0; i < len; i++) {
        sum = numberAdd(Number(arr[i]), sum);
    }
    return sum;
};

// 数组平均值
const average = (arr: CountType[]) => {
    return numberDivide(sum(arr), arr.length);
};

// 数组最大值
const max = (arr: number[]) => {
    return Math.max(...arr);
};

// 数组最小值
const min = (arr: number[]) => {
    return Math.min(...arr);
};

// 数组有效数据长度
const count = (arr: CountType[]) => {
    const removeList: CountType[] = ['', ' ', null, undefined, '-'];
    const res = arr.filter((item) => {
        return !removeList.includes(item);
    });
    return res.length;
};

// 数组样本标准差公式
const stdDeviation = (arr: number[]) => {
    return Math.sqrt(varianceArr(arr));
};

// 数字三位加逗号，保留两位小数
const formatNumber = (num: CountType, pointNum = 2) => {
    if (isNil(num)) {
        return '--';
    }
    const arr = (typeof num == 'string' ? parseFloat(num) : num).toFixed(pointNum).split('.');
    const intNum = arr[0].replace(/\d{1,3}(?=(\d{3})+(\.\d*)?$)/g, '$&,');
    return arr[1] === undefined ? intNum : `${intNum}.${arr[1]}`;
};

self.onmessage = function (e: IWorkerEvent<{
    calcType: {
        title: string;
        type: string;
    };
    columnList: {
        Alias: number;
    }[];
    dataMap: {
        [key: string]: number[];
    };
    selectValue: string;
}>) {
    debugger;
    const { calcType, columnList, dataMap, selectValue } = e.data;
    const arr: CountType[] = [calcType.title];
    columnList.forEach((item) => {
        const alias = item.Alias;
        const type = calcType.type;
        switch (type) {
            case 'count':
                arr.push(count(dataMap[alias] as unknown as CountType[]));
                break;
            case 'sum':
                arr.push(formatNumber(sum(dataMap[alias])));
                break;
            case 'arithmeticMean':
                arr.push(formatNumber(average(dataMap[alias])));
                break;
            case 'weightedAverage':
                arr.push(formatNumber(weightedAverage(dataMap[alias], dataMap[selectValue])));
                break;
            case 'maxNum':
                arr.push(formatNumber(max(dataMap[alias])));
                break;
            case 'median':
                arr.push(formatNumber(middleNum(dataMap[alias])));
                break;
            case 'smallest':
                arr.push(formatNumber(min(dataMap[alias])));
                break;
            case 'variance':
                arr.push(formatNumber(varianceArr(dataMap[alias])));
                break;
            case 'popVariance':
                arr.push(formatNumber(popVariance(dataMap[alias])));
                break;
            case 'standardDeviation':
                arr.push(formatNumber(stdDeviation(dataMap[alias])));
                break;
            case 'popStandardDeviation':
            arr.push(formatNumber(popStandardDeviation(dataMap[alias])));
            break;
        }
    });

    // 发送数据事件
    self.postMessage(arr);
};
