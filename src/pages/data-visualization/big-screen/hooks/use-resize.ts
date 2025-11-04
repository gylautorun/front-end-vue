import { debounce } from 'lodash-es';
import { ref, onMounted, onBeforeUnmount } from 'vue';

// 基础尺寸定义 (与SCSS中的基础尺寸保持一致)
export const BASE_WIDTH = 1920;
export const BASE_HEIGHT = 1080;

// 导出常量，方便其他组件使用
type ResizeType = {
    w?: number;
    h?: number;
    fullScreen?: boolean;
    delay?: number;
};

/**
 * 大屏自适应缩放Hook
 * 自动根据浏览器窗口大小计算缩放比例
 */
export const useResize = (options: ResizeType = {}) => {
    // 优先使用传入的宽高，否则使用默认值
    const { w = BASE_WIDTH, h = BASE_HEIGHT, fullScreen = false, delay = 100 } = options;

    // 缩放元素引用
    const screenRef = ref();
    const scale = ref(1);

    /**
     * 计算并应用缩放比例
     */
    function resize() {
        // 浏览器宽高
        const clientWidth = document.body.clientWidth;
        const clientHeight = document.body.clientHeight;

        // 计算宽高缩放比例
        const scaleW = clientWidth / w;
        const scaleH = clientHeight / h;

        if (clientWidth / clientHeight > w / h) {
            // 如果浏览器的宽高比大于设计稿的宽高比，就取浏览器高度和设计稿高度之比
            scale.value = scaleH;
        } else {
            // 如果浏览器的宽高比小于设计稿的宽高比，就取浏览器宽度和设计稿宽度之比
            scale.value = scaleW;
        }

        if (screenRef.value) {
            if (fullScreen) {
                // 如果不在乎缩放失真的情况，可以设置全屏
                screenRef.value.style.transform = `scale(${scaleW}, ${scaleH})`;
            } else {
                // 否则选择适配比例缩放
                screenRef.value.style.transform = `scale(${scale.value})`;
            }

            // 更新CSS变量，方便其他组件使用
            document.documentElement.style.setProperty('--current-scale', scale.value.toString());
        }
    }

    const resizeDelay = debounce(resize, delay);
    onMounted(() => {
        if (screenRef.value) {
            resize();
            window.addEventListener('resize', resizeDelay);
        }
    });

    onBeforeUnmount(() => {
        window.removeEventListener('resize', resizeDelay);
    });

    return {
        scale,
        screenRef
    };
};
