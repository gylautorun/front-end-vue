# 长列表不卡顿：面试回答手册

## 一句话结论

长列表优化的核心不是让几十万个 DOM 渲染得更快，而是只渲染视口附近的少量 DOM；固定高度用数学计算索引，不定高度用预估高度、实测修正和累计高度数据结构定位，同时处理滚动调度、浏览器最大元素高度、状态持久化与架构降级。

## 30 秒回答

我会优先使用虚拟列表，只渲染可视区域和少量缓冲区。固定高度列表通过 `scrollTop / itemHeight` O(1) 计算起始索引，再用占位层撑开滚动条，通过 `translate3d` 定位真实渲染区域。滚动事件使用 passive listener，只记录最新位置，并通过 `requestAnimationFrame` 每帧最多更新一次。

如果项目高度不固定，我会先用预估高度建立滚动范围，项目挂载后通过 ResizeObserver 获取真实高度，再用 Fenwick Tree 维护累计高度，使单项高度更新、前缀高度查询和滚动位置定位保持 O(log n)。百万级列表还要处理浏览器单元素高度上限，使用物理滚动坐标和逻辑滚动坐标压缩映射。

## 2～3 分钟完整回答

长列表卡顿通常有四类原因：一次创建太多 DOM；滚动事件高频触发框架更新；滚动过程中反复测量布局；数据、交互状态和网络请求规模本身过大。

第一步是虚拟化。页面保留一个完整高度的占位层产生滚动条，实际只渲染视口附近几十个项目。固定高度时，首个可见索引是 `floor(scrollTop / itemHeight)`，渲染起点向前减 overscan，终点加上可见数量和 overscan，最后将渲染块移动到 `startIndex * itemHeight`。这些计算都是 O(1)。

第二步是控制滚动热路径。scroll listener 使用 passive，只保存最新 `scrollTop`，同一帧内只申请一次 requestAnimationFrame，在动画帧中统一提交响应式状态。这样不会因为一帧收到多次 scroll 事件而多次触发 Vue 更新。缓冲区可以根据每帧滚动距离动态调整，慢速时少渲染，高速时多预渲染。

第三步处理不定高度。未进入 DOM 的项目无法知道真实高度，所以先用 estimatedItemHeight。可见项目挂载后，通过一个 ResizeObserver 批量读取真实高度。高度不能使用普通前缀和频繁更新，因为修改一项会影响后面所有累计值，成本是 O(n)。我使用 Fenwick Tree，将单项更新、累计偏移查询和按偏移定位索引控制在 O(log n)。如果视口上方项目高度发生变化，还要给逻辑 scrollTop 增加相同的高度差，保持用户看到的内容不跳动。

第四步处理百万级边界。Chromium 单个元素的可布局高度通常只有约 3355 万像素。以 205px 预估高度计算，只能覆盖约 16 万项。因此不能无限增加占位元素高度。我会把 DOM 占位高度限制在安全值，例如 800 万像素，并维护物理 scrollTop 和完整逻辑 scrollTop 两套坐标，通过比例互相映射。虚拟区间始终使用逻辑坐标查询，DOM 只使用物理坐标滚动。

最后还要有架构判断。虚拟列表只减少 DOM 数量，不减少接口传输量和数据对象内存。真实业务达到几十万条时，通常应该优先提供服务端分页、搜索和筛选，而不是让用户浏览完整列表。

## 固定高度核心公式

```text
firstVisibleIndex = floor(scrollTop / itemHeight)

visibleCount = ceil(viewportHeight / itemHeight)

startIndex = max(0, firstVisibleIndex - overscan)

endIndex = min(
    itemCount,
    firstVisibleIndex + visibleCount + overscan
)

offsetY = startIndex * itemHeight

totalHeight = itemCount * itemHeight
```

模板结构：

```text
滚动容器
└── 完整高度占位层
    └── translate3d 定位的可见项目层
        └── 视口项目 + overscan 项目
```

## 不定高度核心流程

```text
用预估高度初始化所有项目
        ↓
Fenwick Tree 建立逻辑总高度
        ↓
根据逻辑 scrollTop 定位渲染区间
        ↓
渲染视口附近项目
        ↓
ResizeObserver 获取真实高度
        ↓
将高度差增量写入 Fenwick Tree
        ↓
必要时补偿滚动锚点并重新计算区间
```

## 为什么使用 translate3d 定位可见项目层

### 1. 它解决什么问题

虚拟列表不会把全部项目放进 DOM，而是将滚动高度与真实渲染拆成两个层：

