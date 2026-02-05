import { base64ToBlobOrFile } from './utils';

export interface CanvasAutographOption {
    // 挂载的节点元素
    el: HTMLElement;
    // （可选）画笔线条的厚度：像素
    lineSize?: number;
    // （可选）画笔线条的颜色
    lineColor?: string;
    // （可选）背景颜色
    backgroundColor?: string;
    // （可选）缩放比率
    ratio?: number;
}

/**
 * `canvas`签名工具类
 */
export class CanvasAutograph {
    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;
    private option: any;
    private ratio: number;
    private startX: number = 0;
    private startY: number = 0;
    private hasDraw: boolean = false;
    private isDrawing: boolean = false;

    /**
     * 构造函数
     */
    constructor(option: CanvasAutographOption) {
        this.option = option;
        this.ratio = option.ratio || window.devicePixelRatio;
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        // 初始化
        this.init();
    }

    /**
     * 初始化
     */
    private init(): void {
        // 输出节点
        this.option.el.appendChild(this.canvas);
        // 先更新一次
        this.updateSize();
        this.setStyle();
        // 添加事件
        this.addEventListeners();
    }

    /**
     * 更新`canvas`尺寸
     */
    private updateSize(): void {
        this.canvas.width = this.option.el.clientWidth * this.ratio;
        this.canvas.height = this.option.el.clientHeight * this.ratio;
    }

    /**
     * 设置画布样式
     */
    private setStyle(): void {
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.context.lineCap = 'round';
        this.context.lineJoin = 'round';
        this.context.fillStyle = this.option.backgroundColor || '#ffffff';
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 获取线条宽度
     */
    private getLineWidth(): number {
        return this.option.lineSize || 4;
    }

    /**
     * 获取线条颜色
     */
    private getLineColor(): string {
        return this.option.lineColor || '#000000';
    }

    /**
     * 绘画开始
     * @param {{ x: number, y: number }} size 坐标点
     */
    private drawStart(size: { x: number; y: number }): void {
        const x = size.x * this.ratio;
        const y = size.y * this.ratio;
        this.context.beginPath();
        this.context.moveTo(x, y);
        this.context.lineTo(x, y);
        this.context.strokeStyle = this.getLineColor();
        this.context.lineWidth = this.getLineWidth() * this.ratio;
        this.context.stroke();
        this.context.closePath();
        this.startY = y;
        this.startX = x;
    }

    /**
     * 绘画拖拽
     * @param {{ x: number, y: number }} size 坐标点
     */
    private drawMove(size: { x: number; y: number }): void {
        const x = size.x * this.ratio;
        const y = size.y * this.ratio;
        this.context.beginPath();
        this.context.moveTo(this.startX, this.startY);
        this.context.lineTo(x, y);
        this.context.strokeStyle = this.getLineColor();
        this.context.lineWidth = this.getLineWidth() * this.ratio;
        this.context.stroke();
        this.context.closePath();
        this.startY = y;
        this.startX = x;
    }

    /**
     * 绘画结束
     * @param {{ x: number, y: number }} size 坐标点
     */
    private drawEnd(size: { x: number; y: number }): void {
        this.context.beginPath();
        this.context.moveTo(this.startX, this.startY);
        this.context.lineTo(size.x * this.ratio, size.y * this.ratio);
        this.context.stroke();
        this.context.closePath();
    }

    /**
     * 鼠标摁下
     * @param {MouseEvent} e
     */
    private onMouseDown(e: MouseEvent): void {
        e.preventDefault();
        this.isDrawing = true;
        this.hasDraw = true;
        this.drawStart({
            x: e.offsetX,
            y: e.offsetY
        });
    }

    /**
     * 鼠标移动
     * @param {MouseEvent} e
     */
    private onMouseMove(e: MouseEvent): void {
        e.preventDefault();
        if (!this.isDrawing) return;
        this.drawMove({
            x: e.offsetX,
            y: e.offsetY
        });
    }

    /**
     * 鼠标抬起
     * @param {MouseEvent} e
     */
    private onMouseUp(e: MouseEvent): void {
        e.preventDefault();
        if (!this.isDrawing) return;
        this.drawEnd({
            x: e.offsetX,
            y: e.offsetY
        });
        this.isDrawing = false;
    }

    /**
     * 触摸开始
     * @param {TouchEvent} e
     */
    private onTouchStart(e: TouchEvent): void {
        e.preventDefault();
        if (e.touches.length === 1) {
            this.isDrawing = true;
            this.hasDraw = true;
            const size = e.touches[0];
            const box = this.canvas.getBoundingClientRect();
            this.drawStart({
                x: size.clientX - box.left,
                y: size.clientY - box.top
            });
        }
    }

    /**
     * 触摸移动
     * @param {TouchEvent} e
     */
    private onTouchMove(e: TouchEvent): void {
        e.preventDefault();
        if (!this.isDrawing) return;
        if (e.touches.length === 1) {
            const size = e.touches[0];
            const box = this.canvas.getBoundingClientRect();
            this.drawMove({
                x: size.clientX - box.left,
                y: size.clientY - box.top
            });
        }
    }

    /**
     * 触摸结束
     * @param {TouchEvent} e
     */
    private onTouchEnd(e: TouchEvent): void {
        e.preventDefault();
        if (!this.isDrawing) return;
        if (e.touches.length === 1) {
            const size = e.touches[0];
            const box = this.canvas.getBoundingClientRect();
            this.drawEnd({
                x: size.clientX - box.left,
                y: size.clientY - box.top
            });
        }
    }

    /**
     * 整个文档抬起事件
     */
    private documentUp(): void {
        this.isDrawing = false;
        // 如果节点被销毁了，那就取消`document`的绑定事件
        if (!document.body.contains(this.canvas)) {
            document.removeEventListener('mouseup', this.documentUp.bind(this));
            document.removeEventListener('touchend', this.documentUp.bind(this));
        }
    }

    /**
     * 添加事件监听器
     */
    private addEventListeners(): void {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
        document.addEventListener('mouseup', this.documentUp.bind(this));
        document.addEventListener('touchend', this.documentUp.bind(this));
    }

    /**
     * 重置签名版
     */
    public reset(): void {
        this.hasDraw = false;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.setStyle();
    }

    /**
     * 生成图片
     * @param imageType 图片类型
     * @returns
     */
    public getBase64(imageType: string = 'image/jpeg'): string {
        return this.hasDraw ? this.canvas.toDataURL(imageType) : '';
    }

    /**
     * 获取Blob对象
     * @param imageType 图片类型
     * @returns
     */
    public getBlob(imageType: string = 'image/jpeg'): Blob {
        const base64 = this.getBase64(imageType);
        return base64ToBlobOrFile(base64, 'blob', 'signature');
    }

    /**
     * 获取File对象
     * @param imageType 图片类型
     * @param filename 文件名
     * @returns
     */
    public getFile(imageType: string = 'image/jpeg', filename: string = 'signature'): File {
        const base64 = this.getBase64(imageType);
        return base64ToBlobOrFile(base64, 'file', filename) as File;
    }

    /**
     * 获取canvas实例
     */
    public getCanvas(): HTMLCanvasElement {
        return this.canvas;
    }
}
