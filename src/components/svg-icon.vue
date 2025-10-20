<!-- <script setup lang='ts'>
    defineProps<{
        iconClass:string
    }>()

</script>
<template>
    <svg aria-hidden="true" class="svg-icon">
        <use :xlink:href="`#icon-${iconClass}`"/>
    </svg>
</template>

<style lang="scss" scoped>
    .svg-icon {
        width: 1em;
        height: 1em;
        vertical-align: -0.15em;
        fill: currentColor;
        overflow: hidden;
    }
</style> -->
<template>
    <template v-if="renderLocalIcon">
        <svg aria-hidden="true" width="1em" height="1em" v-bind="bindAttrs">
            <use :xlink:href="symbolId" fill="currentColor" />
        </svg>
    </template>
    <template v-else>
        <Icon v-if="icon" :icon="icon" v-bind="bindAttrs" />
    </template>
</template>

<script setup lang="ts">
import { computed, useAttrs } from 'vue';
import { Icon } from '@iconify/vue';

/**
 * 图标组件
 * - 支持iconify和本地svg图标
 * - 同时传递了icon和localIcon，localIcon会优先渲染
 */
interface Props {
    /** 图标名称 */
    icon?: string;
    /** 本地svg的文件名 */
    localIcon?: string;
}

const props = defineProps<Props>();

const attrs = useAttrs();

const bindAttrs = computed<{ class: string; style: string }>(() => ({
    class: (attrs.class as string) || '',
    style: (attrs.style as string) || '',
}));

const symbolId = computed(() => {
    const { VITE_ICON_LOCAL_PREFIX: prefix } = import.meta.env;
    if (!props.localIcon) {
        window.console.error(
        `SvgIcon: 没有传递图标名称，使用项目图标请确保给localIcon传递有效值!
                - localIcon: ${props.localIcon}
                - now error-icon-name: svg-error
                `
        );
        return `#${prefix}-svg-error`;
    }
    const icon = props.localIcon;

    return `#${prefix}-${icon}`;
});

/** 渲染本地icon */
const renderLocalIcon = computed(() => props.localIcon || !props.icon);
</script>

<style scoped></style>
