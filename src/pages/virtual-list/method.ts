export function repeat(value: string, count: number) {
    return value.repeat(count);
}
export interface IListItem {
    id: string;
    index: number;
    title: string;
    value: string;
}
export const GENERATE_LIST_NUM = 10 * 1000;
export const generateList = (params?: {
    num?: number;
    calculate?: number;
    repeatNum?: number;
    isAuto?: boolean;
}) => {
    const {
        num = GENERATE_LIST_NUM,
        repeatNum = 100,
        isAuto = false,
        calculate = 0
    } = params || {};
    const getRepeatNum = () => {
        if (isAuto) {
            return Math.ceil(Math.random() * repeatNum);
        }
        return repeatNum;
    };
    const data = [];
    const value = Math.random().toString(36).substring(2, 15);
    for (let i = 1; i <= num; i++) {
        const index = calculate + i;
        const id = index.toString();
        data.push({
            id,
            index,
            title: `标题${id}`,
            value: repeat(`内容${value}`, getRepeatNum())
        });
    }
    return data;
};

export const listData_default = generateList();
export const listData_100 = generateList({ num: 100 });
export const listData_10000000 = generateList({ num: 10000000 });
