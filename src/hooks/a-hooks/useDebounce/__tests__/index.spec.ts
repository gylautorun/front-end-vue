import { useDebounce } from '../index';
import { ref } from 'vue-demi';
import { sleep } from '../../utils';

describe('useDebounce', () => {
  it('should be defined', () => {
    expect(useDebounce).toBeDefined();
  });

  it('should useThrottle work', async () => {
    const count = ref(0);
    const debouncedCount = useDebounce(count, { wait: 200 });
    count.value++;
    count.value++;
    count.value++;
    count.value++;
    count.value++;
    expect(count.value).toEqual(5);
    expect(debouncedCount.value).toEqual(0);
    await sleep(300);
    expect(debouncedCount.value).toEqual(5);
  });
});
