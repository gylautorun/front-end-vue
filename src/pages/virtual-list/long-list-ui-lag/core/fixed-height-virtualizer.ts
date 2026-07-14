import type { VirtualRange } from './types';

/** 固定高度虚拟列表模型：所有区间和偏移计算都是 O(1)。 */
export class FixedHeightVirtualizer {
    /**
     * 创建固定高度计算模型。
     * @param itemHeight 每个列表项包含边框在内的固定高度，单位为 px。
     */
    constructor(private readonly itemHeight: number) {
        // 拒绝 0、负数、Infinity 和 NaN，避免后续除法得到无效索引。
        if (!Number.isFinite(itemHeight) || itemHeight <= 0) {
            throw new RangeError('itemHeight must be greater than 0');
        }
    }

    /** 根据滚动位置计算本帧需要渲染的数据区间。 */
    getRange(params: {
        /** 当前滚动容器距离列表顶部的距离，单位为 px。 */
        scrollTop: number;
        /** 当前滚动容器的可见高度，单位为 px。 */
        viewportHeight: number;
        /** 完整数据源的项目数量。 */
        itemCount: number;
        /** 可见区前后额外预渲染的项目数量。 */
        overscan: number;
    }): VirtualRange {
        // 数量必须是非负整数，防止外部小数或负值破坏数组区间。
        const itemCount = Math.max(0, Math.floor(params.itemCount));
        // 缓冲数量同样归一化为非负整数。
        const overscan = Math.max(0, Math.floor(params.overscan));
        // 滚动距离不得小于列表顶部。
        const scrollTop = Math.max(0, params.scrollTop);
        // 不允许负视口高度参与可见数量计算。
        const viewportHeight = Math.max(0, params.viewportHeight);
        // 固定高度可通过除法 O(1) 得到视口顶部项目索引。
        const firstVisibleIndex = Math.min(itemCount, Math.floor(scrollTop / this.itemHeight));
        // 向上取整确保视口底部不足一整行的部分也被覆盖。
        const visibleCount = Math.ceil(viewportHeight / this.itemHeight);
        // 起点向前加入缓冲，但不能越过第 0 项。
        const startIndex = Math.max(0, firstVisibleIndex - overscan);
        // 终点包含可见项和尾部缓冲，但不能超过数据总量。
        const endIndex = Math.min(itemCount, firstVisibleIndex + visibleCount + overscan);

        return {
            // 交给 Array.slice 和视图层使用的起始索引。
            startIndex,
            // 交给 Array.slice 和视图层使用的结束索引。
            endIndex,
            // 渲染块应移动到起始项目在完整列表中的位置。
            offsetY: startIndex * this.itemHeight,
            // 占位层高度用于生成与完整列表一致的滚动范围。
            totalHeight: itemCount * this.itemHeight
        };
    }
}
