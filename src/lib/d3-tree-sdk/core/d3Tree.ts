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
 *   - downloadTree(...)      下载树形图为 PNG 图片
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
import {
    LEVEL_CONFIG,
    EDGE_STYLES,
    INTEGRATION_TYPE_NAME,
    IntegrationTypeKey,
    type LevelKey
} from '../types';
import { saveAs } from 'file-saver';
import { createPromise } from '../utils/create-promise';
import { logDragState } from './treeLogger';
import { defaultTreeContext, type TreeContext } from '../TreeContext';
import type { TreeNodeData } from '../schema/TreeAccessors';

/** 从树节点 data 读取配置化 id */
function hDataId(ctx: TreeContext, data: TreeData): string {
    return ctx.accessors.getId(data);
}

/** 从 HierarchyNode 读取配置化 id */
function hNodeId(ctx: TreeContext, d: d3.HierarchyNode<TreeData>): string {
    return hDataId(ctx, d.data);
}

/** 节点卡片背景色（来自 schema.styles.levelColors） */
function nodeLevelColor(ctx: TreeContext, data: TreeData): string {
    const level = ctx.accessors.getLevel(data);
    return ctx.config.levelColors[level] ?? ctx.config.levelColors.base ?? '#CCC';
}

/**
 * 获取节点的整合类型
 * @param ctx - 树上下文
 * @param data - 节点数据
 * @returns 整合类型键值（如 'interface'、'database' 等）
 */
function linkIntegrationType(ctx: TreeContext, data: TreeData): IntegrationTypeKey | undefined {
    return ctx.accessors.getIntegrationType(data);
}

/**
 * 获取连线的颜色
 * @param ctx - 树上下文
 * @param data - 节点数据
 * @returns 连线颜色（根据整合类型返回对应颜色，无类型则返回默认颜色）
 */
function linkStroke(ctx: TreeContext, data: TreeData): string {
    // 获取整合类型
    const type = linkIntegrationType(ctx, data);
    // 如果没有类型，返回默认颜色
    if (!type) return defaultConfig.linkColor;
    // 根据类型返回对应颜色，配置中没有则返回默认颜色
    return ctx.config.edgeColors[type] ?? defaultConfig.linkColor;
}

/**
 * 获取连线的虚线样式
 * @param ctx - 树上下文
 * @param data - 节点数据
 * @returns 虚线样式字符串（'6,4' 表示6px实线+4px空白，'none' 表示实线）
 */
function linkDash(ctx: TreeContext, data: TreeData): string {
    // 如果整合类型是废弃类型，返回虚线样式
    return linkIntegrationType(ctx, data) === IntegrationTypeKey.deprecate ? '6,4' : 'none';
}

/**
 * 获取连线标签的透明度
 * @param ctx - 树上下文
 * @param data - 节点数据
 * @returns 透明度值（1表示显示，0表示隐藏）
 */
function linkLabelOpacity(ctx: TreeContext, data: TreeData): number {
    // 获取整合类型
    const type = linkIntegrationType(ctx, data);
    // 如果有整合类型且不是基础类型，显示标签（透明度为1）
    return type && type !== IntegrationTypeKey.base ? 1 : 0;
}

/**
 * 获取连线标签的文字内容
 * @param ctx - 树上下文
 * @param data - 节点数据
 * @returns 标签文字（优先使用节点存储的类型名称，否则从配置映射表获取）
 */
function linkLabelText(ctx: TreeContext, data: TreeData): string {
    // 优先从节点数据中获取类型名称
    const fromNode = ctx.accessors.getIntegrationTypeName(data);
    if (fromNode) return fromNode;
    // 如果节点没有存储，根据类型键从配置映射表获取
    const type = linkIntegrationType(ctx, data);
    return type ? ctx.config.integrationTypeNames[type] ?? '' : '';
}

const NODE_WIDTH: number = 160;
const NODE_HEIGHT: number = 40;
const MARGIN = { top: 40, right: 40, bottom: 40, left: 40 };

/** 树形图布局方向：horizontal=左右展开，vertical=上下展开 */
export type TreeLayoutOrientation = 'horizontal' | 'vertical';

/**
 * 获取节点卡片的尺寸
 * @param orientation - 树布局方向
 * @returns 节点尺寸对象 { width, height }
 * @description
 * - 水平布局：宽扁卡片 160×40（宽度大于高度）
 * - 垂直布局：竖长卡片 40×160（高度大于宽度）
 */
function getNodeDimensions(orientation: TreeLayoutOrientation): { width: number; height: number } {
    // 水平布局：节点横向排列，使用宽扁卡片
    if (orientation === 'horizontal') {
        return { width: NODE_WIDTH, height: NODE_HEIGHT };
    }
    // 垂直布局：节点纵向排列，使用竖长卡片（交换宽高）
    return { width: NODE_HEIGHT, height: NODE_WIDTH };
}

/**
 * 计算 SVG foreignObject 元素的尺寸和位置
 * @param orientation - 树布局方向
 * @param scale - 缩放比例（默认为1）
 * @returns 包含宽高和坐标的对象 { width, height, x, y }
 * @description
 * foreignObject 用于在 SVG 中嵌入 HTML 内容（如节点卡片）
 * x 和 y 为负值是为了让 foreignObject 的中心点与节点坐标对齐
 */
function getForeignObjectMetrics(
    orientation: TreeLayoutOrientation,
    scale = 1
): { width: number; height: number; x: number; y: number } {
    // 获取基础节点尺寸
    const { width, height } = getNodeDimensions(orientation);
    // 应用缩放比例
    const w = width * scale;
    const h = height * scale;
    // 返回尺寸和位置（负值使元素中心对齐节点坐标）
    return { width: w, height: h, x: -w / 2, y: -h / 2 };
}

/**
 * 应用 foreignObject 元素的属性
 * @param el - SVG foreignObject 元素
 * @param orientation - 树布局方向
 * @param scale - 缩放比例（默认为1）
 * @description
 * 设置 foreignObject 的宽高和位置属性，使其正确显示节点卡片
 */
function applyForeignObjectAttrs(
    el: SVGForeignObjectElement,
    orientation: TreeLayoutOrientation,
    scale = 1
): void {
    // 计算尺寸和位置
    const m = getForeignObjectMetrics(orientation, scale);
    // 设置宽度
    el.setAttribute('width', String(m.width));
    // 设置高度
    el.setAttribute('height', String(m.height));
    // 设置X坐标（负值使元素中心对齐节点坐标）
    el.setAttribute('x', String(m.x));
    // 设置Y坐标（负值使元素中心对齐节点坐标）
    el.setAttribute('y', String(m.y));
}

/**
 * 应用树布局节点大小
 * @param treeLayout - D3 树布局实例
 * @param orientation - 树布局方向
 * @description
 * 设置 D3 树布局的节点大小，根据布局方向调整节点间距：
 * - 水平布局：节点高度+40作为节点大小（控制垂直间距），节点宽度+180作为层级间距（控制水平间距）
 * - 垂直布局：节点宽度+40作为节点大小（控制水平间距），节点高度+180作为层级间距（控制垂直间距）
 *
 * D3 tree.nodeSize() 的参数格式为 [nodeHeight, nodeWidth]，
 * 其中 nodeHeight 控制同级节点之间的垂直间距，nodeWidth 控制层级之间的水平间距。
 */
export function applyTreeLayoutNodeSize(
    treeLayout: d3.TreeLayout<TreeData>,
    orientation: TreeLayoutOrientation
): void {
    // 获取节点尺寸
    const { width, height } = getNodeDimensions(orientation);
    // 水平布局：节点高度+40作为节点大小，节点宽度+180作为层级间距
    if (orientation === 'horizontal') {
        treeLayout.nodeSize([height + 40, width + 180]);
    } else {
        // 垂直布局：节点宽度+40作为节点大小，节点高度+180作为层级间距
        treeLayout.nodeSize([width + 40, height + 180]);
    }
}

/**
 * 计算节点在屏幕上的位置
 * @param node - D3 层级节点
 * @param orientation - 树布局方向
 * @returns 包含 tx（X坐标）和 ty（Y坐标）的对象
 * @description
 * D3 树布局计算出的坐标需要根据布局方向进行转换：
 * - 水平布局：x 表示层级深度（Y坐标），y 表示节点位置（X坐标）
 * - 垂直布局：x 表示节点位置（X坐标），y 表示层级深度（Y坐标）
 */
function nodeScreenPosition(
    node: d3.HierarchyNode<TreeData>,
    orientation: TreeLayoutOrientation
): { tx: number; ty: number } {
    // 水平布局：交换 x 和 y，使树从左向右展开
    if (orientation === 'horizontal') {
        return { tx: node.y ?? 0, ty: node.x ?? 0 };
    }
    // 垂直布局：直接使用 x 和 y，树从上向下展开
    return { tx: node.x ?? 0, ty: node.y ?? 0 };
}

/**
 * 生成节点的 transform 属性字符串
 * @param node - D3 层级节点
 * @param orientation - 树布局方向
 * @returns SVG transform 属性字符串（如 "translate(100,50)"）
 * @description
 * 用于设置节点组元素的 transform 属性，将节点定位到正确位置
 */
function nodeTransformAttr(
    node: d3.HierarchyNode<TreeData>,
    orientation: TreeLayoutOrientation
): string {
    // 计算节点在屏幕上的位置
    const { tx, ty } = nodeScreenPosition(node, orientation);
    // 返回 transform 属性字符串
    return `translate(${tx},${ty})`;
}

/**
 * 将屏幕坐标转换为 SVG 图形 zoom 容器 g 的局部坐标
 * @param graphG - SVG 图形容器元素
 * @param clientX - 屏幕X坐标
 * @param clientY - 屏幕Y坐标
 * @returns 局部坐标对象 { x, y }，转换失败返回 null
 * @description
 * 该函数考虑了 SVG 的缩放（scale）、平移（translate）和 viewBox 等变换，
 * 将鼠标点击或拖拽时的屏幕坐标转换为 SVG 内部的局部坐标，
 * 用于判断鼠标是否点击了某个节点或计算拖拽位置。
 *
 * 转换原理：
 * 1. 获取容器的当前变换矩阵（CTM）
 * 2. 计算逆矩阵
 * 3. 将屏幕坐标点乘以逆矩阵，得到局部坐标
 */
function clientToGraphLocal(
    graphG: SVGGElement,
    clientX: number,
    clientY: number
): { x: number; y: number } | null {
    // 获取 SVG 根元素
    const svg = graphG.ownerSVGElement;
    if (!svg) return null;
    // 获取容器的当前变换矩阵（包含缩放和平移）
    const ctm = graphG.getScreenCTM();
    if (!ctm) return null;
    // 计算逆矩阵（用于反向变换）
    const inverse = ctm.inverse();
    if (!inverse) return null;
    // 创建 SVG 点对象
    const pt = svg.createSVGPoint();
    // 设置屏幕坐标
    pt.x = clientX;
    pt.y = clientY;
    // 应用逆矩阵变换，得到局部坐标
    const local = pt.matrixTransform(inverse);
    return { x: local.x, y: local.y };
}

/**
 * 从鼠标或触摸事件中提取客户端坐标
 * @param sourceEvent - 鼠标事件或触摸事件
 * @param useChangedTouches - 是否使用 changedTouches（用于 touchend 事件）
 * @returns 包含 x 和 y 坐标的对象
 * @description
 * 兼容鼠标事件和触摸事件，统一返回客户端坐标。
 * 触摸事件可能包含多个触摸点，默认使用第一个触摸点。
 * touchend 事件中需要使用 changedTouches 获取离开的触摸点。
 */
function getPointerClientXY(
    sourceEvent: MouseEvent | TouchEvent | null | undefined,
    useChangedTouches = false
): { x: number; y: number } {
    // 如果没有事件，返回原点
    if (!sourceEvent) return { x: 0, y: 0 };
    // 触摸事件处理
    if ('touches' in sourceEvent) {
        // 根据 useChangedTouches 决定使用 touches 还是 changedTouches
        const touches = useChangedTouches ? sourceEvent.changedTouches : sourceEvent.touches;
        if (touches.length > 0) {
            // 返回第一个触摸点的客户端坐标
            return { x: touches[0].clientX, y: touches[0].clientY };
        }
    }
    // 鼠标事件处理
    if ('clientX' in sourceEvent) {
        return { x: sourceEvent.clientX, y: sourceEvent.clientY };
    }
    // 无法获取坐标，返回原点
    return { x: 0, y: 0 };
}

/**
 * 设置节点元素的指针事件
 * @param gEl - 节点组元素
 * @param enabled - 是否启用指针事件
 * @description
 * 控制节点是否响应鼠标事件（点击、拖拽等）。
 * 禁用时，节点不会拦截鼠标事件，可以穿透到下层元素。
 * 同时也控制节点内部的 foreignObject 元素的指针事件。
 */
function setNodePointerEvents(gEl: SVGGElement, enabled: boolean) {
    // 设置节点组的指针事件（enabled=true 表示启用，空字符串表示恢复默认行为）
    gEl.style.pointerEvents = enabled ? '' : 'none';
    // 查找节点内部的 foreignObject 元素
    const fo = gEl.querySelector('foreignObject') as SVGForeignObjectElement | null;
    if (fo) {
        // 设置 foreignObject 的指针事件
        fo.style.pointerEvents = enabled ? '' : 'none';
    }
}

