import type { VirtualRange } from './types';

/**
 * 不定高度虚拟列表模型。
 *
 * 未测量项目先使用 estimatedItemHeight；DOM 挂载后通过 updateItemHeight 修正。
 * Fenwick Tree 让高度修正、偏移查询和滚动位置定位都保持 O(log n)。
 */
export class DynamicHeightVirtualizer {
    /** 每个项目当前使用的高度；未测量项目保存预估高度。 */
    private heights: number[] = [];
    /** Fenwick Tree 的 1-based 累计高度数组，第 0 位不参与计算。 */
    private tree: number[] = [0];

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
        return this.heights.length;
    }

    /** 返回所有项目高度的累计值。 */
    get totalHeight(): number {
        return this.getOffset(this.itemCount);
    }

    /** 数据量变化时保留已有测量结果，并用预估高度初始化新增项目。 */
    setItemCount(nextCount: number): void {
        // 将外部数量归一化为非负整数。
        const count = Math.max(0, Math.floor(nextCount));
        // 保留已有高度，新增索引使用统一预估高度。
        const heights = Array.from(
            { length: count },
            (_, index) => this.heights[index] ?? this.estimatedItemHeight
        );
        // 用新数组替换旧缓存，截断超出新数量的项目。
        this.heights = heights;
        // 数量变化后重新构建对应长度的累计高度树。
        this.rebuildTree();
    }

    /** 返回指定项目顶部相对完整列表顶部的距离。index 可等于 itemCount。 */
    getOffset(index: number): number {
        // 查询索引限制在 0 到 itemCount；itemCount 表示查询完整总高度。
        let cursor = Math.min(this.itemCount, Math.max(0, Math.floor(index)));
        // 保存 Fenwick Tree 查询过程中累加出的前缀高度。
        let sum = 0;
        // 每次移除最低有效位，向负责更大区间的父节点移动。
        while (cursor > 0) {
            sum += this.tree[cursor];
            cursor -= cursor & -cursor;
        }
        return sum;
    }

    /** 写入 DOM 实测高度；返回高度差，0 表示无需触发视图更新。 */
    updateItemHeight(index: number, nextHeight: number): number {
        // 忽略越界索引和非正有限高度，防止污染高度树。
        if (index < 0 || index >= this.itemCount || !Number.isFinite(nextHeight) || nextHeight <= 0) {
            return 0;
        }

        // 保留两位小数，减少浏览器亚像素布局带来的浮点噪声。
        const height = Math.round(nextHeight * 100) / 100;
        // 高度差用于对 Fenwick Tree 做增量更新。
        const delta = height - this.heights[index];
        // 小于半像素的变化没有可见收益，忽略可避免 ResizeObserver 抖动。
        if (Math.abs(delta) < 0.5) return 0;

        // 写入项目最新实测高度。
        this.heights[index] = height;
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
        let bit = 1;
        while ((bit << 1) <= this.itemCount) bit <<= 1;

        // 从高位到低位尝试扩展索引，复杂度为 O(log n)。
        for (; bit > 0; bit >>= 1) {
            // 当前步准备尝试的候选索引。
            const next = index + bit;
            // 候选累计高度未越过目标时，接受本次跳跃。
            if (next <= this.itemCount && prefixHeight + this.tree[next] <= offset) {
                index = next;
                prefixHeight += this.tree[next];
            }
        }

        // offset 等于总高度时 index 会到 itemCount，需要回退到最后一个有效项目。
        return Math.min(index, this.itemCount - 1);
    }

    /** 根据当前高度数组以 O(n) 构建 Fenwick Tree。 */
    private rebuildTree(): void {
        // 在高度数组前补第 0 位，将其转换成 1-based 树结构。
        this.tree = [0, ...this.heights];
        // 把每个节点的区间和累加到直接父节点。
        for (let index = 1; index <= this.itemCount; index++) {
            // index + lowbit(index) 是当前节点的直接 Fenwick 父节点。
            const parent = index + (index & -index);
            if (parent <= this.itemCount) this.tree[parent] += this.tree[index];
        }
    }

    /** 从指定 1-based 索引开始，把高度差传播到所有相关父节点。 */
    private addToTree(index: number, delta: number): void {
        // 每次增加 lowbit(cursor)，依次更新包含该项目的累计区间。
        for (let cursor = index; cursor <= this.itemCount; cursor += cursor & -cursor) {
            this.tree[cursor] += delta;
        }
    }
}
