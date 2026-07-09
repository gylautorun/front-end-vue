import assert from 'node:assert/strict';
import { RangeList } from './range-list.js';

function expectRanges(rangeList, expected) {
    assert.equal(rangeList.toString(), expected);
}

function withMutedConsoleError(callback) {
    const originalConsoleError = console.error;

    console.error = () => {};

    try {
        callback();
    } finally {
        console.error = originalConsoleError;
    }
}

{
    const rangeList = new RangeList();

    expectRanges(rangeList, '');

    rangeList.add([1, 5]);
    expectRanges(rangeList, '[1, 5)');

    rangeList.add([10, 20]);
    expectRanges(rangeList, '[1, 5) [10, 20)');

    rangeList.add([20, 20]);
    expectRanges(rangeList, '[1, 5) [10, 20)');

    rangeList.add([20, 21]);
    expectRanges(rangeList, '[1, 5) [10, 21)');

    rangeList.add([2, 4]);
    expectRanges(rangeList, '[1, 5) [10, 21)');

    rangeList.add([7, 9]);
    expectRanges(rangeList, '[1, 5) [7, 9) [10, 21)');

    rangeList.add([3, 8]);
    expectRanges(rangeList, '[1, 9) [10, 21)');

    rangeList.remove([10, 10]);
    expectRanges(rangeList, '[1, 9) [10, 21)');

    rangeList.remove([10, 11]);
    expectRanges(rangeList, '[1, 9) [11, 21)');

    rangeList.remove([15, 17]);
    expectRanges(rangeList, '[1, 9) [11, 15) [17, 21)');

    // rangeList.remove([6, 6]);
    // expectRanges(rangeList, '[1, 9) [11, 15) [17, 21)'); // [1, 6) [6, 9) [11, 15) [17, 21) ❌

    rangeList.remove([3, 19]);
    expectRanges(rangeList, '[1, 3) [19, 21)');
}

{
    const rangeList = new RangeList([3, 8]);

    expectRanges(rangeList, '[3, 8)');
}

{
    const rangeList = new RangeList([3, 3]);

    expectRanges(rangeList, ''); // [3, 3) ❌

    rangeList.add([5, 5]);
    expectRanges(rangeList, '');
}

{
    const rangeList = new RangeList([1, 5]);

    rangeList.remove([5, 10]);
    expectRanges(rangeList, '[1, 5)');

    rangeList.remove([-10, 1]);
    expectRanges(rangeList, '[1, 5)');
}

withMutedConsoleError(() => {
    const rangeList = new RangeList([5, 1]);

    expectRanges(rangeList, '');

    rangeList.add([1.5, 3]);
    rangeList.remove([1, Number.NaN]);
    expectRanges(rangeList, ''); // [1.5, 3) ❌
});

console.log('RangeList tests passed.');
