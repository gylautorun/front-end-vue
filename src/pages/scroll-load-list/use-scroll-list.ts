import { ref, Ref, computed, watch, unref } from 'vue';
import { useScroll, ElRefType } from './use-scroll';
import { ElMessage } from 'element-plus';

interface Options<T, U> {
    formatResult?: (data: T[]) => U[];
    onSuccess?: () => void;
    immediate?: boolean;
    rowKey?: keyof T;
}

type NotRef<T> = T extends Ref<any> ? never : T

export function useScrollList<T extends U, U = T>(
    api: Function,
    el: ElRefType,
    initParams?: any,
    options?: Options<T, U>
) {
    const {formatResult, onSuccess, immediate} = options || {};

    const params = ref(initParams);
    const loading = ref<boolean>(false);
    const listData: Ref<U[]> = ref([]);
    const pageSize: number = 20;
    const current = ref<number>(1);
    const totalPage = ref<number>(1);

    const isLoadFinish = computed(() => totalPage.value === current.value);

    const { isBottom } = useScroll(el || window);

    const isShowBottomTip = computed(() => isLoadFinish.value && isBottom.value);

    const getListData = async () => {
        try {
            loading.value = true
            const res = await api({
                ...unref(params.value),
                pageNum: current.value,
                pageSize: pageSize
            });
            if (res.code === 200) {
                const data = res.data.records;
                if (current.value === 1) {
                    listData.value = formatResult ? formatResult(data) : data;
                }
                else {
                    listData.value.push(...(formatResult ? formatResult(data) : data));
                }

                totalPage.value = res.data.pages === 0 ? 1 : res.data.pages;

                onSuccess && onSuccess();
            }
            else {
                listData.value = []
                ElMessage.error(res.message)
            }
        }
        catch (error) {
            loading.value = false;
        }
        finally {
            loading.value = false;
        }
    };
    
    // 核心是watch函数，它监听isBottom的变化。当用户滚动到底部时，自动加载下一页的数据
    watch(isBottom, (newVal) => {
        if (newVal && !isLoadFinish.value) {
            current.value++;
            getListData();
        }
    });

    const isImmediate = immediate ?? true;
    isImmediate && getListData();

    const handleSearch = <T extends object>(value: NotRef<T>) => {
        params.value = value;
        current.value = 1;
        getListData();
    };

    return {
        listData,
        loading,
        isLoadFinish,
        handleSearch,
        current,
        isBottom,
        isShowBottomTip,
    };
}
