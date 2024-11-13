import { GLTF } from 'three/addons';
import * as THREE from 'three';
import { loadModel } from './other';
import { InitThree } from '.';
import { MOTION, RADIAL } from './constant';

let arrowHelper: null | THREE.ArrowHelper;
/**
 * 地板场景数据
 */
export class SceneModel {
  /**
   * 场景模型
   */
  sceneModel: GLTF | null;
  /**
   * 障碍地形模型
   */
  obstacleModel: GLTF | null;
  /**
   * 存储地板数据
   */
  floorMesh: THREE.Mesh[];
  /**
   * 碰撞的障碍物
   */
  collisionMesh: THREE.Mesh[];
  /**
   * 底部射线
   */
  floorRaster: THREE.Raycaster | null;

  /**
   * 地板位置 =》 起跳位置
   */
  floorTopPosition: number;
  /**
   * 底部射线是否碰撞
   */
  floorRayCollision: boolean;

  constructor() {
    this.sceneModel = null;
    this.obstacleModel = null;
    this.floorMesh = [];
    this.floorRaster = null;
    this.collisionMesh = [];
    this.floorTopPosition = 0;
    this.floorRayCollision = false;
  }

  async loadScene() {
    try {
      const data = await loadModel('scene.glb');
      this.sceneModel = data;
      data.scene.visible = false;
      // 设置阴影
      data.scene.castShadow = true;
      return data;
    } catch (err) {
      console.error(err);
      throw new Error(err as string);
    }
  }

  /**
   * 障碍地形
   */
  async loadObstacle() {
    try {
      const data = await loadModel('terrains.glb');
      this.obstacleModel = data;
      const sceneMesh = data.scene;
      // sceneMesh.visible = false

      // 获取地板, 固定 下标 1 为地板
      this.floorMesh = [sceneMesh.children[1] as THREE.Mesh];
      // 获取障碍物, 固定 下标 0 为障碍物
      this.collisionMesh = [sceneMesh.children[0] as THREE.Mesh];

      return data;
    } catch (err) {
      console.error(err);
      throw new Error(err as string);
    }
  }

  async render(that: InitThree) {
    try {
      await this.loadScene();
      await this.loadObstacle();
      that.scene?.add(this.obstacleModel!.scene);
      that.scene?.add(this.sceneModel!.scene);
    } catch (err) {
      console.error(err);
      throw new Error(err as string);
    }
  }

  animate(that: InitThree) {
    // 更新底部射线
    this.floorRaster!.ray.origin.copy(
      that.personModelInstance
        .personModel!.scene.position.clone()
        .setY(
          that.personModelInstance.personModel!.scene.position.y +
            RADIAL.FLOOR_RAY_ORIGIN_HEIGHT
        )
    );
    this.floorRaster!.params.Line.threshold = RADIAL.THRESHOLD;
    this.floorRaster!.far = RADIAL.FAR;
    // 更新射线 end ----------------------

    // 辅助射线线
    if (arrowHelper) that.scene?.remove(arrowHelper);
    // 创建一个ArrowHelper来可视化射线
    arrowHelper = new THREE.ArrowHelper(
      this.floorRaster!.ray.direction, // 射线的方向
      this.floorRaster!.ray.origin, // 射线的起点
      this.floorRaster!.far, // 射线的长度
      0xff0000 // 射线的颜色，这里使用红色
    );
    that.scene?.add(arrowHelper!);

    // 发送人物垂直射线，使其人物一直在地板上
    const intersections = this.floorRaster!.intersectObjects(this.floorMesh);
    this.floorRayCollision = intersections.length > 0;

    // 设置人物模型 Y 位置
    if (this.floorRayCollision === true) {
      if (intersections[0]?.distance) {
        const offsetHeight =
          intersections[0].distance - RADIAL.FLOOR_RAY_ORIGIN_HEIGHT;

        // 重要：平滑过渡设置地板位置数据
        this.floorTopPosition = THREE.MathUtils.lerp(
          this.floorTopPosition,
          that.personModelInstance.personModel!.scene.position.y - offsetHeight,
          MOTION.HEIGHT_SMOOTH_FACTOR
        );
      }
    }
  }
}
