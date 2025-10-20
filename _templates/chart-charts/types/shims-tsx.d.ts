import Vue, { VNode,SetupContext } from "vue";

declare module "*.tsx" {
  import Vue from "compatible-vue";
  export default Vue;
}

declare global {
  namespace JSX {
    type Element = VNode;
    // tslint:disable no-empty-interface
    type ElementClass = ComponentRenderProxy;
    interface ElementAttributesProperty {
      $props: any;
    }
    type JSXComponent<T> = (props:T, context?:SetupContext)=> VNode|VNode[]
    interface IntrinsicElements {
      [elem: string]: any;
    }
    interface IntrinsicAttributes {
      [elem: string]: any;
    }
  }
  // JSX中全局组件
  const ElAvatar: typeof import('element-plus/es')['ElAvatar']
  const ElBacktop: typeof import('element-plus/es')['ElBacktop']
  const ElBadge: typeof import('element-plus/es')['ElBadge']
  const ElBreadcrumb: typeof import('element-plus/es')['ElBreadcrumb']
  const ElBreadcrumbItem: typeof import('element-plus/es')['ElBreadcrumbItem']
  const ElButton: typeof import('element-plus/es')['ElButton']
  const ElCard: typeof import('element-plus/es')['ElCard']
  const ElCheckbox: typeof import('element-plus/es')['ElCheckbox']
  const ElConfigProvider: typeof import('element-plus/es')['ElConfigProvider']
  const ElDialog: typeof import('element-plus/es')['ElDialog']
  const ElDivider: typeof import('element-plus/es')['ElDivider']
  const ElDropdown: typeof import('element-plus/es')['ElDropdown']
  const ElDropdownItem: typeof import('element-plus/es')['ElDropdownItem']
  const ElDropdownMenu: typeof import('element-plus/es')['ElDropdownMenu']
  const ElEmpty: typeof import('element-plus/es')['ElEmpty']
  const ElForm: typeof import('element-plus/es')['ElForm']
  const ElFormItem: typeof import('element-plus/es')['ElFormItem']
  const ElIcon: typeof import('element-plus/es')['ElIcon']
  const ElInput: typeof import('element-plus/es')['ElInput']
  const ElMenu: typeof import('element-plus/es')['ElMenu']
  const ElMenuItem: typeof import('element-plus/es')['ElMenuItem']
  const ElRadio: typeof import('element-plus/es')['ElRadio']
  const ElRadioButton: typeof import('element-plus/es')['ElRadioButton']
  const ElRadioGroup: typeof import('element-plus/es')['ElRadioGroup']
  const ElScrollbar: typeof import('element-plus/es')['ElScrollbar']
  const ElSubMenu: typeof import('element-plus/es')['ElSubMenu']
  const ElSwitch: typeof import('element-plus/es')['ElSwitch']
  const ElTag: typeof import('element-plus/es')['ElTag']
  const ElTooltip: typeof import('element-plus/es')['ElTooltip']
}