/**
 * 创建父子连线生成器
 * @param orientation - 树布局方向
 * @returns D3 连线生成器函数
 * @description
 * 创建用于绘制父子节点之间连线的 D3 生成器。
 * 连线使用贝塞尔曲线，根据布局方向调整坐标映射。
 */
function createLinkGenerator(orientation: TreeLayoutOrientation) {
    // 获取节点尺寸
    const { width, height } = getNodeDimensions(orientation);
    // 水平布局：使用 linkHorizontal 生成器
    if (orientation === 'horizontal') {
        return (
            d3
                .linkHorizontal<d3.HierarchyLink<TreeData>, d3.HierarchyNode<TreeData>>()
                // 水平布局：交换 x 和 y 坐标
                .x((d) => d.y ?? 0)
                .y((d) => d.x ?? 0)
                .source(
                    (d) =>
                        ({
                            x: d.source.x ?? 0,
                            y: (d.source.y ?? 0) + width / 2
                        }) as unknown as d3.HierarchyNode<TreeData>
                )
                .target(
                    (d) =>
                        ({
                            x: d.target.x ?? 0,
                            y: (d.target.y ?? 0) - width / 2
                        }) as unknown as d3.HierarchyNode<TreeData>
                )
        );
    }
    return d3
        .linkVertical<d3.HierarchyLink<TreeData>, d3.HierarchyNode<TreeData>>()
        .x((d) => d.x ?? 0)
        .y((d) => d.y ?? 0)
        .source(
            (d) =>
                ({
                    x: d.source.x ?? 0,
                    y: (d.source.y ?? 0) + height / 2
                }) as unknown as d3.HierarchyNode<TreeData>
        )
        .target(
            (d) =>
                ({
                    x: d.target.x ?? 0,
                    y: (d.target.y ?? 0) - height / 2
                }) as unknown as d3.HierarchyNode<TreeData>
        );
}

/**
 * 计算连线标签的中点位置
 * @param link - D3 层级连线
 * @param orientation - 树布局方向
 * @returns 标签位置坐标 { x, y }
 * @description
 * 计算父子连线的中点位置，用于显示整合类型标签。
 * 水平布局和垂直布局的坐标映射不同。
 */
function linkLabelMidpoint(
    link: d3.HierarchyLink<TreeData>,
    orientation: TreeLayoutOrientation
): { x: number; y: number } {
    // 水平布局：交换 x 和 y 坐标
    if (orientation === 'horizontal') {
        return {
            // X坐标：源节点和目标节点的 Y 坐标平均值
            x: ((link.source.y ?? 0) + (link.target.y ?? 0)) / 2,
            // Y坐标：源节点和目标节点的 X 坐标平均值，向下偏移2px
            y: ((link.source.x ?? 0) + (link.target.x ?? 0)) / 2 + 2
        };
    }
    // 垂直布局：直接使用 x 和 y 坐标
    return {
        // X坐标：源节点和目标节点的 X 坐标平均值
        x: ((link.source.x ?? 0) + (link.target.x ?? 0)) / 2,
        // Y坐标：源节点和目标节点的 Y 坐标平均值，向下偏移2px
        y: ((link.source.y ?? 0) + (link.target.y ?? 0)) / 2 + 2
    };
}

/** 关联关系连线与节点卡片的垂直间距 */
const RELATION_LINE_OFFSET = 18;

/**
 * 关联关系连线数据接口
 * @description
 * 包含关联关系的所有信息，用于渲染关联关系连线。
 */
interface RelationLinkDatum {
    sourceId: string; // 源节点ID
    targetId: string; // 目标节点ID
    type: IntegrationTypeKey; // 关联类型
    typeName: string; // 关联类型名称
    name: string; // 关联名称
    source: d3.HierarchyNode<TreeData>; // 源节点
    target: d3.HierarchyNode<TreeData>; // 目标节点
}

/**
 * 获取关联关系连线的颜色
 * @param ctx - 树上下文
 * @param type - 关联类型
 * @returns 连线颜色
 * @description
 * 根据关联类型返回对应的颜色，配置中没有则返回默认颜色。
 */
function relationLinkStroke(ctx: TreeContext, type: IntegrationTypeKey): string {
    return ctx.config.edgeColors[type] ?? defaultConfig.linkColor;
}

/**
 * 获取关联关系连线的虚线样式
 * @param type - 关联类型
 * @returns 虚线样式字符串（'6,4' 表示6px实线+4px空白，'none' 表示实线）
 * @description
 * 废弃类型的关联关系使用虚线显示。
 */
function relationLinkDash(type: IntegrationTypeKey): string {
    // 废弃类型使用虚线样式
    return type === IntegrationTypeKey.deprecate ? '6,4' : 'none';
}

/**
 * 收集所有关联关系数据
 * @param root - 树形数据根节点
 * @param ctx - 树上下文
 * @returns 关联关系数据数组
 * @description
 * 遍历所有节点，收集每个节点的关联关系，构建关联关系连线数据。
 * 每个关联关系包含源节点、目标节点、类型、名称等信息。
 */
function collectRelationLinkData(
    root: d3.HierarchyNode<TreeData>,
    ctx: TreeContext
): RelationLinkDatum[] {
    // 获取访问器
    const acc = ctx.accessors;
    // 创建节点ID到节点对象的映射，用于快速查找目标节点
    const nodeById = new Map(root.descendants().map((n) => [hNodeId(ctx, n), n]));
    // 存储收集到的关联关系数据
    const links: RelationLinkDatum[] = [];
    // 记录已处理的关联关系，避免重复（使用 sourceId__targetId 作为唯一标识）
    const seen = new Set<string>();

    // 遍历所有节点
    for (const node of root.descendants()) {
        // 获取源节点ID
        const sourceId = hNodeId(ctx, node);
        // 遍历该节点的所有关联关系
        for (const relation of acc.getRelations(node.data)) {
            // 获取目标节点ID
            const targetId = acc.getRelationTargetId(relation);
            // 如果目标节点ID不存在或与源节点相同，跳过
            if (!targetId || targetId === sourceId) continue;

            // 生成关联关系的唯一标识
            const key = `${sourceId}__${targetId}`;
            // 如果该关联关系已处理过，跳过
            if (seen.has(key)) continue;
            // 标记该关联关系已处理
            seen.add(key);

            // 从映射表中查找目标节点对象
            const target = nodeById.get(targetId);
            // 如果目标节点不存在，跳过
            if (!target) continue;

            // 添加关联关系数据到数组
            links.push({
                sourceId, // 源节点ID
                targetId, // 目标节点ID
                type: acc.getRelationType(relation), // 关联类型
                typeName: acc.getRelationTypeName(relation), // 关联类型名称
                name: acc.getRelationName(relation), // 关联名称
                source: node, // 源节点对象
                target // 目标节点对象
            });
        }
    }

    // 返回收集到的所有关联关系数据
    return links;
}

/**
 * 创建关联关系连线的 SVG 路径
 * @param d - 关联关系数据，包含源节点、目标节点、类型和名称
 * @param orientation - 树布局方向（水平/垂直）
 * @returns SVG path 字符串
 */
function createRelationLinkPath(d: RelationLinkDatum, orientation: TreeLayoutOrientation): string {
    // 获取节点尺寸（宽高）
    const { width, height } = getNodeDimensions(orientation);
    // 关联线偏移量（用于控制连线与节点的距离）
    const offset = RELATION_LINE_OFFSET;

    // ============ 水平布局处理 ============
    if (orientation === 'horizontal') {
        // 提取源节点和目标节点的坐标
        const sourceX = d.source.x ?? 0; // 源节点X坐标（水平位置）
        const sourceY = d.source.y ?? 0; // 源节点Y坐标（垂直位置）
        const targetX = d.target.x ?? 0; // 目标节点X坐标
        const targetY = d.target.y ?? 0; // 目标节点Y坐标

        // 判断两节点是否在同一行（X坐标差值小于节点高度的一半）
        const sameRow = Math.abs(sourceX - targetX) < height * 0.5;
        // 判断两节点是否在同一列（Y坐标差值小于节点宽度的一半）
        const sameCol = Math.abs(sourceY - targetY) < width * 0.5;

        // 同级左右排列：从两节点底部向下，中间横向连接
        // 场景1：同级左右排列（同一行）
        if (sameRow) {
            // 判断源节点在左还是右
            const leftIsSource = sourceY <= targetY;
            // 确定左右节点的坐标（统一按左到右顺序）
            const leftY = leftIsSource ? sourceY : targetY;
            const rightY = leftIsSource ? targetY : sourceY;
            const leftX = leftIsSource ? sourceX : targetX;
            const rightX = leftIsSource ? targetX : sourceX;
            // 计算两节点X坐标的中点（行中心）
            const rowCenterX = (leftX + rightX) / 2;
            // 计算连线拐点Y坐标：行中心向下偏移节点高度的一半再加偏移量
            const midY = rowCenterX + height / 2 + offset;
            // 左节点底部坐标（Y,X格式，SVG坐标）
            const leftBottom = `${leftY},${leftX + height / 2}`;
            // 右节点底部坐标
            const rightBottom = `${rightY},${rightX + height / 2}`;
            // 返回Z字形路径：左底 → 向下到拐点 → 向右到右拐点 → 向上到右底
            return `M${leftBottom} L${leftY},${midY} L${rightY},${midY} L${rightBottom}`;
        }

        // 同级上下排列：在两节点垂直间隙中间画横向连接线
        // 场景2：同级上下排列（同一列）
        if (sameCol) {
            // 获取上下节点的X坐标
            const topX = Math.min(sourceX, targetX);
            const bottomX = Math.max(sourceX, targetX);
            // 计算两节点Y坐标的中点（列中心）
            const centerY = (sourceY + targetY) / 2;
            // 上节点底部边缘位置
            const topEdge = topX + height / 2;
            // 下节点顶部边缘位置
            const bottomEdge = bottomX - height / 2;
            // 计算连线中点（垂直方向的中间位置）
            const midVert = (topEdge + bottomEdge) / 2;
            // 计算关联类型标签的半宽度（不超过56px）
            const halfSpan = Math.min(width / 2 + offset, 56);
            // 返回三段路径组成十字线：
            return [
                `M${centerY},${topEdge} L${centerY},${midVert}`, // 垂直线：从上方节点到标签位置
                `M${centerY - halfSpan},${midVert} L${centerY + halfSpan},${midVert}`, // 水平线：标签位置的横向线 （十字线的原因）
                `M${centerY},${midVert} L${centerY},${bottomEdge}` // 垂直线：从标签位置到下方节点
            ].join(' ');
        }

        // 斜向分布：在垂直中点处横向连接左右边缘
        // 场景3：斜向分布（不在同一行也不在同一列）
        // 判断源节点在左还是右
        const leftIsSource = sourceY <= targetY;
        const leftY = leftIsSource ? sourceY : targetY;
        const rightY = leftIsSource ? targetY : sourceY;
        const leftX = leftIsSource ? sourceX : targetX;
        const rightX = leftIsSource ? targetX : sourceX;
        // 计算两节点X坐标的中点
        const midY = (leftX + rightX) / 2;
        // 左节点右边缘位置
        const startX = leftY + width / 2;
        // 右节点左边缘位置
        const endX = rightY - width / 2;

        // 如果两节点在X方向重叠（边缘交叉）
        if (startX >= endX) {
            // 计算Y坐标中点
            const centerY = (leftY + rightY) / 2;
            // 上边缘位置
            const topEdge = Math.min(leftX, rightX) + height / 2;
            // 下边缘位置
            const bottomEdge = Math.max(leftX, rightX) - height / 2;
            // 垂直方向中点（标签位置）
            const midVert = (topEdge + bottomEdge) / 2;
            // 标签半宽度
            const halfSpan = Math.min(width / 2 + offset, 56);
            // 返回十字线路径
            return [
                `M${centerY},${topEdge} L${centerY},${midVert}`,
                `M${centerY - halfSpan},${midVert} L${centerY + halfSpan},${midVert}`,
                `M${centerY},${midVert} L${centerY},${bottomEdge}`
            ].join(' ');
        }
        // 正常情况：直接水平连接两节点边缘
        return `M${startX},${midY} L${endX},${midY}`;
    }

    // ============ 垂直布局处理 ============
    // 提取源节点和目标节点的坐标
    const sourceX = d.source.x ?? 0; // 源节点X坐标（垂直位置）
    const sourceY = d.source.y ?? 0; // 源节点Y坐标（水平位置）
    const targetX = d.target.x ?? 0; // 目标节点X坐标
    const targetY = d.target.y ?? 0; // 目标节点Y坐标

    // 判断两节点是否在同一列（X坐标差值小于节点宽度的一半）
    const sameCol = Math.abs(sourceX - targetX) < width * 0.5;
    // 判断两节点是否在同一行（Y坐标差值小于节点高度的一半）
    const sameRow = Math.abs(sourceY - targetY) < height * 0.5;

    // 场景1：同一行（左右排列）
    if (sameRow) {
        // 判断源节点在左还是右
        const leftIsSource = sourceX <= targetX;
        const leftX = leftIsSource ? sourceX : targetX;
        const rightX = leftIsSource ? targetX : sourceX;
        const leftY = leftIsSource ? sourceY : targetY;
        const rightY = leftIsSource ? targetY : sourceY;
        // 计算行中心X坐标
        const rowCenterX = (leftX + rightX) / 2;
        // 计算拐点X坐标：行中心向右偏移节点宽度的一半再加偏移量
        const midX = rowCenterX + width / 2 + offset;
        // 左节点右边缘坐标
        const leftBottom = `${leftX + width / 2},${leftY}`;
        // 右节点右边缘坐标
        const rightBottom = `${rightX + width / 2},${rightY}`;
        // 返回Z字形路径
        return `M${leftBottom} L${midX},${leftY} L${midX},${rightY} L${rightBottom}`;
    }

    // 场景2：同一列（上下排列）
    if (sameCol) {
        // 获取上下节点的Y坐标
        const topY = Math.min(sourceY, targetY);
        const bottomY = Math.max(sourceY, targetY);
        // 计算X坐标中点
        const centerX = (sourceX + targetX) / 2;
        // 上节点底部边缘
        const topEdge = topY + height / 2;
        // 下节点顶部边缘
        const bottomEdge = bottomY - height / 2;
        // 水平方向中点（标签位置）
        const midHoriz = (topEdge + bottomEdge) / 2;
        // 标签半高度
        const halfSpan = Math.min(height / 2 + offset, 56);
        // 返回十字线路径
        return [
            `M${topEdge},${centerX} L${midHoriz},${centerX}`,
            `M${midHoriz},${centerX - halfSpan} L${midHoriz},${centerX + halfSpan}`,
            `M${midHoriz},${centerX} L${bottomEdge},${centerX}`
        ].join(' ');
    }

    // 场景3：斜向分布
    // 判断源节点在上还是下
    const topIsSource = sourceX <= targetX;
    const topY = topIsSource ? sourceY : targetY;
    const bottomY = topIsSource ? targetY : sourceY;
    const topX = topIsSource ? sourceX : targetX;
    const bottomX = topIsSource ? targetX : sourceX;
    // 计算X坐标中点
    const midX = (topX + bottomX) / 2;
    // 上节点底部边缘
    const startY = topY + height / 2;
    // 下节点顶部边缘
    const endY = bottomY - height / 2;

    // 如果两节点在Y方向重叠
    if (startY >= endY) {
        // 计算X坐标中点
        const centerX = (topX + bottomX) / 2;
        // 上边缘位置
        const topEdge = Math.min(topY, bottomY) + height / 2;
        // 下边缘位置
        const bottomEdge = Math.max(topY, bottomY) - height / 2;
        // 水平方向中点（标签位置）
        const midHoriz = (topEdge + bottomEdge) / 2;
        // 标签半高度
        const halfSpan = Math.min(height / 2 + offset, 56);
        // 返回十字线路径
        return [
            `M${topEdge},${centerX} L${midHoriz},${centerX}`,
            `M${midHoriz},${centerX - halfSpan} L${midHoriz},${centerX + halfSpan}`,
            `M${midHoriz},${centerX} L${bottomEdge},${centerX}`
        ].join(' ');
    }
    // 正常情况：直接垂直连接两节点边缘
    return `M${midX},${startY} L${midX},${endY}`;
}

