/** 一次虚拟列表计算得到的渲染窗口。endIndex 遵循 Array.slice 的开区间语义。 */
export interface VirtualRange {
    /** 本次渲染包含的第一项索引。 */
    startIndex: number;
    /** 本次渲染结束索引，不包含该索引对应的项目。 */
    endIndex: number;
    /** 渲染块相对完整列表顶部的纵向偏移，单位为 px。 */
    offsetY: number;
    /** 完整列表的逻辑总高度，单位为 px。 */
    totalHeight: number;
}
