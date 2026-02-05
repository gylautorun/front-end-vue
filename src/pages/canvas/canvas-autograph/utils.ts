/**
 * `base64`转`file`或者`blob`对象
 * @param {string} base64
 * @param {'blob'|'file'} type 转换的类型，默认`'blob'`
 * @param {string} filename 转换后的文件名，`type: 'file'`时生效
 */
export function base64ToBlobOrFile(base64: string, type: string, filename: string) {
    const arr = base64.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const suffix = mime?.split('/')[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    if (type === 'file') {
        return new File([u8arr], `${filename}.${suffix}`, { type: mime });
    } else {
        return new Blob([u8arr], { type: mime });
    }
}
