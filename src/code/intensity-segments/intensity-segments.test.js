import assert from 'node:assert/strict';
import { IntensitySegments } from './intensity-segments.js';

function expectSegments(segments, expected) {
    assert.equal(segments.toString(), JSON.stringify(expected));
}

{
    const segments = new IntensitySegments();

    expectSegments(segments, []);

    segments.add(10, 30, 1);
    expectSegments(segments, [
        [10, 1],
        [30, 0],
    ]);

    segments.add(20, 40, 1);
    expectSegments(segments, [
        [10, 1],
        [20, 2],
        [30, 1],
        [40, 0],
    ]);

    segments.add(10, 40, -2);
    expectSegments(segments, [
        [10, -1],
        [20, 0],
        [30, -1],
        [40, 0],
    ]);
}

{
    const segments = new IntensitySegments();

    expectSegments(segments, []);

    segments.add(10, 30, 1);
    expectSegments(segments, [
        [10, 1],
        [30, 0],
    ]);

    segments.add(20, 40, 1);
    expectSegments(segments, [
        [10, 1],
        [20, 2],
        [30, 1],
        [40, 0],
    ]);

    segments.add(10, 40, -1);
    expectSegments(segments, [
        [20, 1],
        [30, 0],
    ]);

    segments.add(10, 40, -1);
    expectSegments(segments, [
        [10, -1],
        [20, 0],
        [30, -1],
        [40, 0],
    ]);
}

{
    const segments = new IntensitySegments();

    segments.set(10, 30, 5);
    expectSegments(segments, [
        [10, 5],
        [30, 0],
    ]);

    segments.set(20, 40, 2);
    expectSegments(segments, [
        [10, 5],
        [20, 2],
        [40, 0],
    ]);

    segments.set(15, 35, 0);
    expectSegments(segments, [
        [10, 5],
        [15, 0],
        [35, 2],
        [40, 0],
    ]);
}

{
    const segments = new IntensitySegments();

    segments.add(-10, 10, 3);
    segments.add(-5, 5, -3);
    segments.set(0, 20, 1);

    expectSegments(segments, [
        [-10, 3],
        [-5, 0],
        [0, 1],
        [20, 0],
    ]);
}

{
    const segments = new IntensitySegments();

    segments.add(10, 10, 100);
    expectSegments(segments, []);

    assert.throws(
        () => segments.set(20, 10, 3),
        /set\(from, to, amount\) 参数必须是整数边界，且 from 不能大于 to。/
    );

    assert.throws(
        () => segments.add(1.5, 10, 3),
        /add\(from, to, amount\) 参数必须是整数边界，且 from 不能大于 to。/
    );
}

console.log('IntensitySegments tests passed.');
