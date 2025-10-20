function isWindow(obj: unknown) {
    return obj === window;
}
function isHTMLElement(obj: unknown) {
    return obj instanceof HTMLElement;
}

function isWindowOrHTMLElement(obj: HTMLElement | Window) {
    return obj === window || obj instanceof HTMLElement;
}



export function getPageScroll(ele: HTMLElement | Window): {
    scrollHeight: number;
    scrollTop: number;
    clientHeight: number;
} {
    if (isHTMLElement(ele)) {
        // const rect = el.getBoundingClientRect();
        const el = ele as HTMLElement;
        return {
            scrollHeight: el.scrollHeight,
            scrollTop: el.scrollTop,
            clientHeight: el.clientHeight,
        };
    }
    return {
        scrollHeight: document.documentElement.scrollHeight,
        scrollTop: document.documentElement.scrollTop,
        clientHeight: document.documentElement.clientHeight,
    };
}