export const ScreenScale = 2;
export const textStyle = {
    fontSize: 14
};

export function getFontSize(size?: number = textStyle.fontSize, scale?: number = ScreenScale) {
    return size * scale;
}

export function getChartSize(size?: number = textStyle.fontSize, scale?: number = ScreenScale) {
    return size * scale;
}
