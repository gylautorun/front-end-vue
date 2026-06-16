/**
 * D3TreeGraph.ts - D3 树形图 SDK 主类
 * =============================================================================
 * 本文件负责：
 * 1. 封装 D3 树形图的创建、渲染、销毁等生命周期
 * 2. 提供事件系统供外部监听
 * 3. 提供数据操作和视图更新的接口
 * 4. 管理历史记录（撤销/重做）
 *
 * 核心概念：
 * - 实例化：通过 new D3TreeGraph(options) 创建实例
 * - 挂载：通过 mount() 方法将树渲染到 DOM
 * - 事件：通过 on() 方法监听各种事件
 * - 数据变更：通过 mutateData() + commit() 修改数据
 *
 * 为什么需要 D3TreeGraph？
 * D3.js 的 API 比较底层，直接使用会比较繁琐。
 * D3TreeGraph 封装了：
 * - D3 tree layout 的创建和更新
 * - DOM 元素的创建和更新
 * - 拖拽事件的处理
 * - 缩放平移的控制
 * - 历史记录的管理
 *
 * 使用示例：
 * ```ts
 * // 1. 定义 schema
 * const schema = defineTreeConfig({
 *   rootId: 'edu',
 *   fields: { id: 'nodeId', label: 'title', children: 'subNodes' }
 * });
 *
 * // 2. 创建实例
 * const graph = new D3TreeGraph({
 *   container: '#graph',
 *   data: treeData,
 *   schema
 * });
 *
 * // 3. 挂载
 * graph.mount();
 *
 * // 4. 监听事件
 * graph.on('node:click', (node) => console.log('点击', node));
 *
 * // 5. 修改数据
 * const ctx = graph.getContext();
 * ctx.addChildNode(graph.mutateData(), { parentId: 'root', name: '新节点', level: 'domain', integrationType: 'base' });
 * graph.commit();
 *
 * // 6. 销毁
 * graph.destroy();
 * ```
 */

// ============================================================================
// 依赖导入
// ============================================================================
import { cloneDeep } from 'lodash-es';
import type { TreeData, SelectedNode } from './types';
import { EventEmitter } from './EventEmitter';
import { HistoryStack } from './HistoryStack';
import { TreeContext } from './TreeContext';
import type { TreeConfigInput } from './schema/TreeConfig';
import type { TreeNodeData } from './schema/TreeAccessors';
import {
    initD3,
    renderTree,
    zoomIn,
    zoomOut,
    fitView,
    resetZoom,
    downloadTree,
    setTreeOrientation,
    type D3TreeInstance,
    type TreeLayoutOrientation
} from './core/d3Tree';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * SDK 实例化选项
 */
export interface D3TreeGraphOptions {
    /**
     * 容器元素或元素id选择器
     * @example
     * container: '#graph'        // 选择器
     * container: document.getElementById('graph')  // HTMLElement
     */
    container: string | HTMLElement;

    /**
     * 初始树数据
     * @description 字段名由 schema 配置决定，SDK 不假设固定结构
     */
    data: TreeData;

    /**
     * 数据结构配置
     * @description 对接自有数据时通过参数传入
     * 包含 fields（id/children/modules…）、selection、styles、rootId 等
     *
     * @example
     * schema: {
     *   rootId: 'root',
     *   fields: { id: 'nodeId', label: 'title', children: 'subNodes' },
     *   selection: { parentId: 'pid' },
     *   defaults: { dept: '默认单位' }
     * }
     */
    schema?: TreeConfigInput;

    /** @deprecated 请使用 schema */
    treeConfig?: TreeConfigInput;

    /** 是否启用撤销/重做，默认 true */
    enableHistory?: boolean;

    /** 受保护的根节点 id；也可在 schema.protectedRootId 中配置 */
    protectedRootId?: string;
}

/**
 * 设置数据选项
 */
export interface SetDataOptions {
    /** 是否写入历史栈，默认 false */
    recordHistory?: boolean;
}

