/** 两种演示页面共用的数据规模选项。 */
export const DATA_SIZE_OPTIONS = [10_000, 100_000, 500_000, 1_000_000] as const;
/** 页面首次打开时默认生成的数据量。 */
export const DEFAULT_DATA_SIZE = 100_000;

/** 固定高与不定高演示数据都需要的基础字段。 */
export interface BaseDemoItem {
    /** 从 1 开始的稳定业务标识，同时用作 Vue key。 */
    id: number;
    /** 列表项展示的主标题。 */
    title: string;
}

/** 固定高度页面使用的数据结构。 */
export interface FixedDemoItem extends BaseDemoItem {
    /** 固定为单行显示的辅助摘要。 */
    summary: string;
}

/** 不定高度页面使用的数据结构。 */
export interface DynamicDemoItem extends BaseDemoItem {
    /** 当前项目实际渲染的正文行数，范围为 3 到 10。 */
    lineCount: number;
}

/** 根据指定数量生成固定高度演示数据。 */
export const createFixedData = (count: number): FixedDemoItem[] =>
    Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        title: `业务记录 ${String(index + 1).padStart(6, '0')}`,
        summary: `稳定行高与按需渲染，当前数据索引为 ${index}`
    }));

/** 根据指定数量生成不定高度演示数据。 */
export const createDynamicData = (count: number): DynamicDemoItem[] =>
    Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        title: `动态高度记录 ${String(index + 1).padStart(6, '0')}`,
        // 5 与 8 互质，因此序列会均匀覆盖 3 到 10 行。
        lineCount: 3 + ((index * 5) % 8)
    }));
