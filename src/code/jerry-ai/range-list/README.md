# Range List

`RangeList` keeps a sorted list of non-overlapping half-open ranges.

For example:

```js
const rangeList = new RangeList();

rangeList.add([1, 5]);
rangeList.add([10, 20]);
rangeList.add([20, 21]);

rangeList.toString(); // "[1, 5) [10, 21)"
```

Ranges use `[start, end)` semantics, so `start` is included and `end` is not.
Empty or reversed ranges are ignored.

## API

- `add(range)` merges `range` into the current list.
- `remove(range)` removes `range` from the current list, splitting existing ranges when needed.
- `toString()` returns ranges in the required format.

## Run Tests

```sh
node src/code/range-list/range-list.test.js
```

## Complexity

Both `add` and `remove` scan the stored ranges once, so each operation is `O(n)`
where `n` is the number of current ranges.

