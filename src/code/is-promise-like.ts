function isPromiseLike(obj: any): boolean {
    return typeof obj === 'object' && obj !== null && typeof obj.then === 'function';
}