/**
 * 计算关联关系标签的中点位置
 * @param d - 关联关系数据
 * @param orientation - 树布局方向
 * @returns 标签位置坐标 {x, y}
 */
function relationLabelMidpoint(
    d: RelationLinkDatum,
    orientation: TreeLayoutOrientation
): { x: number; y: number } {
    // 获取节点尺寸
    const { width, height } = getNodeDimensions(orientation);
    // 偏移量
    const offset = RELATION_LINE_OFFSET;

    // ============ 水平布局处理 ============
    if (orientation === 'horizontal') {
        // 提取节点坐标
        const sourceX = d.source.x ?? 0;
        const sourceY = d.source.y ?? 0;
        const targetX = d.target.x ?? 0;
        const targetY = d.target.y ?? 0;
        // 判断是否同一行/列
        const sameRow = Math.abs(sourceX - targetX) < height * 0.5;
        const sameCol = Math.abs(sourceY - targetY) < width * 0.5;

        // 同一行：标签放在两节点下方中间
        if (sameRow) {
            // Y坐标：行中心向下偏移
            const midY = (sourceX + targetX) / 2 + height / 2 + offset;
            // X坐标：两节点Y坐标中点
            return { x: (sourceY + targetY) / 2, y: midY };
        }

        // 同一列：标签放在两节点垂直间隙中间
        if (sameCol) {
            const topX = Math.min(sourceX, targetX);
            const bottomX = Math.max(sourceX, targetX);
            // X坐标：两节点Y坐标中点
            const centerY = (sourceY + targetY) / 2;
            // Y坐标：两节点垂直间隙的中点
            const midVert = (topX + height / 2 + bottomX - height / 2) / 2;
            return { x: centerY, y: midVert };
        }

        // 斜向分布：标签放在两节点中心
        return {
            x: (sourceY + targetY) / 2,
            y: (sourceX + targetX) / 2
        };
    }

    // ============ 垂直布局处理 ============
    // 提取节点坐标
    const sourceX = d.source.x ?? 0;
    const sourceY = d.source.y ?? 0;
    const targetX = d.target.x ?? 0;
    const targetY = d.target.y ?? 0;
    // 判断是否同一行/列
    const sameRow = Math.abs(sourceY - targetY) < height * 0.5;
    const sameCol = Math.abs(sourceX - targetX) < width * 0.5;

    // 同一行：标签放在两节点右侧中间
    if (sameRow) {
        // X坐标：行中心向右偏移
        const midX = (sourceX + targetX) / 2 + width / 2 + offset;
        // Y坐标：两节点Y坐标中点
        return { x: midX, y: (sourceY + targetY) / 2 };
    }

    // 同一列：标签放在两节点水平间隙中间
    if (sameCol) {
        const topY = Math.min(sourceY, targetY);
        const bottomY = Math.max(sourceY, targetY);
        // X坐标：两节点X坐标中点
        const centerX = (sourceX + targetX) / 2;
        // Y坐标：两节点水平间隙的中点
        const midHoriz = (topY + height / 2 + bottomY - height / 2) / 2;
        return { x: centerX, y: midHoriz };
    }

    // 斜向分布：标签放在两节点中心
    return {
        x: (sourceX + targetX) / 2,
        y: (sourceY + targetY) / 2
    };
}

/**
 * 更新关联关系连线的渲染
 * @param instance - D3树实例
 * @param root - 树形数据根节点
 */
function updateRelationLinks(instance: D3TreeInstance, root: d3.HierarchyNode<TreeData>): void {
    // 获取树上下文
    const ctx = instance.treeContext;
    // 获取布局方向（默认为水平布局）
    const orientation = instance.orientation ?? 'horizontal';
    // 收集所有关联关系数据
    const linkData = collectRelationLinkData(root, ctx);
    // 创建标签位置计算函数（闭包缓存布局方向）
    const getLabelMid = (d: RelationLinkDatum) => relationLabelMidpoint(d, orientation);

    // 使用 D3 的 join 模式更新关联连线
    instance.relationLink
        // 选择所有关联连线组
        .selectAll<SVGGElement, RelationLinkDatum>('.relation-link-group')
        // 绑定数据，使用 sourceId__targetId 作为唯一标识
        .data(linkData, (d) => `${d.sourceId}__${d.targetId}`)
        .join(
            // ============ 新增元素处理（enter）===========
            (enter) => {
                // 创建新的连线组容器
                const group = enter.append('g').attr('class', 'relation-link-group');

                // 添加连线路径
                group
                    .append('path')
                    .attr('class', 'relation-link') // 设置CSS类名
                    .attr('fill', 'none') // 无填充
                    .attr('stroke-width', 2) // 线宽2px
                    .attr('stroke', (d) => relationLinkStroke(ctx, d.type)) // 根据类型设置颜色
                    .attr('stroke-dasharray', (d) => relationLinkDash(d.type)) // 根据类型设置虚线样式
                    .attr('d', (d) => createRelationLinkPath(d, orientation)); // 创建路径

                // 添加标签背景矩形
                group
                    .append('rect')
                    .attr('class', 'relation-link-label-bg')
                    .attr('x', (d) => getLabelMid(d).x - 40) // 左对齐（宽度80，所以-40）
                    .attr('y', (d) => getLabelMid(d).y - 10) // 上对齐（高度20，所以-10）
                    .attr('width', 80) // 宽度80px
                    .attr('height', 20) // 高度20px
                    .attr('opacity', (d) => (d.name ? 1 : 0)); // 有名称时显示

                // 添加标签文字
                group
                    .append('text')
                    .attr('class', 'relation-link-label')
                    .attr('x', (d) => getLabelMid(d).x) // 水平居中
                    .attr('y', (d) => getLabelMid(d).y) // 垂直居中
                    .attr('opacity', (d) => (d.typeName ? 1 : 0)) // 有类型名称时显示
                    .text((d) => d.typeName ?? ''); // 显示类型名称

                return group;
            },
            // ============ 更新元素处理（update）===========
            (update) => {
                // 更新连线路径属性
                update
                    .select('.relation-link')
                    .attr('stroke', (d) => relationLinkStroke(ctx, d.type))
                    .attr('stroke-dasharray', (d) => relationLinkDash(d.type))
                    .attr('d', (d) => createRelationLinkPath(d, orientation));

                update
                    .select('.relation-link-label-bg')
                    .attr('x', (d) => getLabelMid(d).x - 40)
                    .attr('y', (d) => getLabelMid(d).y - 10)
                    .attr('width', 80)
                    .attr('height', 20)
                    .attr('opacity', (d) => (d.name ? 1 : 0));

                update
                    .select('.relation-link-label')
                    .attr('x', (d) => getLabelMid(d).x)
                    .attr('y', (d) => getLabelMid(d).y)
                    .attr('opacity', (d) => (d.typeName ? 1 : 0))
                    .text((d) => {
                        console.log(d, d.typeName);
                        return d.typeName ?? '';
                    });

                return update;
            },
            (exit) => exit.remove()
        );
}

/**
 * 切换布局方向（需随后调用 renderTree 重绘）
 * @param instance - D3TreeInstance 实例
 * @param orientation - 新的布局方向（horizontal 水平 / vertical 垂直）
 * @description
 * 设置树的布局方向，修改实例的 orientation 属性并更新树布局的节点大小。
 *
 * 注意：调用此函数后需要调用 renderTree() 才能看到界面变化。
 *
 * 布局方向影响：
 * - horizontal（水平）：根节点在左侧，子节点向右展开
 * - vertical（垂直）：根节点在顶部，子节点向下展开
 *
 * 布局切换时会重新计算节点间距，确保不同方向下节点布局合理。
 */
export function setTreeOrientation(
    instance: D3TreeInstance,
    orientation: TreeLayoutOrientation
): void {
    // 步骤 1：更新实例的布局方向属性
    instance.orientation = orientation;
    // 步骤 2：根据新方向重新计算节点大小和间距
    applyTreeLayoutNodeSize(instance.treeLayout, orientation);
}

/**
 * D3 Selection 类型定义说明
 * ----------------------------------------------------------------------------
 * D3 Selection 的泛型参数格式：Selection<GElement, Datum, PElement, PDatum>
 * - GElement: 选中元素的类型（Generic Element）
 * - Datum: 绑定到元素的数据类型
 * - PElement: 父元素的类型（Parent Element）
 * - PDatum: 父元素绑定的数据类型
 */

/** SVG 容器的 D3 Selection 类型 */
type SvgSelection = d3.Selection<SVGSVGElement, null, HTMLElement, null>;

/** 可缩放平移的容器 g 元素的 D3 Selection 类型 */
type GSelection = d3.Selection<SVGGElement, null, SVGSVGElement, null>;

/** 父子连线组（g.link-group）的 D3 Selection 类型 */
type LinkSelection = d3.Selection<SVGGElement, d3.HierarchyLink<TreeData>, SVGGElement, null>;

/** 连线路径（path.link）的 D3 Selection 类型 */
type PathSelection = d3.Selection<
    SVGPathElement,
    d3.HierarchyLink<TreeData>,
    SVGGElement,
    d3.HierarchyLink<TreeData> | null
>;

/** 连线标签背景矩形（rect.link-label-bg）的 D3 Selection 类型 */
type RectSelection = d3.Selection<
    SVGRectElement,
    d3.HierarchyLink<TreeData>,
    SVGGElement,
    d3.HierarchyLink<TreeData> | null
>;

/** 连线标签文字（text.link-label）的 D3 Selection 类型 */
type TextSelection = d3.Selection<
    SVGTextElement,
    d3.HierarchyLink<TreeData>,
    SVGGElement,
    d3.HierarchyLink<TreeData> | null
>;

/** 节点组（g.node）的 D3 Selection 类型 */
type NodeSelection = d3.Selection<
    SVGGElement,
    d3.HierarchyNode<TreeData>,
    SVGGElement,
    d3.HierarchyLink<TreeData> | null
