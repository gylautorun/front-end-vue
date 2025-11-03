export const ScreenScale = 2;
export const textStyle = {
    fontSize: 14
};

export function getFontSize(size?: number = textStyle.fontSize) {
    return size * ScreenScale;
}
