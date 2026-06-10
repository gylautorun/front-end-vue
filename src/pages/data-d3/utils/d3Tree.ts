/**
 * D3 树形图核心工具
 * ----------------------------------------------------------------------------
 * 封装 D3 v7 树形布局的所有逻辑：节点渲染、连线绘制、拖拽、缩放、右键菜单等
 *
 * 主要导出函数：
 *   - initD3(...)            创建 SVG + 树形布局（首次挂载）
 *   - renderTree(...)        数据变化时重渲染（节点增删、整合方式改变时）
 *   - zoomIn / zoomOut / fitView  缩放平移控制
 *   - clearSelection(...)    清除所有选中状态
 *
 * 工作流程：
 *   1. initD3 选择 #graph-container，创建 svg + g 分层
 *   2. treeLayout = d3.tree<TreeData>().nodeSize([竖向, 横向]) 决定节点间距
 *   3. d3.hierarchy(treeData) 转为 d3.HierarchyNode，加入 .x / .y
 *   4. 用 <foreignObject> + 自定义 HTML 节点卡片渲染节点内容
 *   5. 用 d3.linkHorizontal 画连线，连线颜色取自 EDGE_STYLES
 *   6. 给节点 .more-btn 绑定 click，调用 onMoreClick(event, nodeId)
 */
import * as d3 from 'd3';
import type { TreeData } from '../types';
import { NODE_COLORS, EDGE_STYLES, INTEGRATION_TYPE_NAME, IntegrationTypeKey } from '../types';

const NODE_WIDTH: number = 160;
const NODE_HEIGHT: number = 40;

// 定义 D3 Selection 的基础类型
// Selection<GElement, Datum, PElement, PDatum>
type SvgSelection = d3.Selection<SVGSVGElement, null, HTMLElement, null>;
type GSelection = d3.Selection<SVGGElement, null, SVGSVGElement, null>;
type LinkSelection = d3.Selection<SVGGElement, d3.HierarchyLink<TreeData>, SVGGElement, null>;
type PathSelection = d3.Selection<
    SVGPathElement,
    d3.HierarchyLink<TreeData>,
    SVGGElement,
    d3.HierarchyLink<TreeData> | null
>;
type RectSelection = d3.Selection<
    SVGRectElement,
    d3.HierarchyLink<TreeData>,
    SVGGElement,
    d3.HierarchyLink<TreeData> | null
>;
type TextSelection = d3.Selection<
    SVGTextElement,
    d3.HierarchyLink<TreeData>,
    SVGGElement,
    d3.HierarchyLink<TreeData> | null
>;
type NodeSelection = d3.Selection<
    SVGGElement,
    d3.HierarchyNode<TreeData>,
    SVGGElement,
    d3.HierarchyLink<TreeData> | null
>;

/** D3 树实例：暴露给 GraphCanvas 用于缩放、重渲染 */
export interface D3TreeInstance {
    svg: SvgSelection;
    g: GSelection;
    treeLayout: d3.TreeLayout<TreeData>;
    root: d3.HierarchyNode<TreeData>;
    link: LinkSelection;
    path: PathSelection;
    labelBg: RectSelection;
    labelText: TextSelection;
    node: NodeSelection;
    /** 已绑定到 svg 的 zoom 行为，用于精确控制 transform */
    zoom: d3.ZoomBehavior<SVGSVGElement, null>;
}

/**
 * 模块级变量：记录"当前正在拖拽的节点 id"
 * ----------------------------------------------------------------------------
 * 解决 d3-drag v3 的 dragend 回调中 `this` 不可靠（指向 dispatch context 而非元素）
 *   - dragstart 时写入
 *   - dragend 时读取
 *   - dragended 后清空
 *
 * 注意：这是模块级单例，如果同时支持多个 d3 树实例会有冲突。
 * 当前项目只有一个 data-d3 页面，可以接受。
 */
let currentDraggingNodeId: string | null = null;

const defaultConfig = {
    linkColor: '#CCC'
};
/**
 * 初始化 D3 树形图（在 #graph-container 中创建 SVG + 布局）
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 获取容器尺寸 width/height
 *   2. 创建 svg（铺满容器） + g（可平移缩放）
 *   3. 配置 d3.zoom() 缩放行为
 *   4. 配置 d3.tree() 节点大小
 *   5. 监听 svg.click → 派发 'd3-svg-click' 自定义事件（用于关闭右键菜单）
 *   6. 调用 renderTree(...) 完成首次渲染
 *   7. 给节点 .more-btn 绑定 click → onMoreClick
 *   8. 给节点绑定拖拽 d3.drag() → 移动 g 元素 + 落点检测
 *      落点检测在 dragended 时执行：
 *      - 用 d3.pointers 拿到鼠标在 SVG 坐标系中的位置
 *      - 用 d3.hierarchy(x).find(在 x/y 半径内) 找命中的节点
 *      - 命中节点与源节点是同级（同一个父节点）才触发 onDropToTarget
 */
