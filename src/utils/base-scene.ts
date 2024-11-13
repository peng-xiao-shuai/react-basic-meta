import * as THREE from 'three';
import { OrbitControls } from 'three/addons';

export class BaseScene {
  container: HTMLElement;
  w_h: { w: number; h: number };
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene | null;
  controls: OrbitControls | null;
  private static instance: BaseScene;

  /**
   * requestAnimationFrame id, 用于停止
   */
  frameId: number;
  /**
   * 帧数之间时间
   */
  clock: THREE.Clock;
  /**
   * 分辨率
   */
  devicePixelRatio: number;
  updateSize: () => void;

  constructor(domId: string) {
    this.container = document.getElementById(domId) as HTMLElement;
    this.w_h = {
      w: this.container.clientWidth || window.innerWidth,
      h: this.container.clientHeight || window.innerHeight,
    };

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setClearColor('#000000');

    this.camera = new THREE.PerspectiveCamera(55, this.w_h.w / this.w_h.h);

    this.scene = new THREE.Scene();
    this.controls = null;
    this.frameId = 0;
    this.clock = new THREE.Clock();
    this.devicePixelRatio = window.devicePixelRatio || 1;

    this.updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Update camera aspect ratio
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      // Update renderer size
      this.renderer.setSize(width, height);
    };
    BaseScene.instance = this;
    // if (BaseScene.instance) {
    //   throw new Error('BaseScene 单例实例已存在');
    // } else {
    //   // 使用基类的单例
    //   const baseInstance = BaseScene.getInstance(domId);
    //   Object.assign(this, baseInstance);
    // }
  }

  /**
   * 获取 BaseScene 单例实例
   */
  public static getInstance(): BaseScene {
    return BaseScene.instance;
  }

  /**
   * 初始
   */
  public baseInit() {
    const { w, h } = this.w_h;
    this.renderer.setPixelRatio(this.devicePixelRatio);
    this.renderer.setSize(w, h);
    // 添加dom
    this.container.appendChild(this.renderer.domElement);

    // 关闭影子
    this.renderer.shadowMap.enabled = false;

    // 轨道控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minPolarAngle = Math.PI / 3;
    this.controls.maxDistance = 30;
    this.controls.minDistance = 25;
    this.controls.panSpeed = 7;
    window.addEventListener('resize', this.updateSize);
  }

  /**
   * 销毁 GUI
   */
  public destroy(): void {
    this.container.removeChild(this.renderer.domElement);
    // 清除 requestAnimationFrame
    cancelAnimationFrame(this.frameId);
    window.removeEventListener('resize', this.updateSize);
    // 清空单例实例
    BaseScene.instance = null!;
  }
}
