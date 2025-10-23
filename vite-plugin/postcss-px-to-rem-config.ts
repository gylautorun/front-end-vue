/**
 * https://github.com/njleonzhang/postcss-px-to-rem
 */
import pxToRem from '@njleonzhang/postcss-px-to-rem';

export function postcssPxToRemConfig(params) {
    const {
        unitToConvert = 'px', // 要转换的单位，默认是px
        widthOfDesignLayout = 1920, // 设计布局的宽度。对于pc仪表盘，一般是1920
        unitPrecision = 5, // 小数点
        selectorBlackList = ['.ignore', '.hairlines'], // 要忽略并保留为 px 的选择器
        minPixelValue = 1, // 设置要替换的最小像素值
        mediaQuery = false, // 允许在媒体查询中转换 px
    } = params || {};

    return pxToRem({
        unitToConvert,
        widthOfDesignLayout,
        unitPrecision,
        selectorBlackList,
        minPixelValue,
        mediaQuery,
    });
}