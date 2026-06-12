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

export interface D3TreeGraphOptions {
    /** 容器元素或元素 id */
    container: string | HTMLElement;
    /** 初始树数据（字段名由 schema 决定，SDK 不假设固定结构） */
    data: TreeData;
    /**
     * 数据结构配置 —— 对接自有数据时通过参数传入
     * 包含 fields（id/children/modules…）、selection、styles、rootId 等
     */
    schema?: TreeConfigInput;
    /** @deprecated 请使用 schema */
    treeConfig?: TreeConfigInput;
    /** 是否启用撤销/重做，默认 true */
    enableHistory?: boolean;
    /** 受保护的根节点 id；也可在 schema.protectedRootId 中配置 */
    protectedRootId?: string;
}

export interface SetDataOptions {
    /** 是否写入历史栈，默认 false */
    recordHistory?: boolean;
}

export type D3TreeGraphEventMap = {
    'node:click': TreeData;
    'node:dblclick': TreeData;
    'node:more': { event: MouseEvent; nodeId: string };
    'node:drop-target': {
        sourceId: string;
        targetId: string;
        sourceData: TreeData;
        targetData: TreeData;
    };
    'svg:click': void;
    'data:change': TreeData;
    'history:change': ReturnType<HistoryStack['getState']>;
    'orientation:change': TreeLayoutOrientation;
    'destroy': void;
};

/**
 * D3 树形图 SDK（框架无关）
 * ----------------------------------------------------------------------------
 * 可在 Vue2 / Vue3 / React / 原生 JS 中使用：
 *
 * ```ts
 * const schema = defineTreeConfig({
 *   fields: { id: 'nodeId', label: 'name', children: 'subNodes' }
 * });
 * const graph = new D3TreeGraph({ container: '#app', data: treeData, schema });
 * graph.on('node:click', (node) => console.log(node));
 * graph.mount();
 * ```
 */
export class D3TreeGraph {
    readonly events = new EventEmitter();

    private containerEl: HTMLElement;
    private containerId: string;
    private data: TreeData;
    private initialData: TreeData;
    private instance: D3TreeInstance | null = null;
    private history: HistoryStack;
    private enableHistory: boolean;
    private protectedRootId?: string;
    readonly treeContext: TreeContext;
    private selectedNodeIds = new Set<string>();
    private mounted = false;
    private svgClickHandler = () => this.events.emit('svg:click');
    private resizeHandler = () => this.handleResize();

    constructor(options: D3TreeGraphOptions) {
        this.containerEl = this.resolveContainer(options.container);
        this.containerId = this.ensureContainerId(this.containerEl);
        this.data = cloneDeep(options.data);
        this.initialData = cloneDeep(options.data);
        this.enableHistory = options.enableHistory !== false;
        this.treeContext = new TreeContext({
            ...(options.schema ?? options.treeConfig),
            protectedRootId: options.protectedRootId ?? options.schema?.protectedRootId ?? options.treeConfig?.protectedRootId
        });
        this.protectedRootId = this.treeContext.getProtectedRootId(this.data);
        this.history = new HistoryStack(this.data);
    }

