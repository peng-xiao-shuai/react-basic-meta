import { GLTF } from 'three/addons';
import { MOTION, RADIAL } from './constant';
import * as THREE from 'three';
import { SceneModel } from './scene-model';
import { InitThree } from '.';
import { createRaycaster, loadModel } from './other';
import { switchAction } from './animation';

/**
 * 移动方向
 */
const direction = new THREE.Vector3();
/**
 * 移动速度
 */
const velocity = new THREE.Vector3();
let arrowHelper: null | THREE.ArrowHelper;

export class PersonModel {
  /**
   * 人物模型包含动画数据
   */
  personModel: GLTF | null;
  motionData: {
    moveForward: boolean;
    moveLeft: boolean;
    moveBackward: boolean;
    moveRight: boolean;
  };
  /**
   * 是否走路动画
   */
  isWalk: boolean;

  // 添加辅助边界框
  boundingBox: THREE.Box3 | null;
  boxHelper: THREE.Box3Helper | null;

  /**
   * 动画
   */
  mixer: THREE.AnimationMixer | null;
  activeAction: THREE.AnimationAction | null;

  /**
   * 场景模型数据
   */
  sceneModelInstance: InstanceType<typeof SceneModel>;

  /**
   * 跳跃
   */
  jumping: {
    /**
     * 是否跳跃
     */
    isJumping: boolean;
    /**
     * 射线暂停
     */
    floorRayPause: boolean;
    /**
     * 跳跃速度
     */
    velocity: number;
  };
  constructor() {
    this.personModel = null;
    this.isWalk = false;
    this.motionData = {
      moveForward: false,
      moveLeft: false,
      moveBackward: false,
      moveRight: false,
    };
    this.boundingBox = null;
    this.boxHelper = null;

    this.mixer = null;
    this.activeAction = null;
    this.sceneModelInstance = new SceneModel();
    this.jumping = {
      isJumping: false,
      floorRayPause: false,
      velocity: 0,
    };
  }

  /**
   * 加载人物模型
   */
  async load() {
    try {
      const data = await loadModel('panda.glb');

      data.scene.name = 'personModel';
      this.personModel = data;
      const personMesh = data.scene;

      this.boundingBox = new THREE.Box3().setFromObject(personMesh);
      this.boxHelper = new THREE.Box3Helper(
        this.boundingBox,
        new THREE.Color(0xffff00)
      );

      document.addEventListener('keydown', this.keyDown.bind(this));
      document.addEventListener('keyup', this.keyUp.bind(this));

      /**
       * playerMesh.add(this.camera)
       * 这里不需要将镜头给到模型, this.controls.target.copy(position) 轨道控制器会将焦点指向 personModel.position
       * 在通过 this.controls.maxDistance、this.controls.minDistance 限制与模型之间距离可以达到轨道控制器跟随模型
       * 不加限制距离的话轨道控制器位置不会改变
       */

      // 创建地板射线
      createRaycaster(
        this.personModel!.scene.position.clone().setY(
          this.personModel!.scene.position.y + RADIAL.FLOOR_RAY_ORIGIN_HEIGHT
        ),
        new THREE.Vector3(0, -1, 0),
        this.sceneModelInstance.floorMesh,
        (ray) => {
          this.sceneModelInstance.floorRaster = ray;
        }
      );

      // /**
      //  * 按键操作模块
      //  */
      // pressKeyOperate.call(this, this.personModel.scene, {
      //   move: (key) => {
      //     console.log(key, 'key');

      //     // 执行转向模块
      //     const cameraDirection = getKeyDirection.call(this, key);
      //     walk.call(this, cameraDirection);

      //     if (this.isCollision) {
      //       this.personModel?.scene.translateZ(-MOTION.MOVE_SPEED);
      //     }
      //   },
      //   down: () => {
      //     switchAction.call(this, 'Walking');
      //   },
      //   stop: () => {
      //     switchAction.call(this, 'Idle');
      //   },
      // });

      // jump.call(this);
      console.log(data);

      // 增加相关动作
      this.mixer = new THREE.AnimationMixer(personMesh);
      this.activeAction = this.mixer.clipAction(data.animations[0]);
      this.activeAction.clampWhenFinished = true;
      // this.activeAction.loop = THREE.LoopOnce;
      this.activeAction.play();

      return data;
    } catch (err) {
      throw new Error(err as string);
    }
  }

