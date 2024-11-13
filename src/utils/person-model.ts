import { GLTF } from 'three/addons';
import { CONTROLS, MOTION, RADIAL } from './constant';
import * as THREE from 'three';
import { SceneModel } from './scene-model';
import { InitThree } from '.';
import { createRaycaster, loadModel } from './other';
import { switchAction } from './animation';
import { getKeyDirection, walk } from './action';
/**
 * 移动速度
 */
const velocity = new THREE.Vector3();

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
     * 滞空状态（人物没有在地板上，并且不是跳跃的情况下）
     */
    isInAir: boolean;
  };
  // 添加新属性
  axesHelper: THREE.AxesHelper | null;
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
      isInAir: false,
    };

    this.axesHelper = null;
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
    console.log(this.jumping.isInAir);

    // 非跳跃且底部没有触碰地板的情况下（滞空）
    if (this.jumping.isInAir) {
      // 如果正在走路，则停止走路动画
      if (this.isWalk) {
        switchAction.call(this, 'Idle');
        this.motionData = {
          moveForward: false,
          moveLeft: false,
          moveBackward: false,
          moveRight: false,
        };
      }
      this.isWalk = false;
      return;
    }
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
          velocity.y = MOTION.JUMP_HEIGHT;
          this.jumping.isJumping = true; // 设置跳跃状态
          this.jumping.floorRayPause = true;
        }
        break;
    }
  }

  private keyUp(this: PersonModel, event: KeyboardEvent) {
    // 非跳跃且底部没有触碰地板的情况下（滞空）
    if (this.jumping.isInAir) return;

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
      // 添加 AxesHelper，参数 5 表示轴线长度
      this.axesHelper = new THREE.AxesHelper(5);

      personMesh.add(this.axesHelper);
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

    if (this.personModel && this.sceneModelInstance.floorMesh.length) {
      const { position } = this.personModel.scene;
      // 更新边界框
      this.boundingBox!.setFromObject(this.personModel.scene);

      // 移动摩擦
      velocity.z -= velocity.z * MOTION.FRICTION * delta;
      velocity.y -= 0.8 * 10 * delta;

      // // 添加持续转向逻辑
      if (this.isWalk) {
        let key: 'w' | 'a' | 's' | 'd' = 'w';
        if (this.motionData.moveForward) key = 'w';
        if (this.motionData.moveLeft) key = 'a';
        if (this.motionData.moveBackward) key = 's';
        if (this.motionData.moveRight) key = 'd';

        velocity.z -= -1 * 10 * delta;

        const cameraDirection = getKeyDirection.call(this, key);
        walk.call(this, cameraDirection);
      }
      this.personModel.scene.translateZ(velocity.z * delta * MOTION.MOVE_SPEED);

      // 确保相机始终看向模型
      that.controls?.target.set(
        position.x,
        this.sceneModelInstance.floorTopPosition + CONTROLS.EXTRA_HEIGHT,
        position.z
      );
      that.controls?.update();

      this.sceneModelInstance.animate(that);

      if (this.jumping.isJumping) {
        // 设置滞空 false
        this.jumping.isInAir = false;
      } else {
        // 设置滞空
        this.jumping.isInAir = !this.sceneModelInstance.floorRayCollision;
      }
      // 使人物模型一直往下掉，同时在点击跳跃的时候更改 velocity 值
      velocity.y -= MOTION.GRAVITY * delta * MOTION.JUMP_VELOCITY;
      position.y += velocity.y * delta * MOTION.JUMP_VELOCITY;

      // 检查是否落地， 同时在跳跃人物位置小于地板位置时会关闭跳跃状态
      if (
        position.y <= this.sceneModelInstance.floorTopPosition &&
        !this.jumping.isInAir
      ) {
        this.jumping.isJumping = false;
        this.jumping.floorRayPause = false;
        position.y = this.sceneModelInstance.floorTopPosition;
      }
    }

    // 动画直接混合，使两帧动画之间流畅。this.clock.getDelta() 获取帧动画直接时间
    if (this.mixer && this.mixer.update) {
      this.mixer.update(delta);
    }
  }
}
