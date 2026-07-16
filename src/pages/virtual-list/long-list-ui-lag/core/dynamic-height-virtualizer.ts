import type { VirtualRange } from './types';

/**
 * 不定高度虚拟列表模型。
 *
 * 未测量项目先使用 estimatedItemHeight；DOM 挂载后通过 updateItemHeight 修正。
 * Fenwick Tree 让高度修正、偏移查询和滚动位置定位都保持 O(log n)。
 */
export class DynamicHeightVirtualizer {
    /** 只保存已测量项目的真实高度，内存不随总项目数增长。 */
    private readonly measuredHeights = new Map<number, number>();
    /** 稀疏 Fenwick Tree 只保存相对预估高度的差值。 */
    private readonly tree = new Map<number, number>();
    /** 模型维护的逻辑项目数。 */
    private itemCountValue = 0;

    /**
     * 创建不定高度计算模型。
     * @param itemCount 初始数据项目数量。
     * @param estimatedItemHeight 尚未进入 DOM 的项目预估高度。
     */
    constructor(
        itemCount: number,
        private readonly estimatedItemHeight: number
    ) {
        // 无效预估值会让总高度和二分定位失真，因此直接拒绝。
        if (!Number.isFinite(estimatedItemHeight) || estimatedItemHeight <= 0) {
            throw new RangeError('estimatedItemHeight must be greater than 0');
        }
        // 根据初始数量创建高度缓存与累计高度树。
        this.setItemCount(itemCount);
    }

    /** 返回高度模型当前维护的项目数量。 */
    get itemCount(): number {
        return this.itemCountValue;
    }

    /** 返回所有项目高度的累计值。 */
    get totalHeight(): number {
        return this.getOffset(this.itemCount);
    }

    /** 数据量变化时保留已有测量结果，并用预估高度初始化新增项目。 */
    setItemCount(nextCount: number): void {
        // 将外部数量归一化为安全的非负整数。
        const count = Number.isFinite(nextCount)
            ? Math.min(Number.MAX_SAFE_INTEGER, Math.max(0, Math.floor(nextCount)))
            : 0;
        this.itemCountValue = count;

        // 缩容时丢弃越界测量；扩容也需重建，使旧差值传播到新 Fenwick 父节点。
        for (const index of this.measuredHeights.keys()) {
            if (index >= count) this.measuredHeights.delete(index);
        }
        this.rebuildTree();
    }

    /** 返回指定项目顶部相对完整列表顶部的距离。index 可等于 itemCount。 */
    getOffset(index: number): number {
        // 查询索引限制在 0 到 itemCount；itemCount 表示查询完整总高度。
        const cursor = Math.min(this.itemCount, Math.max(0, Math.floor(index)));
        // 未测量部分直接使用预估高度，只叠加稀疏树中的实测差值。
        return cursor * this.estimatedItemHeight + this.getDeltaPrefix(cursor);
    }

    /** 写入 DOM 实测高度；返回高度差，0 表示无需触发视图更新。 */
    updateItemHeight(index: number, nextHeight: number): number {
        // 忽略越界索引和非正有限高度，防止污染高度树。
        if (
            index < 0 ||
            index >= this.itemCount ||
            !Number.isFinite(nextHeight) ||
            nextHeight <= 0
        ) {
            return 0;
        }

        // 保留两位小数，减少浏览器亚像素布局带来的浮点噪声。
        const height = Math.round(nextHeight * 100) / 100;
        // 高度差用于对 Fenwick Tree 做增量更新。
        const previousHeight = this.measuredHeights.get(index) ?? this.estimatedItemHeight;
        const delta = height - previousHeight;
        // 小于半像素的变化没有可见收益，忽略可避免 ResizeObserver 抖动。
        if (Math.abs(delta) < 0.5) return 0;

        // 写入项目最新实测高度。
        this.measuredHeights.set(index, height);
        // Fenwick Tree 是 1-based，因此项目索引需要加 1。
        this.addToTree(index + 1, delta);
        // 返回差值供视图层判断是否需要滚动锚点补偿。
        return delta;
    }

