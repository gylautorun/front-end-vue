import { defineComponent, computed, ref } from 'vue';
import { tableProps } from './type';
import {useTableHeader} from './hook/use-table-header';
import {useTreeVirtualScroll} from './hook/use-tree-virtual-scroll';
import './style.scss';
import { MinusSquareOutlined, PlusSquareOutlined } from '@ant-design/icons-vue';


export default defineComponent({
    name: 'ScrollTreeTable',
    props: tableProps,
    setup(props) {
        const scrollRef = ref<HTMLElement | null>(null);
        const { tableHeaders, headerRef } = useTableHeader(props)
        const {
            isExpanded,
            toggleExpand,
            startIndex,
            count,
            tableData,
            allTableData,
            onScroll,
        } = useTreeVirtualScroll(props, {headerRef, scrollRef});
        console.log(tableData.value)
        
        /* render 函数 */
        return () => {
            const { columns, cellHeight } = props
            const bodyHeight = startIndex.value * cellHeight;
            const bottomHeight = (allTableData.value.length - startIndex.value - count.value) * cellHeight;
            return (
                <div
                    class="scroll-table-wrapper scroll-table-tree"
                    ref={scrollRef}
                    onScroll={onScroll}
                >
                    <table class="table">
                        <thead ref={headerRef}>
                            <tr>
                                {tableHeaders.value.map((header) => (
                                    <th>{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <div style={{height: `${bodyHeight}px`}} />
                        <tbody>
                            {tableData.value.map((item, index) => (
                                <tr key={item.id}>
                                    {columns.map((column, columnIndex) => {
                                        const { customRender, key } = column;
                                        const { level = 0 } = item;
                                        const id = String(item.id);
                                        return (
                                            <td>
                                                <span
                                                    style={{
                                                        marginLeft: `${level * 20}px`,
                                                        marginRight: '5px'
                                                    }}
                                                >
                                                    {columnIndex === 0 && item.children && (
                                                        isExpanded(id) ? (
                                                            <MinusSquareOutlined
                                                                class="square-outlined"
                                                                onClick={() => toggleExpand(id)}
                                                            />
                                                        ) : (
                                                            <PlusSquareOutlined
                                                                class="square-outlined"
                                                                onClick={() => toggleExpand(id)}
                                                            />
                                                        )
                                                    )}
                                                </span>
                                                {customRender ? customRender({
                                                    text: item.name,
                                                    record: item,
                                                    index,
                                                    column,
                                                }) : item.name}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                        <div style={{height: `${bottomHeight}px`}} />
                    </table>
                </div>
            );
        }
    }
});
