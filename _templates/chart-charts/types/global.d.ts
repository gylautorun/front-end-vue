import type {
  ComponentRenderProxy,
  VNode,
  ComponentPublicInstance,
  FunctionalComponent,
  PropType as VuePropType
} from "vue";


// import {ProxyStorage} from '/@/utils/storage'
// GlobalComponents for Volar
declare module "vue" {
  export interface GlobalComponents {
    VSvg: typeof import("../src/components/globals/v-svg")["default"];
    VCharts: typeof import("../src/components/globals/v-charts")["default"];
  }
}

type KEYS<T> = T extends Array<infer R>? R: string

declare global {
  const __APP_INFO__: {
    pkg: {
      name: string;
      version: string;
      dependencies: Recordable<string>;
      devDependencies: Recordable<string>;
    };
    lastBuildTime: string;
  };
  interface Window {
    // Global vue app instance
    __APP__: App<Element>;
    _AMapSecurityConfig:{ // 高德地图配置
      securityJsCode:string
    }
  }

  // vue
  type PropType<T> = VuePropType<T>;

  type Writable<T> = {
    -readonly [P in keyof T]: T[P];
  };

  type Nullable<T> = T | null;
  type NonNullable<T> = T extends null | undefined ? never : T;
  type Recordable<T = any> = Record<string, T>;
  type ReadonlyRecordable<T = any> = {
    readonly [key: string]: T;
  };
  type Indexable<T = any> = {
    [key: string]: T;
  };
  type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>;
  };
  type TimeoutHandle = ReturnType<typeof setTimeout>;
  type IntervalHandle = ReturnType<typeof setInterval>;

  interface ChangeEvent extends Event {
    target: HTMLInputElement;
  }

  interface WheelEvent {
    path?: EventTarget[];
  }
  interface ImportMetaEnv extends ViteEnv {
    __: unknown;
  }

  declare interface ViteEnv {
    VITE_PORT: number;
    VITE_PUBLIC_PATH: string;
    VITE_PROXY_DOMAIN: string;
    VITE_PROXY_DOMAIN_REAL: string;
    VITE_ROUTER_HISTORY: string;
    VITE_LEGACY: boolean;
    VITE_APP_COMMON_LOGOUT_URL: string
    VITE_APP_COMMON_LOGIN_URL: string
  }

  function parseInt(s: string | number, radix?: number): number;

  function parseFloat(string: string | number): number;

  const defineOptions: typeof defineComponent;

  interface DownloadReturnData { // 下载接口返回数据格式
    data: BlobPart,
    contentDisposition: string,
    postData?: any,
  }

  interface MenuItem { // 菜单列表
    value: string,
    label: string
  }

  const AMapUI:any
  interface BaseQueryPageParam { //公共查询参数
    pageNum:number,
    pageSize:number,
  }

  // 分页列表搜索项配置
  interface TableSearchConfItem {
    value: string|Array<any>|number|boolean,
    tag: 'input'|'select'|'date',
    name: string, // 搜索字段key
    title?:string, //  字段名称
    placeholder?:string|string[]
    allowClear?:boolean // 是否展示清除图标
    hidden?:boolean | (()=>boolean) // 隐藏字段
    width?:string, // 表单域得宽度
    selectConf?:{
      labelKey?:string,
      valueKey?:string
      showSearch?:boolean,
      options?:Array<any>|Ref<Array<any>>|OptionsFun|Object
    },
    dateConf?:{
      type: 'year'|'month'|'date'|'dates'|'datetime'| 'week'|'datetimerange'|'daterange'| 'monthrange',
      valueFormat?:string, // 事件格式化类型
      endTimeKey?:string, // 结束事件key
      startTimeKey?:string, //开始事件key
    },
    events?:{
      change:(...arg:any)=>void
    }
  }

  
  interface BaseSearchParams {
    pageNum:number,
    pageSize:number,
  }
  interface SearchResult<T> { // 分页查询出参
    total:number,
    list:Array<T>
  }
  type TableSearchConf  = TableSearchConfItem[]

  // 下拉项|字典项配置
  interface SelectOptions {
    value:string|number,
    label:string,
    raw:any
  }
}