```text
完整高度占位层：负责产生正确滚动条
可见项目层：只渲染视口附近项目
```

可见项目层使用绝对定位，初始位置在占位层顶部。虚拟区间变化后，必须把它整体移动到 `startIndex` 在完整列表中的位置，否则新渲染的数据仍会显示在顶部。

### 2. offsetY 从哪里来

```text
固定高度 offsetY = startIndex * itemHeight
不定高度 offsetY = prefixHeight(startIndex)
```

固定高度直接做乘法，复杂度为 O(1)。不定高度通过 Fenwick Tree 查询起始项之前的累计高度，复杂度为 O(log n)。

### 3. 标准实现

```css
.visible-list {
    position: absolute;
    transform: translate3d(0, var(--offset-y), 0);
    will-change: transform;
}
```

项目中只给唯一的可见项目层设置 transform，不给每个列表项分别设置位置。

### 4. 与 top、margin-top 的对比

| 方案         | 是否改变布局位置                       | 可能影响其他元素       | 高频更新适用性 |
| ------------ | -------------------------------------- | ---------------------- | -------------- |
| `margin-top` | 是                                     | 会推动或影响相邻元素   | 较差           |
| `top`        | 取决于定位方式，通常仍属于布局位置属性 | 可能触发布局相关工作   | 一般           |
| `transform`  | 否，只改变最终绘制位置                 | 通常不影响其他元素布局 | 更适合         |

这里使用“通常”是因为浏览器的实际渲染路径还取决于页面结构、图层、滤镜、阴影和设备，不能承诺 transform 永远不发生 paint。

### 5. 主要优点

| 优点         | 说明                                                       |
| ------------ | ---------------------------------------------------------- |
| 减少布局影响 | transform 不改变正常文档流占位，通常不需要重新布局周围元素 |
| 批量移动     | 只修改一个父层即可移动内部所有可见项目                     |
| 适合高频更新 | 浏览器通常可以在合成阶段处理连续 transform 变化            |
| 支持亚像素   | 不定高度累计偏移出现小数时仍可准确定位                     |
| 职责清晰     | 占位层负责高度，可见层 transform 只负责视觉位置            |

### 6. translate3d 与 GPU 合成层

`translate3d(x, y, 0)` 使用三维 transform，浏览器通常会考虑将该元素放入独立合成层，滚动时只更新图层变换。但是否建层由浏览器决定，因此不能回答“translate3d 一定开启 GPU 加速”。

```css
will-change: transform;
```

`will-change` 是性能提示，让浏览器提前准备 transform 变化。本项目只设置在唯一可见项目层。给每个项目都设置可能产生大量图层，增加内存、显存和合成成本。

### 7. 使用边界

`translate3d` 不能解决：

-   DOM 数量过多，必须依赖虚拟化减少节点。
-   Vue 更新过于频繁，必须依赖 rAF 合帧。
-   不定高度累计位置，必须依赖高度缓存和 Fenwick Tree。
-   浏览器最大元素高度，必须依赖物理、逻辑坐标压缩。
-   复杂阴影、滤镜和图片产生的 paint 成本。

百万级列表也不能把数亿像素的逻辑 offset 直接写进 transform，否则可能遇到浏览器坐标范围和浮点精度问题。本项目先压缩滚动坐标，再将安全范围内的 `renderOffsetY` 写给 translate3d。

### 8. 面试口述答案

> 占位层只负责滚动高度，可见层负责真实渲染。每次虚拟区间变化后，我用 translate3d 把可见层整体移动到 startIndex 对应的累计偏移。相比修改 top 或 margin，它不改变文档流占位，通常能减少 layout，并适合浏览器在合成阶段高频移动。它不是优化的根本，根本仍是减少 DOM 和控制更新频率，而且 GPU 分层由浏览器决定，不能说 translate3d 一定开启 GPU 加速。

### 为什么不能只用 ResizeObserver

ResizeObserver 只能告诉我们已挂载 DOM 的高度，不能测量尚未渲染的几十万项，也不能直接回答某个 scrollTop 对应哪一项。它是高度数据来源，不是完整的虚拟列表定位算法。

### 为什么不用普通前缀和

普通前缀和查询某项顶部是 O(1)，但任意一项高度变化后，后面所有前缀值都要修改，单次更新为 O(n)。Fenwick Tree 的更新和前缀查询都是 O(log n)，更适合持续测量修正。

### Fenwick Tree 的原理怎么回答

Fenwick Tree 的核心是利用二进制最低有效位划分累计区间。定义：

```text
lowbit(i) = i & -i
```

