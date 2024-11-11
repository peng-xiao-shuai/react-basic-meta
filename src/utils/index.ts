// react-basic-meta/src/utils/index.ts
/**
 * @author: peng-xiao-shuai
 * @date: 2023-10-25 17:50:42
 * @last Modified by: peng-xiao-shuai
 * @last Modified time: 2023-10-25 17:50:42
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons';
import { unloadModel } from './other';
import { PersonModel } from './person-model';

interface InitThreeParams {
  id: string;
}

export class InitThree {
  params: InitThreeParams;
  container: HTMLElement;
  w_h: { w: number; h: number };
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene | null;
  controls: OrbitControls | null;

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
  /**
   * 是否碰撞
   */
  // isCollision: boolean;
  updateSize: () => void;

  personModelInstance: InstanceType<typeof PersonModel>;

  constructor(params: InitThreeParams) {
    if (!params.id) console.error('未传递id');
    this.params = params;
    this.container = document.getElementById(this.params.id) as HTMLElement;

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
    // this.isCollision = false;
    // 创建一个 GUI
    // this.gui = new dat.GUI()
    this.personModelInstance = new PersonModel();

    this.updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Update camera aspect ratio
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();

      // Update renderer size
      this.renderer.setSize(width, height);
    };
  }

  init() {
    const { w, h } = this.w_h;
    this.renderer.setPixelRatio(this.devicePixelRatio);
    this.renderer.setSize(w, h);
    // 添加dom
    this.container.appendChild(this.renderer.domElement);

    // 关闭影子
    this.renderer.shadowMap.enabled = false;

    // 环境光
    const ALight = new THREE.AmbientLight('#93cbe7', 5);
    this.scene!.add(ALight);

    const dlight = new THREE.DirectionalLight('#f1faff', 1);
    dlight.position.set(0, 16, 20);
    dlight.castShadow = true;
    this.scene!.add(dlight);

    if (process.env.NODE_ENV === 'development') {
      const axesHelper = new THREE.AxesHelper(500);
      this.scene!.add(axesHelper);
    }

    // 轨道控制器
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.maxPolarAngle = Math.PI / 2.2;
    this.controls.minPolarAngle = Math.PI / 3;
    this.controls.maxDistance = 30;
    this.controls.minDistance = 25;

    // this.controls.enableZoom = false
    // this.controls.enablePan = false
    // this.controls.enableDamping = false
    // this.controls.dampingFactor = 0.05
    this.personModelInstance.render(this);
    this.resize();
    this.render();
  }
  resize() {
    window.addEventListener('resize', this.updateSize);
  }

  unload() {
    unloadModel.call(this);
    this.container.removeChild(this.renderer.domElement);
  }

  render() {
    this.frameId = requestAnimationFrame(this.render.bind(this));
    this.personModelInstance.animate(this);
    // if (this.obstacleModel) {
    //   // 检测角色前方的碰撞，我们可以使用角色的前方向量
    //   // 如果角色的前方是沿着Z轴，我们可以这样设置方向
    //   const direction = new THREE.Vector3(0, 0, -1);
    //   direction.applyQuaternion(this.personModel!.scene.quaternion);

    //   const intersect = createRaycaster(
    //     this.personModel!.scene.position.clone().setY(5),
    //     direction.normalize().negate(),
    //     this.collisionMesh,
    //     (ray) => {
    //       // ray.params.Line.threshold = RADIAL.THRESHOLD;
    //       // ray.far = RADIAL.FAR;
    //       // // 辅助射线线
    //       // if (arrowHelper) this.scene?.remove(arrowHelper);
    //       // // 创建一个ArrowHelper来可视化射线
    //       // arrowHelper = new THREE.ArrowHelper(
    //       //   ray.ray.direction, // 射线的方向
    //       //   ray.ray.origin, // 射线的起点
    //       //   ray.far, // 射线的长度
    //       //   0xff0000 // 射线的颜色，这里使用红色
    //       // );
    //     }
    //   );

    //   if (intersect?.distance) {
    //     // arrowHelper?.setLength(intersect?.distance);
    //     // 将这个ArrowHelper添加到场景中
    //     // this.scene?.add(arrowHelper!);
    //     this.isCollision = intersect.distance < RADIAL.MIN_DISTANCE_TO_OBJECT;
    //   }
    // }

    this.renderer.render(this.scene!, this.camera);
  }
}
