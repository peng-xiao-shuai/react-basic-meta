// react-basic-meta/src/utils/index.ts
/**
 * @author: peng-xiao-shuai
 * @date: 2023-10-25 17:50:42
 * @last Modified by: peng-xiao-shuai
 * @last Modified time: 2023-10-25 17:50:42
 */
import * as THREE from 'three';
import { GLTF, OrbitControls } from 'three/addons';
import { createRaycaster, loadModel, unloadModel } from './other';
import { pressKeyOperate, getKeyDirection, walk, jump } from './action';
import { switchAction } from './animation';
import { MOTION, RADIAL } from './constant';

let arrowHelper: null | THREE.ArrowHelper;
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
  mixer: THREE.AnimationMixer | null;
  // actions: Record<string, any>; // 暂时没用到
  activeAction: THREE.AnimationAction | null;
  /**
   * requestAnimationFrame id, 用于停止
   */
  frameId: number;
  /**
   * 帧数之间时间
   */
  clock: THREE.Clock;
  /**
   * 人物模型包含动画数据
   */
  personModel: GLTF | null;
  /**
   * 场景模型
   */
  sceneModel: GLTF | null;
  /**
   * 障碍地形模型
   */
  obstacleModel: GLTF | null;
  /**
   * 分辨率
   */
  devicePixelRatio: number;
  /**
   * 存储地板数据
   */
  floorMesh: THREE.Mesh[];
  /**
   * 碰撞的障碍物
   */
  collisionMesh: THREE.Mesh[];
  /**
   * 是否碰撞
   */
  isCollision: boolean;

  // 添加新的属性
  boundingBox: THREE.Box3 | null;
  boxHelper: THREE.Box3Helper | null;
  // @ts-expect-error 此数据在 jump 函数中初始化。floorRayPause在 render 初始化
  jumpData: {
    /**
     * 跳跃时暂停射线
     */
    floorRayPause: boolean;
    /**
     * 地板位置 =》 起跳位置
     */
    floorTopPosition: number;
    /**
     * 跳跃更新函数
     */
    updateJump: () => void;
  };
  updateSize: () => void;

  constructor(params: InitThreeParams) {
    if (!params.id) console.error('未传递id');
    this.params = params;
    this.container = document.getElementById(this.params.id) as HTMLElement;

    this.w_h = {
      w: this.container.clientWidth || window.innerWidth,
      h: this.container.clientHeight || window.innerHeight,
    };

    this.boundingBox = null;
    this.boxHelper = null;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setClearColor('#000000');

    this.camera = new THREE.PerspectiveCamera(55, this.w_h.w / this.w_h.h);

    this.scene = new THREE.Scene();

    this.controls = null;
    this.mixer = null;
    // this.actions = {};
    this.activeAction = null;
    this.frameId = 0;
    this.clock = new THREE.Clock();
    this.personModel = null;
    this.sceneModel = null;
    this.obstacleModel = null;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.floorMesh = [];
    this.collisionMesh = [];
    this.isCollision = false;

    // 创建一个 GUI
    // this.gui = new dat.GUI()

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
    this.resize();
    this.loadScene();
    this.loadObstacle();
    this.render();
  }

  loadScene() {
    loadModel('scene.glb').then((data) => {
      this.sceneModel = data;
      data.scene.visible = false;
      // 设置阴影
      data.scene.castShadow = true;
      this.scene?.add(this.sceneModel.scene);
    });
  }

  /**
   * 障碍地形
   */
  loadObstacle() {
    loadModel('terrains.glb').then((data) => {
      this.obstacleModel = data;
      const sceneMesh = data.scene;
      // sceneMesh.visible = false

      // 获取地板, 固定 下标 1 为地板
      this.floorMesh = [sceneMesh.children[1] as THREE.Mesh];
      // 获取障碍物, 固定 下标 0 为障碍物
      this.collisionMesh = [sceneMesh.children[0] as THREE.Mesh];
      this.scene?.add(sceneMesh);
    });
  }

  /**
   * 加载人物模型
   * @param {string} modeName 模型文件名称
   */
  load(modeName: string) {
    loadModel(modeName).then((data) => {
      data.scene.name = 'personModel';
      this.personModel = data;
      const personMesh = data.scene;

      this.boundingBox = new THREE.Box3().setFromObject(personMesh);
      this.boxHelper = new THREE.Box3Helper(
        this.boundingBox,
        new THREE.Color(0xffff00)
      );
      this.scene?.add(this.boxHelper);
      this.scene?.add(this.personModel.scene);
      /**
       * playerMesh.add(this.camera)
       * 这里不需要将镜头给到模型, this.controls.target.copy(position) 轨道控制器会将焦点指向 personModel.position
       * 在通过 this.controls.maxDistance、this.controls.minDistance 限制与模型之间距离可以达到轨道控制器跟随模型
       * 不加限制距离的话轨道控制器位置不会改变
       */

      // 相机初始位置跟随人物位置
      this.camera.position.set(
        personMesh.position.x,
        personMesh.position.y + 15,
        personMesh.position.z - 30
      );

      /**
       * 按键操作模块
       */
      pressKeyOperate.call(this, this.personModel.scene, {
        move: (key) => {
          // 执行转向模块
          const cameraDirection = getKeyDirection.call(this, key);
          walk.call(this, cameraDirection);

          if (this.isCollision) {
            this.personModel?.scene.translateZ(-MOTION.MOVE_SPEED);
          }
        },
        down: () => {
          switchAction.call(this, 'Walking');
        },
        stop: () => {
          switchAction.call(this, 'Idle');
        },
      });

      // 增加相关动作
      this.mixer = new THREE.AnimationMixer(personMesh);
      this.activeAction = this.mixer.clipAction(data.animations[0]);
      this.activeAction.clampWhenFinished = true;
      // this.activeAction.loop = THREE.LoopOnce
      this.activeAction.play();

      jump.call(this);
    });
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

    if (this.personModel) {
      // 更新跳跃
      if (this.jumpData.updateJump) this.jumpData.updateJump();

      // 更新边界框
      if (this.boundingBox && this.boxHelper)
        this.boundingBox.setFromObject(this.personModel.scene);

      const { position } = this.personModel.scene;
      // 发送人物垂直射线，使其人物一直在地板上
      const intersect = createRaycaster(
        this.personModel.scene.position
          .clone()
          .setY(position.y + RADIAL.FLOOR_RAY_ORIGIN_HEIGHT),
        new THREE.Vector3(0, -1, 0),
        this.floorMesh
      );

      // 设置人物模型 Y 位置
      if (intersect?.distance) {
        const offsetHeight =
          intersect.distance - RADIAL.FLOOR_RAY_ORIGIN_HEIGHT;

        // 设置地板位置数据
        this.jumpData.floorTopPosition = position.y - offsetHeight;

        // 跳跃时暂停将模型y轴贴地
        if (!this.jumpData.floorRayPause) {
          position.y -= offsetHeight;
        }
      }

      // 确保相机始终看向模型
      this.controls?.target.copy(position);
      this.controls?.update();
    }

    if (this.obstacleModel) {
      // 检测角色前方的碰撞，我们可以使用角色的前方向量
      // 如果角色的前方是沿着Z轴，我们可以这样设置方向
      const direction = new THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(this.personModel!.scene.quaternion);

      const intersect = createRaycaster(
        this.personModel!.scene.position.clone().setY(5),
        direction.normalize().negate(),
        this.collisionMesh,
        (ray) => {
          ray.params.Line.threshold = RADIAL.THRESHOLD;
          ray.far = RADIAL.FAR;

          // 辅助射线线
          if (arrowHelper) this.scene?.remove(arrowHelper);
          // 创建一个ArrowHelper来可视化射线
          arrowHelper = new THREE.ArrowHelper(
            ray.ray.direction, // 射线的方向
            ray.ray.origin, // 射线的起点
            ray.far, // 射线的长度
            0xff0000 // 射线的颜色，这里使用红色
          );
        }
      );

      if (intersect?.distance) {
        arrowHelper?.setLength(intersect?.distance);
        // 将这个ArrowHelper添加到场景中
        this.scene?.add(arrowHelper!);
        this.isCollision = intersect.distance < RADIAL.MIN_DISTANCE_TO_OBJECT;
      }
    }

    // 动画直接混合，使两帧动画之间流畅。this.clock.getDelta() 获取帧动画直接时间
    if (this.mixer && this.mixer.update)
      this.mixer.update(this.clock.getDelta());
    this.renderer.render(this.scene!, this.camera);
  }
}