    /** 挂载到 DOM 并初始化 D3 */
    mount(): this {
        if (this.mounted) return this;
        this.containerEl.innerHTML = '';

        this.instance = initD3(
            this.containerId,
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
                }),
            this.treeContext
        );

        document.addEventListener('d3-svg-click', this.svgClickHandler);
        window.addEventListener('resize', this.resizeHandler);
        this.mounted = true;

        window.setTimeout(() => this.resetZoom(), 100);
        return this;
    }

    /** 销毁实例并清理监听 */
    destroy(): void {
        if (!this.mounted) return;
        document.removeEventListener('d3-svg-click', this.svgClickHandler);
        window.removeEventListener('resize', this.resizeHandler);
        this.containerEl.innerHTML = '';
        this.instance = null;
        this.mounted = false;
        this.events.emit('destroy');
        this.events.clear();
    }

    on<K extends keyof D3TreeGraphEventMap>(
        event: K,
        handler: (payload: D3TreeGraphEventMap[K]) => void
    ): () => void {
        return this.events.on(event, handler as (...args: unknown[]) => void);
    }

    off<K extends keyof D3TreeGraphEventMap>(
        event: K,
        handler: (payload: D3TreeGraphEventMap[K]) => void
    ): void {
        this.events.off(event, handler as (...args: unknown[]) => void);
    }

    getData(): TreeData {
        return cloneDeep(this.data);
    }

    getInitialData(): TreeData {
        return cloneDeep(this.initialData);
    }

    getInstance(): D3TreeInstance | null {
        return this.instance;
    }

    getOrientation(): TreeLayoutOrientation {
        return this.instance?.orientation ?? 'horizontal';
    }

    setSelectedNodes(nodes: SelectedNode[]): void {
        this.selectedNodeIds = new Set(nodes.map((n) => n.id));
        this.render();
    }

    setSelectedIds(ids: string[]): void {
        this.selectedNodeIds = new Set(ids);
        this.render();
    }

    setData(nextData: TreeData, options: SetDataOptions = {}): void {
        this.data = cloneDeep(nextData);
        this.render();
        if (options.recordHistory && this.enableHistory) {
            this.history.push(this.data);
            this.emitHistoryChange();
        }
        this.events.emit('data:change', this.getData());
    }

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

    recordHistory(): void {
        if (!this.enableHistory) return;
        this.history.push(this.data);
        this.emitHistoryChange();
    }

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

    canUndo(): boolean {
        return this.enableHistory && this.history.canUndo();
    }

    canRedo(): boolean {
        return this.enableHistory && this.history.canRedo();
    }

    refresh(): void {
        this.data = cloneDeep(this.initialData);
        if (this.enableHistory) {
            this.history.reset(this.data);
            this.emitHistoryChange();
        }
        this.render();
        this.resetZoom();
        this.events.emit('data:change', this.getData());
    }

    resetToInitialData(data: TreeData): void {
        this.initialData = cloneDeep(data);
        this.refresh();
    }

    zoomIn(): void {
        if (!this.instance) return;
        zoomIn(this.instance.svg, this.instance.zoom);
    }

    zoomOut(): void {
        if (!this.instance) return;
        zoomOut(this.instance.svg, this.instance.zoom);
    }

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

    toggleOrientation(): TreeLayoutOrientation {
        const next: TreeLayoutOrientation =
            this.getOrientation() === 'horizontal' ? 'vertical' : 'horizontal';
        this.setOrientation(next);
        return next;
    }

    setOrientation(orientation: TreeLayoutOrientation): void {
        if (!this.instance) return;
        setTreeOrientation(this.instance, orientation);
        this.render();
        this.resetZoom();
        this.events.emit('orientation:change', orientation);
    }

    async download(
        fileName = 'tree-diagram',
        format: 'png' | 'svg' = 'png'
    ): Promise<void> {
        if (!this.instance) return;
        await downloadTree(
            this.instance.svg,
            this.instance.root,
            this.containerEl.clientWidth,
            fileName,
            format
        );
    }

    /** 就地修改内部数据引用（供 tree-operations 使用） */
    mutateData(): TreeData {
        return this.data;
    }

    /** 提交变更：重绘 + 可选记录历史 */
    commit(options: SetDataOptions = { recordHistory: true }): void {
        this.render();
        if (options.recordHistory) {
            this.recordHistory();
        }
        this.events.emit('data:change', this.getData());
    }

    getContext(): TreeContext {
        return this.treeContext;
    }

    getProtectedRootId(): string | undefined {
        return this.protectedRootId;
    }

    private emitHistoryChange(): void {
        this.events.emit('history:change', this.history.getState());
    }

    private handleResize(): void {
        if (!this.instance) return;
        const width = this.containerEl.clientWidth;
        const height = this.containerEl.clientHeight;
        this.instance.svg.attr('width', width).attr('height', height);
    }

    private resolveContainer(container: string | HTMLElement): HTMLElement {
        if (typeof container === 'string') {
            const el = document.getElementById(container) ?? document.querySelector(container);
            if (!el) throw new Error(`[D3TreeGraph] Container not found: ${container}`);
            return el as HTMLElement;
        }
        return container;
    }

    private ensureContainerId(el: HTMLElement): string {
        if (!el.id) {
            el.id = `d3-tree-${Date.now()}`;
        }
        return el.id;
    }
}
