import { Ref, computed, ref } from 'vue';
import { ITableItem, TableProps } from '../type';

export function useTreeVirtualScroll(
    props: TableProps,
    refs: {
        headerRef: Ref<HTMLElement | null>;
        scrollRef: Ref<HTMLElement | null>;
    }
) {
    const expandedRowKeys = ref<string[]>([]);
    // 实际渲染数据的起始索引
    const startIndex = ref(0);

    // 判断节点是否展开
    const isExpanded = (key: string) => {
        return expandedRowKeys.value.includes(key);
    };

    // 切换节点展开状态
    const toggleExpand = (key: string) => {
        const index = expandedRowKeys.value.findIndex((item) => item === key);
        index >= 0
            ? expandedRowKeys.value.splice(index, 1)
            : expandedRowKeys.value.push(key);
    };

    // 遍历树
    const walkTree = (data: ITableItem[], walkData: ITableItem[], level = 0) => {
        for (let item of walkData) {
            data.push({
                ...item,
                level,
            });
            if (isExpanded(item.id) && item.children) {
                walkTree(data, item.children, level + 1)
            }
        }
    };

    // 全部展开数据
    const allTableData = computed(() => {
        const data: ITableItem[] = [];
        const { dataSource } = props;
        walkTree(data, dataSource);
        return data;
    });

    const scrollY = computed(() => {
        const {scrollY} = props;
        const { scrollRef } = refs;
        if (scrollRef.value) {
            return scrollRef.value.clientHeight;
        }
        return scrollY;
    });

    // 表格实际可展示的数据条数
    const count = computed(() => {
        const { cellHeight, headerFixed } = props;
        const { headerRef } = refs;
        const headerHeight = (headerFixed && headerRef.value) ? headerRef.value.clientHeight : 0;
        return Math.ceil((scrollY.value - headerHeight) / cellHeight);
    });

    // 实际渲染数据
    const tableData = computed(() => {
        const data = allTableData.value;
        const start = startIndex.value;
        const end = Math.min(start + count.value, data.length);
        return data.slice(start, end);
    });

    // 滚动监听事件
    const onScroll = (e: Event) => {
        const { scrollTop, scrollHeight } = e.target as HTMLElement;
        const start = Math.floor(
            (scrollTop / scrollHeight) * allTableData.value.length
        );
        startIndex.value = start;
    };

    return {
        isExpanded,
        toggleExpand,
        startIndex,
        count,
        tableData,
        allTableData,
        onScroll,
    };
}