/**
 * SDK 事件地图
 * ----------------------------------------------------------------------------
 * 定义所有可监听的事件及其 payload 类型。
 *
 * @example
 * graph.on('node:click', (node) => {
 *   console.log(node);  // node 类型为 TreeData
 * });
 *
 * graph.on('data:change', (data) => {
 *   console.log(data);  // data 类型为 TreeData
 * });
 */
export type D3TreeGraphEventMap = {
    /** 节点单击事件 */
    'node:click': TreeData;
    /** 节点双击事件 */
    'node:dblclick': TreeData;
    /** 展开/收起按钮点击事件 */
    'node:expand': string;
    /** 更多按钮点击事件 */
    'node:more': { event: MouseEvent; nodeId: string };
    /** 节点拖拽放置事件 */
    'node:drop-target': {
        sourceId: string;
        targetId: string;
        sourceData: TreeData;
        targetData: TreeData;
    };
    /** SVG 点击事件（空白区域） */
    'svg:click': void;
    /** 数据变更事件 */
    'data:change': TreeData;
    /** 历史状态变更事件 */
    'history:change': ReturnType<HistoryStack['getState']>;
    /** 布局方向变更事件 */
    'orientation:change': TreeLayoutOrientation;
    /** 实例销毁事件 */
    destroy: void;
};

// ============================================================================
// D3TreeGraph 类
// ============================================================================

/**
 * D3 树形图 SDK（框架无关）
 * ----------------------------------------------------------------------------
 * 可在 Vue2 / Vue3 / React / 原生 JS 中使用。
 *
 * 设计原则：
 * 1. **框架无关**：不依赖任何前端框架，纯 TypeScript 实现
 * 2. **配置驱动**：通过 schema 参数适配不同的数据结构
 * 3. **单向数据流**：数据变更通过 mutateData() + commit()
 * 4. **事件驱动**：所有操作都通过事件通知外部
 *
 * @example
 * // Vue 3 中使用
 * import { D3TreeGraph, defineTreeConfig } from '@/lib/d3-tree-sdk';
 * const schema = defineTreeConfig({
 *   fields: { id: 'nodeId', label: 'name', children: 'subNodes' }
 * });
 * const graph = new D3TreeGraph({
 *   container: graphRef.value,
 *   data: treeData,
 *   schema: defineTreeConfig({ rootId: 'edu' })
 * });
 * graph.mount();
 * graph.on('node:click', (node) => console.log(node));
 * onUnmounted(() => graph.destroy());
 *
 * @example
 * // React 中使用
 * useEffect(() => {
 *   const graph = new D3TreeGraph({ container: ref.current, data, schema });
 *   graph.mount();
 *   return () => graph.destroy();
 * }, []);
 */
export class D3TreeGraph {
    /**
     * 事件发射器
     * @description 用于触发和监听事件
     */
    readonly events = new EventEmitter();

    // =========================================================================
    // 私有属性
    // =========================================================================

    /** 容器 DOM 元素 */
    private containerEl: HTMLElement;

    /** 容器 ID */
    private containerId: string;

    /** 当前树数据 */
    private data: TreeData;

    /** 初始数据（用于刷新） */
    private initialData: TreeData;

    /** D3 实例引用 */
    private instance: D3TreeInstance | null = null;

    /** 历史记录栈 */
    private history: HistoryStack;

    /** 是否启用历史记录 */
    private enableHistory: boolean;

    /** 受保护根节点 ID */
    private protectedRootId?: string;

    /** 树操作上下文 */
    readonly treeContext: TreeContext;

    /** 当前选中的节点 ID 集合 */
    private selectedNodeIds = new Set<string>();

    /** 是否已挂载 */
    private mounted = false;

    /** SVG 点击事件处理器（用于转发） */
    private svgClickHandler = () => this.events.emit('svg:click');

    /** 窗口 resize 事件处理器 */
    private resizeHandler = () => this.handleResize();

