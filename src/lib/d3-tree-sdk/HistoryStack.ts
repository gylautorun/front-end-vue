/**
 * HistoryStack.ts - 撤销/重做历史栈
 * =============================================================================
 * 本文件负责：
 * 1. 记录树数据的变更历史
 * 2. 支持撤销（undo）和重做（redo）操作
 * 3. 提供历史状态查询（canUndo/canRedo）
 *
 * 核心概念：
 * - stack：历史记录数组，每项是完整的树数据快照
 * - index：当前指针位置，指向 stack 中的某一版本
 * - 快照：使用 cloneDeep 确保数据独立，互不影响
 *
 * 工作原理：
 * ```
 * stack: [v0, v1, v2, v3]     index: 3（指向最新版本 v3）
 *                     ^
 *                     └── 当前状态
 *
 * undo() 后：
 * stack: [v0, v1, v2, v3]     index: 2（指向前一个版本 v2）
 *               ^
 *               └── 当前状态
 *
 * 再 push() 新数据后：
 * stack: [v0, v1, v2, v4]    index: 3（指向最新版本 v4，v3 被丢弃）
 *                     ^
 *                     └── 当前状态
 * ```
 *
 * 为什么用 cloneDeep？
 * 树数据结构可能包含嵌套引用，直接存储会导致不同历史版本共享同一引用。
 * 使用 lodash-es 的 cloneDeep 确保每个快照都是独立的数据副本。
 *
 * 使用示例：
 * ```ts
 * const history = new HistoryStack(initialData);
 *
 * // 记录新状态
 * history.push(newData);
 *
 * // 撤销
 * const prevData = history.undo();  // 返回 v2
 *
 * // 重做
 * const nextData = history.redo();   // 返回 v3
 *
 * // 查询状态
 * if (history.canUndo()) { ... }
 * if (history.canRedo()) { ... }
 *
 * // 获取状态摘要
 * const state = history.getState();
 * // { canUndo: true, canRedo: false, index: 3, length: 4 }
 *
 * // 重置历史
 * history.reset(freshData);
 * ```
 */

// ============================================================================
// 依赖导入
// ============================================================================
import { cloneDeep } from 'lodash-es';
import type { TreeData } from './types';

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 历史状态摘要
 * ----------------------------------------------------------------------------
 * 用于 UI 显示撤销/重做按钮状态，或显示历史进度。
 */
export interface HistoryState {
    /** 是否可以撤销 */
    canUndo: boolean;
    /** 是否可以重做 */
    canRedo: boolean;
    /** 当前版本索引（从 0 开始） */
    index: number;
    /** 历史记录总数 */
    length: number;
}

// ============================================================================
// HistoryStack 类
// ============================================================================

/**
 * 撤销/重做历史栈
 * ----------------------------------------------------------------------------
 * 采用"指针式"设计：
 * - stack 存储所有历史版本
 * - index 指向当前版本
 * - push 新数据时，丢弃 redo 方向的历史（重做分支）
 *
 * @example
 * const history = new HistoryStack(treeData);
 *
 * // 操作1：添加子节点
 * history.push(dataAfterAdd);
 *
 * // 操作2：合并节点
 * history.push(dataAfterMerge);
 *
 * // 撤销到操作1
 * const v1 = history.undo();
 *
 * // 重做到操作2
 * const v2 = history.redo();
 *
 * // 再操作3（添加模块）
 * history.push(dataAfterAddModule);
 * // 此时 v2 被丢弃，无法再 redo
 *
 * @example
 * // 集成到 D3TreeGraph
 * class D3TreeGraph {
 *   recordHistory() {
 *     this.history.push(this.data);
 *   }
 *
 *   undo() {
 *     const prev = this.history.undo();
 *     if (prev) {
 *       this.data = prev;
 *       this.render();
 *     }
 *   }
 * }
 */
export class HistoryStack {
    /**
     * 历史记录栈
     * @description 存储所有数据快照，每项是独立的深拷贝
     */
    private stack: TreeData[] = [];

    /**
     * 当前版本指针
     * @description 指向 stack 中的索引，取值范围 0 ~ stack.length - 1
     * @default -1（未初始化）
     */
    private index = -1;

    /**
     * 构造函数
     * ----------------------------------------------------------------------------
     * @param initial - 初始树数据
     *
     * @description
     * 初始化时将初始数据作为第一个历史版本。
     */
    constructor(initial: TreeData) {
        this.reset(initial);
    }

