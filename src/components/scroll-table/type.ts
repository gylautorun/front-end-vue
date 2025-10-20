import { ExtractPropTypes, PropType, VNode } from 'vue'

interface ColumnSlotParams {
  text: string;
  record: ITableItem;
  index: number;
  column: ColumnProps;
}

export interface ITableItem {
    city: string;
    id: string | number;
    level?: number;
    name: string;
    children?: ITableItem[];
}

export interface ColumnProps {
  key: string
  title: string
  customRender?: (params: ColumnSlotParams) => VNode
}

export const tableProps = {
  columns: {
    type: Array as PropType<ColumnProps[]>,
    default: () => []
  },
  dataSource: {
    type: Array as PropType<ITableItem[]>,
    default: () => []
  },
  cellHeight: {
    type: Number,
    default: 46
  },
  scrollY: {
    type: Number,
    default: 320
  },
  headerFixed: {
    type: Boolean,
    default: false
  }
}

export type TableProps = ExtractPropTypes<typeof tableProps>