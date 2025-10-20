import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {vertexShader, fragmentShader} from './constant';
import { isNil } from 'lodash-es';
import { IData } from './type';

interface Earth3DOptions {
    canvas: HTMLCanvasElement;
}
declare module 'three' {
    interface Mesh {
        curve: THREE.CubicBezierCurve3;
        _s: number;
    }
    interface BufferGeometry {
        currentPos: number;
        pointSpeed: number;
    }
    interface Object3D {
        _s: number;
        _y?: number;
        curve?: THREE.CubicBezierCurve3;
    }
}
interface CustomObject3D extends THREE.Object3D {
    _y?: number;
    _s: number;
}



function getDefaultNumber(num: number | undefined) {
    if (isNil(num)) {
        return 0;
    }
    return num;
}
function getUrlObject(path: string) {
    const data = new URL(path, import.meta.url);
    return data;
}
export class Earth3D {
    private canvas!: HTMLCanvasElement;
    options!: Earth3DOptions;
    private scene!: THREE.Scene;
    private camera!: THREE.PerspectiveCamera;
    private renderer!: THREE.WebGLRenderer;
    private textureLoader!: THREE.TextureLoader;
    // private light!: THREE.AmbientLight;
    private controls!: OrbitControls;

    // 旋转队列
    rotateSlowArr: CustomObject3D[] = [];
    // 放大并透明 队列
    bigByOpacityArr: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial, THREE.Object3DEventMap>[] = [];
    // 移动 队列
    moveArr: THREE.Object3D<THREE.Object3DEventMap>[] = [];

    // 边界 绘制点集合
    lines: number[][] = [];
    // 炫光粒子 几何体
    geometryLz = new THREE.BufferGeometry();
    // 炫光粒子 透明度
    opacityList!: Float32Array<ArrayBuffer>;

    // 地球，月亮 3D层
    landOrbitObject = new THREE.Object3D();
    // 地球3D层
    earthObject: CustomObject3D = new THREE.Object3D();
    // 月亮3D层
    moonObject: CustomObject3D = new THREE.Object3D();
    // 地球半径
    globeRadius = 5;

    constructor(options: Earth3DOptions) {
        this.options = options;
        this.canvas = options.canvas;
    }

    get width() {
        return this.canvas.clientWidth;
    }
    get height() {
        return this.canvas.clientHeight;
    }