export function initD3(
    containerId: string,
    treeData: TreeData,
    onNodeClick: (data: TreeData) => void,
    onNodeDoubleClick: (data: TreeData) => void,
    onMoreClick: (event: MouseEvent, nodeId: string) => void,
    isSelected: (nodeId: string) => boolean,
    /**
     * 拖拽到目标节点上（同级）时触发
     * @param sourceId 源节点 ID
     * @param targetId 目标节点 ID
     * @param sourceData 源节点 TreeData
     * @param targetData 目标节点 TreeData
     */
    onDropToTarget: (
        sourceId: string,
        targetId: string,
        sourceData: TreeData,
        targetData: TreeData
    ) => void
): D3TreeInstance {
    const container = document.getElementById(containerId);
    if (!container) throw new Error('Container not found');

    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3
        .select<HTMLElement, null>(`#${containerId}`)
        .append<SVGSVGElement>('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('cursor', 'grab')
        .style('display', 'block');

    // 提取原生 SVG DOM 元素（保留变量，避免以后需要 d3.pointer 时再用）
    const svgEl: SVGSVGElement = svg.node() as SVGSVGElement;
    // 防止 unused 警告
    void svgEl;

    // 应用缩放功能
    const zoom = d3.zoom<SVGSVGElement, null>().on('zoom', (event) => {
        g.attr('transform', event.transform);
    });
    svg.call(zoom);

    svg.on('click', () => {
        // 触发自定义事件，让 Vue 组件关闭 Popover 菜单
        const event = new CustomEvent('d3-svg-click');
        document.dispatchEvent(event);
    });

    const g = svg.append<SVGGElement>('g') as unknown as GSelection;

    /**
     * D3 树形布局算法（Reingold-Tilford）
     * ----------------------------------------------------------------------------
     * 步骤：
     *   1. d3.tree<TreeData>() 创建布局（带类型约束的树形数据）
     *   2. nodeSize([height, width]) 设置节点间距：
     *      - 第一个参数是同一层节点之间的垂直间距
     *      - 第二个参数是父子节点之间的水平间距
     *   3. separation 自定义兄弟节点间距：
     *      - 同父节点 (a.parent == b.parent)：1.2 倍基础间距
     *      - 不同父节点 (a.parent != b.parent)：1.5 倍基础间距
     *   4. 后面调用 treeLayout(root) 时计算每个节点的 x/y
     */
    const treeLayout = d3
        .tree<TreeData>()
        // 与 d3.html 保持一致：水平间距 340（父子层之间），垂直间距 80（同级之间）
        .nodeSize([NODE_HEIGHT + 40, NODE_WIDTH + 180]) // [垂直间距, 水平间距]
        .separation((a, b) => (a.parent == b.parent ? 1.2 : 1.5));

    /**
     * 把 TreeData 转换为 D3 的层次结构
     * ----------------------------------------------------------------------------
     * 步骤：
     *   1. d3.hierarchy(treeData) 递归遍历，生成 HierarchyNode 树
     *   2. 每个节点添加 .x（垂直坐标）、.y（水平坐标）、.depth（深度）
     *   3. treeLayout(root) 触发布局计算
     */
    const root = d3.hierarchy(treeData);
    treeLayout(root);

    // 绘制连线组
    const link = g
        .append<SVGGElement>('g')
        .selectAll<SVGGElement, d3.HierarchyLink<TreeData>>('.link-group')
        .data(root.links())
        .enter()
        .append<SVGGElement>('g')
        .attr('class', 'link-group');

    // 创建水平连线生成器， 使用 d3.linkHorizontal() 创建水平连线（参考文件的核心实现）
    const linkGenerator = d3
        .linkHorizontal<d3.HierarchyLink<TreeData>, d3.HierarchyNode<TreeData>>()
        .x((d) => d.y ?? 0)
        .y((d) => d.x ?? 0);

    // 使用连线生成器创建路径
    const path = link
        .append<SVGPathElement>('path')
        .attr('class', 'link')
        .attr('stroke', (d) => {
            const type = d.target.data.integrationType as IntegrationTypeKey;
            return EDGE_STYLES[type] || defaultConfig.linkColor;
        })
        .attr('stroke-dasharray', (d) => {
            const type = d.target.data.integrationType as IntegrationTypeKey;
            return type === IntegrationTypeKey.deprecate ? '6,4' : 'none';
        })
        .attr('d', linkGenerator);

    // 连线标签背景
    const labelBg = link.append<SVGRectElement>('rect').attr('class', 'link-label-bg');

    // 连线标签文字
    const labelText = link
        .append<SVGTextElement>('text')
        .attr('class', 'link-label')
        .text((d) => d.target.data.integrationTypeName || '');

    // 绘制节点组
    const node = g
        .append<SVGGElement>('g')
        .selectAll<SVGGElement, d3.HierarchyNode<TreeData>>('.node')
        .data(root.descendants())
        .enter()
        .append<SVGGElement>('g')
        .attr('class', 'node')
        .attr('data-id', (d) => d.data.id) // 用于拖拽命中时查找 DOM
        .attr('transform', (d) => `translate(${d.y ?? 0},${d.x ?? 0})`); // 交换 x/y 实现左右生长

    // 使用 foreignObject 嵌入 HTML 节点卡片
    const fo = node
        .append('foreignObject')
        .attr('width', NODE_WIDTH)
        .attr('height', NODE_HEIGHT)
        .attr('x', -NODE_WIDTH / 2)
        .attr('y', -NODE_HEIGHT / 2);

    fo.append('xhtml:div')
        .attr('class', 'node-card')
        .classed('selected', (d) => isSelected(d.data.id))
        .style('background-color', (d) => NODE_COLORS[d.data.level] || '#8c8c8c')
        .html((d) => {
            const moduleBadge =
                d.data.modules && d.data.modules.length > 0
                    ? `<div class="node-badge">${d.data.modules.length}个模块</div>`
                    : '';
            return `
                <div class="node-label" title="${d.data.label}">${d.data.label}</div>
                ${moduleBadge}
                <button class="more-btn" data-id="${d.data.id}">⋮</button>
            `;
        })
        .on('click', function (event, d) {
            event.stopPropagation();
            onNodeClick(d.data);
        })
        .on('dblclick', function (event, d) {
            event.stopPropagation();
            onNodeDoubleClick(d.data);
        });

    // 绑定"更多"按钮事件
    fo.selectAll('.more-btn').on('click', function (event) {
        event.stopPropagation();
        const nodeId = d3.select(this).attr('data-id');
        if (nodeId) {
            onMoreClick(event as MouseEvent, nodeId);
        }
    });

    // 拖拽功能（参考文件实现）
    // ----------------------------------------------------------------------------
    // 落点检测：在 drag.end 阶段判断释放点是否落在某个节点上
    // 只处理"同级节点"之间的合并（用户需求：拖到同级节点才弹框）
    //
    // 关键修复：
    //   1. 用 `function () {}` 写法让 `this` 指向当前被拖拽的 SVGGElement
    //      （箭头函数会让 this 丢失，导致 setAttribute is not a function）
    //   2. SVG / g 元素引用用闭包变量传，避免依赖 event.sourceEvent.currentTarget
    //      （drag 事件触发时 currentTarget 可能是 null / window）
    //   3. drag 过程中只平移视觉位置（不修改 d.x / d.y），避免污染 d3.hierarchy
    //   4. dragend 用 d3.pointers 转换到 SVG 坐标系，再匹配同层级节点位置
    //
    // 关键细节：d3-drag 的 .on(type, listener) 回调的 `this` 指向当前被拖拽元素
    //     但是 d3-drag v3 的类型签名是 `this: D3DragEvent`，TypeScript 会推错。
    //     这里用 `function (this: SVGGElement, ...)` + 显式类型断言规避。
    node.call(
        d3
            .drag<SVGGElement, d3.HierarchyNode<TreeData>>()
            .on('start', function (this: unknown, _event, d) {
                // this 在 d3-drag v3 中是 d3 selection 或 DOM 元素（依赖 d3 版本细节）
                // 不用 this，直接用 d 参数（d = event.subject = HierarchyNode）
                if (d && d.data) dragstarted(d);
            })
            .on('drag', function (this: unknown, event, d) {
                if (!d) return;
                // 用 event.subject 的 data.id 找 DOM 元素（最可靠）
                const nodeId = d.data?.id;
                if (!nodeId) return;
                const gEl = document.querySelector(
                    `g.node[data-id="${CSS.escape(nodeId)}"]`
                ) as SVGGElement | null;
                if (gEl) dragged(gEl, event, d, root);
            })
            .on('end', function (this: unknown, event, d) {
                // dragend 中 this 不可靠 —— 用 currentDraggingNodeId（dragstart 时记录）
                dragended(event, d, root, onDropToTarget);
            })
    );

    // 初始化标签位置
    updateLinkLabels(labelBg, labelText);

    // 窗口大小变化处理
    window.addEventListener('resize', () => handleResize(svg, container));

    /**
     * 初始化时调用 resetZoom，让图居中显示且 scale = 1
     * ----------------------------------------------------------------------------
     * 不调用此函数会导致两个问题：
     *   1. 树的根节点默认在 (0, 0)，节点可能超出视口
     *   2. scale = 1 时无法适应大屏/小屏
     *
     * resetZoom 内部：
     *   - 计算 g 元素 bbox（节点总包围盒）
     *   - 计算 translate 让 bbox 居中显示（scale 固定为 1）
     *   - 用 zoomIdentity.translate().scale(1) 应用 transform
     *   - 传入 zoom 行为，确保触发已注册的 zoom 监听器
     *   - 监听器中 g.attr('transform', event.transform) 自动更新 g
     */
    resetZoom(svg, g, width, height, zoom);

    return { svg, g, treeLayout, root, link, path, labelBg, labelText, node, zoom };
}

/**
 * 拖拽开始
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 把当前被拖拽的节点提到最上层（raise()），避免拖动时被其他节点遮挡
 *   2. 记录原始 (x, y)（d3.hierarchy 输出的屏幕坐标）到 dataset
 *      后续 drag 用此 + 鼠标位置计算"累计偏移量"
 *
 * @param gEl 节点 g 元素
 * @param d   被拖拽的 HierarchyNode
 */
function dragstarted(d: d3.HierarchyNode<TreeData>) {
    // 防御：d 可能是 plain object（d3-drag v3 subject fallback）
    if (!d || !d.data) return;
    const nodeId = d.data.id;
    const gEl = document.querySelector(
        `g.node[data-id="${CSS.escape(nodeId)}"]`
    ) as SVGGElement | null;
    if (!gEl) return;

    d3.select(gEl).raise();
    // 记录原始 d.x / d.y（debug 用）
    gEl.dataset.origX = String(Number(d.x ?? 0));
    gEl.dataset.origY = String(Number(d.y ?? 0));
    // 关键：初始化"当前累计 transform"
    gEl.dataset.curTX = String(Number(d.y ?? 0));
    gEl.dataset.curTY = String(Number(d.x ?? 0));
    // 记录当前拖拽节点 id（供 dragended 读取）
    currentDraggingNodeId = nodeId;
}

/**
 * 拖拽中：实时更新节点视觉位置（不修改 d.x / d.y）
 * ----------------------------------------------------------------------------
 * 关键设计：
 *   - 不再把坐标写回 d.x / d.y（避免污染 d3.hierarchy 的层级结构）
 *   - 用 dataset 维护"当前累计 transform" + drag 增量 (event.dx, event.dy)
 *     确保节点准确贴在鼠标位置
 *   - 命中检测改用 DOM 命中（document.elementsFromPoint），不做坐标系转换
 *
 * 步骤：
 *   1. 拿原 transform（dragstart 时记录在 dataset.curTX / curTY）
 *   2. 累加本次 event.dx / event.dy（屏幕坐标增量）
 *   3. 节点 transform = translate(curTX + dx, curTY + dy)
 *   4. 用 DOM 命中找鼠标下方的同级节点，加 .drop-target 高亮
 *
 * @param gEl   节点 g 元素（this）
 * @param event d3 drag 事件
 * @param d     被拖拽的 HierarchyNode
 * @param root  当前 HierarchyNode 根（用于找鼠标下方的同级节点）
 */
function dragged(
    gEl: SVGGElement,
    event: d3.D3DragEvent<SVGGElement, d3.HierarchyNode<TreeData>, d3.HierarchyNode<TreeData>>,
    d: d3.HierarchyNode<TreeData>,
    root: d3.HierarchyNode<TreeData>
) {
    // 关键防御：检查 d 是否真的拿到了 HierarchyNode
    // d3-drag v3 的 d = event.subject
    //     event.subject = drag.subject(event, datum) 默认返回 datum（即 selection.data() 绑定的 data）
    //     但 selection.call(d3.drag()) 时如果 datum 是 undefined，subject 会变成 {x: clientX, y: clientY}
    //     此时 d 是一个 plain object，不是 HierarchyNode
    if (!d || typeof (d as { parent?: unknown }).parent === 'undefined') {
        // 防御：d 不是 HierarchyNode，尝试从 DOM 找 data-id
        const nodeId = gEl.getAttribute('data-id');
        if (nodeId) {
            const realNode = root.descendants().find((n) => n.data.id === nodeId);
            if (realNode) {
                d = realNode as d3.HierarchyNode<TreeData>;
            }
        }
    }

    // 当前累计 transform（dragstart 时初始化为 d.y / d.x）
    // 用 ?? 0 防御 undefined，Number() 防御 string
    const initialTX = Number.isFinite(Number(d?.y)) ? Number(d?.y) : 0;
    const initialTY = Number.isFinite(Number(d?.x)) ? Number(d?.x) : 0;
    let curTX = Number(gEl.dataset.curTX ?? initialTX);
    let curTY = Number(gEl.dataset.curTY ?? initialTY);
    if (!Number.isFinite(curTX)) curTX = initialTX;
    if (!Number.isFinite(curTY)) curTY = initialTY;

    // d3-drag 提供 event.dx / event.dy：本次 drag 事件相对上次的屏幕坐标增量
    const dx = Number.isFinite(Number(event.dx)) ? Number(event.dx) : 0;
    const dy = Number.isFinite(Number(event.dy)) ? Number(event.dy) : 0;

    curTX += dx;
    curTY += dy;

    // 写回 dataset 累计
    gEl.dataset.curTX = String(curTX);
    gEl.dataset.curTY = String(curTY);

    // 更新节点 g 元素 transform
    d3.select(gEl).attr('transform', `translate(${curTX},${curTY})`);

    // 实时 hover 高亮：找鼠标下方的同级节点
    // 用 DOM 命中（elementFromPoint）+ 同 parent.data.id 判定
    //    不用坐标系转换 —— 浏览器直接告诉我们鼠标下是哪个 DOM 元素
    //    关键：把 elementFromPoint 的 clientX/Y 当成 viewBox 内的"命中点"
    //    然后取鼠标下最近的 g.node 元素
    const sourceEvent = event.sourceEvent as MouseEvent | TouchEvent;
    let clientX = 0;
    let clientY = 0;
    if (sourceEvent && 'touches' in sourceEvent && sourceEvent.touches.length > 0) {
        clientX = sourceEvent.touches[0].clientX;
        clientY = sourceEvent.touches[0].clientY;
    } else if (sourceEvent && 'clientX' in sourceEvent) {
        clientX = (sourceEvent as MouseEvent).clientX;
        clientY = (sourceEvent as MouseEvent).clientY;
    }

    clearDropTargetHighlight();
    const hit = findSameLevelNodeAtDOM(root, d, clientX, clientY);
    if (hit) {
        const targetNodeEl = findNodeGElement(hit);
        if (targetNodeEl) {
            targetNodeEl.classList.add('drop-target');
        }
    }
}

/**
 * 拖拽结束：检测落点 + 触发"同级节点合并"弹框
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 拿鼠标在 SVG 坐标系中的位置
 *   2. 找鼠标下方的同级节点（d3.pointers 转换 + 同 parent.data.id 判定）
 *   3. 找到目标后调用 onDropToTarget(sourceId, targetId, ...)
 *   4. 清除 hover 高亮
 *   5. **节点 transform 已不再反映 d.x / d.y**，需要 renderTree() 重绘
 *
 * @param svgEl         原生 SVG 元素（用于 d3.pointers 坐标转换，由 initD3 闭包传入）
 * @param event         d3 drag 事件
 * @param d             源节点（被拖拽的）
 * @param root          当前 HierarchyNode 根
 * @param onDropToTarget 命中同级节点时触发的回调
 */
function dragended(
    event: d3.D3DragEvent<SVGGElement, d3.HierarchyNode<TreeData>, d3.HierarchyNode<TreeData>>,
    d: d3.HierarchyNode<TreeData>,
    root: d3.HierarchyNode<TreeData>,
    onDropToTarget: (
        sourceId: string,
        targetId: string,
        sourceData: TreeData,
        targetData: TreeData
    ) => void
) {
    // ⚠️ DEBUG：记录到 window.__dragDebug，让用户在控制台查看
    (window as Window & { __dragDebug?: unknown[] }).__dragDebug =
        (window as Window & { __dragDebug?: unknown[] }).__dragDebug ?? [];
    ((window as Window & { __dragDebug?: unknown[] }).__dragDebug as unknown[]).push({
        type: 'dragended',
        dType: typeof d,
        dIsHierarchyNode: d && typeof d === 'object' && 'parent' in d,
        dHasData: d && typeof d === 'object' && 'data' in d,
        dData: d && typeof d === 'object' ? (d as { data?: unknown }).data : null,
        dX: d && typeof d === 'object' ? (d as { x?: unknown }).x : null,
        dY: d && typeof d === 'object' ? (d as { y?: unknown }).y : null,
        currentDraggingNodeId
    });

    // 关键防御：d3-drag 的 d 可能是 plain object（不是 HierarchyNode）
    // 此时用模块级变量 currentDraggingNodeId 找真正节点
    if (!d || !d.data) {
        // 优先用 currentDraggingNodeId（dragstart 时记录）
        if (currentDraggingNodeId) {
            const realNode = root.descendants().find((n) => n.data.id === currentDraggingNodeId);
            if (realNode) {
                d = realNode as d3.HierarchyNode<TreeData>;
            }
        }
    }

    // 用 DOM 命中（elementFromPoint）找鼠标下方的同级节点
    // 不再做坐标系转换 —— 浏览器直接告诉我们鼠标下是哪个 g.node
    const sourceEvent = event.sourceEvent as MouseEvent | TouchEvent;
    let clientX = 0;
    let clientY = 0;
    if (sourceEvent && 'changedTouches' in sourceEvent && sourceEvent.changedTouches.length > 0) {
        clientX = sourceEvent.changedTouches[0].clientX;
        clientY = sourceEvent.changedTouches[0].clientY;
    } else if (sourceEvent && 'clientX' in sourceEvent) {
        clientX = (sourceEvent as MouseEvent).clientX;
        clientY = (sourceEvent as MouseEvent).clientY;
    }

    // 找鼠标下方的同级节点
    const hit = findSameLevelNodeAtDOM(root, d, clientX, clientY);

    // 清除所有 drop-target 高亮
    clearDropTargetHighlight();

    // 释放后：把当前被拖拽节点的 transform 重置回 d.x / d.y 决定的原坐标
    const draggedG = document.querySelector(
        `g.node[data-id="${CSS.escape(d.data.id)}"]`
    ) as SVGGElement | null;
    if (draggedG) {
        d3.select(draggedG).attr('transform', `translate(${Number(d.y ?? 0)},${Number(d.x ?? 0)})`);
        // 清理 dataset（避免下次拖拽残留状态）
        delete draggedG.dataset.curTX;
        delete draggedG.dataset.curTY;
        delete draggedG.dataset.origX;
        delete draggedG.dataset.origY;
    }

    // 清空 currentDraggingNodeId
    currentDraggingNodeId = null;

    if (!hit) {
        return;
    }

    if (hit.data.id === d.data.id) {
        return;
    }

    // 触发父组件合并弹框
    onDropToTarget(d.data.id, hit.data.id, d.data, hit.data);
}

/**
 * 通过 DOM 命中查找"与源节点同级"的节点
 * ----------------------------------------------------------------------------
 * 命中规则：
 *   1. 用 document.elementFromPoint(clientX, clientY) 拿鼠标下方的 DOM 元素
 *   2. 向上找最近的 g.node[data-id] 元素
 *   3. 用 data-id 反查 HierarchyNode
 *   4. 必须与源节点有相同 parent.data.id（同级）
 *
 * 优势：完全不用坐标转换，浏览器直接告诉我们鼠标下是哪个 DOM
 *      避免 d.x / d.y / viewBox / zoom transform 等坐标系不一致问题
 *
 * @param root    当前 HierarchyNode 根
 * @param source  源节点（被拖拽的）
 * @param clientX 鼠标 clientX（DOM 坐标）
 * @param clientY 鼠标 clientY（DOM 坐标）
 */
function findSameLevelNodeAtDOM(
    root: d3.HierarchyNode<TreeData>,
    source: d3.HierarchyNode<TreeData>,
    clientX: number,
    clientY: number
): d3.HierarchyNode<TreeData> | null {
    // 防御：source.parent 可能为 undefined（如果 source 就是根节点）
    const sourceParentId = source?.parent?.data?.id;
    if (sourceParentId === undefined) {
        return null;
    }

    // 防御：elementFromPoint 在 drag 时可能因为"鼠标在 foreignObject 内的 div"而返回 div
    // 此时要通过 closest('g.node') 找父级 g.node
    const elements = document.elementsFromPoint(clientX, clientY);
    let targetId: string | null = null;

    for (const el of elements) {
        const nodeG = (el as Element).closest('g.node[data-id]') as SVGGElement | null;
        if (nodeG) {
            const id = nodeG.getAttribute('data-id');
            // 不能是自己
            if (id && id !== source.data.id) {
                targetId = id;
                break;
            }
        }
    }

    // 如果通过 DOM 命中找到了目标，验证同级后返回
    if (targetId) {
        const targetNode = root.descendants().find((n) => n.data.id === targetId);
        // 双重检查：必须是同级，且不能是自己
        if (
            targetNode &&
            targetNode.parent &&
            targetNode.parent.data.id === sourceParentId &&
            targetNode.data.id !== source.data.id
        ) {
            return targetNode;
        }
    }

    // DOM 命中未找到或不是同级，尝试基于坐标计算的方式
    // 这种方式可以检测不在可视区内的节点
    return findSameLevelNodeByCoord(root, source, clientX, clientY);
}

/**
 * 通过坐标计算查找同级节点（用于 DOM 命中失败时的回退）
 * ----------------------------------------------------------------------------
 * 原理：
 *   1. 获取当前 SVG 的 transform（缩放和平移）
 *   2. 将鼠标 client 坐标转换为 SVG 内部坐标
 *   3. 遍历同级节点，计算节点中心与鼠标点的距离
 *   4. 返回距离最近且在阈值内的节点
 *
 * @param root    当前 HierarchyNode 根
 * @param source  源节点（被拖拽的）
 * @param clientX 鼠标 clientX（DOM 坐标）
 * @param clientY 鼠标 clientY（DOM 坐标）
 */
function findSameLevelNodeByCoord(
    root: d3.HierarchyNode<TreeData>,
    source: d3.HierarchyNode<TreeData>,
    clientX: number,
    clientY: number
): d3.HierarchyNode<TreeData> | null {
    // 防御：source.parent 可能为 undefined（如果 source 就是根节点）
    const sourceParentId = source?.parent?.data?.id;
    if (sourceParentId === undefined) {
        return null;
    }

    // 找到所有同级节点
    const siblings = root
        .descendants()
        .filter(
            (n) => n.parent && n.parent.data.id === sourceParentId && n.data.id !== source.data.id
        );

    if (siblings.length === 0) {
        return null;
    }

    // 获取 SVG 元素来计算坐标转换
    const svgEl = document.querySelector('svg');
    if (!svgEl) {
        return null;
    }

    // 获取当前的 transform
    const gEl = svgEl.querySelector('g');
    if (!gEl) {
        return null;
    }

    // 解析当前的 transform（scale 和 translate）
    let scale = 1;
    let translateX = 0;
    let translateY = 0;

    const transformAttr = gEl.getAttribute('transform');
    if (transformAttr) {
        const scaleMatch = transformAttr.match(/scale\(([\d.]+)\)/);
        const translateMatch = transformAttr.match(/translate\(([\d.-]+),\s*([\d.-]+)\)/);

        if (scaleMatch) {
            scale = parseFloat(scaleMatch[1]);
        }
        if (translateMatch) {
            translateX = parseFloat(translateMatch[1]);
            translateY = parseFloat(translateMatch[2]);
        }
    }

    // 获取 SVG 的 bounding rect
    const svgRect = svgEl.getBoundingClientRect();

    // 将 client 坐标转换为 SVG 内部坐标
    const svgX = (clientX - svgRect.left - translateX) / scale;
    const svgY = (clientY - svgRect.top - translateY) / scale;

    // 节点宽度和高度（用于计算点击区域）
    const NODE_WIDTH = 160;
    const NODE_HEIGHT = 40;
    const hitThreshold = Math.max(NODE_WIDTH, NODE_HEIGHT) / 2 + 20; // 增加一些容差

    // 遍历同级节点，找到距离最近且在阈值内的节点
    let closestNode: d3.HierarchyNode<TreeData> | null = null;
    let minDistance = Infinity;

    for (const node of siblings) {
        const nodeX = node.y ?? 0;
        const nodeY = node.x ?? 0;

        // 计算节点中心与鼠标点的距离
        const dx = svgX - nodeX;
        const dy = svgY - nodeY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < hitThreshold && distance < minDistance) {
            minDistance = distance;
            closestNode = node;
        }
    }

    return closestNode;
}