>;

/**
 * D3 树实例接口：暴露给 GraphCanvas 用于缩放、重渲染和状态管理
 * @description
 * 该接口定义了 D3 树形图实例的核心组成部分，包含：
 * - SVG 相关的 selections（svg、g、link、node 等）
 * - 布局相关对象（treeLayout、root）
 * - 状态管理（currentDraggingNodeId、orientation）
 * - 配置信息（treeContext）
 */
export interface D3TreeInstance {
    /** SVG 容器的 D3 selection */
    svg: SvgSelection;
    /** 可缩放平移的容器 g 元素的 D3 selection */
    g: GSelection;
    /** D3 树布局算法实例（Reingold-Tilford） */
    treeLayout: d3.TreeLayout<TreeData>;
    /** 树形数据的根节点（D3 HierarchyNode 结构） */
    root: d3.HierarchyNode<TreeData>;
    /** 父子连线组的 D3 selection */
    link: LinkSelection;
    /** 连线路径的 D3 selection */
    path: PathSelection;
    /** 连线标签背景矩形的 D3 selection */
    labelBg: RectSelection;
    /** 连线标签文字的 D3 selection */
    labelText: TextSelection;
    /** 节点组的 D3 selection */
    node: NodeSelection;
    /** 关联关系连线组（独立于树形父子连线，用于绘制节点间的关联关系） */
    relationLink: d3.Selection<SVGGElement, unknown, SVGGElement, unknown>;
    /** 已绑定到 svg 的 zoom 行为，用于精确控制 transform */
    zoom: d3.ZoomBehavior<SVGSVGElement, null>;
    /** 当前正在拖拽的节点 id（实例级状态，支持多实例场景） */
    currentDraggingNodeId: string | null;
    /** 布局方向：horizontal（左右布局）/ vertical（上下布局） */
    orientation: TreeLayoutOrientation;
    /** 字段映射与树配置（包含访问器、样式配置等） */
    treeContext: TreeContext;
}

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
 *      落点检测在 dragEnded 时执行：
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
    ) => void,
    treeContext: TreeContext = defaultTreeContext
): D3TreeInstance {
    const acc = treeContext.accessors;
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
    const orientation: TreeLayoutOrientation = 'horizontal';
    const treeLayout = d3.tree<TreeData>().separation((a, b) => (a.parent == b.parent ? 1.2 : 1.5));
    applyTreeLayoutNodeSize(treeLayout, orientation);

    /**
     * 把 TreeData 转换为 D3 的层次结构
     * ----------------------------------------------------------------------------
     * 步骤：
     *   1. d3.hierarchy(treeData) 递归遍历，生成 HierarchyNode 树
     *   2. 每个节点添加 .x（垂直坐标）、.y（水平坐标）、.depth（深度）
     *   3. treeLayout(root) 触发布局计算
     */
    const root = d3.hierarchy(treeData, (d) => acc.hierarchyChildren(d) as TreeData[] | undefined);
    treeLayout(root);

    // 绘制连线组
    const link = g
        .append<SVGGElement>('g')
        .selectAll<SVGGElement, d3.HierarchyLink<TreeData>>('.link-group')
        .data(root.links())
        .enter()
        .append<SVGGElement>('g')
        .attr('class', 'link-group');

    const linkGenerator = createLinkGenerator(orientation);

    // 使用连线生成器创建路径
    const path = link
        .append<SVGPathElement>('path')
        .attr('class', 'link')
        .attr('stroke', (d) => linkStroke(treeContext, d.target.data))
        .attr('stroke-dasharray', (d) => linkDash(treeContext, d.target.data))
        .attr('d', linkGenerator);

    // 连线标签背景
    const labelBg = link
        .append<SVGRectElement>('rect')
        .attr('class', 'link-label-bg')
        .attr('opacity', (d) => linkLabelOpacity(treeContext, d.target.data));

    // 连线标签文字
    const labelText = link
        .append<SVGTextElement>('text')
        .attr('class', 'link-label')
        .attr('opacity', (d) => linkLabelOpacity(treeContext, d.target.data))
        .text((d) => linkLabelText(treeContext, d.target.data));

    // 关联关系连线组（置于树形连线与节点之间，不改动原有父子连线）
    const relationLink = g.append<SVGGElement>('g').attr('class', 'relation-links') as d3.Selection<
        SVGGElement,
        unknown,
        SVGGElement,
        unknown
    >;

    // 绘制节点组
    const node = g
        .append<SVGGElement>('g')
        .selectAll<SVGGElement, d3.HierarchyNode<TreeData>>('.node')
        .data(root.descendants())
        .enter()
        .append<SVGGElement>('g')
        .attr('class', 'node')
        .attr('data-id', (d) => acc.getId(d.data))
        .attr('transform', (d) => nodeTransformAttr(d, orientation));

    // 使用 foreignObject 嵌入 HTML 节点卡片
    const foMetrics = getForeignObjectMetrics(orientation);
    const fo = node
        .append('foreignObject')
        .attr('width', foMetrics.width)
        .attr('height', foMetrics.height)
        .attr('x', foMetrics.x)
        .attr('y', foMetrics.y);

    fo.append('xhtml:div')
        .attr('class', 'node-card')
        .classed('selected', (d) => isSelected(acc.getId(d.data)))
        .style('background-color', (d) => nodeLevelColor(treeContext, d.data))
        .html((d) => buildNodeCardHtml(d, treeContext))
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

    // 创建实例对象（包含拖拽状态）
    const instance: D3TreeInstance = {
        svg,
        g,
        treeLayout,
        root,
        link,
        path,
        labelBg,
        labelText,
        node,
        relationLink,
        zoom,
        currentDraggingNodeId: null,
        orientation,
        treeContext
    };

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
    //   5. 拖拽到画布边缘时自动平移画布，方便将最后一个节点拖到第一个节点
    //
    // 关键细节：d3-drag 的 .on(type, listener) 回调的 `this` 指向当前被拖拽元素
    //     但是 d3-drag v3 的类型签名是 `this: D3DragEvent`，TypeScript 会推错。
    //     这里用 `function (this: SVGGElement, ...)` + 显式类型断言规避。
    bindNodeDrag(node, instance, onDropToTarget);

    // 初始化关联关系连线
    updateRelationLinks(instance, root);

    // 初始化标签位置
    updateLinkLabels(labelBg, labelText, orientation);

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

    return instance;
}

/**
 * 拖拽开始
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 把当前被拖拽的节点提到最上层（raise()），避免拖动时被其他节点遮挡
 *   2. 记录原始 (x, y)（d3.hierarchy 输出的屏幕坐标）到 dataset
 *      后续 drag 用此 + 鼠标位置计算"累计偏移量"
 *   3. 记录当前拖拽节点 id 到实例对象（供 dragEnded 读取）
 *
 * @param instance D3TreeInstance 实例（用于存储拖拽状态，支持多实例）
 * @param d        被拖拽的 HierarchyNode
 */
/**
 * 统一获取当前节点的函数（单一数据源）
 * ----------------------------------------------------------------------------
 * 从 instance.root 中获取最新的节点信息，这是所有事件处理的唯一数据源
 *
 * @param instance - 包含 root 属性的对象
 * @param nodeId - 节点 ID
 * @returns 最新的 HierarchyNode 或 null
 * @description
 * 该函数是获取节点数据的唯一入口，确保所有事件处理都使用最新的节点数据。
 * 避免了 D3 事件快照导致的数据不一致问题。
 */
function getCurrentNode(
    instance: D3TreeInstance,
    nodeId: string
): d3.HierarchyNode<TreeData> | null {
    // 获取树的根节点
    const root = instance.root;
    // 如果根节点不存在，返回 null
    if (!root) return null;
    // 获取树上下文
    const ctx = instance.treeContext;
    // 在所有后代节点中查找指定 ID 的节点
    return root.descendants().find((n) => hNodeId(ctx, n) === nodeId) || null;
}

/**
 * 根据节点 ID 查找对应的 SVG g 元素
 * @param svg - D3 SVG selection
 * @param nodeId - 节点 ID
 * @returns SVG g 元素或 null
 * @description
 * 使用 CSS 选择器 `g.node[data-id="xxx"]` 查找节点。
 * 使用 CSS.escape() 转义特殊字符，防止选择器注入攻击。
 */
function findNodeGElementInSvg(svg: SvgSelection, nodeId: string): SVGGElement | null {
    return svg.select(`g.node[data-id="${CSS.escape(nodeId)}"]`).node() as SVGGElement | null;
}

/**
 * 从 DOM 元素解析节点 ID（优先级：DOM 属性 > 数据快照）
 * @param gEl - SVG g 元素
 * @param ctx - TreeContext（用于从数据快照获取 ID）
 * @param d - 可选的 HierarchyNode 快照数据
 * @returns 节点 ID 或 null
 * @description
 * 优先从 g 元素的 data-id 属性获取节点 ID（实时更新）。
 * 如果 data-id 不存在，从 d 参数（事件绑定时的快照）获取。
 * 防止 D3 v7 快照导致的节点 ID 过时问题。
 */
function resolveNodeIdFromElement(
    gEl: SVGGElement,
    ctx: TreeContext,
    d?: d3.HierarchyNode<TreeData>
): string | null {
    return gEl.getAttribute('data-id') || (d ? hNodeId(ctx, d) : null);
}

/**
 * 判断是否显示"整合"徽章
 * @param d - HierarchyNode
 * @param ctx - TreeContext
 * @returns 是否显示整合徽章
 * @description
 * 从节点数据获取 integratedFrom 属性（记录整合来源节点 ID 列表）。
 * 判断条件：深度 > 0（非根节点）且 integratedFrom 非空且有内容。
 */
function shouldShowIntegratedBadge(d: d3.HierarchyNode<TreeData>, ctx: TreeContext): boolean {
    const from = ctx.accessors.getIntegratedFrom(d.data as TreeNodeData);
    return (d.depth ?? 0) > 0 && !!(from && from.length > 0);
}

/**
 * 构建节点卡片的 HTML 内容
 * @param d - HierarchyNode
 * @param ctx - TreeContext
 * @returns HTML 字符串
 * @description
 * 构建节点卡片的 HTML 内容，包括：
 * - integrated-badge：整合徽章（左上角）
 * - node-label：节点名称（居中）
 * - node-badge：模块数量徽章（右上角）
 * - more-btn：更多操作按钮（右侧）
 */
function buildNodeCardHtml(d: d3.HierarchyNode<TreeData>, ctx: TreeContext): string {
    // 获取数据访问器
    const acc = ctx.accessors;
    // 获取节点数据
    const data = d.data;
    // 获取模块列表
    const modules = acc.getModules(data);
    // 构建模块数量徽章（如果有模块）
    const moduleBadge =
        modules.length > 0 ? `<div class="node-badge">${modules.length}个模块</div>` : '';
    // 获取整合来源节点 ID 列表
    const integratedFrom = acc.getIntegratedFrom(data);
    // 构建整合徽章（如果节点是由其他节点整合而来）
    const integratedBadge = shouldShowIntegratedBadge(d, ctx)
        ? `<div class="integrated-badge" title="由 ${integratedFrom!.length} 个节点整合">🔗 整合</div>`
        : '';
    // 获取节点标签和 ID
    const label = acc.getLabel(data);
    const id = acc.getId(data);
    // 拼接 HTML 模板字符串
    return `
        ${integratedBadge}
        <div class="node-label" title="${label}">${label}</div>
        ${moduleBadge}
        <button class="more-btn" data-id="${id}">⋮</button>
    `;
}

/**
 * 绑定节点拖拽事件
 * @param nodeSelection - 节点 g 元素的 D3 selection
 * @param instance - D3TreeInstance 实例（存储拖拽状态）
 * @param onDropToTarget - 命中同级节点时的回调
 * @description
 * 绑定节点的拖拽事件，包括：
 * 1. 清除旧的拖拽监听（防止 renderTree 重复绑定时事件叠加）
 * 2. 创建新的 d3.drag() 行为
 * 3. 绑定 dragstart → dragStarted：记录拖拽开始状态、创建占位符
 * 4. 绑定 drag → dragged：实时更新节点位置、画布边缘自动平移、落点检测
 * 5. 绑定 dragend → dragEnded：清除拖拽状态、判定是否触发合并
 *
 * 关键设计：
 * - 使用 instance.currentDraggingNodeId 追踪拖拽状态（支持多实例）
 * - 拖拽过程只更新视觉位置，不修改 d.x/d.y（避免污染层级数据）
 * - dragEnded 时通过 DOM 命中检测落点节点
 */
/**
 * 绑定节点拖拽事件
 * @param nodeSelection - 节点 g 元素的 D3 selection
 * @param instance - D3TreeInstance 实例（存储拖拽状态）
 * @param onDropToTarget - 命中同级节点时的回调
 * @description
 * 为节点绑定完整的拖拽事件处理链，包括：
 * 1. 清除旧的拖拽监听（防止 renderTree 重复绑定时事件叠加）
 * 2. 绑定 dragstart → dragStarted：记录拖拽开始状态、创建占位符
 * 3. 绑定 drag → dragged：实时更新节点位置、画布边缘自动平移、落点检测
 * 4. 绑定 dragend → dragEnded：清除拖拽状态、判定是否触发合并
 *
 * 关键设计：
 * - 使用 instance.currentDraggingNodeId 追踪拖拽状态（支持多实例）
 * - 拖拽过程只更新视觉位置，不修改 d.x/d.y（避免污染层级数据）
 * - dragEnded 时通过 DOM 命中检测落点节点
 */
