import * as THREE from 'three';
import { unloadModel } from './other';
import { PersonModel } from './person-model';
import { GUI } from './gui';
import { MOTION } from './constant';
import { BaseScene } from './base-scene';

interface InitThreeParams {
  id: string;
}

export class InitThree extends BaseScene {
  params: InitThreeParams;
  /**
   * gui 实例
   */
  gui: GUI;
  /**
   * 是否碰撞
   */
  // isCollision: boolean;
  personModelInstance: InstanceType<typeof PersonModel>;

  constructor(params: InitThreeParams) {
    if (!params.id) console.error('未传递id');
    super(params.id);
    this.params = params;
    // this.isCollision = false;
    this.personModelInstance = new PersonModel();

    // 创建一个 GUI
    this.gui = GUI.getInstance();
  }

  init() {
    super.baseInit();

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
    this.personModelInstance.render(this);

    this.guiInit();
    this.render();
  }

  guiInit() {
    // 添加一个文件夹
    const folder = this.gui.addFolder('运动');
    folder.open(); // 可选：默认展开文件夹
    // 在文件夹中添加控制器
    folder.add(MOTION, 'GRAVITY', 1, 20, 1).name('重力');
    folder.add(MOTION, 'GRAVITY_VELOCITY', 1, 20, 1).name('重力速度');
  }

  unload() {
    unloadModel.call(this);
    super.destroy();
    this.gui.destroy();
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
