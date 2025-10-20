import {reactive, toRefs} from 'vue';

type Callback = () => void;

type Options = Partial<{
    pageSize: number;
    pageSizes: number[];
    showPageSize: boolean;
    showTotal: boolean;
    total: number;
    pageNumber: number;
}>;

export function usePagination(options: Options, callback?: Callback) {
    const pagination = reactive({
        ...Object.assign({
            pageSize: 10,
            pageSizes: [10, 20, 30, 50],
            showPageSize: true,
            showTotal: true,
            pageNumber: 1,
        }, options),
        onChangeSize: (size: number) => {
            pagination.pageSize = size;
            pagination.pageNumber = 1;
            callback?.();
        },
        onChangeNumber: (size: number) => {
            pagination.pageNumber = size;
            callback?.();
        },
    });

    const changeSize = pagination.onChangeSize;
    const changeNumber = pagination.onChangeNumber;
    function changeTotal(total: number) {
        pagination.total = total;
    }
    const {pageSize, pageNumber, total} = toRefs(pagination);
    return {
        pageNumber,
        pageSize,
        total,
        pagination,
        changeSize,
        changeNumber,
        changeTotal,
    };
}