`tree[i]` 不保存单个项目，也不保存完整前缀，而是保存长度为 `lowbit(i)` 的区间：

```text
[i - lowbit(i) + 1, i]
```

例如高度数组是 `[3, 2, 5, 4, 1, 6, 2, 3]`：

```text
tree[2] = height[1] + height[2] = 5
tree[4] = height[1] + ... + height[4] = 14
tree[6] = height[5] + height[6] = 7
tree[8] = height[1] + ... + height[8] = 26
```

更新第 3 项时，通过 `i += lowbit(i)` 依次访问 `3 -> 4 -> 8`，这些正是所有包含第 3 项的累计区间，所以只需 O(log n)。

查询前 6 项高度时，通过 `i -= lowbit(i)` 依次访问 `6 -> 4 -> 0`。`tree[6]` 管 `[5, 6]`，`tree[4]` 管 `[1, 4]`，相加就是完整前缀，因此也是 O(log n)。

根据 scrollTop 定位项目时，可以从最高 2 次幂开始做 binary lifting。每次尝试向右跳一个二进制步长，如果累计高度仍不超过 scrollTop 就接受，否则拒绝，再把步长减半。每个二进制位只判断一次，所以定位也是 O(log n)，不会退化成二分查找叠加前缀查询的 O(log² n)。

面试口述版：Fenwick Tree 通过 `lowbit` 让每个节点保存一段 2 的幂长度区间。更新时沿父区间向上加高度差，查询时把目标前缀拆成若干互不重叠区间，定位时按二进制位逐步试探，因此三种操作都只经过树高数量的节点。

### 为什么不用 Canvas 提前测量所有高度

Canvas 无法完整复现 DOM 的字体回退、CSS 换行、富文本、图片、组件插槽和异步内容。它适合结构简单、字体与宽度完全可控的纯文本场景，不能作为通用替代方案。

## 百万级滚动坐标压缩

### 问题来源

浏览器会限制单个元素最大布局高度：

```text
33,554,432 / 205 ≈ 163,680
```

所以数据有 50 万或 100 万条，并不代表一个占位元素能撑出对应高度。浏览器可能静默截断高度，表现为只能滚动到约 16 万项。

### 解决公式

```text
physicalTotalHeight = min(logicalTotalHeight, safeHeight)

scrollScale =
    (logicalTotalHeight - viewportHeight)
    / (physicalTotalHeight - viewportHeight)

logicalScrollTop = physicalScrollTop * scrollScale
```

使用可滚动距离而不是直接用总高度相除，可以保证物理顶部和底部分别精确映射到逻辑顶部和底部。

渲染块不能直接按比例缩放，否则文字和真实项目高度也会失真。当前项目使用以下位置补偿：

```text
renderOffsetY =
    physicalScrollTop
    - (logicalScrollTop - logicalRangeOffset)
```

## 底部抖动怎么回答

不定高列表到达底部后，最后几项仍可能从预估高度修正为真实高度。逻辑总高度变化会改变压缩比例，如果继续按旧位置换算并写回 scrollTop，会出现“测量、改 scrollTop、换节点、再次测量”的循环。

处理方式：

1. 测量前判断用户是否已经在物理底部。
2. 如果在底部，高度修正后直接锁定新的物理底部和逻辑底部。
3. 距离边界不足 1px 时直接映射到精确边界，不再用比例乘法放大浮点误差。
4. 已到边界后拦截继续向外的 wheel 输入。
5. 使用 `overscroll-behavior: contain` 阻止滚动链和系统回弹。
6. 目标位置变化超过阈值才写入 DOM scrollTop。

## 复杂度总结

| 场景                    | 定位起点 | 高度更新 | 查询偏移 | 实际 DOM 数量    |
| ----------------------- | -------- | -------- | -------- | ---------------- |
| 固定高度                | O(1)     | 不需要   | O(1)     | O(可见项 + 缓冲) |
| 不定高度 + Fenwick Tree | O(log n) | O(log n) | O(log n) | O(可见项 + 缓冲) |

虚拟化后，DOM 数量与总数据量基本无关，但 JavaScript 数据对象和高度数组内存仍然是 O(n)。

## 常见追问

### 1. 为什么使用 requestAnimationFrame，不使用 debounce

debounce 会等滚动停止后才更新，滚动期间可见内容会跟不上滚动条。固定 100ms throttle 也可能错过多帧，快速滚动时容易白屏。requestAnimationFrame 与浏览器绘制节奏同步，可以保证每帧最多更新一次，同时持续跟随滚动。

