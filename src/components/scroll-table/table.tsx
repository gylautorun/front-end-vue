import { defineComponent } from 'vue';
import { tableProps } from './type';
import {useTableHeader} from './hook/use-table-header';
import './style.scss';

export default defineComponent({
  name: 'Table',
  props: tableProps,
  setup(props) {
    const { tableHeaders } = useTableHeader(props)
    /* render 函数 */
    return () => {
      const { dataSource, columns } = props;
      return (
        <table class="table">
          <thead>
            <tr>
              {tableHeaders.value.map((header) => (
                <th>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataSource.map((item) => (
              <tr key={item.id}>
                {columns.map((column, index) => {
                  const { customRender, key } = column
                  return (
                    <td>
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