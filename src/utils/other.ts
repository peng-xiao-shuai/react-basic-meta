import * as THREE from 'three';
import { GLTFLoader } from 'three/addons';
import { DRACOLoader } from 'three/addons';
import type { InitThree } from '.';

/**
 * 创建射线
 * @param {THREE.Vector3} rayOrigin 起点
 * @param {THREE.Vector3} downDirection 方向
 * @param {THREE.Object3D[]} groundMesh 碰到的物体
 * @param {(raycaster: THREE.Raycaster) => void} cb 其余回调操作
 * @returns {THREE.Vector3}
 */
export const createRaycaster = (
  rayOrigin: THREE.Vector3,
  downDirection: THREE.Vector3 = new THREE.Vector3(0, -1, 0),
  groundMesh: THREE.Object3D[] = [],
  cb: (raycaster: THREE.Raycaster) => void = () => ({})
): THREE.Intersection | null => {
  // 创建射线投射器
  const raycaster = new THREE.Raycaster();
  // raycaster.params.Points.threshold = 0.002
  raycaster.params.Line.threshold = 5;

  // 设置射线的起点和方向
  raycaster.set(rayOrigin, downDirection);

  // 获取与射线相交的物体
  const intersects = raycaster.intersectObjects(groundMesh);

  cb(raycaster);

  if (intersects.length > 0) return intersects[0];

  return null;
};

const MODEL_URL = `glb/`;

/**
 * 加载 glb 模型
 * @param {string} name 模型名称包含后缀
 * @returns {Promise<import('three/examples/jsm/loaders/GLTFLoader').GLTF>}
 */
export const loadModel = (
  name: string
): Promise<import('three/addons').GLTF> => {
  const gltfLoader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  // 设置解码路径
  dracoLoader.setDecoderPath(`/draco/`);
  gltfLoader.setDRACOLoader(dracoLoader);

  return gltfLoader.loadAsync(`${MODEL_URL}${name}`);
};

/**
 * 销毁模型。window.addEventListener 监听事件并不会销毁
 */
export function unloadModel(this: InitThree): void {
  // 清除 requestAnimationFrame
  cancelAnimationFrame(this.frameId);

  window.removeEventListener('resize', this.updateSize);

  // 销毁 GUI（如果有的话）
  // if (this.gui && this.gui.destroy) this.gui.destroy();

  // 是否场景模型资源
  this.personModelInstance.sceneModelInstance?.sceneModel?.scene.traverse(
    disposeResource
  );

  // 释放场景内资源
  this.scene!.traverse(disposeResource);

  // 释放角色模型资源，如果有的话（释放资源了，视图还是可以看见，因为没有 remove 删除）
  if (this.personModelInstance) {
    this.personModelInstance.personModel?.scene.traverse(disposeResource);
  }

  // 删除角色模型，如果有的话
  if (this.scene && this.personModelInstance.personModel?.scene)
    this.scene?.remove(this.personModelInstance.personModel.scene);
  // 清除对场景的引用
  this.scene = null;

  // 停止所有动作，清除对动画的引用
  if (this.personModelInstance.mixer) {
    this.personModelInstance.mixer.stopAllAction();
    this.personModelInstance.mixer = null;
  }

  this.personModelInstance.activeAction = null;
}

const disposeResource = (object: THREE.Object3D) => {
  const mesh = object as THREE.Mesh;
  if (mesh.isMesh) {
    mesh.geometry.dispose();
    const material = mesh.material;
    // 检查材质是否为数组
    if (Array.isArray(material)) {
      material.forEach((mat) => mat.dispose()); // 释放每个材质
    } else {
      material.dispose(); // 释放单个材质
    }
  }
};
