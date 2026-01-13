// 窗口形状接口
export interface WindowShape {
    x: number;
    y: number;
    w: number;
    h: number;
}

// 窗口数据接口
export interface WindowData {
    id: number;
    shape: WindowShape;
    metaData: any;
}

// 窗口变化回调类型
export type WinChangeCallback = () => void;

// 窗口形状变化回调类型
export type WinShapeChangeCallback = (id: number, shape: WindowShape, easing?: boolean) => void;

const LOCAL_STORAGE_WINDOWS_KEY = `windows-multiple-window-3d-scene-${window.location.pathname}`;

export class WindowManager {
    private windows: WindowData[] = [];
    private count: number = 0;
    private id: number = 0;
    private winData: WindowData;
    private winShapeChangeCallback: WinShapeChangeCallback | null = null;
    private winChangeCallback: WinChangeCallback | null = null;
    private localStorageKey: string = LOCAL_STORAGE_WINDOWS_KEY;

    // localStorage键值对，使用getter确保每次访问都能动态生成正确的键
    public get localStorageKeys(): { windows: string; count: string } {
        const localStorageKey = this.localStorageKey;
        return {
            windows: localStorageKey,
            count: `${localStorageKey}-count`
        };
    }

    constructor() {
        let that = this;

        // 初始化窗口数据
        this.winData = { id: 0, shape: { x: 0, y: 0, w: 0, h: 0 }, metaData: null };

        // event listener for when localStorage is changed from another window
        addEventListener('storage', (event: StorageEvent) => {
            if (event.key == this.localStorageKeys.windows && event.newValue) {
                let newWindows: WindowData[] = JSON.parse(event.newValue);
                let winChange = that.didWindowsChange(that.windows, newWindows);

                that.windows = newWindows;

                if (winChange && that.winChangeCallback) {
                    that.winChangeCallback();
                }
            }
        });

        // event listener for when current window is about to be closed
        window.addEventListener('beforeunload', function (e: BeforeUnloadEvent) {
            let index = that.getWindowIndexFromId(that.id);

            //remove this window from the list and update local storage
            that.windows.splice(index, 1);
            that.updateWindowsLocalStorage();
        });
    }

    // check if theres any changes to the window list
    private didWindowsChange(pWins: WindowData[], nWins: WindowData[]): boolean {
        if (pWins.length != nWins.length) {
            return true;
        } else {
            let c = false;

            for (let i = 0; i < pWins.length; i++) {
                if (pWins[i].id != nWins[i].id) c = true;
            }

            return c;
        }
    }

    // initiate current window (add metadata for custom data to store with each window instance)
    public init(metaData: any): void {
        const countKey = this.localStorageKeys.count;
        this.windows = JSON.parse(localStorage.getItem(this.localStorageKeys.windows) || '[]');
        this.count = Number(localStorage.getItem(countKey) || 0);
        this.count++;

        this.id = this.count;
        let shape = this.getWinShape();
        this.winData = { id: this.id, shape: shape, metaData: metaData };
        this.windows.push(this.winData);
        localStorage.setItem(countKey, this.count.toString());
        this.updateWindowsLocalStorage();
    }

    private getWinShape(): WindowShape {
        let shape: WindowShape = {
            x: window.screenLeft,
            y: window.screenTop,
            w: window.innerWidth,
            h: window.innerHeight
        };
        return shape;
    }

    private getWindowIndexFromId(id: number): number {
        let index = -1;

        for (let i = 0; i < this.windows.length; i++) {
            if (this.windows[i].id == id) index = i;
        }

        return index;
    }

    private updateWindowsLocalStorage(): void {
        localStorage.setItem(this.localStorageKeys.windows, JSON.stringify(this.windows));
    }

    public update(): void {
        let winShape = this.getWinShape();

        if (
            winShape.x != this.winData.shape.x ||
            winShape.y != this.winData.shape.y ||
            winShape.w != this.winData.shape.w ||
            winShape.h != this.winData.shape.h
        ) {
            this.winData.shape = winShape;

            let index = this.getWindowIndexFromId(this.id);
            this.windows[index].shape = winShape;

            if (this.winShapeChangeCallback) {
                this.winShapeChangeCallback(this.id, winShape, true);
            }
            this.updateWindowsLocalStorage();
        }
    }

    public setWinShapeChangeCallback(callback: WinShapeChangeCallback): void {
        this.winShapeChangeCallback = callback;
    }

    public setWinChangeCallback(callback: WinChangeCallback): void {
        this.winChangeCallback = callback;
    }

    public getWindows(): WindowData[] {
        return this.windows;
    }

    public getThisWindowData(): WindowData {
        return this.winData;
    }

    public getThisWindowID(): number {
        return this.id;
    }

    // 添加清理localStorage的方法
    public clearLocalStorage(): void {
        // 使用类型断言解决Object.keys的类型问题
        (Object.keys(this.localStorageKeys) as Array<keyof typeof this.localStorageKeys>).forEach(
            (key) => {
                localStorage.removeItem(this.localStorageKeys[key]);
            }
        );
    }
}

export default WindowManager;
