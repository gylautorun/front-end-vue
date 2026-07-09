/**
 * 使用有序断点存储分段强度。
 *
 * 每一项都是 [start, value]：
 * - start 表示该段开始的位置；
 * - value 表示从 start 到下一个断点之前的强度；
 * - 第一个断点之前的强度默认始终为 0。
 */
export class IntensitySegments {
    constructor() {
        // segments 始终按 start 升序排列，并且相邻段不会保留相同 value。
        this.segments = [];
    }

    /**
     * 给半开区间 [from, to) 内的每个位置增加 amount。
     */
    add(from, to, amount) {
        // 先校验边界和强度值，避免非法输入破坏内部有序结构。
        this.#assertValidRange(from, to, 'add(from, to, amount)');
        this.#validateAmount(amount);

        // 空区间或增加 0 都不会改变结果。
        if (from === to || amount === 0) {
            return;
        }

        // 确保 from 和 to 都是断点，方便只修改中间覆盖到的段。
        const startIndex = this.#ensureBreakpoint(from);
        const endIndex = this.#ensureBreakpoint(to);

        // 对 [from, to) 覆盖到的每一段累加强度。
        for (let index = startIndex; index < endIndex; index += 1) {
            this.segments[index][1] += amount;
        }

        // 合并相邻强度相同的段，并移除开头强度为 0 的冗余断点。
        this.#normalize();
    }

    /**
     * 将半开区间 [from, to) 内的每个位置设置为 amount。
     */
    set(from, to, amount) {
        // set 和 add 使用同一套边界与强度校验规则。
        this.#assertValidRange(from, to, 'set(from, to, amount)');
        this.#validateAmount(amount);

        // 空区间不产生任何修改。
        if (from === to) {
            return;
        }

        // 确保设置范围的左右边界都存在断点。
        const startIndex = this.#ensureBreakpoint(from);
        const endIndex = this.#ensureBreakpoint(to);

        // 删除原范围内的断点，并用 [from, amount] 表示新强度。
        this.segments.splice(startIndex, endIndex - startIndex, [from, amount]);
        this.#normalize();
    }

    toString() {
        // 输出格式要求是 JSON 数组字符串。
        return JSON.stringify(this.segments);
    }

    #ensureBreakpoint(point) {
        // 找到第一个 start >= point 的位置。
        const index = this.#lowerBound(point);

        // 如果 point 已经是断点，直接复用它的位置。
        if (this.segments[index]?.[0] === point) {
            return index;
        }

        // 新断点继承它左侧区间的强度；如果左侧不存在，则强度为 0。
        const valueAtPoint = index === 0 ? 0 : this.segments[index - 1][1];
        this.segments.splice(index, 0, [point, valueAtPoint]);

        return index;
    }

    #lowerBound(point) {
        // 二分查找第一个 start >= point 的下标。
        let left = 0;
        let right = this.segments.length;

        while (left < right) {
            const middle = Math.floor((left + right) / 2);

            if (this.segments[middle][0] < point) {
                left = middle + 1;
            } else {
                right = middle;
            }
        }

        return left;
    }

    #normalize() {
        // 清理冗余断点：如果当前强度和前一段相同，该断点没有存在必要。
        const normalized = [];
        let previousValue = 0;

        for (const [start, value] of this.segments) {
            if (value === previousValue) {
                continue;
            }

            normalized.push([start, value]);
            previousValue = value;
        }

        this.segments = normalized;
    }

    #isValidRange(from, to) {
        return Number.isInteger(from) && Number.isInteger(to) && from <= to;
    }

    #assertValidRange(from, to, methodName) {
        if (!this.#isValidRange(from, to)) {
            throw new TypeError(`${methodName} 参数必须是整数边界，且 from 不能大于 to。`);
        }
    }

    #validateAmount(amount) {
        if (!Number.isInteger(amount)) {
            throw new TypeError('amount 必须是整数。');
        }
    }
}
