import SvgIcon from '@/components/svg-icon.vue'

declare module 'vue' {
    interface GlobalComponents {
        SvgIcon: typeof SvgIcon
    }
}