### 2. passive listener 有什么作用

它明确告诉浏览器监听器不会调用 preventDefault 阻止滚动，浏览器可以更早执行滚动和合成。但 passive 不会自动减少回调次数，所以仍需要 requestAnimationFrame 合帧。

### 3. translate3d 一定会开启 GPU 加速吗

不会。是否创建 GPU 合成层由浏览器根据页面和设备决定。完整回答见“为什么使用 translate3d 定位可见项目层”的第 6～8 节。

### 4. overscan 是什么

overscan 是在视口之外额外预渲染的缓冲区域。固定高度可以按项目条数表示，不定高度更适合按像素表示。缓冲太小会在快速滚动时露白，太大会增加 DOM 和渲染成本。

### 5. 为什么固定高度更优

固定高度不需要 DOM 测量和高度缓存，所有索引、偏移和总高度都可以直接计算，不存在高度修正引起的滚动锚点变化。业务允许时应优先固定高度、限制文本行数并给图片预留尺寸。

### 6. 列表项滚出 DOM 后状态怎么办

交互状态不能只保存在列表项组件内部。选中、展开、编辑草稿等状态应保存在数据源、独立 Map/Set 或全局状态中，用稳定 id 作为 key。项目重新进入视口时从数据状态恢复。

### 7. 为什么不能把全部计算放进 Web Worker

Worker 不能读取和修改 DOM，也不能执行 ResizeObserver。固定高度的几次除法和不定高度 O(log n) 查询通常很轻，频繁向 Worker 发送滚动消息反而增加通信和序列化成本。Worker 更适合重排序、过滤、聚合或复杂业务计算。

### 8. 什么时候应该服务端分页

数据来自服务端、数量超过用户可有效浏览的范围，或者完整数据传输与内存成本明显时，应使用服务端分页、游标加载、搜索和筛选。虚拟列表解决渲染问题，不解决网络、内存和信息发现问题。

### 9. 如何处理图片导致的高度变化

优先给图片声明 width、height 或 aspect-ratio，在加载前预留空间。无法预知时由 ResizeObserver 修正高度，但要批量处理变化，并对视口上方高度差做滚动补偿。

### 10. 如何验证优化有效

使用 Chrome Performance 和 Memory 面板检查：

-   快速滚动时是否存在持续超过 50ms 的 Long Task。
-   DOM 节点数是否随总数据量增长。
-   滚动热路径是否出现 forced reflow。
-   往返滚动后观察器和 DOM 引用是否持续增加。
-   10 万、50 万、100 万条是否都能到达最后一项。
-   到达底部后继续滚动是否稳定。
-   CPU 节流和低端设备下是否仍能接受。

## 容易说错的点

-   错误：使用了虚拟列表，所以时间复杂度是 O(1)。不定高度定位和更新通常是 O(log n)，数据内存仍是 O(n)。
-   错误：translate3d 和 will-change 就能解决卡顿。它们不能减少 DOM 和 JavaScript 工作量。
-   错误：ResizeObserver 可以测量全部数据。它只能观察已经存在的 DOM。
-   错误：Worker 可以解决所有滚动卡顿。Worker 不能操作 DOM，高频通信也有成本。
-   错误：只要把占位层高度设得足够大就能支持百万条。浏览器存在最大元素高度限制。
-   错误：虚拟列表能解决百万条数据的所有问题。它只解决渲染数量，网络和内存仍需独立治理。

## 项目代码对应关系

| 内容                         | 文件                                 |
| ---------------------------- | ------------------------------------ |
| 固定高度算法                 | `core/fixed-height-virtualizer.ts`   |
| 不定高度算法和 Fenwick Tree  | `core/dynamic-height-virtualizer.ts` |
| 固定高度演示页面             | `fixed-height/index.vue`             |
| 不定高度、坐标压缩与测量页面 | `dynamic-height/index.vue`           |
| 公共数据生成                 | `shared/demo-data.ts`                |
| 数据规模控件                 | `shared/data-size-select.vue`        |
| 完整实现设计说明             | `readme.md`                          |

## 推荐收尾

我的优化顺序是：先确认产品是否真的需要展示全部数据；需要时优先固定高度虚拟化；无法固定时使用预估高度、ResizeObserver 和 Fenwick Tree；再用 rAF 控制滚动热路径；百万级数据处理浏览器高度上限；最后通过分页、搜索和服务端计算控制网络与内存成本。这样不是依赖某一个 API，而是从渲染、调度、数据结构、浏览器边界和系统架构多个层次解决问题。
