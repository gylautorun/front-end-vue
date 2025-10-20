import {reactive, onMounted, onUnmounted} from 'vue';

export function useWindowSize() {
    const windowSize = reactive<{
        width: number;
        height: number;
    }>({
        width: window.innerWidth,
        height: window.innerHeight,
    });
    const handleResize = () => {
        windowSize.width = window.innerWidth;
        windowSize.height = window.innerHeight;
    };
    onMounted(() => {
        window.addEventListener('resize', handleResize);
    });
    onUnmounted(() => {
        window.removeEventListener('resize', handleResize);
    });

    return windowSize;
}
