import {throttle} from 'lodash-es';
import { nextTick, onMounted, onUnmounted, ref, Ref } from 'vue';
import { getPageScroll } from './tool';

export type ElRefType = Ref<HTMLElement | null>;
export type ElType = HTMLElement | Window;


/**
 * 监听滚动事件，返回是否滚动到底部及滚动信息
 * 通过 el.scrollHeight、el.scrollTop、el.clientHeight 获取元素的滚动高度、滚动位置和可视区域高度
 *  当scrollTop + clientHeight接近scrollHeight时，我们认为用户已经滚动到了底部
 * @param elRef DOM元素引用
 * @returns 返回是否滚动到底部、scrollHeight、scrollTop和clientHeight
 */
export function useScroll(elRef: ElRefType) {
    let el: ElType = window;
    const isBottom = ref<boolean>(false);
    const scrollInfo = ref<{
        scrollHeight: number;
        scrollTop: number;
        clientHeight: number;
    }>({
        scrollHeight: 0,
        scrollTop: 0,
        clientHeight: 0,   
    });
    const handleBottom = () => {
        const {
            scrollHeight,
            scrollTop,
            clientHeight,
        } = getPageScroll(el);
        scrollInfo.value = {
            scrollHeight,
            scrollTop,
            clientHeight,
        };
        console.log(isBottom.value);
        if (scrollTop + clientHeight + 15 >= scrollHeight) {
            isBottom.value = true
        } else {
            isBottom.value = false
        }
    }
    onMounted(() => {
        nextTick(() => {
            if (elRef) {
                el = elRef.value as ElType;
            }
            el.addEventListener('scroll', throttle(handleBottom, 200));
        })
    });
    onUnmounted(() => {
        el.removeEventListener('scroll', handleBottom);
    });
    return {
        isBottom,
        scrollHeight: scrollInfo.value.scrollHeight,
        scrollTop: scrollInfo.value.scrollTop,
        clientHeight: scrollInfo.value.clientHeight,
    }
}
