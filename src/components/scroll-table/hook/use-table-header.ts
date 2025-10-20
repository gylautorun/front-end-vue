import { computed, ref } from 'vue';
import { TableProps } from '../type';

export function useTableHeader(props: TableProps) {
    const headerRef = ref<HTMLElement | null>(null);

    const tableHeaders = computed(() => {
        return props.columns.map((column) => column.title);
    });

    return {
        headerRef,
        tableHeaders,
    };
}