/**
 * 找到某个 HierarchyNode 对应的 DOM g 元素
 * （通过遍历 SVG 内的 g.node 元素，对比 data-id）
 */
function findNodeGElement(node: d3.HierarchyNode<TreeData>): SVGGElement | null {
    const gNodes = document.querySelectorAll('g.node[data-id]');
    for (const el of Array.from(gNodes)) {
        if (el.getAttribute('data-id') === node.data.id) {
            return el as SVGGElement;
        }
    }
    return null;
}

/**
 * 清除所有节点的 drop-target 高亮 class
 */
function clearDropTargetHighlight() {
    const highlighted = document.querySelectorAll('g.node.drop-target');
    highlighted.forEach((el) => el.classList.remove('drop-target'));
}

/**
 * 更新所有连线路径 + 标签位置
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 重新创建 linkHorizontal 生成器
 *   2. 更新每条 path 的 d 属性
 *   3. 更新所有标签的位置
 *
 * @param path      连线路径 selection
 * @param labelBg   标签背景 selection
 * @param labelText 标签文字 selection
 */
export function updateLinks(path: PathSelection, labelBg: RectSelection, labelText: TextSelection) {
    // 创建连线生成器
    const linkGenerator = d3
        .linkHorizontal<d3.HierarchyLink<TreeData>, d3.HierarchyNode<TreeData>>()
        .x((d) => d.y ?? 0)
        .y((d) => d.x ?? 0);

    // 更新连线路径
    path.attr('d', linkGenerator);

    // 更新标签位置
    updateLinkLabels(labelBg, labelText);
}