function bindNodeDrag(
    nodeSelection: d3.Selection<
        SVGGElement,
        d3.HierarchyNode<TreeData>,
        SVGGElement,
        d3.HierarchyLink<TreeData> | null
    >,
    instance: D3TreeInstance,
    onDropToTarget: (
        sourceId: string,
        targetId: string,
        sourceData: TreeData,
        targetData: TreeData
    ) => void
) {
    // 步骤 1：清除旧拖拽监听，避免 renderTree 重复绑定导致事件叠加错乱
    nodeSelection.call(
        d3
            .drag<SVGGElement, d3.HierarchyNode<TreeData>>()
            .on('start', null)
            .on('drag', null)
            .on('end', null)
    );

    // 步骤 2：创建新的 d3.drag() 行为并绑定事件
    nodeSelection.call(
        d3
            .drag<SVGGElement, d3.HierarchyNode<TreeData>>()
            // 步骤 3：绑定 dragstart 事件
            .on('start', function (this: SVGGElement, event) {
                // 忽略点击 more-btn 的情况
                const target = event.sourceEvent?.target as HTMLElement;
                if (target?.classList.contains('more-btn')) return;

                // 解析当前节点 ID
                const nodeId = resolveNodeIdFromElement(this, instance.treeContext);
                if (!nodeId) return;

                // 获取最新的节点数据（单一数据源）
                const currentNode = getCurrentNode(instance, nodeId);
                if (!currentNode) return;

                // 调用拖拽开始处理函数
                dragStarted(instance, currentNode, this, event);
            })
            // 步骤 4：绑定 drag 事件（拖拽过程中）
            .on('drag', function (this: SVGGElement, event) {
                // 解析当前节点 ID
                const nodeId = resolveNodeIdFromElement(this, instance.treeContext);
                if (!nodeId) return;
                // 检查是否正在拖拽
                if (!instance.currentDraggingNodeId) return;
                // 调用拖拽中处理函数
                dragged(this, event, instance, instance.svg, instance.zoom);
            })
            // 步骤 5：绑定 dragend 事件（拖拽结束）
            .on('end', function (this: SVGGElement, event) {
                // 解析当前节点 ID
                const nodeId = resolveNodeIdFromElement(this, instance.treeContext);
                if (!nodeId) return;
                // 获取最新的节点数据（单一数据源）
                const currentNode = getCurrentNode(instance, nodeId);
                if (!currentNode) return;
                // 调用拖拽结束处理函数
                dragEnded(instance, event, currentNode, instance.root, onDropToTarget);
            })
    );
}

/**
 * 拖拽开始处理函数
 * @param instance - D3TreeInstance 的部分属性
 * @param d - 当前 HierarchyNode
 * @param gEl - 节点的 SVG g 元素
 * @param event - d3 drag 事件
 * @description
 * 处理拖拽开始时的初始化工作，包括：
 * 1. 参数校验：检查节点数据是否有效
 * 2. 获取节点 ID
 * 3. 将被拖拽节点提升到最上层（避免被其他节点遮挡）
 * 4. 记录原始坐标到 dataset（origX, origY）
 * 5. 设置实例级拖拽状态（currentDraggingNodeId）
 * 6. 记录节点起始屏幕坐标（nodeStartX, nodeStartY）
 * 7. 记录鼠标起始局部坐标（pointerStartX, pointerStartY）
 * 8. 禁用节点的指针事件（避免 self-hit 问题）
 * 9. 添加 dragging CSS 类
 * 10. 记录拖拽日志
 * 11. 创建占位符矩形（显示在原位置）
 *
 * 关键数据存储：
 * - dataset.origX/origY: 原始 d.x/d.y（用于拖拽结束时重置）
 * - dataset.nodeStartX/nodeStartY: 节点起始屏幕坐标（用于计算位移）
 * - dataset.pointerStartX/pointerStartY: 鼠标起始局部坐标（用于计算位移）
 */
function dragStarted(
    instance: Pick<
        D3TreeInstance,
        'currentDraggingNodeId' | 'root' | 'orientation' | 'treeContext' | 'g'
    >,
    d: d3.HierarchyNode<TreeData>,
    gEl: SVGGElement,
    event: d3.D3DragEvent<SVGGElement, d3.HierarchyNode<TreeData>, d3.HierarchyNode<TreeData>>
) {
    // 步骤 1：参数校验 - 检查节点数据是否有效
    if (!d?.data) return;

    // 获取树上下文和访问器
    const ctx = instance.treeContext;
    const acc = ctx.accessors;
    // 获取节点 ID
    const nodeId = hNodeId(ctx, d);

    // 步骤 2：将节点提升到最上层，避免拖动时被其他节点遮挡
    d3.select(gEl).raise();

    // 步骤 3：记录原始坐标（用于拖拽结束时重置节点位置）
    gEl.dataset.origX = String(Number(d.x ?? 0));
    gEl.dataset.origY = String(Number(d.y ?? 0));

    // 步骤 4：设置实例级拖拽状态，标记当前正在拖拽的节点
    instance.currentDraggingNodeId = nodeId;

    // 步骤 5：记录节点和鼠标的起始位置（用于计算位移）
    const graphG = instance.g?.node() as SVGGElement | null;
    const { tx, ty } = nodeScreenPosition(d, instance.orientation);
    gEl.dataset.nodeStartX = String(tx);
    gEl.dataset.nodeStartY = String(ty);

    // 如果存在图形容器，记录鼠标起始局部坐标
    if (graphG) {
        const { x, y } = getPointerClientXY(event.sourceEvent as MouseEvent | TouchEvent);
        const local = clientToGraphLocal(graphG, x, y);
        if (local) {
            gEl.dataset.pointerStartX = String(local.x);
            gEl.dataset.pointerStartY = String(local.y);
        }
    }

    // 步骤 6：禁用节点的指针事件，避免 elementsFromPoint 检测时被自身遮挡
    setNodePointerEvents(gEl, false);

    // 步骤 7：添加 dragging CSS 类（用于样式区分拖拽中的节点）
    gEl.classList.add('dragging');

    // 步骤 8：记录拖拽日志（便于调试和追踪）
    logDragState({
        nodeId: nodeId,
        nodeLabel: acc.getLabel(d.data),
        sourceX: d.x,
        sourceY: d.y
    });

    // 步骤 9：创建占位背景矩形（显示在原位置，提示用户节点原来的位置）
    const parentEl = gEl.parentElement;
    if (parentEl) {
        const parentG = parentEl as unknown as SVGGElement;
        // 创建占位符 g 元素
        const placeholder = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        placeholder.setAttribute('class', 'drag-placeholder');
        placeholder.setAttribute('data-target-id', nodeId);
        placeholder.setAttribute('transform', nodeTransformAttr(d, instance.orientation));

        // 创建占位矩形
        const { width, height } = getNodeDimensions(instance.orientation);
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', String(-width / 2));
        rect.setAttribute('y', String(-height / 2));
        rect.setAttribute('width', String(width));
        rect.setAttribute('height', String(height));
        rect.setAttribute('rx', '6');
        rect.setAttribute('ry', '6');
        rect.setAttribute('fill', 'rgba(140, 140, 140, 0.3)');
        rect.setAttribute('stroke', '#8c8c8c');
        rect.setAttribute('stroke-width', '2');
        rect.setAttribute('stroke-dasharray', '4,4');
        rect.setAttribute('pointer-events', 'none');

        // 添加到父容器
        placeholder.appendChild(rect);
        parentG.appendChild(placeholder);
    }
}

/**
 * 拖拽中处理函数：实时更新节点视觉位置 + 画布边缘自动平移 + 落点检测
 * @param gEl - 节点的 SVG g 元素
 * @param event - d3 drag 事件
 * @param instance - D3TreeInstance 实例
 * @param svg - D3 SVG selection
 * @param zoom - D3 zoom 行为
 * @description
 * 处理拖拽过程中的实时操作，包括：
 * 1. 参数校验：获取节点 ID 和当前节点数据
 * 2. 获取拖拽起始状态（节点起始坐标、鼠标起始坐标）
 * 3. 获取当前鼠标位置（clientX, clientY）
 * 4. 计算当前节点位置：节点起始位置 + 鼠标位移（自动适配 zoom）
 * 5. 更新节点 transform 属性（只修改视觉位置，不修改 d.x/d.y）
 * 6. 画布边缘自动平移：当鼠标靠近边缘时自动平移画布
 * 7. 清除之前的落点高亮
 * 8. 检测鼠标下方的同级节点，添加 drop-target 高亮
 *
 * 关键设计：
 * - 使用 clientToGraphLocal 映射坐标（自动适配 zoom scale/translate）
 * - 不修改 d.x/d.y，避免污染 d3.hierarchy 层级结构
 * - 边缘自动平移支持拖拽最后一个节点到第一个节点
 */