    // =========================================================================
    // 构造函数
    // =========================================================================

    /**
     * 构造函数
     * ----------------------------------------------------------------------------
     * @param options - 实例化选项
     *
     * @description
     * 解析配置，创建 TreeContext 和 HistoryStack。
     * 不执行 DOM 操作，挂载需调用 mount()。
     */
    constructor(options: D3TreeGraphOptions) {
        // 解析容器
        this.containerEl = this.resolveContainer(options.container);
        this.containerId = this.ensureContainerId(this.containerEl);

        // 保存数据
        this.data = cloneDeep(options.data);
        this.initialData = cloneDeep(options.data);

        // 历史记录配置
        this.enableHistory = options.enableHistory !== false;

        // 创建树上下文
        this.treeContext = new TreeContext({
            ...(options.schema ?? options.treeConfig),
            protectedRootId:
                options.protectedRootId ??
                options.schema?.protectedRootId ??
                options.treeConfig?.protectedRootId
        });

        // 获取受保护根节点 ID
        this.protectedRootId = this.treeContext.getProtectedRootId(this.data);

        // 初始化历史记录
        this.history = new HistoryStack(this.data);
    }

    // =========================================================================
    // 生命周期方法
    // =========================================================================

    /**
     * 挂载到 DOM 并初始化 D3
     * ----------------------------------------------------------------------------
     * @returns this（支持链式调用）
     *
     * @description
     * 执行以下操作：
     * 1. 清空容器内容
     * 2. 调用 initD3 初始化 D3
     * 3. 注册事件监听（SVG 点击、窗口 resize）
     * 4. 延迟 100ms 调用 resetZoom() 使树居中
     *
     * @example
     * const graph = new D3TreeGraph(options);
     * graph.mount();  // 挂载
     * graph.mount();  // 重复调用无效
     */
    mount(): this {
        if (this.mounted) return this;

        // 清空容器
        this.containerEl.innerHTML = '';

        // 初始化 D3
        this.instance = initD3(
            this.containerId,
            this.data,
            (nodeData) => this.events.emit('node:click', nodeData),
            (nodeData) => this.events.emit('node:dblclick', nodeData),
            (event, nodeId) => this.events.emit('node:more', { event, nodeId }),
            (nodeId) => this.events.emit('node:expand', nodeId),
            (nodeId) => this.selectedNodeIds.has(nodeId),
            (sourceId, targetId, sourceData, targetData) =>
                this.events.emit('node:drop-target', {
                    sourceId,
                    targetId,
                    sourceData,
                    targetData
                }),
            this.treeContext
        );

        // 注册全局事件
        document.addEventListener('d3-svg-click', this.svgClickHandler);
        window.addEventListener('resize', this.resizeHandler);

        // 标记已挂载
        this.mounted = true;

        // 延迟重置缩放
        window.setTimeout(() => this.resetZoom(), 100);

        return this;
    }

    /**
     * 销毁实例并清理监听
     * ----------------------------------------------------------------------------
     * @description
     * 执行以下清理：
     * 1. 移除事件监听
     * 2. 清空容器内容
     * 3. 销毁 D3 实例
     * 4. 触发 destroy 事件
     *
     * @example
     * // Vue 中使用
     * onUnmounted(() => graph.destroy());
     */
    destroy(): void {
        if (!this.mounted) return;

        // 移除事件监听
        document.removeEventListener('d3-svg-click', this.svgClickHandler);
        window.removeEventListener('resize', this.resizeHandler);

        // 清空容器
        this.containerEl.innerHTML = '';

        // 销毁实例
        this.instance = null;
        this.mounted = false;

        // 触发销毁事件
        this.events.emit('destroy');
        this.events.clear();
    }

    // =========================================================================
    // 事件监听
    // =========================================================================