/**
 * 更新连线上的标签（背景框 + 文字）位置
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 计算每条连线中点 = (源点 + 目标点) / 2
 *   2. 标签背景框定位到中点（rect 居中显示）
 *   3. 标签文字定位到中点
 *
 * @param labelBg   标签背景 selection
 * @param labelText 标签文字 selection
 */
export function updateLinkLabels(labelBg: RectSelection, labelText: TextSelection) {
    // 获取坐标的辅助函数
    const getX = (d: d3.HierarchyLink<TreeData>): number => {
        const sourceY = d.source.y ?? 0;
        const targetY = d.target.y ?? 0;
        return (sourceY + targetY) / 2;
    };

    const getY = (d: d3.HierarchyLink<TreeData>): number => {
        const sourceX = d.source.x ?? 0;
        const targetX = d.target.x ?? 0;
        return (sourceX + targetX) / 2;
    };

    labelBg
        .attr('x', (d) => getX(d) - 25)
        .attr('y', (d) => getY(d) - 10)
        .attr('width', 50)
        .attr('height', 20);

    labelText.attr('x', getX).attr('y', getY);
}

/**
 * 窗口大小变化处理
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 读取容器新尺寸
 *   2. 更新 svg 的 width / height（让 svg 占满容器）
 *
 * 注：initD3 中 svg 用了 100% 自适应，此函数是兜底保险
 *
 * @param svg       SVG selection
 * @param container DOM 容器
 */
