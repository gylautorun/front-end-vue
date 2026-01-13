import { WindowManager, WindowShape } from './window-manager';
import * as THREE from 'three';

export class RenderMore3DScene {
    private t = THREE;
    private camera: THREE.OrthographicCamera | null = null;
    private scene: THREE.Scene | null = null;
    private renderer: THREE.WebGLRenderer | null = null;
    private world: THREE.Object3D | null = null;
    private near!: number;
    private far!: number;
    private pixR: number = window.devicePixelRatio ? window.devicePixelRatio : 1;
    private cubes: THREE.Mesh[] = [];
    private sceneOffsetTarget = { x: 0, y: 0 };
    private sceneOffset = { x: 0, y: 0 };
    private today: number;
    private internalTime: number;
    private windowManager: WindowManager | null = null;
    private initialized: boolean = false;
    container: HTMLElement = document.body;

    constructor(private sceneContainer: HTMLElement) {
        this.today = this.getTodayTime();
        this.internalTime = this.getTime();
        this.container = sceneContainer || this.container;
    }

    private getTodayTime(): number {
        const todayDate = new Date();
        todayDate.setHours(0);
        todayDate.setMinutes(0);
        todayDate.setSeconds(0);
        todayDate.setMilliseconds(0);
        return todayDate.getTime();
    }

    // get time in seconds since beginning of the day (so that all windows use the same time)
    private getTime(): number {
        return (new Date().getTime() - this.today) / 1000.0;
    }

    public init(): void {
        if (new URLSearchParams(window.location.search).get('clear')) {
            this.windowManager?.clearLocalStorage();
        } else {
            // this code is essential to circumvent that some browsers preload the content of some pages before you actually hit the url
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState != 'hidden' && !this.initialized) {
                    this.initializeScene();
                }
            });

            window.addEventListener('load', () => {
                if (document.visibilityState != 'hidden') {
                    this.initializeScene();
                }
            });
        }
    }

    private initializeScene(): void {
        this.initialized = true;

        // add a short timeout because window.offsetX reports wrong values before a short period
        setTimeout(() => {
            this.setupScene();
            this.setupWindowManager();
            this.resize();
            this.updateWindowShape(false);
            this.render();
            window.addEventListener('resize', this.resize);
        }, 500);
    }

    private setupScene(): void {
        this.camera = new this.t.OrthographicCamera(
            0,
            0,
            window.innerWidth,
            window.innerHeight,
            -10000,
            10000
        );

        this.camera.position.z = 2.5;
        this.near = this.camera.position.z - 0.5;
        this.far = this.camera.position.z + 0.5;

        this.scene = new this.t.Scene();
        this.scene.background = new this.t.Color(0.0);
        this.scene.add(this.camera);

        // depth替代depthBuffer（Three.js 0.175.0版本重命名）
        this.renderer = new this.t.WebGLRenderer({ antialias: true, depth: true });
        this.renderer.setPixelRatio(this.pixR);

        this.world = new this.t.Object3D();
        this.scene.add(this.world);

        this.renderer.domElement.setAttribute('id', 'scene');
        this.container.appendChild(this.renderer.domElement);
    }

    private setupWindowManager(): void {
        this.windowManager = new WindowManager();
        this.windowManager.setWinShapeChangeCallback(
            (id: number, shape: WindowShape, easing: boolean = true) => {
                this.updateWindowShape(easing);
            }
        );
        this.windowManager.setWinChangeCallback(() => {
            this.windowsUpdated();
        });

        // here you can add your custom metadata to each windows instance
        const metaData = { foo: 'bar' };

        // this will init the windowmanager and add this window to the centralised pool of windows
        this.windowManager.init(metaData);

        // call update windows initially (it will later be called by the win change callback)
        this.windowsUpdated();
    }

    private windowsUpdated(): void {
        this.updateNumberOfCubes();
    }

    private updateNumberOfCubes(): void {
        if (!this.windowManager || !this.world) return;

        const wins = this.windowManager.getWindows();

        // remove all cubes
        this.cubes.forEach((c) => {
            this.world!.remove(c);
        });

        this.cubes = [];

        // add new cubes based on the current window setup
        for (let i = 0; i < wins.length; i++) {
            const win = wins[i];

            const c = new this.t.Color();
            // 将立方体颜色固定为红色： c.setHSL(0, 1.0, 0.5)
            c.setHSL(i * 0.1, 1.0, 0.5);

            // 立方体大小
            const s = 100 + i * 50;
            // 将材质的 wireframe 属性设置为 false ，使立方体不再是线框（网）形式，而是实体形式
            const cube = new this.t.Mesh(
                new this.t.BoxGeometry(s, s, s),
                new this.t.MeshBasicMaterial({ color: c, wireframe: true })
            );
            cube.position.x = win.shape.x + win.shape.w * 0.5;
            cube.position.y = win.shape.y + win.shape.h * 0.5;

            this.world.add(cube);
            this.cubes.push(cube);
        }
    }

    private updateWindowShape(easing: boolean = true): void {
        // storing the actual offset in a proxy that we update against in the render function
        this.sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
        if (!easing) this.sceneOffset = this.sceneOffsetTarget;
    }

    private render(): void {
        if (!this.scene || !this.camera || !this.renderer || !this.world || !this.windowManager)
            return;

        const t = this.getTime();

        this.windowManager.update();

        // calculate the new position based on the delta between current offset and new offset times a falloff value (to create the nice smoothing effect)
        const falloff = 0.05;
        this.sceneOffset.x =
            this.sceneOffset.x + (this.sceneOffsetTarget.x - this.sceneOffset.x) * falloff;
        this.sceneOffset.y =
            this.sceneOffset.y + (this.sceneOffsetTarget.y - this.sceneOffset.y) * falloff;

        // set the world position to the offset
        this.world.position.x = this.sceneOffset.x;
        this.world.position.y = this.sceneOffset.y;

        const wins = this.windowManager.getWindows();

        // loop through all our cubes and update their positions based on current window positions
        for (let i = 0; i < this.cubes.length; i++) {
            const cube = this.cubes[i];
            const win = wins[i];
            const _t = t; // + i * .2;

            const posTarget = {
                x: win.shape.x + win.shape.w * 0.5,
                y: win.shape.y + win.shape.h * 0.5
            };

            cube.position.x = cube.position.x + (posTarget.x - cube.position.x) * falloff;
            cube.position.y = cube.position.y + (posTarget.y - cube.position.y) * falloff;
            cube.rotation.x = _t * 0.5;
            cube.rotation.y = _t * 0.3;
        }

        this.renderer.render(this.scene, this.camera);
        requestAnimationFrame(() => this.render());
    }

    // resize the renderer to fit the window size
    private resize(): void {
        if (!this.camera || !this.renderer) return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera = new this.t.OrthographicCamera(0, width, 0, height, -10000, 10000);
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
}

export default RenderMore3DScene;