    /**
     * 注册事件监听
     * ----------------------------------------------------------------------------
     * @template K - 事件名（必须是 D3TreeGraphEventMap 的 key）
     * @param event - 事件名称
     * @param handler - 事件处理函数
     * @returns 取消订阅函数
     *
     * @description
     * 监听 SDK 内部事件。支持 TypeScript 类型推断。
     *
     * @example
     * // 监听节点点击
     * const unsub = graph.on('node:click', (node) => {
     *   console.log('点击了', node.label);
     * });
     *
     * // 取消监听
     * unsub();
     *
     * @example
     * // 监听数据变更
     * graph.on('data:change', (data) => {
     *   console.log('数据已更新');
     * });
     */
    on<K extends keyof D3TreeGraphEventMap>(
        event: K,
        handler: (payload: D3TreeGraphEventMap[K]) => void
    ): () => void {
        return this.events.on(event, handler as (...args: unknown[]) => void);
    }

    /**
     * 移除事件监听
     * ----------------------------------------------------------------------------
     * @template K - 事件名
     * @param event - 事件名称
     * @param handler - 要移除的处理函数
     *
     * @description
     * 移除之前通过 on() 注册的监听器。
     * 通常不需要直接调用，建议使用 on() 返回的取消订阅函数。
     */
    off<K extends keyof D3TreeGraphEventMap>(
        event: K,
        handler: (payload: D3TreeGraphEventMap[K]) => void
    ): void {
        this.events.off(event, handler as (...args: unknown[]) => void);
    }

    // =========================================================================
    // 数据访问
    // =========================================================================

    /**
     * 获取当前数据（深拷贝）
     * ----------------------------------------------------------------------------
     * @returns 当前树数据的深拷贝
     *
     * @description
     * 返回数据副本，修改返回值不会影响内部数据。
     */
    getData(): TreeData {
        return cloneDeep(this.data);
    }

    /**
     * 获取初始数据（深拷贝）
     * ----------------------------------------------------------------------------
     * @returns 初始树数据的深拷贝
     *
     * @description
     * 用于刷新操作或保存原始数据。
     */
    getInitialData(): TreeData {
        return cloneDeep(this.initialData);
    }

    /**
     * 获取 D3 实例引用
     * ----------------------------------------------------------------------------
     * @returns D3TreeInstance 或 null（未挂载时）
     *
     * @description
     * 返回 D3 内部实例，包含 svg、g、zoom 等引用。
     * 谨慎使用，外部修改可能导致不可预期的问题。
     */
    getInstance(): D3TreeInstance | null {
        return this.instance;
    }

    /**
     * 获取当前布局方向
     * ----------------------------------------------------------------------------
     * @returns 'horizontal' 或 'vertical'
     */
    getOrientation(): TreeLayoutOrientation {
        return this.instance?.orientation ?? 'horizontal';
    }

    /**
     * 设置选中节点列表
     * ----------------------------------------------------------------------------
     * @param nodes - 选中的节点列表
     *
     * @description
     * 批量设置选中节点，更新选中状态并重新渲染。
     */
    setSelectedNodes(nodes: SelectedNode[]): void {
        this.selectedNodeIds = new Set(nodes.map((n) => n.id));
        this.render();
    }

    /**
     * 设置选中节点 ID 列表
     * ----------------------------------------------------------------------------
     * @param ids - 选中的节点 ID 列表
     */
    setSelectedIds(ids: string[]): void {
        this.selectedNodeIds = new Set(ids);
        this.render();
    }

    /**
     * 设置数据
     * ----------------------------------------------------------------------------
     * @param nextData - 新的树数据
     * @param options - 选项
     * @param options.recordHistory - 是否记录历史（默认 false）
     *
     * @description
     * 替换整个树数据并重新渲染。
     * 与 mutateData() + commit() 的区别：
     * - setData()：完全替换数据
     * - mutateData() + commit()：就地修改数据
     *
     * @example
     * // 替换数据（不记录历史）
     * graph.setData(newTreeData);
     *
     * // 替换数据（记录历史）
     * graph.setData(newTreeData, { recordHistory: true });
     */
    setData(nextData: TreeData, options: SetDataOptions = {}): void {
        this.data = cloneDeep(nextData);
        this.render();

        if (options.recordHistory && this.enableHistory) {
            this.history.push(this.data);
            this.emitHistoryChange();
        }

        this.events.emit('data:change', this.getData());
    }

