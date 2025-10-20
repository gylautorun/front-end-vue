
/**
 * 交通信号灯颜色问询模式 替换 setInterval 定时器
 */

export enum TrafficLightColorEnum {
    Red = 'red',
    Yellow = 'yellow',
    Green = 'green',
}
export interface ITrafficLightPart {
    type: TrafficLightColorEnum;
    time: number;
}

export interface ITrafficLight {
    getCurrentLight(): {
        type: TrafficLightColorEnum;
        remain: number; // 剩余时间
    };
}
export class TrafficLight implements ITrafficLight {
    private _lights: ITrafficLightPart[] = [];
    private _currentIndex: number;
    private _switchTime: number;
    constructor(lights: ITrafficLightPart[]) {
        this._lights = lights;
        this._currentIndex = 0; // 当前信号灯下标
        this._switchTime = Date.now(); // 切换到当前信号灯开启时间
    }

    /**
     * 更新当前信号灯 (每次问询时都会调用)
     */
    private _update() {
        while (1) {
            // if (this._elapsedTime >= this._current.time) {
            //     this._currentIndex = (this._currentIndex + 1) % this._lights.length;
            //     this._switchTime = Date.now();
            // } else {
            //     break;
            // }
            if (this._elapsedTime < this._current.time) {
                break; // 当前信号灯剩余时间大于 0, 则不切换
            }
            this._switchTime += this._current.time; // 更新切换时间 => 当前信号灯开启时间 += 当前信号灯剩余时间
            this._currentIndex = (this._currentIndex + 1) % this._lights.length;
        }
    }
    get _current() {
        return this._lights[this._currentIndex];
    }
    /**
     * 当前信号灯已经开启的时间
     */
    get _elapsedTime(){
        return Date.now() - this._switchTime;
    }

    getCurrentLight(): {
        type: TrafficLightColorEnum;
        remain: number; // 剩余时间
    } {
        this._update();

        return {
            type: this._current.type,
            remain: this._current.time - this._elapsedTime,
        };
    }
}