function handleResize(svg: SvgSelection, container: HTMLElement) {
    const width = container.clientWidth;
    const height = container.clientHeight;
    svg.attr('width', width).attr('height', height);
}

/**
 * 重渲染 D3 树形图（节点数据更新时调用）
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. d3.hierarchy(treeData) 重新构建层次结构并执行 treeLayout 计算
 *   2. d3.join() 绑定连线（path/labelBg/labelText）和节点（node）
 *   3. 连线颜色 = EDGE_STYLES[integrationType]，虚线 = "停用下线"
 *   4. 连线标签背景 + 文字（白色背景框 + 整合方式文字）
 *   5. 节点内容用 <foreignObject> 嵌入自定义 HTML（节点卡片）
 *   6. 节点 .more-btn 重新绑定 click 事件
 *   7. transition().duration(300) 动画过渡
 */
export function renderTree(
    instance: D3TreeInstance,
    treeData: TreeData,
    onNodeClick: (data: TreeData) => void,
    onNodeDoubleClick: (data: TreeData) => void,
    onMoreClick: (event: MouseEvent, nodeId: string) => void,
    isSelected: (nodeId: string) => boolean
) {
    const { treeLayout, path, labelBg, labelText, node } = instance;

    // 重新计算布局
    const root = d3.hierarchy(treeData);
    treeLayout(root);

    // 更新连线数据
    const linkData = root.links();

    // 创建连线生成器
    const linkGenerator = d3
        .linkHorizontal<d3.HierarchyLink<TreeData>, d3.HierarchyNode<TreeData>>()
        .x((d) => d.y ?? 0)
        .y((d) => d.x ?? 0);

    // 获取坐标的辅助函数
    const getX = (d: d3.HierarchyLink<TreeData>): number => {
        const sourceY = d.source.y ?? 0;
        const targetY = d.target.y ?? 0;
        return (sourceY + targetY) / 2;
    };

    const getY = (d: d3.HierarchyLink<TreeData>): number => {
        const sourceX = d.source.x ?? 0;
        const targetX = d.target.x ?? 0;
        return (sourceX + targetX) / 2;
    };

    // 更新连线路径
    path.data(linkData)
        .attr('d', linkGenerator)
        .attr('stroke', (d) => {
            const type = d.target.data.integrationType as IntegrationTypeKey;
            return EDGE_STYLES[type] || defaultConfig.linkColor;
        })
        .attr('stroke-dasharray', (d) => {
            const type = d.target.data.integrationType as IntegrationTypeKey;
            return type === IntegrationTypeKey.deprecate ? '6,4' : 'none';
        });

    // 更新连线标签位置
    labelBg
        .data(linkData)
        .attr('x', (d) => getX(d) - 25)
        .attr('y', (d) => getY(d) - 10);

    // 更新连线标签文字
    labelText
        .data(linkData)
        .attr('x', getX)
        .attr('y', getY)
        .text((d) =>
            d.target.data.integrationType
                ? INTEGRATION_TYPE_NAME[d.target.data.integrationType]
                : ''
        );

    // 更新节点数据
    const nodeData = root.descendants();
    const nodeUpdate = node.data(nodeData);

    // 平滑过渡更新节点位置
    nodeUpdate
        .transition()
        .duration(500)
        .attr('transform', (d) => `translate(${d.y ?? 0},${d.x ?? 0})`);

    // 更新节点卡片内容和样式
    nodeUpdate
        .select('.node-card')
        .style('background-color', (d) => NODE_COLORS[d.data.level] || '#8c8c8c')
        .classed('selected', (d) => isSelected(d.data.id))
        .html((d) => {
            const moduleBadge =
                d.data.modules && d.data.modules.length > 0
                    ? `<div class="node-badge">${d.data.modules.length}个模块</div>`
                    : '';
            return `
                <div class="node-label" title="${d.data.label}">${d.data.label}</div>
                ${moduleBadge}
                <button class="more-btn" data-id="${d.data.id}">⋮</button>
            `;
        });

    // 重新绑定节点点击事件
    nodeUpdate
        .selectAll<HTMLElement, d3.HierarchyNode<TreeData>>('.node-card')
        .on('click', function (event, d) {
            event.stopPropagation();
            onNodeClick(d.data);
        })
        .on('dblclick', function (event, d) {
            event.stopPropagation();
            onNodeDoubleClick(d.data);
        });

    // 重新绑定"更多"按钮事件
    nodeUpdate.selectAll('.more-btn').on('click', function (event) {
        event.stopPropagation();
        const nodeId = d3.select(this).attr('data-id');
        if (nodeId) {
            onMoreClick(event as MouseEvent, nodeId);
        }
    });

    instance.root = root;
}