    /**
     * 重新渲染树
     * ----------------------------------------------------------------------------
     * @description
     * 使用当前 data 重新渲染树形图。
     * 通常在数据变更后调用。
     *
     * @example
     * // 外部直接修改了 this.data
     * this.render();
     */
    render(): void {
        if (!this.instance) return;

        renderTree(
            this.instance,
            this.data,
            (nodeData) => this.events.emit('node:click', nodeData),
            (nodeData) => this.events.emit('node:dblclick', nodeData),
            (event, nodeId) => this.events.emit('node:more', { event, nodeId }),
            (nodeId) => this.selectedNodeIds.has(nodeId),
            (sourceId, targetId, sourceData, targetData) =>
                this.events.emit('node:drop-target', {
                    sourceId,
                    targetId,
                    sourceData,
                    targetData
                })
        );
    }

    // =========================================================================
    // 历史记录
    // =========================================================================

    /**
     * 记录历史
     * ----------------------------------------------------------------------------
     * @description
     * 将当前数据状态保存到历史栈。
     * 通常在数据变更后调用。
     */
    recordHistory(): void {
        if (!this.enableHistory) return;
        this.history.push(this.data);
        this.emitHistoryChange();
    }

    /**
     * 撤销
     * ----------------------------------------------------------------------------
     * @returns 是否成功撤销
     *
     * @description
     * 将数据恢复到上一个状态，并重新渲染。
     */
    undo(): boolean {
        if (!this.enableHistory) return false;

        const prev = this.history.undo();
        if (!prev) return false;

        this.data = prev;
        this.render();
        this.emitHistoryChange();
        this.events.emit('data:change', this.getData());

        return true;
    }

    /**
     * 重做
     * ----------------------------------------------------------------------------
     * @returns 是否成功重做
     */
    redo(): boolean {
        if (!this.enableHistory) return false;

        const next = this.history.redo();
        if (!next) return false;

        this.data = next;
        this.render();
        this.emitHistoryChange();
        this.events.emit('data:change', this.getData());

        return true;
    }

    /**
     * 是否可以撤销
     * ----------------------------------------------------------------------------
     * @returns 可以撤销返回 true
     */
    canUndo(): boolean {
        return this.enableHistory && this.history.canUndo();
    }

    /**
     * 是否可以重做
     * ----------------------------------------------------------------------------
     * @returns 可以重做返回 true
     */
    canRedo(): boolean {
        return this.enableHistory && this.history.canRedo();
    }

    /**
     * 刷新（恢复到初始状态）
     * ----------------------------------------------------------------------------
     * @description
     * 使用初始数据重置当前数据，清空历史记录，并重新渲染。
     *
     * @example
     * graph.refresh();
     */
    refresh(): void {
        // 恢复初始数据
        this.data = cloneDeep(this.initialData);

        // 清空历史记录
        if (this.enableHistory) {
            this.history.reset(this.data);
            this.emitHistoryChange();
        }

        // 重新渲染
        this.render();
        this.resetZoom();

        // 触发数据变更事件
        this.events.emit('data:change', this.getData());
    }

    /**
     * 重置初始数据
     * ----------------------------------------------------------------------------
     * @param data - 新的初始数据
     *
     * @description
     * 更新初始数据引用，然后刷新。
     * 用于从服务器重新加载数据。
     *
     * @example
     * // 从服务器获取新数据
     * const newData = await fetchTreeData();
     * graph.resetToInitialData(newData);
     */
    resetToInitialData(data: TreeData): void {
        this.initialData = cloneDeep(data);
        this.refresh();
    }

    // =========================================================================
    // 缩放平移
    // =========================================================================

