import { defineComponent } from 'vue';
import { tableProps } from './type';
import {useTableHeader} from './hook/use-table-header';
import {useTreeData} from './hook/use-tree-data';
import './style.scss';

export default defineComponent({
  name: 'TreeTable',
  props: tableProps,
  setup(props) {
    const { tableHeaders } = useTableHeader(props)
    const { isExpanded, toggleExpand, tableData } = useTreeData(props)
    /* render 函数 */
    return () => {
      const { columns } = props
      return (
        <table class="table tree-table">
          <thead>
            <tr>
              {tableHeaders.value.map((header) => (
                <th>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.value.map((item, index) => (
              <tr key={item.id}>
                {columns.map((column, columnIndex) => {
                  const { customRender, key } = column
                  const { id, level = 0 } = item
                  return (
                    <td>
                      {columnIndex === 0 && (
                        <button
                          class="btn btn-light btn-sm"
                          style={{
                            marginLeft: `${level * 20}px`,
                            marginRight: '5px'
                          }}
                          onClick={() => toggleExpand(id)}>
                          {isExpanded(id) ? '-' : '+'}
                        </button>
                      )}
                      {customRender
                        ? customRender({
                            text: item.name,
                            record: item,
                            index,
                            column
                          })
                        : item.name}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
  }
})