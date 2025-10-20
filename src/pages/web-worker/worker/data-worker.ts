import { IWorkerEvent } from '../type';

self.onmessage = function (e: IWorkerEvent<string[][]>) {
    const data = e.data;
    const list = [];
    for (let i = 1; i < 400; i++) {
        for (let j = 0; j < 10; j++) {
            list.push({...data[j], key: `数据${j + 1 + i * 10}`});
        }
    }
    console.log(list, 'data-worker');
    // 发送数据事件
    self.postMessage(list);
};