    /**
     * 放大
     */
    zoomIn(): void {
        if (!this.instance) return;
        zoomIn(this.instance.svg, this.instance.zoom);
    }

    /**
     * 缩小
     */
    zoomOut(): void {
        if (!this.instance) return;
        zoomOut(this.instance.svg, this.instance.zoom);
    }

    /**
     * 自适应视图
     * ----------------------------------------------------------------------------
     * @description
     * 自动缩放和平移，使整个树视图适应容器大小。
     */
    fitView(): void {
        if (!this.instance) return;
        fitView(
            this.instance.svg,
            this.instance.g,
            this.containerEl.clientWidth,
            this.containerEl.clientHeight,
            this.instance.zoom
        );
    }

    /**
     * 重置缩放
     * ----------------------------------------------------------------------------
     * @description
     * 重置缩放和平移到初始状态（树居中显示）。
     */
    resetZoom(): void {
        if (!this.instance) return;
        resetZoom(
            this.instance.svg,
            this.instance.g,
            this.containerEl.clientWidth,
            this.containerEl.clientHeight,
            this.instance.zoom
        );
    }

    // =========================================================================
    // 布局方向
    // =========================================================================

    /**
     * 切换布局方向
     * ----------------------------------------------------------------------------
     * @returns 切换后的方向
     *
     * @description
     * 在水平布局和垂直布局之间切换。
     * horizontal：根节点在左侧，子节点向右延伸
     * vertical：根节点在顶部，子节点向下延伸
     */
    toggleOrientation(): TreeLayoutOrientation {
        const next: TreeLayoutOrientation =
            this.getOrientation() === 'horizontal' ? 'vertical' : 'horizontal';
        this.setOrientation(next);
        return next;
    }

    /**
     * 设置布局方向
     * ----------------------------------------------------------------------------
     * @param orientation - 布局方向
     */
    setOrientation(orientation: TreeLayoutOrientation): void {
        if (!this.instance) return;

        setTreeOrientation(this.instance, orientation);
        this.render();
        this.resetZoom();

        this.events.emit('orientation:change', orientation);
    }

    // =========================================================================
    // 导出
    // =========================================================================

    /**
     * 导出树图
     * ----------------------------------------------------------------------------
     * @param fileName - 文件名（不含扩展名），默认 'tree-diagram'
     * @param format - 导出格式，默认 'png'
     *
     * @description
     * 将当前树图导出为图片文件。
     *
     * @example
     * // 导出 PNG
     * await graph.download('my-tree', 'png');
     *
     * // 导出 SVG
     * await graph.download('my-tree', 'svg');
     */
    async download(fileName = 'tree-diagram', format: 'png' | 'svg' = 'png'): Promise<void> {
        if (!this.instance) return;
        await downloadTree(
            this.instance.svg,
            this.instance.root,
            this.containerEl.clientWidth,
            fileName,
            format
        );
    }

    // =========================================================================
    // 数据变更 (就地修改内部数据引用（供 tree-operations 使用）)
    // =========================================================================

    /**
     * 获取可变更的数据引用
     * ----------------------------------------------------------------------------
     * @returns 当前数据引用
     *
     * @description
     * **重要**：返回的是内部数据引用，不是副本。
     * 修改返回值会直接影响内部数据。
     *
     * 配合 commit() 使用：
     * 1. mutateData() 获取数据引用
     * 2. 直接修改数据（或通过 TreeContext 修改）
     * 3. commit() 提交变更，重新渲染
     *
     * @example
     * const ctx = graph.getContext();
     * const data = graph.mutateData();
     * ctx.addChildNode(data, { parentId: 'root', name: '新节点', level: 'domain', integrationType: 'base' });
     * graph.commit();
     */
    mutateData(): TreeData {
        return this.data;
    }

