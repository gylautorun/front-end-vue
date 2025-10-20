import { ITableItem } from '@/components/scroll-table/type';

export interface IItem extends ITableItem {
    
}

export function getData(): IItem[] {
    const data: IItem[] = [];
    for (let i = 0; i < 400000; ++i) {
        data.push({
            id: i,
            name: `员工${i}`,
            city: 'BJ'
        });
    }
    return data;
}

export function getTreeData(): IItem[] {
    const treeData: IItem[] = [];
    for (let i = 0; i < 4; ++i) {
        const level1Data: IItem[] = [];
        for (let j = 0; j < 100000; ++j) {
            const id = `${i}-${j}`;
            level1Data.push({
                id,
                name: `员工${id}`,
                city: 'BJ'
            });
        }
        const id = `${i}`
        treeData.push({
            id,
            name: `员工${id}`,
            city: 'BJ',
            children: level1Data,
        });
    }
    return treeData;
}