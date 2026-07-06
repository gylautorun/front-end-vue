function timeout(time: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, time));
}

type TaskItem = () => Promise<void>;
type Task = {
    task: TaskItem;
    resolve: (value?: void) => void;
    reject: (reason?: any) => void;
};

interface SuperTaskType {
    // 并发任务数
    limit: number;
    // 任务队列
    tasks: Task[];
    // 当前执行任务数
    current: number;
    // 添加任务
    add(task: TaskItem): void;
}
class SuperTask implements SuperTaskType {
    tasks: Task[];
    limit: number = 2;
    current: number = 0;
    constructor(limit = 2) {
        // 初始化并发任务数为2
        this.limit = limit;
        this.tasks = [];
    }
    /**
     * 添加任务到队列
     * @param task 任务
     * @returns Promise
     */
    add(task: TaskItem): Promise<void> {
        return new Promise((resolve, reject) => {
            this.tasks.push({
                task,
                resolve,
                reject
            });
            this.execute();
        });
    }

    /**
     * 执行任务
     */
    async execute() {
        while (this.tasks.length > 0 && this.current < this.limit) {
            const { task, resolve, reject } = this.tasks.shift()!;
            task()
                .then(resolve, reject)
                .finally(() => {
                    this.current--; // 当前执行任务数减1
                    this.execute(); // 执行下一个任务
                });
            this.current++; // 当前执行任务数加1
        }
    }
}

const task = new SuperTask();
let timeoutId: number = Date.now();
function addTask(time: number, name: string) {
    task.add(() => {
        return timeout(time);
    }).then(() => {
        console.log(`耗时 ${Date.now() - timeoutId}ms, ${name} 任务完成`);
    });
}
addTask(10000, '任务1'); // 耗时 10000ms, 任务1 任务完成
addTask(5000, '任务2'); // 耗时 5000ms,任务2 任务完成
addTask(3000, '任务3'); // 耗时 8000ms,任务3 任务完成
addTask(4000, '任务4'); // 耗时 12000ms,任务4 任务完成
addTask(5000, '任务5'); // 耗时 15000ms,任务5 任务完成
