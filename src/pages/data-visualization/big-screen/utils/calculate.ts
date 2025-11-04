import { BASE_WIDTH, BASE_HEIGHT } from '../hooks/use-resize';

/**
 * 获取当前屏幕缩放比例
 * 优先从CSS变量读取，否则使用默认值
 *  - 添加 .trim() 方法清理从 CSS 变量获取的字符串中可能存在的空白字符
 *  - 增加条件检查 && designScale !== 'undefined' 以防止当 CSS 变量值为字符串 "undefined" 时导致的问题
 *  - 在解析数字时增加 isFinite(parsedScale) 检查，确保返回的是一个有效的有限数值
 */
export function getCurrentScale(): number {
    // 尝试从CSS变量获取当前缩放比例
    const cssScale = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--current-scale')
        .trim(); // 清理可能的空白字符

    if (cssScale && cssScale !== 'undefined') {
        // 额外检查非'undefined'字符串
        const parsedScale = parseFloat(cssScale);
        if (!isNaN(parsedScale) && isFinite(parsedScale)) {
            return parsedScale;
        }
    }

    // 从CSS变量获取设计缩放比例
    const designScale = window
        .getComputedStyle(document.documentElement)
        .getPropertyValue('--big-screen-scale')
        .trim(); // 清理可能的空白字符

    if (designScale && designScale !== 'undefined') {
        // 额外检查非'undefined'字符串
        const parsedScale = parseFloat(designScale);
        if (!isNaN(parsedScale) && isFinite(parsedScale)) {
            return parsedScale;
        }
    }

    // 默认返回2（4K缩放比例）
    return 2;
}

/**
 * 计算字体大小
 * @param size 基础字体大小（可选，默认为14px）
 * @returns 缩放后的字体大小
 */
export function getFontSize(size: number = 14): number {
    return size * getCurrentScale();
}

/**
 * 计算图表相关尺寸
 * @param size 基础尺寸（可选，默认为14px）
 * @returns 缩放后的尺寸
 */
export function getChartSize(size: number = 14): number {
    return size * getCurrentScale();
}

/**
 * 导出基础尺寸常量，方便其他组件使用
 */
export { BASE_WIDTH, BASE_HEIGHT };
