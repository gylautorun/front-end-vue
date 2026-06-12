import { cloneDeep } from 'lodash-es';
import type { TreeData } from './types';

export interface HistoryState {
    canUndo: boolean;
    canRedo: boolean;
    index: number;
    length: number;
}

/** 撤销/重做历史栈 */
export class HistoryStack {
    private stack: TreeData[] = [];
    private index = -1;

    constructor(initial: TreeData) {
        this.reset(initial);
    }

    reset(data: TreeData): void {
        this.stack = [cloneDeep(data)];
        this.index = 0;
    }

    push(data: TreeData): void {
        const snapshot = cloneDeep(data);
        if (this.index < this.stack.length - 1) {
            this.stack = this.stack.slice(0, this.index + 1);
        }
        this.stack.push(snapshot);
        this.index = this.stack.length - 1;
    }

    undo(): TreeData | null {
        if (!this.canUndo()) return null;
        this.index -= 1;
        return cloneDeep(this.stack[this.index]);
    }

    redo(): TreeData | null {
        if (!this.canRedo()) return null;
        this.index += 1;
        return cloneDeep(this.stack[this.index]);
    }

    canUndo(): boolean {
        return this.index > 0;
    }

    canRedo(): boolean {
        return this.index < this.stack.length - 1;
    }

    getState(): HistoryState {
        return {
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            index: this.index,
            length: this.stack.length
        };
    }
}
