import { computed, ref } from 'vue';
import { TableProps } from '../type';

export function useTreeData(props: TableProps) {
    const expandedRowKeys = ref<string[]>([]);

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
    const walkTree = (data: any[], walkData: any[], level = 0) => {
        for (let item of walkData) {
            data.push({
                ...item,
                level,
            });
            if (isExpanded(item.id) && item.children) {
                walkTree(data, item.children, level + 1);
            }
        }
    };

    // 实际渲染数据
    const tableData = computed(() => {
        const data: any[] = [];
        const { dataSource } = props;
        walkTree(data, dataSource);
        return data;
    });

    return {
        isExpanded,
        toggleExpand,
        tableData,
    };
}