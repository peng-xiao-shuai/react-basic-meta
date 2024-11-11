import { GLTF } from 'three/addons';
import * as THREE from 'three';
import { loadModel } from './other';
import { InitThree } from '.';

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
  // /**
  //  * 跳跃更新函数
  //  */
  // updateJump: () => void;
  constructor() {
    this.sceneModel = null;
    this.obstacleModel = null;
    this.floorMesh = [];
    this.floorRaster = null;
    this.collisionMesh = [];
    this.floorTopPosition = 0;
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
}
