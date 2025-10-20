import { defineComponent, onMounted, ref } from 'vue';
import {ScrollTreeTable} from '@/components/scroll-table';
import { Action, ElMessage, ElMessageBox } from 'element-plus'
import { IItem, getData, getTreeData } from './utils';
import './style.scss';

const service = () => {
    return new Promise<IItem[]>((resolve) => {
        setTimeout(() => {
            resolve(getTreeData());
        }, 100);
    });
};
export default defineComponent({
    name: 'ScrollTablePage',
    setup() {
        const dataSource = ref<IItem[]>([]);
        onMounted(async () => {
            const data = await service();
            dataSource.value = data;
        });
        const notice = (record: IItem) => {
            ElMessageBox.alert(record.city, record.name, {
                confirmButtonText: 'OK',
                callback: (action: Action) => {
                    ElMessage({
                        type: 'info',
                        message: `action: ${action}`,
                    });
                },
            });
        };
        /* render 函数 */
        return () => {
            return (
                <div class="scroll-table">
                    <ScrollTreeTable
                        columns={[
                            {
                                title: '姓名',
                                key: 'name',
                            },
                            {
                                title: '城市',
                                key: 'city',
                            },
                            {
                                title: '操作',
                                key: 'option',
                                customRender({record}: {record: IItem}) {
                                    return (
                                        <button
                                            class="btn btn-primary"
                                            onClick={() => notice(record)}
                                        >
                                            提示
                                        </button>
                                    )
                                },
                            }
                        ]}
                        dataSource={dataSource.value}
                    />
                </div>
            );
        };
    }
});
