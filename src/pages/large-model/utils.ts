/**
 * 从图像元素获取图像数据
 * @param image HTMLImageElement 图像元素
 * @returns ImageData 图像数据
 * @throws Error 如果图像未加载完成或无法获取图像数据
 */
export function getImageDataFromImage(image: HTMLImageElement): ImageData {
    // 检查图像是否已经加载完成
    if (!image.complete || image.naturalWidth === 0 || image.naturalHeight === 0) {
        throw new Error('图像未加载完成或无效');
    }

    // 创建一个canvas元素
    const canvas = document.createElement('canvas');

    // 设置canvas的宽高与图像一致
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    // 获取canvas上下文
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('无法获取canvas上下文');
    }

    try {
        // 将图像绘制到canvas上
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        // 获取图像数据
        return ctx.getImageData(0, 0, canvas.width, canvas.height);
    } catch (error) {
        // 处理可能的跨域错误或其他绘制错误
        if (error instanceof Error && error.name === 'SecurityError') {
            throw new Error('无法获取图像数据：跨域安全限制');
        }
        throw new Error(
            `获取图像数据失败：${error instanceof Error ? error.message : String(error)}`
        );
    }
}

/**
 * 等待图像加载完成
 * @param image HTMLImageElement 图像元素
 * @returns Promise<void> 图像加载完成的Promise
 */
export function waitForImageLoad(image: HTMLImageElement): Promise<void> {
    // 如果图像已经加载完成，直接返回resolve的Promise
    if (image.complete && image.naturalWidth > 0) {
        return Promise.resolve();
    }

    // 否则等待图像加载完成
    return new Promise((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('图像加载失败'));
    });
}
