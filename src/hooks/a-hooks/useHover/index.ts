import { BasicTarget, getTargetElement } from '../utils/dom';
import { onUnmounted } from 'vue-demi';
import { useBoolean } from '../useBoolean';
import { safeOnMounted } from '../utils';

interface Options {
  onEnter?: () => void;
  onLeave?: () => void;
}

export function useHover(target: BasicTarget, options?: Options) {
  const { state, setFalse, setTrue } = useBoolean(false);
  const { onEnter, onLeave } = options ?? {};

  function onMouseEnter() {
    setTrue();
    onEnter && onEnter();
  }

  function onMouseLeave() {
    setFalse && setFalse();
    onLeave && onLeave();
  }

  safeOnMounted(() => {
    const targetElement = getTargetElement(target);
    if (!targetElement) {
      return;
    }

    targetElement.addEventListener('mouseenter', onMouseEnter);
    targetElement.addEventListener('mouseleave', onMouseLeave);
  });

  onUnmounted(() => {
    const targetElement = getTargetElement(target);
    if (targetElement) {
      targetElement.removeEventListener('mouseenter', onMouseEnter);
      targetElement.removeEventListener('mouseleave', onMouseLeave);
    }
  });

  return state;
}