    /** 根据累计高度二分定位可见项，再按像素缓冲扩展渲染区间。 */
    getRange(params: {
        /** 完整逻辑坐标系中的滚动位置。 */
        scrollTop: number;
        /** DOM 滚动容器的可见高度。 */
        viewportHeight: number;
        /** 可见区前后额外预渲染的像素高度。 */
        overscanPx: number;
    }): VirtualRange {
        // 所有输入先钳制为非负值。
        const scrollTop = Math.max(0, params.scrollTop);
        const viewportHeight = Math.max(0, params.viewportHeight);
        const overscanPx = Math.max(0, params.overscanPx);
        // 从视口顶部向前扩展像素缓冲，再定位包含该偏移的项目。
        const startIndex = this.findIndexAtOffset(Math.max(0, scrollTop - overscanPx));
        // 可见底部加像素缓冲，并限制在逻辑总高度内。
        const endOffset = Math.min(this.totalHeight, scrollTop + viewportHeight + overscanPx);
        // endIndex 是开区间，因此定位结果需要加 1。
        const endIndex = Math.min(this.itemCount, this.findIndexAtOffset(endOffset) + 1);

        return {
            // 本次应渲染的第一个数据索引。
            startIndex,
            // 本次渲染开区间结束索引。
            endIndex,
            // 起始项目在完整逻辑列表中的累计偏移。
            offsetY: this.getOffset(startIndex),
            // 当前预估高度和实测高度共同组成的逻辑总高度。
            totalHeight: this.totalHeight
        };
    }

    /** 查找包含指定纵向偏移量的项目索引。 */
    private findIndexAtOffset(offset: number): number {
        // 空列表没有有效项目，约定返回索引 0。
        if (!this.itemCount) return 0;

        // 当前已经确认不超过目标偏移的 Fenwick 索引。
        let index = 0;
        // index 对应的累计高度。
        let prefixHeight = 0;
        // 从不超过项目数量的最高 2 次幂开始做二进制提升。
        let bit = this.itemCount ? 2 ** Math.floor(Math.log2(this.itemCount)) : 1;

        // 从高位到低位尝试扩展索引，复杂度为 O(log n)。
        for (; bit >= 1; bit /= 2) {
            // 当前步准备尝试的候选索引。
            const next = index + bit;
            // 候选累计高度未越过目标时，接受本次跳跃。
            if (next > this.itemCount) continue;
            const blockHeight =
                this.lowbit(next) * this.estimatedItemHeight + (this.tree.get(next) ?? 0);
            if (prefixHeight + blockHeight <= offset) {
                index = next;
                prefixHeight += blockHeight;
            }
        }

        // offset 等于总高度时 index 会到 itemCount，需要回退到最后一个有效项目。
        return Math.min(index, this.itemCount - 1);
    }

    /** 根据少量实测高度重建稀疏 Fenwick Tree。 */
    private rebuildTree(): void {
        this.tree.clear();
        for (const [index, height] of this.measuredHeights) {
            this.addToTree(index + 1, height - this.estimatedItemHeight);
        }
    }

    /** 从指定 1-based 索引开始，把高度差传播到所有相关父节点。 */
    private addToTree(index: number, delta: number): void {
        // 每次增加 lowbit(cursor)，依次更新包含该项目的累计区间。
        for (let cursor = index; cursor <= this.itemCount; cursor += this.lowbit(cursor)) {
            this.tree.set(cursor, (this.tree.get(cursor) ?? 0) + delta);
        }
    }

    /** 查询前 index 项的实测高度差值和。 */
    private getDeltaPrefix(index: number): number {
        let cursor = index;
        let sum = 0;
        while (cursor > 0) {
            sum += this.tree.get(cursor) ?? 0;
            cursor -= this.lowbit(cursor);
        }
        return sum;
    }

    /**
     * 返回正整数最低有效二进制位对应的值。
     * 不使用 JS 32 位位运算，确保索引超过 21 亿后仍然正确。
     */
    private lowbit(value: number): number {
        let bit = 1;
        while (value % (bit * 2) === 0) bit *= 2;
        return bit;
    }
}
