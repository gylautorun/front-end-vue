import { defineComponent, ref } from 'vue';
import { tableProps } from './type';
import {useTableHeader} from './hook/use-table-header';
import {useVirtualScroll} from './hook/use-virtual-scroll';
import './style.scss';

export default defineComponent({
    name: 'ScrollTable',
    props: tableProps,
    setup(props) {
        const scrollRef = ref<HTMLElement | null>(null);
        const { tableHeaders, headerRef } = useTableHeader(props);
        const { tableData, startIndex, count, onScroll } = useVirtualScroll(
            props,
            {headerRef, scrollRef}
        );
        /* render 函数 */
        return () => {
            const { dataSource, columns, cellHeight } = props;
            const topHeight = startIndex.value * cellHeight;
            const bottomHeight = (dataSource.length - startIndex.value - count.value) * cellHeight;
            return (
                <div
                        class="scroll-table-wrapper table-container"
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
                        {/* 表格内容上方插入空白元素 */}
                        <div style={{height: `${topHeight}px`}} />
                        <tbody>
                            {/* 表格实际渲染内容 */}
                            {tableData.value.map((item) => (
                                <tr style={{ height: `${cellHeight}px` }} key={item.id}>
                                    {columns.map((column, index) => {
                                        const { customRender, key } = column
                                        return (
                                            <td>
                                                {customRender ? customRender({
                                                    text: item.name,
                                                    record: item,
                                                    index,
                                                    column
                                                }) : item.name}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                        {/* 表格内容下方插入空白元素 */}
                        <div style={{height: `${bottomHeight}px`}} />
                    </table>
                </div>
            );
        }
    }
});