    /**
     * 重置历史栈
     * ----------------------------------------------------------------------------
     * @param data - 新的初始数据
     *
     * @description
     * 清空所有历史，将 data 作为唯一的初始版本。
     * 用于刷新/重置操作。
     *
     * @example
     * // 刷新时重置历史
     * history.reset(freshData);
     */
    reset(data: TreeData): void {
        this.stack = [cloneDeep(data)];
        this.index = 0;
    }

    /**
     * 记录新状态
     * ----------------------------------------------------------------------------
     * @param data - 新的树数据
     *
     * @description
     * 将新数据添加到历史栈。
     * **重要**：如果当前指针不在栈顶（存在 redo 分支），
     * 会丢弃 redo 方向的历史，模拟"新操作"的行为。
     *
     * @example
     * // 场景1：正常添加
     * history.push(dataV1);  // stack: [v0, v1], index: 1
     * history.push(dataV2);  // stack: [v0, v1, v2], index: 2
     *
     * @example
     * // 场景2：撤销后添加（丢弃 redo）
     * history.undo();         // index: 1
     * history.push(dataV3);  // stack: [v0, v1, v3], index: 2
     * // 原来的 v2 被丢弃，无法再 redo
     */
    push(data: TreeData): void {
        // 深拷贝确保数据独立
        const snapshot = cloneDeep(data);

        // 如果指针不在栈顶，丢弃 redo 分支
        // 例：stack: [v0, v1, v2, v3], index: 2
        //     push 后: stack: [v0, v1, v2] + v3 = [v0, v1, v2, v3]
        //     实际是 [v0, v1, v3]，丢弃了 v2
        if (this.index < this.stack.length - 1) {
            this.stack = this.stack.slice(0, this.index + 1);
        }

        // 添加新快照并移动指针
        this.stack.push(snapshot);
        this.index = this.stack.length - 1;
    }

    /**
     * 撤销操作
     * ----------------------------------------------------------------------------
     * @returns 撤销后的数据快照，如果无法撤销返回 null
     *
     * @description
     * 将指针前移一位，返回前一个版本的数据。
     *
     * @example
     * // 场景：当前 index: 3
     * const prev = history.undo();  // index: 2，返回 v2
     * const prev = history.undo();  // index: 1，返回 v1
     * const prev = history.undo();  // null，无法再撤销
     */
    undo(): TreeData | null {
        if (!this.canUndo()) return null;
        this.index -= 1;
        return cloneDeep(this.stack[this.index]);
    }

    /**
     * 重做操作
     * ----------------------------------------------------------------------------
     * @returns 重做后的数据快照，如果无法重做返回 null
     *
     * @description
     * 将指针后移一位，返回后一个版本的数据。
     *
     * @example
     * // 场景：当前 index: 1
     * const next = history.redo();  // index: 2，返回 v2
     * const next = history.redo();  // index: 3，返回 v3
     * const next = history.redo();  // null，无法再重做
     */
    redo(): TreeData | null {
        if (!this.canRedo()) return null;
        this.index += 1;
        return cloneDeep(this.stack[this.index]);
    }

    /**
     * 是否可以撤销
     * ----------------------------------------------------------------------------
     * @returns 可以撤销返回 true
     *
     * @description
     * 当指针大于 0 时，可以撤销。
     */
    canUndo(): boolean {
        return this.index > 0;
    }

    /**
     * 是否可以重做
     * ----------------------------------------------------------------------------
     * @returns 可以重做返回 true
     *
     * @description
     * 当指针小于栈顶时，可以重做。
     */
    canRedo(): boolean {
        return this.index < this.stack.length - 1;
    }

    /**
     * 获取历史状态摘要
     * ----------------------------------------------------------------------------
     * @returns 历史状态对象
     *
     * @description
     * 返回当前历史的完整状态，用于 UI 显示或调试。
     *
     * @example
     * const state = history.getState();
     * console.log(`历史 ${state.index + 1}/${state.length}`);
     * // "历史 3/5"
     *
     * // UI 绑定
     * undoBtn.disabled = !state.canUndo;
     * redoBtn.disabled = !state.canRedo;
     */
    getState(): HistoryState {
        return {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            index: this.index,
            length: this.stack.length
        };
    }
}