    /**
     * 初始化渲染器
     * */
    initRenderer(canvas: HTMLCanvasElement, width: number, height: number) {
        // antialias: true, alpha: true 抗锯齿设置
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
        // window.devicePixelRatio 设备像素比
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        return renderer;
    }
    /**
     * 初始化相机
     */
    initCamera(width: number, height: number) {
        // new THREE.PerspectiveCamera(
        //     75,
        //     width / height,
        //     0.1,
        //     1000
        // );
        const camera = new THREE.PerspectiveCamera(45, width / height, 1, 10000)
        camera.position.set(5, -20, 200)
        camera.lookAt(0, 3, 0)
        return camera;
    }
    /**
     * 初始化场景
     */
    initScene() {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x020924);
        // 雾
        // scene.fog = new THREE.Fog(0x020924, 200, 1000)
        return scene;
    }
    /**
       * 初始化 相机控制
       */
    initControls(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true;
        controls.enableZoom = true;
        controls.autoRotate = false;
        controls.autoRotateSpeed = 2;
        controls.enablePan = true;
        return controls;
    }

    /**
     * 初始化光
     */
    initLight(scene: THREE.Scene) {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xcccccc, 0.2);
        scene.add(ambientLight);
        // 平行光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.2);
        directionalLight.position.set(1, 0.1, 0).normalize();
        // 平行光2
        const directionalLight2 = new THREE.DirectionalLight(0xff2ffff, 0.2);
        directionalLight2.position.set(1, 0.1, 0.1).normalize();
        scene.add(directionalLight);
        scene.add(directionalLight2);
        // 半球光
        const heMiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.2);
        heMiLight.position.set(0, 1, 0);
        scene.add(heMiLight);
        // 平行光3
        const directionalLight3 = new THREE.DirectionalLight(0xffffff);
        directionalLight3.position.set(1, 500, -20);
        // 开启阴影
        directionalLight3.castShadow = true;
        // 设置光边界
        directionalLight3.shadow.camera.top = 18;
        directionalLight3.shadow.camera.bottom = -10;
        directionalLight3.shadow.camera.left = -52;
        directionalLight3.shadow.camera.right = 12;
        scene.add(directionalLight3);
    }
    createThreeApp = () => {
        // 纹理加载器
        this.textureLoader = new THREE.TextureLoader();
        // 场景
        this.scene = this.initScene();
        // 相机
        this.camera = this.initCamera(this.width, this.height);
        
        // 渲染器
        this.renderer = this.initRenderer(this.canvas, this.width, this.height);
        // document.body.appendChild(this.renderer.domElement);

        // 相机控制
        this.controls = this.initControls(this.camera, this.renderer);
        // 初始化灯光
        this.initLight(this.scene);
    };

    /**
     * 渲染函数
     * */
    renders(time: number) {
        time *= 0.003
        // 3D对象 旋转
        // _y 初始坐标 _s 旋转速度
        this.rotateSlowArr.forEach((obj) => {
          obj.rotation.y = getDefaultNumber(obj._y) + time * getDefaultNumber(obj._s);
        });
        this.bigByOpacityArr.forEach((mesh) => {
            //  目标 圆环放大 并 透明
            mesh._s += 0.01;
            mesh.scale.set(1 * mesh._s, 1 * mesh._s, 1 * mesh._s);
            if (mesh._s <= 2) {
                mesh.material.opacity = 2 - mesh._s;
            }
            else {
                mesh._s = 1;
            }
        })
        this.moveArr.forEach ((mesh) => {
            if (!mesh.curve) {
                return;
            }
            mesh._s += 0.01;
            let tankPosition = new THREE.Vector3();
            tankPosition = mesh.curve.getPointAt(mesh._s % 1);
            mesh.position.set(tankPosition.x, tankPosition.y, tankPosition.z);
        });

        if (this.geometryLz.attributes.position) {
            this.geometryLz.currentPos += this.geometryLz.pointSpeed;
            for (let i = 0; i < this.geometryLz.pointSpeed; i++) {
                this.opacityList[(this.geometryLz.currentPos - i) % this.lines.length] = 0;
            }

            for (let i = 0; i < 200; i++) {
                this.opacityList[(this.geometryLz.currentPos + i) % this.lines.length] = (
                    i / 50 > 2 ? 2 : i / 50
                );
            }
            this.geometryLz.attributes.aOpacity.needsUpdate = true;
        }

        this.renderer.clear();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 动画渲染函数
     */
    animate() {
        window.requestAnimationFrame((time) => {
            if (this.controls) {
                this.controls.update();
            }

            this.renders(time);
            this.animate();
        });
    }

    /**
     * 创建 方形纹理
     * */
    generateSprite() {
        const canvas = document.createElement('canvas');
        canvas.width = 16;
        canvas.height = 16;

        const context = canvas.getContext('2d') as CanvasRenderingContext2D;
        // 创建颜色渐变
        const gradient = context.createRadialGradient(
            canvas.width / 2,
            canvas.height / 2,
            0,
            canvas.width / 2,
            canvas.height / 2,
            canvas.width / 2
        );
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.2, 'rgba(0,255,255,1)');
        gradient.addColorStop(0.4, 'rgba(0,0,64,1)');
        gradient.addColorStop(1, 'rgba(0,0,0,1)');

        // 绘制方形
        context.fillStyle = gradient;
        context.fillRect(0, 0, canvas.width, canvas.height);
        // 转为纹理
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        return texture;
    }

    /**
     * 背景绘制
     * */
    drawingBackground() {
        const positions = [];
        const colors = [];
        // 创建 几何体
        const geometry = new THREE.BufferGeometry();
        for (let i = 0; i < 10000; i++) {
            const vertex = new THREE.Vector3();
            vertex.x = Math.random() * 2 - 1;
            vertex.y = Math.random() * 2 - 1;
            vertex.z = Math.random() * 2 - 1;
            positions.push(vertex.x, vertex.y, vertex.z);
        }
        // 对几何体 设置 坐标 和 颜色
        geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3)
        );
        // 默认球体
        geometry.computeBoundingSphere();

        // 星星资源图片
        // ParticleBasicMaterial 点基础材质
        const starsMaterial = new THREE.PointsMaterial({
            map: this.generateSprite(),
            size: 2,
            transparent: true,
            opacity: 1,
            //true：且该几何体的colors属性有值，则该粒子会舍弃第一个属性--color，而应用该几何体的colors属性的颜色
            // vertexColors: true,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        // 粒子系统 网格
        const stars = new THREE.Points(geometry, starsMaterial);
        stars.scale.set(300, 300, 300);
        this.scene.add(stars);
    }

    
    /**
     * 球相关加载
     * */
    drawEarthAndMoon() {
        const radius = this.globeRadius;
        const widthSegments = 100
        const heightSegments = 100
        const sphereGeometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments)

        // 地球
        const earthTexture = this.textureLoader.load(getUrlObject('./img/3.jpg').href);
        const earthMaterial = new THREE.MeshStandardMaterial({
            map: earthTexture,
        });
        const earthMesh = new THREE.Mesh(sphereGeometry, earthMaterial);

        // 月球
        const moonTexture = this.textureLoader.load(getUrlObject('./img/2.jpg').href);
        const moonMaterial = new THREE.MeshPhongMaterial({ map: moonTexture });
        const moonMesh = new THREE.Mesh(sphereGeometry, moonMaterial);
        moonMesh.scale.set(0.1, 0.1, 0.1);
        moonMesh.position.x = 10;

        this.moonObject.add(moonMesh);
        // 加入动画队列
        this.moonObject._y = 0;
        this.moonObject._s = 1;
        this.rotateSlowArr.push(this.moonObject);

        // 地球加入 地球3D层
        this.earthObject.add(earthMesh);
        // 地球旋转角度
        this.earthObject.rotation.set(0.5, 2.9, 0.1);
        this.earthObject._y = 2.0;
        this.earthObject._s = 0.1;
        // 加入动画队列
        // rotateSlowArr.push(earthObject)

        // 加入 地球3D层
        this.landOrbitObject.add(this.earthObject);
        // 加入 月亮3D层
        this.landOrbitObject.add(this.moonObject);

        this.scene.add(this.landOrbitObject);
    }

    /**
     * 经维度 转换坐标
     * THREE.Spherical 球类坐标
     * lng: 经度
     * lat: 维度
     * radius: 地球半径
     */
    lglt2xyz(lng: number, lat: number, radius: number) {
        // 以z轴正方向为起点的水平方向弧度值
        const theta = (90 + lng) * (Math.PI / 180)
        // 以y轴正方向为起点的垂直方向弧度值
        const phi = (90 - lat) * (Math.PI / 180)

        return new THREE.Vector3().setFromSpherical(
            new THREE.Spherical(radius, phi, theta)
        );
    }

    /**
     * 绘制 目标点
     * */
    spotCircle(spot: number[]) {
        // 圆
        const geometry1 = new THREE.CircleGeometry(0.02, 100);
        const material1 = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide });
        const circle = new THREE.Mesh(geometry1, material1);
        circle.position.set(spot[0], spot[1], spot[2]);
        // mesh在球面上的法线方向(球心和球面坐标构成的方向向量)
        const coordVec3 = new THREE.Vector3(spot[0], spot[1], spot[2]).normalize();
        // mesh默认在XOY平面上，法线方向沿着z轴new THREE.Vector3(0, 0, 1)
        const meshNormal = new THREE.Vector3(0, 0, 1);
        // 四元数属性.quaternion表示mesh的角度状态
        //.setFromUnitVectors();计算两个向量之间构成的四元数值
        circle.quaternion.setFromUnitVectors(meshNormal, coordVec3);
        this.earthObject.add(circle);

        // 圆环
        const geometry2 = new THREE.RingGeometry(0.03, 0.04, 100);
        // transparent 设置 true 开启透明
        const material2 = new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true });
        const circleY = new THREE.Mesh(geometry2, material2);
        circleY.position.set(spot[0], spot[1], spot[2]);

        // 指向圆心
        circleY.lookAt(new THREE.Vector3(0, 0, 0));
        this.earthObject.add(circleY);
        // 加入动画队列
        this.bigByOpacityArr.push(circleY);
    }

    /**
     * 绘制 两个目标点并连线
     * */
    lineConnect(posStart: number[], posEnd: number[]) {
        const v0 = this.lglt2xyz(posStart[0], posStart[1], this.globeRadius);
        const v3 = this.lglt2xyz(posEnd[0], posEnd[1], this.globeRadius);

        // angleTo() 计算向量的夹角
        const angle = v0.angleTo(v3);
        let vTop = v0.clone().add(v3);
        // multiplyScalar 将该向量与所传入的 标量进行相乘
        vTop = vTop.normalize().multiplyScalar(this.globeRadius);

        let n: number = 0;
        if (angle <= 1) {
            n = (this.globeRadius / 5) * angle;
        }
        else if (angle > 1 && angle < 2) {
            n = (this.globeRadius / 5) * Math.pow(angle, 2);
        }
        else {
            n = (this.globeRadius / 5) * Math.pow(angle, 1.5);
        }

        const v1 = v0
            .clone()
            .add(vTop)
            .normalize()
            .multiplyScalar(this.globeRadius + n);
        const v2 = v3
            .clone()
            .add(vTop)
            .normalize()
            .multiplyScalar(this.globeRadius + n);
        // 三维三次贝塞尔曲线(v0起点，v1第一个控制点，v2第二个控制点，v3终点)
        const curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3);

        // 绘制 目标位置
        this.spotCircle([v0.x, v0.y, v0.z]);
        this.spotCircle([v3.x, v3.y, v3.z]);
        this.moveSpot(curve);

        const lineGeometry = new THREE.BufferGeometry();
        // 获取曲线 上的50个点
        const points = curve.getPoints(50);
        const positions = [];
        const colors = [];
        const color = new THREE.Color();

        // 给每个顶点设置演示 实现渐变
        for (var j = 0; j < points.length; j++) {
            color.setHSL(0.81666 + j, 0.88, 0.715 + j * 0.0025) // 粉色
            colors.push(color.r, color.g, color.b)
            positions.push(points[j].x, points[j].y, points[j].z)
        }
        // 放入顶点 和 设置顶点颜色
        lineGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3, true));
        lineGeometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3, true));

        const material = new THREE.LineBasicMaterial({ vertexColors: true, side: THREE.DoubleSide });
        const line = new THREE.Line(lineGeometry, material);

        this.earthObject.add(line);
    }

    /**
     * 线上移动物体
     * */
    moveSpot(curve: THREE.CubicBezierCurve3) {
        // 线上的移动物体
        const aGeo = new THREE.SphereGeometry(0.04, 0.04, 0.04);
        const aMater = new THREE.MeshPhongMaterial({ color: 0xff0000, side: THREE.DoubleSide });
        const aMesh = new THREE.Mesh(aGeo, aMater);
        // 保存曲线实例
        aMesh.curve = curve;
        aMesh._s = 0;

        this.moveArr.push(aMesh);
        this.earthObject.add(aMesh);
    }

    /**
     * 画图
     * */
    drawChart() {
        const markPos = this.lglt2xyz(106.553091, 29.57337, 5);
        // 目标点
        this.spotCircle([markPos.x, markPos.y, markPos.z]);
        let markPos2 = this.lglt2xyz(106.553091, 33.57337, 5);
        // 目标点
        this.spotCircle([markPos2.x, markPos2.y, markPos2.z]);
        let markPos3 = this.lglt2xyz(111.553091, 29.57337, 5);
        // 目标点
        this.spotCircle([markPos3.x, markPos3.y, markPos3.z]);

        this.lineConnect([121.48, 31.23], [116.4, 39.91]);
        this.lineConnect([121.48, 31.23], [121.564136, 25.071558]);
        this.lineConnect([121.48, 31.23], [104.896185, 11.598253]);
        this.lineConnect([121.48, 31.23], [130.376441, -16.480708]);
        this.lineConnect([121.48, 31.23], [-71.940328, -13.5304]);
        this.lineConnect([121.48, 31.23], [-3.715707, 40.432926]);
    }

    /**
     * 边界炫光路径
     * */
    dazzleLight() {
        const href = getUrlObject('./file/100000.json').href;
        const loader = new THREE.FileLoader();
        loader.load(href, (data) => {
            const jsonData = JSON.parse(data as string) as IData;
            console.log('🚀 ~ file: index.html:454 ~ loader.load ~ jsonData:', jsonData);

            // 中国边界
            const feature = jsonData.features[0];
            const province = new THREE.Object3D() as THREE.Object3D & { properties: string };
            province.properties = feature.properties.name
            // 点数据
            const coordinates = feature.geometry.coordinates;

            coordinates.forEach((coordinate) => {
                // coordinate 多边形数据
                coordinate.forEach((rows) => {
                    // 绘制线
                    const line = this.lineDraw(rows, 0xaa381e);
                    province.add(line);
                });
            })
            // 添加地图边界
            this.earthObject.add(province);

            // 拉平 为一维数组
            const positions = new Float32Array(this.lines.flat(1));
            // 设置顶点
            this.geometryLz.setAttribute('position', new THREE.BufferAttribute(positions, 3))
            // 设置 粒子透明度为 0
            const opacityArray = new Float32Array(positions.length).map(() => 0);
            this.geometryLz.setAttribute('aOpacity', new THREE.BufferAttribute(opacityArray, 1));

            this.opacityList = opacityArray;

            this.geometryLz.currentPos = 0;
            // 炫光移动速度
            this.geometryLz.pointSpeed = 20;

            // 控制 颜色和粒子大小
            const params = {
                pointSize: 2.0,
                pointColor: '#4ec0e9'
            };

            // 创建着色器材质
            const material = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                transparent: true, // 设置透明
                uniforms: {
                    uSize: {
                        value: params.pointSize
                    },
                    uColor: {
                        value: new THREE.Color(params.pointColor)
                    },
                },
            });
            const points = new THREE.Points(this.geometryLz, material);

            this.earthObject.add(points);
        });
    }

    /**
     * 边框 图形绘制
     * @param polygon 多边形 点数组
     * @param color 材质颜色
     * */
    indexBol = true;
    lineDraw(polygon: any[], color: number) {
        const lineGeometry = new THREE.BufferGeometry();
        const pointsArray = new Array();
        polygon.forEach((row) => {
            // 转换坐标
            const xyz = this.lglt2xyz(row[0], row[1], this.globeRadius);;
            // 创建三维点
            pointsArray.push(xyz);

            if (this.indexBol) {
                // 为了好看 这里只要内陆边界
                this.lines.push([xyz.x, xyz.y, xyz.z]);
            }
        })

        this.indexBol = false;

        // 放入多个点
        lineGeometry.setFromPoints(pointsArray);

        const lineMaterial = new THREE.LineBasicMaterial({
            color: color,
        });
        return new THREE.Line(lineGeometry, lineMaterial);
    }


    /**
     * 页面加载完成后执行的方法
     */
    onload = () => {
        // 初始化 three.js 场景
        this.createThreeApp();

        // 绘制
        this.drawingBackground();
        this.drawEarthAndMoon();
        this.drawChart();
        this.dazzleLight();

        // 渲染
        this.animate();
    }
}