    /**
     * 提交变更 (提交变更：重绘 + 可选记录历史)
     * ----------------------------------------------------------------------------
     * @param options - 选项
     * @param options.recordHistory - 是否记录历史（默认 true）
     *
     * @description
     * 在数据变更后调用，重新渲染并可选记录历史。
     *
     * @example
     * // 正常提交（记录历史）
     * graph.commit();
     *
     * // 不记录历史
     * graph.commit({ recordHistory: false });
     */
    commit(options: SetDataOptions = { recordHistory: true }): void {
        this.render();

        if (options.recordHistory) {
            this.recordHistory();
        }

        this.events.emit('data:change', this.getData());
    }

    // =========================================================================
    // 工具方法
    // =========================================================================

    /**
     * 获取树上下文
     * ----------------------------------------------------------------------------
     * @returns TreeContext 实例
     *
     * @description
     * 用于执行树操作（添加节点、合并节点等）。
     *
     * @example
     * const ctx = graph.getContext();
     * ctx.addChildNode(graph.mutateData(), { ... });
     * graph.commit();
     */
    getContext(): TreeContext {
        return this.treeContext;
    }

    /**
     * 获取受保护根节点 ID
     * ----------------------------------------------------------------------------
     * @returns 受保护根节点 ID
     */
    getProtectedRootId(): string | undefined {
        return this.protectedRootId;
    }

    /**
     * 获取 SVG 元素
     * ----------------------------------------------------------------------------
     * @returns SVG 元素或 null
     *
     * @description
     * 用于外部监听 zoom 事件等。
     *
     * @example
     * const svg = graph.getSvgElement();
     * if (svg) {
     *   // 监听 zoom
     *   svg.addEventListener('zoom', handler);
     * }
     */
    getSvgElement(): SVGSVGElement | null {
        if (!this.instance) return null;
        return this.instance.svg.node() as SVGSVGElement | null;
    }

    /**
     * 监听 zoom 变化 (监听 zoom 变化（画布缩放/平移时触发)
     * ----------------------------------------------------------------------------
     * @param handler - zoom 变化回调
     * @param handler.x - 平移 X
     * @param handler.y - 平移 Y
     * @param handler.k - 缩放比例
     * @returns 取消订阅函数
     *
     * @description
     * 监听画布缩放/平移事件。
     *
     * @example
     * const unsub = graph.onZoom((transform) => {
     *   console.log('缩放比例:', transform.k);
     *   console.log('平移:', transform.x, transform.y);
     * });
     *
     * // 取消监听
     * unsub();
     */
    onZoom(handler: (transform: { x: number; y: number; k: number }) => void): () => void {
        if (!this.instance) return () => {};
        const svg = this.instance.svg;
        const zoom = this.instance.zoom;

        const wrappedHandler = (event: d3.D3ZoomEvent<SVGSVGElement, null>) => {
            handler({ x: event.transform.x, y: event.transform.y, k: event.transform.k });
        };

        svg.on('zoom.graph', wrappedHandler);
        return () => svg.on('zoom.graph', null);
    }

    // =========================================================================
    // 私有方法
    // =========================================================================

    /** 触发历史状态变更事件 */
    private emitHistoryChange(): void {
        this.events.emit('history:change', this.history.getState());
    }

    /** 处理窗口 resize */
    private handleResize(): void {
        if (!this.instance) return;

        const width = this.containerEl.clientWidth;
        const height = this.containerEl.clientHeight;

        this.instance.svg.attr('width', width).attr('height', height);
    }

    /** 解析容器 */
    private resolveContainer(container: string | HTMLElement): HTMLElement {
        if (typeof container === 'string') {
            const el = document.getElementById(container) ?? document.querySelector(container);
            if (!el) throw new Error(`[D3TreeGraph] Container not found: ${container}`);
            return el as HTMLElement;
        }
        return container;
    }

    /** 确保容器有 ID */
    private ensureContainerId(el: HTMLElement): string {
        if (!el.id) {
            el.id = `d3-tree-${Date.now()}`;
        }
        return el.id;
    }
}