/**
 * 放大 SVG 内容（带 300ms 动画过渡）
 * ----------------------------------------------------------------------------
 * 关键修复：传入已绑定的 zoom 行为
 * 步骤：
 *   1. 创建 transition 对象
 *   2. 用传入的 zoom 行为（不是新创建的）调用 scaleBy 乘以 1.25
 *   3. 300ms 平滑过渡
 *
 * @param svg  - D3 选中的 SVG 元素
 * @param zoom - 已绑定到 svg 的 zoom 行为
 */
export function zoomIn(svg: SvgSelection, zoom: d3.ZoomBehavior<SVGSVGElement, null>) {
    svg.transition()
        .duration(300)
        .call(zoom.scaleBy as any, 1.25);
}

/**
 * 缩小 SVG 内容（带 300ms 动画过渡）
 * ----------------------------------------------------------------------------
 * 关键修复：传入已绑定的 zoom 行为
 * 步骤：
 *   1. 创建 transition 对象
 *   2. 用传入的 zoom 行为（不是新创建的）调用 scaleBy 乘以 0.8
 *   3. 300ms 平滑过渡
 *
 * @param svg  - D3 选中的 SVG 元素
 * @param zoom - 已绑定到 svg 的 zoom 行为
 */
export function zoomOut(svg: SvgSelection, zoom: d3.ZoomBehavior<SVGSVGElement, null>) {
    svg.transition()
        .duration(300)
        .call(zoom.scaleBy as any, 0.8);
}

