import assert from 'node:assert/strict';
import { RangeList } from './range-list.js';

function expectRanges(rangeList, expected) {
    assert.equal(rangeList.toString(), expected);
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

    rangeList.add([3, 8]);
    expectRanges(rangeList, '[1, 8) [10, 21)');

    rangeList.remove([10, 10]);
    expectRanges(rangeList, '[1, 8) [10, 21)');

    rangeList.remove([10, 11]);
    expectRanges(rangeList, '[1, 8) [11, 21)');

    rangeList.remove([15, 17]);
    expectRanges(rangeList, '[1, 8) [11, 15) [17, 21)');

    rangeList.remove([3, 19]);
    expectRanges(rangeList, '[1, 3) [19, 21)');
}

{
    const rangeList = new RangeList();

    rangeList.add([-10, -5]);
    rangeList.add([-3, 2]);
    rangeList.add([-5, -3]);
    expectRanges(rangeList, '[-10, 2)');

    rangeList.remove([-8, -1]);
    expectRanges(rangeList, '[-10, -8) [-1, 2)');
}

{
    const rangeList = new RangeList();

    rangeList.add([5, 10]);
    rangeList.add([1, 3]);
    rangeList.add([12, 15]);
    expectRanges(rangeList, '[1, 3) [5, 10) [12, 15)');

    rangeList.remove([0, 20]);
    expectRanges(rangeList, '');
}

console.log('RangeList tests passed.');

