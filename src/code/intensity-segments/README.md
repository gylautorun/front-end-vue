# Intensity Segments

`IntensitySegments` stores a piecewise-constant function as sorted breakpoints.

For example, this internal state:

```js
[
    [10, 1],
    [20, 2],
    [30, 1],
    [40, 0],
]
```

means:

- `(-Infinity, 10)` has intensity `0`
- `[10, 20)` has intensity `1`
- `[20, 30)` has intensity `2`
- `[30, 40)` has intensity `1`
- `[40, Infinity)` has intensity `0`

The public range operations use half-open intervals: `[from, to)`.

## API

```js
const segments = new IntensitySegments();

segments.add(10, 30, 1);
segments.set(20, 40, 5);
segments.toString();
```

## Run Tests

```sh
node src/code/intensity-segments/intensity-segments.test.js
```

## Complexity

Let `n` be the number of stored breakpoints and `k` be the number of breakpoints
inside the updated range.

- Finding boundaries: `O(log n)`
- Inserting/removing breakpoints and normalization: `O(n)`
- Updating covered breakpoints: `O(k)`

The implementation keeps the representation canonical by removing leading zero
segments and adjacent segments with the same intensity.

