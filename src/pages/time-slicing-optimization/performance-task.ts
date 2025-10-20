
export function handlePerformanceTask(tasks: Array<Function>, scheduler: Function) {
    let index = 0; // 任务下标
    let stopped = false;
    const len = tasks.length;
    function run() {
        scheduler((isGoing: () => boolean) => {
            if (stopped) return;
            while (index < len && isGoing()) {
                if (stopped) return;
                tasks[index++]();
            }
            if (index < len) {
                if (stopped) return;
                run();
            }
        });
    }
    run();

    return {
        stop: () => {
            stopped = true;
        },
    };
};

/**
 * 封装 requestIdleCallback 任务调度器
 * @param tasks 任务数组
 */
export function idlePerformanceTask(tasks: Array<Function>) {
    return handlePerformanceTask(tasks, (runChunk: Function) => {
        requestIdleCallback((idle) => {
            runChunk(() => idle.timeRemaining() > 0);
        });
    });
}

/**
 * 封装 requestAnimationFrame 任务调度器
 * @param tasks 任务数组
 */
export function requestAnimationFramePerformanceTask(tasks: Array<Function>, timeSplit = 100) {
    return handlePerformanceTask(tasks, (runChunk: Function) => {
        let count = 0;
        requestAnimationFrame(() => {
            runChunk(() => count++ < timeSplit);
        });
    });
}

// test
function test() {
    const tasks = Array.from({ length: 1000 }, (_, i) => {
        return () => {
            console.log(i);
        };
    });
    const scheduler = (runChunk: Function) => {
        let count = 0;
        setTimeout(() => {
            runChunk(() => count++ < 10);
        }, 1000);
    };
    const result = handlePerformanceTask(tasks, scheduler);

    setTimeout(() => {
        result.stop();
    }, 5000);
}