
function isCheckRangeEfficient(range) {
    if (!Array.isArray(range)) {
        return false;
    }
    if (range.length !== 2) {
        return false;
    }
    const [min, max] = range;
    if ((typeof min !== 'number' || typeof max !== 'number')
        || (isNaN(min) || isNaN(max))
        || min > max) {
        return false;
    }
    return true;
}
function errorRange(name) {
    console.error(name, '参数必须是[a, b]数组范围格式, a和b必须是整数且a小于等于b, 请检查传参');
}
export class RangeList {
    constructor (range) {
        const isEfficient = isCheckRangeEfficient(range);
        if (!isEfficient && range !== undefined) {
            errorRange('new RangeList(range)');
        }
        this.list = isEfficient ? [range] : [];
    }

    get length() {
        return this.list.length;
    }
    _valitateRange(range, name) {
        const isEfficient = isCheckRangeEfficient(range);
        if (!isEfficient) {
            errorRange(name);
        }
        return isEfficient;
    }

    add(range) {
        if (!this._valitateRange(range, 'add(range)方法')) {
            return;
        }
        if (this.length === 0) {
            this.list.push(range);
            return;
        }

        let [left, right] = range;
        const list = [];
        // 是否插入过
        let isInserted = false;
        for (const _range of this.list) {
            const [_left, _right] = _range;
            if (_left > right) {
                // 当前位置在 插入区间的右侧且无交集
                if (!isInserted) {
                    list.push([left, right]);
                    isInserted = true;                    
                }
                list.push(_range);
            } else if (_right < left) {
                // 当前位置在 在插入区间的左侧且无交集
                list.push(_range);
            } else {
                // 与插入区间有交集, 计算并集返回, 和后续对比
                left = Math.min(left, _left);
                right = Math.max(right, _right);
            }
        }
        if (!isInserted) {
            list.push([left, right]);
        }
        this.list = list;
    }

    remove(range) {
        if (!this._valitateRange(range, 'remove(range)方法')) {
            return;
        }
        if (this.length === 0) {
            return;
        }
        // [1, 9) [10, 21)  [10, 10]
        let [left, right] = range;
        const list = [];
        for (const _range of this.list) {
            const [_left, _right] = _range;
            if (_left > right) {
                // 当前位置在 移除区间的右侧且无交集
                list.push(_range);
            } else if (_right < left) {
                // 当前位置在 移除区间的左侧且无交集
                list.push(_range);
            } else {
                // 与移除区间有交集
                if (_left < left) {
                    list.push([_left, left]);
                }
                if (_right > right) {
                    list.push([right, _right]);
                }
            }
        }
        this.list = list;
    }

    toString() {
        // 需要注意空格 输出有空格
        const result = this.list.reduce((res, item) => {
            const [min, max] = item;
            // 输出有间隔
            if (res !== '') {
                res += ' ';
            }
            return `${res}[${min}, ${max})`;
        }, '');
        // 还可以先收集 => ['[)', ...].join(' ')
        console.log('toString:', result);
        return result;
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
rl.toString(); // [1, 6) [6, 9) [11, 15) [17, 21)

rl.remove([3, 19]);
rl.toString(); // [1, 3) [19, 21)
