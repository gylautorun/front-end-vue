export function generateColors(count = 20) {
    const colors = [];
    for (let i = 0; i < count; i++) {
        const hue = Math.round((360 / count) * i);
        const saturation = 100;
        const value = 100;
        colors.push(`hsl(${hue}, ${saturation}%, ${value}%)`);
    }
    return colors;
}

export function hslToHex(h: number, s: number, l: number) {
    // 参数校验（h: 0-360, s/l: 0-100）
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    l = Math.max(0, Math.min(100, l));
    // 转换s/l到0-1范围
    s /= 100;
    l /= 100;
    // HSL转RGB核心算法
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;

    let r, g, b;
    if (h >= 0 && h < 60) {
        [r, g, b] = [c, x, 0];
    } else if (h < 120) {
        [r, g, b] = [x, c, 0];
    } else if (h < 180) {
        [r, g, b] = [0, c, x];
    } else if (h < 240) {
        [r, g, b] = [0, x, c];
    } else if (h < 300) {
        [r, g, b] = [x, 0, c];
    } else {
        [r, g, b] = [c, 0, x];
    }
    // RGB转HEX（补零+大写）
    const toHex = (n: number) =>
        Math.round((n + m) * 255)
            .toString(16)
            .padStart(2, '0')
            .toUpperCase();

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
// 输出HEX格式
// console.log(generateColors().map(hsl => /* HSL转HEX函数 */));
