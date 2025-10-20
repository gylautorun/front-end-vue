import type { App, Component } from 'vue'
import SvgIcon from '@/components/svg-icon.vue'

// 创建一个带有名称的组件对象
const components: { name: string; component: Component }[] = [
    {
        name: 'SvgIcon',
        component: SvgIcon
    }
]

export function registerGlobComp(app: App) {
    components.forEach((comp) => {
        app.component(comp.name, comp.component)
    })
}
