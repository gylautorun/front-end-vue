/**
 * 验证给定值是否为布尔类型，如果是则返回该值，否则返回默认值
 * @param val 需要验证的值
 * @param defaultValue 当val不是布尔类型时返回的默认值，默认为true
 * @returns 如果val是布尔类型则返回val，否则返回defaultValue
 */
export function validateBoolean(val: unknown, defaultValue = true): boolean {
    return typeof val === 'boolean' ? val : defaultValue;
}