function dragged(
    gEl: SVGGElement,
    event: d3.D3DragEvent<SVGGElement, d3.HierarchyNode<TreeData>, d3.HierarchyNode<TreeData>>,
    instance: D3TreeInstance,
    svg: SvgSelection,
    zoom: d3.ZoomBehavior<SVGSVGElement, null>
) {
    // 步骤 1：参数校验 - 解析节点 ID
    const nodeId = resolveNodeIdFromElement(gEl, instance.treeContext);
    if (!nodeId) return;

    // 步骤 2：从单一数据源获取最新节点数据
    const d = getCurrentNode(instance, nodeId);
    if (!d) return;

    // 步骤 3：获取拖拽起始状态
    const graphG = instance.g?.node() as SVGGElement | null;
    const nodeStartX = Number(gEl.dataset.nodeStartX);
    const nodeStartY = Number(gEl.dataset.nodeStartY);
    const pointerStartX = Number(gEl.dataset.pointerStartX);
    const pointerStartY = Number(gEl.dataset.pointerStartY);

    // 步骤 4：获取当前鼠标位置
    const sourceEvent = event.sourceEvent as MouseEvent | TouchEvent;
    const { x: clientX, y: clientY } = getPointerClientXY(sourceEvent);

    // 步骤 5：计算当前节点位置（节点起始位置 + 鼠标位移）
    let curTX = nodeStartX;
    let curTY = nodeStartY;
    if (
        graphG &&
        Number.isFinite(nodeStartX) &&
        Number.isFinite(nodeStartY) &&
        Number.isFinite(pointerStartX) &&
        Number.isFinite(pointerStartY)
    ) {
        // 将屏幕坐标转换为图形容器局部坐标（自动适配 zoom）
        const local = clientToGraphLocal(graphG, clientX, clientY);
        if (local) {
            curTX = nodeStartX + (local.x - pointerStartX);
            curTY = nodeStartY + (local.y - pointerStartY);
        }
    }

    // 步骤 6：更新节点视觉位置（只修改 transform，不修改 d.x/d.y）
    d3.select(gEl).attr('transform', `translate(${curTX},${curTY})`);

    // 步骤 7：画布边缘自动平移
    // 边缘区域宽度（鼠标进入此区域时触发自动平移）
    const edgeMargin = 100;
    // 自动平移速度（像素/帧）
    const panSpeed = 8;

    const svgEl = svg.node();
    if (svgEl) {
        const rect = svgEl.getBoundingClientRect();
        const canvasWidth = rect.width;
        const canvasHeight = rect.height;

        // 计算鼠标在画布内的相对位置
        const relativeX = clientX - rect.left;
        const relativeY = clientY - rect.top;

        // 计算需要平移的量
        let panDX = 0;
        let panDY = 0;

        // 左边边缘：鼠标在左边时，画布向右平移（显示左边的内容）
        if (relativeX < edgeMargin) {
            panDX = panSpeed;
        }
        // 右边边缘：鼠标在右边时，画布向左平移（显示右边的内容）
        else if (relativeX > canvasWidth - edgeMargin) {
            panDX = -panSpeed;
        }

        // 顶部边缘：鼠标在顶部时，画布向下平移（显示顶部的内容）
        if (relativeY < edgeMargin) {
            panDY = panSpeed;
        }
        // 底部边缘：鼠标在底部时，画布向上平移（显示底部的内容）
        else if (relativeY > canvasHeight - edgeMargin) {
            panDY = -panSpeed;
        }

        // 如果需要平移，执行平移（10ms 过渡动画）
        if (panDX !== 0 || panDY !== 0) {
            svg.transition()
                .duration(10)
                .call(zoom.translateBy as any, panDX, panDY);
        }
    }

    // 步骤 8：清除之前的落点高亮
    clearDropTargetHighlight(svg, instance.orientation);

    // 步骤 9：检测鼠标下方的同级节点并添加高亮
    const currentRoot = instance.root;
    if (currentRoot) {
        const hit = findSameLevelNodeAtDOM(
            currentRoot,
            d,
            clientX,
            clientY,
            instance.treeContext,
            instance.orientation,
            graphG
        );
        if (hit) {
            const targetNodeEl = findNodeGElementInSvg(svg, hNodeId(instance.treeContext, hit));
            if (targetNodeEl) {
                // 添加 drop-target 类实现高亮
                targetNodeEl.classList.add('drop-target');
                // 增大 foreignObject 尺寸以显示放大效果
                const fo = targetNodeEl.querySelector(
                    'foreignObject'
                ) as SVGForeignObjectElement | null;
                if (fo) {
                    applyForeignObjectAttrs(fo, instance.orientation, 1.3);
                }
            }
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
 * @param instance       D3TreeInstance 实例（用于读取拖拽状态，支持多实例）
 * @param event          d3 drag 事件
 * @param d              源节点（被拖拽的）
 * @param root           当前 HierarchyNode 根
 * @param onDropToTarget 命中同级节点时触发的回调
 */
function dragEnded(
    instance: D3TreeInstance,
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
    const ctx = instance.treeContext;
    const acc = ctx.accessors;

    // 步骤 1：参数校验 - 如果没有有效的拖拽节点，直接返回
    if (!instance.currentDraggingNodeId) {
        return;
    }

    // 步骤 2：获取单一数据源的根节点
    const currentRoot = instance.root ?? root;

    // 步骤 3：从单一数据源获取最新节点（D3 v7 中 d 参数是绑定时的快照）
    const currentNode = getCurrentNode(instance, instance.currentDraggingNodeId);
    if (currentNode) {
        d = currentNode;
    }

    // 步骤 4：获取鼠标位置并检测落点节点
    const sourceEvent = event.sourceEvent as MouseEvent | TouchEvent;
    const { x: clientX, y: clientY } = getPointerClientXY(sourceEvent, true);

    const graphG = instance.g?.node() as SVGGElement | null;
    const hit = findSameLevelNodeAtDOM(
        currentRoot,
        d,
        clientX,
        clientY,
        ctx,
        instance.orientation,
        graphG
    );

    const svg = instance.svg;

    // 步骤 5：清除所有 drop-target 高亮
    clearDropTargetHighlight(svg, instance.orientation);

    // 步骤 6：重置被拖拽节点的状态
    const draggedId = hNodeId(ctx, d);
    const draggedG = svg ? findNodeGElementInSvg(svg, draggedId) : null;
    if (draggedG) {
        // 重置节点位置
        const latestNode = getCurrentNode(instance, draggedId) ?? d;
        const { tx: resetX, ty: resetY } = nodeScreenPosition(latestNode, instance.orientation);
        d3.select(draggedG).attr('transform', `translate(${Number(resetX)},${Number(resetY)})`);

        // 恢复指针事件
        setNodePointerEvents(draggedG, true);

        // 清除临时数据
        delete draggedG.dataset.pointerStartX;
        delete draggedG.dataset.pointerStartY;
        delete draggedG.dataset.nodeStartX;
        delete draggedG.dataset.nodeStartY;
        delete draggedG.dataset.origX;
        delete draggedG.dataset.origY;

        // 移除 dragging 类
        draggedG.classList.remove('dragging');

        // 移除占位符
        if (svg) {
            svg.select(`g.drag-placeholder[data-target-id="${CSS.escape(draggedId)}"]`).remove();
        }
    }

    // 步骤 7：清空实例级拖拽状态
    instance.currentDraggingNodeId = null;

    // 步骤 8：检查是否命中目标节点
    if (!hit) {
        return;
    }

    // 步骤 9：检查是否拖到自己身上
    if (hNodeId(ctx, hit) === draggedId) {
        return;
    }

    // 步骤 10：检查是否允许同级合并
    if (
        !ctx.canSiblingMerge({
            depth: d.depth ?? 0,
            parent: (d.parent?.data ?? null) as TreeData | null
        })
    ) {
        return;
    }

    // 步骤 11：记录拖拽结束日志
    logDragState({
        nodeId: draggedId,
        nodeLabel: acc.getLabel(d.data),
        targetNodeId: hNodeId(ctx, hit),
        targetNodeLabel: acc.getLabel(hit.data as TreeNodeData)
    });

    // 步骤 12：触发父组件合并弹框
    onDropToTarget(draggedId, hNodeId(ctx, hit), d.data, hit.data);
}

/**
 * 通过 DOM 命中查找"与源节点同级"的节点
 * 命中规则：
 *   1. DOM：elementsFromPoint + 卡片 getBoundingClientRect
 *   2. 回退：clientToGraphLocal + 同级节点卡片矩形（适配 zoom 缩放）
 *
 * @param graphG  zoom 容器 g（坐标回退时使用）
 * ----------------------------------------------------------------------------
 * 步骤：
 *   1. 参数校验：获取源节点 ID，检查有效性
 *   2. 从 root 中查找当前源节点（解决快照问题）
 *   3. 获取源节点的父节点 ID
 *   4. 使用 document.elementsFromPoint 获取鼠标下方所有元素
 *   5. 遍历元素，查找 g.node[data-id] 节点
 *   6. 精确检测：检查鼠标是否在节点卡片范围内（getBoundingClientRect）
 *   7. 验证目标节点与源节点是否同级（同一父节点）
 *   8. 如果 DOM 命中失败，调用坐标回退方法
 *
 * 关键设计：
 *   - DOM 命中优先（浏览器原生 API，精度高）
 *   - 坐标计算作为回退（适配 zoom 缩放后的场景）
 *   - 使用 closest('g.node') 处理 foreignObject 内的点击
 *
 * @param root - D3 HierarchyNode 根节点
 * @param source - 源节点（被拖拽的节点）
 * @param clientX - 鼠标 X 坐标
 * @param clientY - 鼠标 Y 坐标
 * @param ctx - TreeContext
 * @param orientation - 布局方向
 * @param graphG - zoom 容器 g（坐标回退时使用）
 * @returns 命中的同级节点或 null
 * @description
 * 使用 DOM API 检测鼠标下方的同级节点，采用两级检测策略：
 * 1. DOM 命中优先（浏览器原生 API，精度高）
 * 2. 坐标计算作为回退（适配 zoom 缩放后的场景）
 *
 * 步骤：
 * 1. 参数校验：获取源节点 ID，检查有效性
 * 2. 从 root 中查找当前源节点（解决快照问题）
 * 3. 获取源节点的父节点 ID
 * 4. 使用 document.elementsFromPoint 获取鼠标下方所有元素
 * 5. 遍历元素，查找 g.node[data-id] 节点
 * 6. 精确检测：检查鼠标是否在节点卡片范围内（getBoundingClientRect）
 * 7. 验证目标节点与源节点是否同级（同一父节点）
 * 8. 如果 DOM 命中失败，调用坐标回退方法
 */
function findSameLevelNodeAtDOM(
    root: d3.HierarchyNode<TreeData>,
    source: d3.HierarchyNode<TreeData>,
    clientX: number,
    clientY: number,
    ctx: TreeContext,
    orientation: TreeLayoutOrientation,
    graphG?: SVGGElement | null
): d3.HierarchyNode<TreeData> | null {
    // 步骤 1：参数校验 - 获取源节点 ID
    const sourceNodeId = source?.data ? hDataId(ctx, source.data) : '';
    if (!sourceNodeId) {
        return null;
    }

    // 步骤 2：从 root 中查找当前源节点（解决 D3 v7 快照问题）
    const currentSourceNode = root.descendants().find((n) => hNodeId(ctx, n) === sourceNodeId);
    if (!currentSourceNode) {
        return null;
    }

    // 步骤 3：获取源节点的父节点 ID（用于判断同级）
    const sourceParentId = currentSourceNode.parent
        ? hDataId(ctx, currentSourceNode.parent.data)
        : undefined;
    if (sourceParentId === undefined) {
        return null;
    }

    // 步骤 4：使用 DOM API 获取鼠标下方所有元素
    // 防御：elementFromPoint 在 drag 时可能返回 foreignObject 内的 div
    // 此时要通过 closest('g.node') 找父级 g.node
    const elements = document.elementsFromPoint(clientX, clientY);
    let targetId: string | null = null;

    // 步骤 5：遍历元素，查找 g.node[data-id] 节点
    for (const el of elements) {
        const nodeG = (el as Element).closest('g.node[data-id]') as SVGGElement | null;
        if (nodeG) {
            const id = nodeG.getAttribute('data-id');
            // 步骤 6：检查不能是自己（使用最新的源节点ID）
            if (id && id !== sourceNodeId) {
                // 步骤 7：精确检测 - 检查鼠标是否在节点卡片范围内
                const cardEl = nodeG.querySelector('.node-card');
                if (cardEl) {
                    const rect = cardEl.getBoundingClientRect();
                    // 检查鼠标是否在卡片范围内
                    if (
                        clientX >= rect.left &&
                        clientX <= rect.right &&
                        clientY >= rect.top &&
                        clientY <= rect.bottom
                    ) {
                        targetId = id;
                        break;
                    }
                }
            }
        }
    }

    // 步骤 8：如果通过 DOM 命中找到了目标，验证同级后返回
    if (targetId) {
        const targetNode = root.descendants().find((n) => hNodeId(ctx, n) === targetId);
        if (
            targetNode &&
            targetNode.parent &&
            hDataId(ctx, targetNode.parent.data) === sourceParentId &&
            hNodeId(ctx, targetNode) !== sourceNodeId
        ) {
            return targetNode;
        }
    }

    // 步骤 9：DOM 未命中时，用坐标计算作为回退（适配 zoom 缩放后）
    if (graphG) {
        return findSameLevelNodeByCoord(root, source, clientX, clientY, ctx, orientation, graphG);
    }
    return null;
}

/**
 * 通过坐标计算查找同级节点（DOM 命中失败时的回退）
 * @param root - D3 HierarchyNode 根节点
 * @param source - 源节点（被拖拽的节点）
 * @param clientX - 鼠标 X 坐标
 * @param clientY - 鼠标 Y 坐标
 * @param ctx - TreeContext
 * @param orientation - 布局方向
 * @param graphG - zoom 容器 g
 * @returns 命中的同级节点或 null
 * @description
 * 将 client 坐标转为 zoom 容器局部坐标，检测是否落在节点卡片矩形内。
 * 作为 DOM 命中失败时的回退方案，确保在 zoom 缩放后仍能准确检测。
 *
 * 步骤：
 * 1. 参数校验：获取源节点 ID，检查有效性
 * 2. 从 root 中查找当前源节点（解决快照问题）
 * 3. 获取源节点的父节点 ID
 * 4. 筛选所有同级节点（同一父节点且不是自己）
 * 5. 将鼠标 client 坐标转为 zoom 容器局部坐标
 * 6. 获取节点卡片尺寸（考虑布局方向）
 * 7. 遍历同级节点，检测鼠标是否落在节点卡片矩形内
 * 8. 返回命中的节点或 null
 *
 * 关键设计：
 * - 使用 clientToGraphLocal 自动适配 zoom scale/translate
 * - 矩形碰撞检测：检查鼠标是否在节点卡片范围内
 * - 作为 DOM 命中的回退方案
 */
function findSameLevelNodeByCoord(
    root: d3.HierarchyNode<TreeData>,
    source: d3.HierarchyNode<TreeData>,
    clientX: number,
    clientY: number,
    ctx: TreeContext,
    orientation: TreeLayoutOrientation,
    graphG: SVGGElement
): d3.HierarchyNode<TreeData> | null {
    // 步骤 1：参数校验 - 获取源节点 ID
    const sourceNodeId = source?.data ? hNodeId(ctx, source) : '';
    if (!sourceNodeId) {
        return null;
    }

    // 步骤 2：从 root 中查找当前源节点（解决 D3 v7 快照问题）
    const currentSourceNode = root.descendants().find((n) => hNodeId(ctx, n) === sourceNodeId);
    if (!currentSourceNode) {
        return null;
    }

    // 步骤 3：获取源节点的父节点 ID（用于判断同级）
    const sourceParentId = currentSourceNode.parent
        ? hDataId(ctx, currentSourceNode.parent.data)
        : undefined;
    if (sourceParentId === undefined) {
        return null;
    }

    // 步骤 4：筛选所有同级节点（同一父节点且不是自己）
    const siblings = root
        .descendants()
        .filter(
            (n) =>
                n.parent &&
                hDataId(ctx, n.parent.data) === sourceParentId &&
                hNodeId(ctx, n) !== sourceNodeId
        );

    if (siblings.length === 0) {
        return null;
    }

    // 步骤 5：将鼠标 client 坐标转为 zoom 容器局部坐标
    const local = clientToGraphLocal(graphG, clientX, clientY);
    if (!local) {
        return null;
    }

    // 步骤 6：获取节点卡片尺寸（考虑布局方向）
    const { width, height } = getNodeDimensions(orientation);
    const halfW = width / 2;
    const halfH = height / 2;

    // 步骤 7：遍历同级节点，检测鼠标是否落在节点卡片矩形内
    for (const node of siblings) {
        const { tx, ty } = nodeScreenPosition(node, orientation);
        // 矩形碰撞检测
        if (
            local.x >= tx - halfW &&
            local.x <= tx + halfW &&
            local.y >= ty - halfH &&
            local.y <= ty + halfH
        ) {
            return node;
        }
    }

    // 步骤 8：未命中任何节点
    return null;
}

/**
 * 清除所有节点的 drop-target 高亮 class
 * @param svg - D3 SVG selection（可选，用于限定清除范围）
 * @param orientation - 树布局方向（用于恢复 foreignObject 属性）
 * @description
 * 清除所有节点的拖拽落点高亮状态，包括：
 * 1. 移除 drop-target CSS 类（取消高亮样式）
 * 2. 恢复 foreignObject 元素的原始尺寸（如果之前被放大）
 *
 * 该函数在拖拽过程中被频繁调用，用于清除之前的落点高亮，
 * 确保只有当前鼠标下方的同级节点才会显示高亮。
 */
function clearDropTargetHighlight(
    svg?: SvgSelection,
    orientation: TreeLayoutOrientation = 'horizontal'
) {
    // 步骤 1：选择所有带有 drop-target 类的节点
    // 如果提供了 svg selection，则在其范围内查找；否则全局查找
    const highlighted = svg
        ? svg.selectAll('g.node.drop-target')
        : d3.selectAll('g.node.drop-target');

    // 步骤 2：遍历每个高亮节点
    highlighted.each(function () {
        const el = this as SVGGElement;
        // 步骤 3：移除 drop-target 类，取消高亮样式
        el.classList.remove('drop-target');

        // 步骤 4：恢复 foreignObject 元素的原始尺寸
        const fo = el.querySelector('foreignObject') as SVGForeignObjectElement | null;
        if (fo) {
            // fo.setAttribute('width', String(NODE_WIDTH));
            // fo.setAttribute('height', String(NODE_HEIGHT));
            // fo.setAttribute('x', String(-NODE_WIDTH / 2));
            // fo.setAttribute('y', String(-NODE_HEIGHT / 2));
            // 使用 applyForeignObjectAttrs 恢复到默认尺寸
            applyForeignObjectAttrs(fo, orientation);
        }
    });
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
export function updateLinks(
    path: PathSelection,
    labelBg: RectSelection,
    labelText: TextSelection,
    orientation: TreeLayoutOrientation = 'horizontal'
) {
    path.attr('d', createLinkGenerator(orientation));
    updateLinkLabels(labelBg, labelText, orientation);
}

/**
 * 更新连线上的标签（背景框 + 文字）位置
 * @param labelBg - 标签背景 selection
 * @param labelText - 标签文字 selection
 * @param orientation - 树布局方向
 * @description
 * 更新所有连线上标签的位置，确保标签始终显示在连线的中点位置。
 *
 * 步骤：
 * 1. 计算每条连线中点 = (源点 + 目标点) / 2
 * 2. 标签背景框定位到中点（rect 居中显示，宽 50px，高 20px）
 * 3. 标签文字定位到中点（文字垂直水平居中）
 */
export function updateLinkLabels(
    labelBg: RectSelection,
    labelText: TextSelection,
    orientation: TreeLayoutOrientation = 'horizontal'
) {
    // 步骤 1：更新标签背景框位置
    // 背景框宽 50px，高 20px，所以 x 偏移 -25，y 偏移 -10 使其居中
    labelBg
        .attr('x', (d) => linkLabelMidpoint(d, orientation).x - 25)
        .attr('y', (d) => linkLabelMidpoint(d, orientation).y - 10)
        .attr('width', 50)
        .attr('height', 20);

    // 步骤 2：更新标签文字位置（文字锚点已设置为居中）
    labelText
        .attr('x', (d) => linkLabelMidpoint(d, orientation).x)
        .attr('y', (d) => linkLabelMidpoint(d, orientation).y);
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
 * @param instance - D3TreeInstance 实例
 * @param treeData - 树形数据
 * @param onNodeClick - 节点单击回调
 * @param onNodeDoubleClick - 节点双击回调
 * @param onMoreClick - 更多按钮点击回调
 * @param isSelected - 判断节点是否选中的函数
 * @param onDropToTarget - 拖拽到目标节点时的回调（可选）
 * @returns 更新后的根节点
 * @description
 * 重新渲染整个树形图，处理数据变化后的节点和连线更新。
 * 使用 D3 的 join() 模式正确处理 enter/update/exit 三个阶段。
 *
 * 步骤：
 * 1. d3.hierarchy(treeData) 重新构建层次结构并执行 treeLayout 计算
 * 2. 使用 join() 绑定连线数据（处理新增、更新、删除）
 * 3. 使用 join() 绑定节点数据（处理新增、更新、删除）
 * 4. 重新绑定节点点击事件和更多按钮事件
 * 5. 更新 instance.root（关键修复：确保拖拽事件使用最新层级结构）
 * 6. 重新绑定拖拽事件（如果提供了 onDropToTarget）
 * 7. 更新关联关系连线
 */
export function renderTree(
    instance: D3TreeInstance,
    treeData: TreeData,
    onNodeClick: (data: TreeData) => void,
    onNodeDoubleClick: (data: TreeData) => void,
    onMoreClick: (event: MouseEvent, nodeId: string) => void,
    isSelected: (nodeId: string) => boolean,
    onDropToTarget?: (
        sourceId: string,
        targetId: string,
        sourceData: TreeData,
        targetData: TreeData
    ) => void
): d3.HierarchyNode<TreeData> {
    // 获取实例属性
    const { treeLayout, link, node } = instance;
    const orientation = instance.orientation ?? 'horizontal';
    const ctx = instance.treeContext;
    const acc = ctx.accessors;

    // 步骤 1：重新计算布局
    const root = d3.hierarchy(treeData, (d) => acc.hierarchyChildren(d) as TreeData[] | undefined);
    treeLayout(root);

    // 步骤 2：准备连线数据
    const linkData = root.links();
    const linkGenerator = createLinkGenerator(orientation);
    const getLabelX = (d: d3.HierarchyLink<TreeData>) => linkLabelMidpoint(d, orientation).x;
    const getLabelY = (d: d3.HierarchyLink<TreeData>) => linkLabelMidpoint(d, orientation).y;

    // 步骤 3：使用 join() 处理连线的 enter/update/exit
    const linkUpdate = link
        .data(linkData, (d) => `${hNodeId(ctx, d.source)}__${hNodeId(ctx, d.target)}`)
        .join(
            // enter: 创建新的连线组
            (enter) => {
                const linkGroup = enter.append('g').attr('class', 'link-group');

                // 添加路径
                linkGroup
                    .append('path')
                    .attr('class', 'link')
                    .attr('d', linkGenerator)
                    .attr('stroke', (d) => linkStroke(ctx, d.target.data))
                    .attr('stroke-dasharray', (d) => linkDash(ctx, d.target.data));

                // 添加标签背景
                linkGroup
                    .append('rect')
                    .attr('class', 'link-label-bg')
                    .attr('x', (d) => getLabelX(d) - 25)
                    .attr('y', (d) => getLabelY(d) - 10)
                    .attr('width', 50)
                    .attr('height', 20)
                    .attr('opacity', (d) => linkLabelOpacity(ctx, d.target.data));

                // 添加标签文字
                linkGroup
                    .append('text')
                    .attr('class', 'link-label')
                    .attr('x', getLabelX)
                    .attr('y', getLabelY)
                    .attr('opacity', (d) => linkLabelOpacity(ctx, d.target.data))
                    .text((d) => linkLabelText(ctx, d.target.data));

                return linkGroup;
            },
            // update: 更新现有连线
            (update) => {
                update
                    .select('path')
                    .attr('d', linkGenerator)
                    .attr('stroke', (d) => linkStroke(ctx, d.target.data))
                    .attr('stroke-dasharray', (d) => linkDash(ctx, d.target.data));

                update
                    .select('.link-label-bg')
                    .attr('x', (d) => getLabelX(d) - 25)
                    .attr('y', (d) => getLabelY(d) - 10)
                    .attr('opacity', (d) => linkLabelOpacity(ctx, d.target.data));

                update
                    .select('.link-label')
                    .attr('x', getLabelX)
                    .attr('y', getLabelY)
                    .attr('opacity', (d) => linkLabelOpacity(ctx, d.target.data))
                    .text((d) => linkLabelText(ctx, d.target.data));

                return update;
            },
            // exit: 移除多余连线
            (exit) => exit.remove()
        );

    // 更新实例中的 link selection
    instance.link = linkUpdate;

    // 步骤 4：准备节点数据
    const nodeData = root.descendants();

    // 步骤 5：使用 join() 处理节点的 enter/update/exit
    const nodeUpdate = node
        .data(nodeData, (d) => hNodeId(ctx, d))
        .join(
            // enter: 创建新节点
            (enter) => {
                const nodeGroup = enter
                    .append('g')
                    .attr('class', 'node')
                    .attr('data-id', (d) => hNodeId(ctx, d))
                    .attr('transform', (d) => nodeTransformAttr(d, orientation));

                const enterFoMetrics = getForeignObjectMetrics(orientation);
                nodeGroup
                    .append('foreignObject')
                    .attr('width', enterFoMetrics.width)
                    .attr('height', enterFoMetrics.height)
                    .attr('x', enterFoMetrics.x)
                    .attr('y', enterFoMetrics.y)
                    .append('xhtml:div')
                    .attr('class', 'node-card')
                    .classed('vertical', orientation === 'vertical')
                    .style('background-color', (d) => nodeLevelColor(ctx, d.data))
                    .html((d) => buildNodeCardHtml(d, ctx));

                return nodeGroup;
            },
            // update: 更新现有节点
            (update) => {
                update
                    .attr('data-id', (d) => hNodeId(ctx, d))
                    .attr('transform', function (d) {
                        const el = this as SVGGElement;
                        const fallback = nodeTransformAttr(d, orientation);
                        // 如果节点正在拖拽中，保持当前 transform
                        if (el.classList.contains('dragging')) {
                            return el.getAttribute('transform') || fallback;
                        }
                        return fallback;
                    });

                const updateFoMetrics = getForeignObjectMetrics(orientation);
                update
                    .select('foreignObject')
                    .attr('width', updateFoMetrics.width)
                    .attr('height', updateFoMetrics.height)
                    .attr('x', updateFoMetrics.x)
                    .attr('y', updateFoMetrics.y);

                update
                    .select('.node-card')
                    .style('background-color', (d) => nodeLevelColor(ctx, d.data))
                    .classed('selected', (d) => isSelected(hNodeId(ctx, d)))
                    .classed('vertical', orientation === 'vertical')
                    .html((d) => buildNodeCardHtml(d, ctx));

                return update;
            },
            // exit: 移除多余节点
            (exit) => exit.remove()
        );

    // 更新实例中的 node selection
    instance.node = nodeUpdate;

    // 步骤 6：重新绑定节点点击事件
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

    // 步骤 7：重新绑定"更多"按钮事件
    nodeUpdate.selectAll('.more-btn').on('click', function (event) {
        event.stopPropagation();
        const nodeId = d3.select(this).attr('data-id');
        if (nodeId) {
            onMoreClick(event as MouseEvent, nodeId);
        }
    });

    // 步骤 8：关键修复 - 在重新绑定拖拽事件之前更新 instance.root
    // 确保拖拽事件使用最新的层级结构
    instance.root = root;

    // 步骤 9：重新绑定拖拽事件（如果提供了回调）
    if (onDropToTarget) {
        bindNodeDrag(nodeUpdate, instance, onDropToTarget);
    }

    // 步骤 10：更新关联关系连线（独立图层）
    updateRelationLinks(instance, root);

    return root;
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
    // 步骤 1：获取 g 元素（内部所有节点）的 bbox 包围盒
    const gNode = g.node();
    if (!gNode) return;

    const bounds = gNode.getBBox();

    // 步骤 2：计算缩放比例 = 0.9 / max(包围盒宽/视口宽, 包围盒高/视口高)
    // 步骤 3：限制 scale 最大为 1（避免图被意外放大）
    //   - 如果图比视口小（rawScale > 1）→ 保持 scale = 1
    //   - 如果图比视口大（rawScale < 1）→ 缩小到 90% 视口
    const rawScale = 0.9 / Math.max(bounds.width / width, bounds.height / height);
    const scale = Math.min(rawScale, 1);
    const finalScale = scale > 0.95 ? 1 : scale;

    // 步骤 4：计算平移量 = 让包围盒居中显示
    const translate = [
        width / 2 - finalScale * (bounds.x + bounds.width / 2),
        height / 2 - finalScale * (bounds.y + bounds.height / 2)
    ];

    // 步骤 5：用 d3.zoomIdentity.translate().scale() 构造目标 transform
    const targetTransform = d3.zoomIdentity.translate(translate[0], translate[1]).scale(finalScale);

    // 步骤 6：同步调用 zoom.transform 应用 transform（不使用 transition）
    // 步骤 7：zoom 监听器自动更新 g 的 transform
    if (zoom) {
        // 方式 1：使用传入的 zoom 行为（推荐）- 同步生效
        svg.call(zoom.transform as any, targetTransform);
    } else {
        // 方式 2：直接读取 svg 上已绑定的 zoom
        const existingZoom = d3.zoom<SVGSVGElement, null>().transform as any;
        svg.call(existingZoom, targetTransform);
    }
}

/**
 * 获取树形图的包围盒
 * ----------------------------------------------------------------------------
 * 遍历所有节点，找到最左、最右、最上、最下的节点，计算树的边界
 *
 * @param root - D3 HierarchyNode 根节点
 * @returns 包围盒对象 { left, right, top, bottom }
 */
function getTreeBox(root: d3.HierarchyNode<TreeData>) {
    let box = {
        left: root,
        right: root,
        top: root,
        bottom: root
    };
    root.eachBefore((node) => {
        if ((node.x ?? 0) < (box.left.x ?? 0)) {
            box.left = node;
        }
        if ((node.x ?? 0) > (box.right.x ?? 0)) {
            box.right = node;
        }
        if ((node.y ?? 0) < (box.top.y ?? 0)) {
            box.top = node;
        }
        if ((node.y ?? 0) > (box.bottom.y ?? 0)) {
            box.bottom = node;
        }
    });
    return box;
}

/**
 * 获取 SVG 字符串（包含内联 CSS 样式）
 * ----------------------------------------------------------------------------
 * 借鉴 org-tree-lib 的实现：
 *   1. 克隆 SVG 节点
 *   2. 添加白色背景矩形
 *   3. 设置固定宽高
 *   4. 调整 g 元素的 transform（居中显示）
 *   5. 提取并内联相关 CSS 样式
 *   6. 序列化为字符串
 *
 * @param svgNodeOri - 原始 SVG DOM 节点
 * @param baseTranslate - 居中平移量 [x, y]
 * @param options    - 配置选项 { width, height, nodeWidth, margin }
 * @returns SVG 字符串
 */
function getSVGString(
    svgNodeOri: SVGSVGElement,
    baseTranslate: [number, number],
    options: { width: number; height: number; nodeWidth: number; margin: typeof MARGIN }
) {
    const { width, height, margin } = options;
    const svgNode = svgNodeOri.cloneNode(true) as SVGSVGElement;

    // 设置命名空间
    svgNode.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
    svgNode.setAttribute('width', String(width));
    svgNode.setAttribute('height', String(height));

    // 移除可能导致布局问题的属性
    svgNode.removeAttribute('viewBox');
    svgNode.removeAttribute('preserveAspectRatio');

    // 添加白色背景矩形（在最前面）
    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('x', '0');
    bgRect.setAttribute('y', '0');
    bgRect.setAttribute('width', String(width));
    bgRect.setAttribute('height', String(height));
    bgRect.setAttribute('fill', '#ffffff');
    svgNode.insertBefore(bgRect, svgNode.firstChild);

    // 调整 g 元素的 transform，使用 baseTranslate 居中
    const gEl = svgNode.querySelector('g');
    if (gEl) {
        // 清除原始的 transform（来自 zoom 操作）
        gEl.removeAttribute('transform');
        // 设置新的居中 transform
        gEl.setAttribute('transform', `translate(${baseTranslate[0]}, ${baseTranslate[1]})`);
    }

    // 提取并内联 CSS 样式
    const cssStyleText = getCSSStyles(svgNode);
    appendCSS(cssStyleText, svgNode);

    // 序列化为字符串
    const serializer = new XMLSerializer();
    return serializer.serializeToString(svgNode);

    /**
     * 提取相关 CSS 样式文本
     */
    function getCSSStyles(parentElement: Element) {
        const selectorTextArr: string[] = [];

        // 添加父元素的 ID 和类名
        if (parentElement.id) {
            selectorTextArr.push('#' + parentElement.id);
        }
        for (let c = 0; c < parentElement.classList.length; c++) {
            const className = '.' + parentElement.classList[c];
            if (!selectorTextArr.includes(className)) {
                selectorTextArr.push(className);
            }
        }

        // 添加子元素的 ID 和类名
        const nodes = parentElement.getElementsByTagName('*');
        for (let i = 0; i < nodes.length; i++) {
            const id = nodes[i].id;
            if (id && !selectorTextArr.includes('#' + id)) {
                selectorTextArr.push('#' + id);
            }

            const classes = nodes[i].classList;
            for (let c = 0; c < classes.length; c++) {
                const className = '.' + classes[c];
                if (!selectorTextArr.includes(className)) {
                    selectorTextArr.push(className);
                }
            }
        }

        // 提取 CSS 规则
        let extractedCSSText = '';
        for (let i = 0; i < document.styleSheets.length; i++) {
            const s = document.styleSheets[i];
            try {
                if (!s.cssRules) continue;
            } catch (e) {
                if ((e as Error).name !== 'SecurityError') {
                    throw e;
                }
                continue;
            }

            const cssRules = s.cssRules;
            for (let r = 0; r < cssRules.length; r++) {
                const rule = cssRules[r] as CSSRule;
                if (rule.type === CSSRule.STYLE_RULE) {
                    const styleRule = rule as CSSStyleRule;
                    // 检查选择器是否与 SVG 中的元素相关
                    const selectorText = styleRule.selectorText;
                    if (selectorText && selectorTextArr.some((sel) => selectorText.includes(sel))) {
                        extractedCSSText += styleRule.cssText + '\n';
                    }
                }
            }
        }

        return extractedCSSText;
    }

    /**
     * 将 CSS 样式内联到 SVG 中
     */
    function appendCSS(cssText: string, element: SVGSVGElement) {
        if (!cssText) return;
        const styleElement = document.createElementNS('http://www.w3.org/2000/svg', 'style');
        styleElement.setAttribute('type', 'text/css');
        styleElement.textContent = cssText;
        const refNode = element.hasChildNodes() ? element.children[0] : null;
        element.insertBefore(styleElement, refNode);
    }
}

/**
 * 将 SVG 字符串转换为图片
 * ----------------------------------------------------------------------------
 * 借鉴 org-tree-lib 的实现：
 *   1. 将 SVG 字符串编码为 base64 数据 URL
 *   2. 创建 canvas 元素
 *   3. 创建 Image 对象，加载 SVG
 *   4. 在 canvas 上绘制图片
 *   5. 用 canvas.toBlob 导出为 PNG Blob
 *
 * @param svgString - SVG 字符串
 * @param width     - 图片宽度
 * @param height    - 图片高度
 * @param format    - 图片格式（默认 'png'）
 * @returns Promise<Blob> - 图片 Blob 对象
 */
function svgString2Image(
    svgString: string,
    width: number,
    height: number,
    format: string = 'png'
): Promise<Blob> {
    const { promise, resolve, reject } = createPromise<Blob>();

    // 将 SVG 字符串编码为 base64 数据 URL
    const imgsrc = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
        reject(new Error('[svgString2Image] Failed to get canvas context'));
        return promise;
    }

    canvas.width = width;
    canvas.height = height;

    const image = new Image();
    image.onload = function () {
        // 先填充白色背景
        context.fillStyle = '#FFF';
        context.fillRect(0, 0, width, height);
        // 然后绘制 SVG 图像
        context.drawImage(image, 0, 0, width, height);

        canvas.toBlob(function (blob) {
            if (blob) {
                resolve(blob);
            } else {
                reject(new Error('[svgString2Image] Failed to create blob'));
            }
        }, `image/${format}`);
    };

    image.onerror = function () {
        reject(new Error('[svgString2Image] Failed to load image'));
    };

    image.src = imgsrc;

    return promise;
}

/**
 * 计算下载所需的平移和尺寸
 * ----------------------------------------------------------------------------
 * 借鉴 org-tree-lib 的 calculateDownloadTranslate 实现
 * 使用实际渲染的 DOM 尺寸（而非 D3 节点坐标）
 *
 * @param svg       - SVG 元素（用于获取实际渲染的 bounding box）
 * @param elemWidth - 容器宽度
 * @returns { width, height, baseTranslate }
 */
function calculateDownloadTranslate0(svg: SvgSelection, elemWidth: number) {
    const svgNode = svg.node();
    if (!svgNode) {
        return { width: elemWidth, height: 800, baseTranslate: [0, MARGIN.top] };
    }

    // 获取实际渲染的 g 元素的 bounding box
    const gEl = svgNode.querySelector('g');
    if (!gEl) {
        return { width: elemWidth, height: 800, baseTranslate: [0, MARGIN.top] };
    }

    const bounds = gEl.getBBox();

    // 使用实际渲染的尺寸（确保覆盖所有内容）
    const width = Math.max(bounds.width + MARGIN.left + MARGIN.right, elemWidth);
    const height = Math.max(bounds.height + MARGIN.top + MARGIN.bottom, 800);
    // 使用实际渲染的尺寸（正好包裹内容，不留多余空白）
    // const width = bounds.width + MARGIN.left + MARGIN.right;
    // const height = bounds.height + MARGIN.top + MARGIN.bottom;

    // 计算平移量：让内容从左上角开始（带 margin）
    // transX = 左边距 - bounds.x（把内容左边界移到左边距位置）
    // transY = 上边距 - bounds.y（把内容上边界移到上边距位置）
    const transX = MARGIN.left - bounds.x;
    const transY = MARGIN.top - bounds.y;
    const baseTranslate = [transX, transY];

    console.log('[calculateDownloadTranslate] bounds:', bounds);
    console.log('[calculateDownloadTranslate] calculated:', { width, height, baseTranslate });

    return { width, height, baseTranslate };
}
function calculateDownloadTranslate(svg: SvgSelection, elemWidth: number) {
    const svgNode = svg.node();
    if (!svgNode) {
        return { width: elemWidth, height: 800, baseTranslate: [0, MARGIN.top] };
    }

    // 获取实际渲染的 g 元素
    const gEl = svgNode.querySelector('g');
    if (!gEl) {
        return { width: elemWidth, height: 800, baseTranslate: [0, MARGIN.top] };
    }

    // 保存原始 transform（来自 zoom 操作）
    const originalTransform = gEl.getAttribute('transform');

    // 临时移除 transform 以获取准确的 bounds（不受缩放和平移影响）
    gEl.removeAttribute('transform');
    const bounds = gEl.getBBox();

    // 恢复原始 transform
    if (originalTransform) {
        gEl.setAttribute('transform', originalTransform);
    }

    console.log('[calculateDownloadTranslate] bounds:', bounds);

    // 图片宽度 = 内容宽度 + 边距，至少为容器宽度
    const width = Math.max(bounds.width + MARGIN.left + MARGIN.right, elemWidth);
    // 图片高度 = 内容高度 + 边距，至少为最小高度
    const height = Math.max(bounds.height + MARGIN.top + MARGIN.bottom, 800);

    // 计算平移量：让内容居中显示
    const transX = MARGIN.left - bounds.x;
    const transY = MARGIN.top - bounds.y;
    const baseTranslate = [transX, transY];

    console.log('[calculateDownloadTranslate] calculated:', { width, height, baseTranslate });

    return { width, height, baseTranslate };
}

/**
 * 下载树形图
 * ----------------------------------------------------------------------------
 * 借鉴 org-tree-lib 的 download 实现：
 *   1. 计算下载所需的尺寸和平移
 *   2. 获取 SVG 字符串（包含内联样式）
 *   3. 根据格式转换为 PNG 或直接下载 SVG
 *
 * @param svg      - D3 选中的 SVG 元素
 * @param root     - D3 HierarchyNode 根节点
 * @param elemWidth - 容器宽度
 * @param name     - 文件名（默认 'tree-diagram'）
 * @param format   - 下载格式：'png' 或 'svg'（默认 'png'）
 */
export async function downloadTree(
    svg: SvgSelection,
    root: d3.HierarchyNode<TreeData>,
    elemWidth: number,
    name: string = 'tree-diagram',
    format: 'png' | 'svg' = 'png'
) {
    try {
        const svgNode = svg.node();
        if (!svgNode) {
            console.warn('[downloadTree] SVG element not found');
            return;
        }

        // 计算下载尺寸和偏移（使用实际渲染的 DOM 尺寸）
        const { width, height, baseTranslate } = calculateDownloadTranslate(svg, elemWidth);
        console.log('[downloadTree] dimensions:', { width, height, baseTranslate });

        // 获取 SVG 字符串（包含内联 CSS）
        const svgString = getSVGString(svgNode, baseTranslate as [number, number], {
            width,
            height,
            nodeWidth: NODE_WIDTH,
            margin: MARGIN
        });
        console.log('[downloadTree] svgString length:', svgString.length);

        if (format === 'svg') {
            // 下载 SVG 文件
            console.log('[downloadTree] downloading SVG:', `${name}.svg`);
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            saveAs(blob, `${name}.svg`, true);
            console.log('[downloadTree] SVG saveAs called');
        } else {
            // 转换为 PNG 图片并下载
            console.log('[downloadTree] converting to blob...');
            const blob = await svgString2Image(svgString, width, height, 'png');
            console.log('[downloadTree] blob created:', blob.size, 'bytes');

            // 下载
            console.log('[downloadTree] calling saveAs:', `${name}.png`);

            // 使用 file-saver 的 saveAs 方法，第三个参数 true 表示强制下载（创建 object URL）
            saveAs(blob, `${name}.png`, true);
            console.log('[downloadTree] PNG saveAs called');
        }
    } catch (e) {
        console.error('[downloadTree] error:', e);
        throw e; // 重新抛出错误让调用者知道
    }
}