/**
 * 重置缩放：将缩放比例重置为 1，并居中显示
 * ----------------------------------------------------------------------------
 * 功能：
 *   1. 将 scale 设置为 1（100%）
 *   2. 将图居中显示
 *   3. 使用已绑定的 zoom 行为同步应用 transform
 *
 * 步骤：
 *   1. 获取 g 元素的 bbox 包围盒
 *   2. 计算平移量 = 让包围盒居中显示（scale = 1）
 *   3. 用 d3.zoomIdentity.translate().scale(1) 构造目标 transform
 *   4. 同步调用 zoom.transform 应用 transform
 *
 * @param svg    - D3 选中的 SVG 元素
 * @param g      - D3 选中的容器 g 元素
 * @param width  - 视口宽度
 * @param height - 视口高度
 * @param zoom   - 已绑定到 svg 的 zoom 行为（推荐传入）
 */
export function resetZoom(
    svg: SvgSelection,
    g: GSelection,
    width: number,
    height: number,
    zoom?: d3.ZoomBehavior<SVGSVGElement, null>
) {
    const gNode = g.node();
    if (!gNode) return;

    const bounds = gNode.getBBox();
    // scale 固定为 1
    const scale = 1;

    // 计算平移量，让包围盒居中显示
    const translate = [
        width / 2 - scale * (bounds.x + bounds.width / 2),
        height / 2 - scale * (bounds.y + bounds.height / 2)
    ];

    // 使用 svg 上已绑定的 zoom 行为
    const targetTransform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale);

    if (zoom) {
        svg.call(zoom.transform as any, targetTransform);
    } else {
        const existingZoom = d3.zoom<SVGSVGElement, null>().transform as any;
        svg.call(existingZoom, targetTransform);
    }
}