  private keyDown(this: PersonModel, event: KeyboardEvent) {
    if (
      [
        'ArrowUp',
        'ArrowLeft',
        'ArrowDown',
        'ArrowRight',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
      ].includes(event.code) &&
      !this.isWalk
    ) {
      this.isWalk = true;

      // mixer = startAnimation(
      //   playerMesh,
      //   animations,
      //   'walk' // animationName，这里是"Run"
      // )
      switchAction.call(this, 'Walking');
    }
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.motionData.moveForward = true;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        this.motionData.moveLeft = true;
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.motionData.moveBackward = true;
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.motionData.moveRight = true;
        break;

      case 'Space':
        if (
          !this.jumping.isJumping &&
          this.personModel!.scene.position.y <=
            this.sceneModelInstance.floorTopPosition
        ) {
          this.jumping.velocity = MOTION.JUMP_VELOCITY;
          this.jumping.isJumping = true; // 设置跳跃状态
          this.jumping.floorRayPause = true;
        }
        break;
    }
  }

  private keyUp(this: PersonModel, event: KeyboardEvent) {
    if (
      [
        'ArrowUp',
        'ArrowLeft',
        'ArrowDown',
        'ArrowRight',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
      ].includes(event.code)
    ) {
      this.isWalk = false;
      switchAction.call(this, 'Idle');
    }
    switch (event.code) {
      case 'ArrowUp':
      case 'KeyW':
        this.motionData.moveForward = false;
        break;

      case 'ArrowLeft':
      case 'KeyA':
        this.motionData.moveLeft = false;
        break;

      case 'ArrowDown':
      case 'KeyS':
        this.motionData.moveBackward = false;
        break;

      case 'ArrowRight':
      case 'KeyD':
        this.motionData.moveRight = false;
        break;
    }
  }

  async render(that: InitThree) {
    try {
      await this.load();
      await this.sceneModelInstance.render(that);

      const personMesh = this.personModel!.scene;

      that.scene?.add(this.boxHelper!);
      that.scene?.add(personMesh);

      // 相机初始位置跟随人物位置
      that.camera.position.set(
        personMesh.position.x,
        personMesh.position.y + 15,
        personMesh.position.z - 30
      );
    } catch (err) {
      console.error(err);

      throw new Error(err as string);
    }
  }

  animate(that: InitThree) {
    const delta = that.clock.getDelta();

    if (this.personModel) {
      const { position } = this.personModel.scene;
      // 更新边界框
      this.boundingBox!.setFromObject(this.personModel.scene);

      // 更新底部射线
      this.sceneModelInstance.floorRaster!.ray.origin.copy(
        this.personModel.scene.position
          .clone()
          .setY(position.y + RADIAL.FLOOR_RAY_ORIGIN_HEIGHT)
      );
      this.sceneModelInstance.floorRaster!.params.Line.threshold =
        RADIAL.THRESHOLD;
      this.sceneModelInstance.floorRaster!.far = RADIAL.FAR;
      // 更新射线 end ----------------------

      // 辅助射线线
      if (arrowHelper) that.scene?.remove(arrowHelper);
      // 创建一个ArrowHelper来可视化射线
      arrowHelper = new THREE.ArrowHelper(
        this.sceneModelInstance.floorRaster!.ray.direction, // 射线的方向
        this.sceneModelInstance.floorRaster!.ray.origin, // 射线的起点
        this.sceneModelInstance.floorRaster!.far, // 射线的长度
        0xff0000 // 射线的颜色，这里使用红色
      );
      that.scene?.add(arrowHelper!);

      // 发送人物垂直射线，使其人物一直在地板上
      const intersections =
        this.sceneModelInstance.floorRaster!.intersectObjects(
          this.sceneModelInstance.floorMesh,
          false
        );

      // 移动摩擦
      velocity.x -= velocity.x * 1 * delta;
      velocity.z -= velocity.z * 1 * delta;
      velocity.y -= 0.8 * 10 * delta;

      // 移动方向
      direction.z =
        Number(this.motionData.moveBackward) -
        Number(this.motionData.moveForward);
      direction.x =
        Number(this.motionData.moveRight) - Number(this.motionData.moveLeft);
      direction.normalize(); // this ensures consistent movements in all directions

      // 移动的范围
      if (this.motionData.moveForward || this.motionData.moveBackward)
        velocity.z -= direction.z * 10 * delta;
      if (this.motionData.moveLeft || this.motionData.moveRight)
        velocity.x -= direction.x * 10 * delta;

      position.x += velocity.x * delta;
      position.z += velocity.z * delta;

      const onObject = intersections.length > 0;

      // 设置人物模型 Y 位置
      if (onObject === true) {
        if (intersections[0]?.distance) {
          const offsetHeight =
            intersections[0].distance - RADIAL.FLOOR_RAY_ORIGIN_HEIGHT;

          // 设置地板位置数据
          this.sceneModelInstance.floorTopPosition = position.y - offsetHeight;
        }
      }

      // 确保相机始终看向模型
      that.controls?.target.copy(position);
      that.controls?.update();

      if (position.y < this.sceneModelInstance.floorTopPosition) {
        velocity.y = 0;
        position.y = this.sceneModelInstance.floorTopPosition;
      }

      if (this.jumping.isJumping) {
        this.jumping.velocity +=
          MOTION.JUMP_GRAVITY * delta * MOTION.JUMP_ACCELERATION;
        this.personModel!.scene.position.y += this.jumping.velocity * delta;
        // 检查是否落地
        if (
          this.personModel!.scene.position.y <=
          this.sceneModelInstance.floorTopPosition
        ) {
          this.jumping.isJumping = false;
          this.jumping.floorRayPause = false;
          this.jumping.velocity = 0;
          this.personModel!.scene.position.y =
            this.sceneModelInstance.floorTopPosition;
        }
      }
    }

    // 动画直接混合，使两帧动画之间流畅。this.clock.getDelta() 获取帧动画直接时间
    if (this.mixer && this.mixer.update) {
      this.mixer.update(delta);
    }
  }
}
