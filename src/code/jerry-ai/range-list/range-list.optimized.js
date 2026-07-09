function isValidRange(range) {
    // 1. 入参必须是长度为 2 的数组，表示 [start, end)。
    if (!Array.isArray(range) || range.length !== 2) {
        return false;
    }

    // 2. 取出区间左右边界。
    const [start, end] = range;

    // 3. 左右边界都必须是整数，并且左边界不能大于右边界。
    return Number.isInteger(start) && Number.isInteger(end) && start <= end;
}

function assertValidRange(range, methodName) {
    // 统一入口校验：构造函数、add、remove 都复用同一套规则。
    if (!isValidRange(range)) {
        throw new TypeError(`${methodName} 参数必须是 [start, end] 格式的整数数组，且 start 不能大于 end。`);
    }
}

class RangeList {
    constructor(range) {
        // 1. 内部始终维护一个有序、互不重叠的区间数组。
        this.list = [];

        // 2. 构造函数允许不传 range，此时初始化为空列表。
        if (range !== undefined) {
            // 3. 如果传了 range，先校验格式是否合法。
            assertValidRange(range, 'new RangeList(range)');

            // 4. 取出区间左右边界。
            const [left, right] = range;

            // 5. 只有非空区间才加入列表，[x, x) 是空区间，直接忽略。
            if (left < right) {
                this.list.push([left, right]);
            }
        }
    }

    get length() {
        return this.list.length;
    }

    add(range) {
        // 1. add 的入参也必须是合法区间。
        assertValidRange(range, 'add(range)');

        // 2. 新区间会在合并过程中不断扩展，所以这里使用 let。
        let [left, right] = range;

        // 3. [x, x) 是空区间，不会改变当前列表。
        if (left >= right) {
            return;
        }

        // 4. nextList 用来收集添加新区间后的最终结果。
        const nextList = [];
        // 5. 标记新区间是否已经插入，避免重复插入。
        let inserted = false;

        // 6. 遍历当前已有的所有区间。
        for (const [currentLeft, currentRight] of this.list) {
            // 7. 当前区间完全在新区间左侧，没有交集，直接保留。
            if (currentRight < left) {
                nextList.push([currentLeft, currentRight]);
                continue;
            }

            // 8. 当前区间完全在新区间右侧，先插入新区间，再保留当前区间。
            if (right < currentLeft) {
                if (!inserted) {
                    nextList.push([left, right]);
                    inserted = true;
                }

                nextList.push([currentLeft, currentRight]);
                continue;
            }

            // 9. 两个区间有交集或相邻，合并成一个更大的新区间。
            left = Math.min(left, currentLeft);
            right = Math.max(right, currentRight);
        }

        // 10. 如果遍历结束还没有插入，说明新区间应该放在列表末尾。
        if (!inserted) {
            nextList.push([left, right]);
        }

        // 11. 用合并后的结果替换旧列表。
        this.list = nextList;
    }

    remove(range) {
        // 1. remove 的入参也必须是合法区间。
        assertValidRange(range, 'remove(range)');

        // 2. 取出要删除的区间边界。
        const [left, right] = range;

        // 3. [x, x) 是空区间，不会删除任何内容。
        if (left >= right) {
            return;
        }

        // 4. nextList 用来收集删除后的剩余区间。
        const nextList = [];

        // 5. 遍历当前已有的所有区间。
        for (const [currentLeft, currentRight] of this.list) {
            // 6. 当前区间和删除区间没有交集，直接保留。
            if (currentRight <= left || right <= currentLeft) {
                nextList.push([currentLeft, currentRight]);
                continue;
            }

            // 7. 当前区间左侧有未被删除的部分，保留下来。
            if (currentLeft < left) {
                nextList.push([currentLeft, left]);
            }

            // 8. 当前区间右侧有未被删除的部分，保留下来。
            if (right < currentRight) {
                nextList.push([right, currentRight]);
            }
        }

        // 9. 用删除后的结果替换旧列表。
        this.list = nextList;
    }

    toString() {
        // 将每个区间格式化为 [left, right)，再用空格拼接。
        const res = this.list.map(([left, right]) => `[${left}, ${right})`).join(' ');
        // console.log('toString:', res);
        return res;
    }
}

// Example run
const rl = new RangeList();
rl.toString(); // ''

rl.add([1, 5]);
rl.toString(); // [1, 5)

rl.add([10, 20]);
rl.toString(); // [1, 5) [10, 20)

rl.add([20, 20]);
rl.toString(); // [1, 5) [10, 20)

rl.add([20, 21]);
rl.toString(); // [1, 5) [10, 21)

rl.add([2, 4]);
rl.toString(); // [1, 5) [10, 21)

rl.add([7, 9]);
rl.toString(); // [1, 5) [7, 9) [10, 21)

rl.add([3, 8]);
rl.toString(); // [1, 9) [10, 21)

rl.remove([10, 10]);
rl.toString(); // [1, 9) [10, 21)

rl.remove([10, 11]);
rl.toString(); // [1, 9) [11, 21)

rl.remove([15, 17]);
rl.toString(); // [1, 9) [11, 15) [17, 21)

rl.remove([6, 6]);
rl.toString(); // [1, 9) [11, 15) [17, 21)

rl.remove([3, 19]);
rl.toString(); // [1, 3) [19, 21)