/**
 * 适应屏幕：根据节点包围盒自动计算合适的缩放和平移
 * ----------------------------------------------------------------------------
 * 关键修复：
 *   1. 使用 svg 上已绑定的 zoom 行为（避免创建新的 zoom 实例）
 *   2. 不使用 transition（避免异步动画导致首次渲染时 scale 不生效）
 *   3. 直接调用 zoom.transform 同步应用 transform
 *   4. 只缩小不放大（Math.min(rawScale, 1)）
 *      - 图比视口小（rawScale > 1）→ 保持 scale = 1
 *      - 图比视口大（rawScale < 1）→ 缩小到 90% 视口
 *
 * 步骤：
 *   1. 获取 g 元素（内部所有节点）的 bbox 包围盒
 *   2. 计算缩放比例 = 0.9 / max(包围盒宽/视口宽, 包围盒高/视口高)
 *   3. 限制 scale 最大为 1（避免图被意外放大）
 *   4. 计算平移量 = 让包围盒居中显示
 *   5. 用 d3.zoomIdentity.translate().scale() 构造目标 transform
 *   6. 同步调用 zoom.transform 应用 transform（不使用 transition）
 *   7. zoom 监听器自动更新 g 的 transform
 *
 * @param svg    - D3 选中的 SVG 元素
 * @param g      - D3 选中的容器 g 元素
 * @param width  - 视口宽度
 * @param height - 视口高度
 * @param zoom   - 已绑定到 svg 的 zoom 行为（推荐传入）
 */
export function fitView(
    svg: SvgSelection,
    g: GSelection,
    width: number,
    height: number,
    zoom?: d3.ZoomBehavior<SVGSVGElement, null>
) {
    const gNode = g.node();
    if (!gNode) return;

    const bounds = gNode.getBBox();
    // 关键修复：只缩小不放大（min(scale, 1)）
    // - 如果图比视口小（scale > 1）→ 保持 scale = 1，不放大
    // - 如果图比视口大（scale < 1）→ 缩小到合适尺寸
    const rawScale = 0.9 / Math.max(bounds.width / width, bounds.height / height);
    const scale = Math.min(rawScale, 1); // 不超过 1

    // 如果 scale 接近 1（大于 0.95），直接使用 scale = 1
    const finalScale = scale > 0.95 ? 1 : scale;

    const translate = [
        width / 2 - finalScale * (bounds.x + bounds.width / 2),
        height / 2 - finalScale * (bounds.y + bounds.height / 2)
    ];

    // 关键：使用 svg 上已绑定的 zoom 行为
    // 注意：不使用 transition()，确保 transform 同步生效
    const targetTransform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(finalScale);

    if (zoom) {
        // 方式 1：使用传入的 zoom 行为（推荐）- 同步生效
        svg.call(zoom.transform as any, targetTransform);
    } else {
        // 方式 2：直接读取 svg 上已绑定的 zoom
        const existingZoom = d3.zoom<SVGSVGElement, null>().transform as any;
        svg.call(existingZoom, targetTransform);
    }
}
