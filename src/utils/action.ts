/**
 * 转向操作模块
 * @author: peng-xiao-shuai
 * @date: 2023-10-26 15:06:34
 * @last Modified by: peng-xiao-shuai
 * @last Modified time: 2023-10-26 15:06:34
 */
import * as THREE from 'three';
import type { InitThree } from '.';

type CycleKeys = 'w' | 's' | 'a' | 'd';
export interface Cycle {
  move: (keys: CycleKeys) => void;
  down: (keys?: CycleKeys) => void;
  stop: () => void;
}
/**
 * 按键操作
 * @param {THREE.Group} personModel 人物模型
 * @param {} cycle 执行周期
 */
export const pressKeyOperate = (
  personModel: THREE.Group,
  cycle: Cycle
): void => {
  let isWalk = false;
  window.addEventListener('keydown', (e) => {
    // 匹配按键，调用移动函数（如果有的话）
    if (['w', 's', 'a', 'd'].includes(e.key)) {
      if (!isWalk) {
        isWalk = true;

        // mixer = startAnimation(
        //   playerMesh,
        //   animations,
        //   'walk' // animationName，这里是"Run"
        // )
        cycle.down(e.key as CycleKeys);
      }
      if (cycle.move) cycle.move(e.key as CycleKeys);

      // 控制行走
      personModel.translateZ(0.2);
    }
  });
  window.addEventListener('keyup', (e) => {
    if (['w', 's', 'a', 'd'].includes(e.key)) {
      isWalk = false;
      if (cycle.stop) cycle.stop();
    }
    if (e.key === 'w') {
      // mixer = startAnimation(
      //   playerMesh,
      //   animations,
      //   'idle' // animationName，这里是"Run"
      // )
    }
  });
};

/**
 * 根据按键 a、s、d 获取转向方向
 * @param {'w'|'a'|'s'|'d'} key 方向
 * @returns {THREE.Vector3} cameraDirection。 walk 函数入参
 */
export function getKeyDirection(
  this: InitThree,
  key: 'w' | 'a' | 's' | 'd'
): THREE.Vector3 {
  // -Math.PI / 2 是 -90° 的弧度表示
  const radian = {
    w: Math.PI * 2,
    a: Math.PI / 2,
    s: Math.PI,
    d: -Math.PI / 2,
  }[key];

  const cameraDirection = this.camera.getWorldDirection(new THREE.Vector3());

  // 创建一个旋转矩阵，使其在Y轴上旋转-90°
  const quaternion = new THREE.Quaternion();
  quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), radian);

  // 将旋转矩阵应用于相机的朝向
  cameraDirection.applyQuaternion(quaternion);

  return cameraDirection;
}

/**
 * 转向系统 根据方向进行转向
 * @param {THREE.Vector3} cameraDirection
 * @see https://codepen.io/cdeep/full/QWMWyYW 参考
 */
export function walk(this: InitThree, cameraDirection: THREE.Vector3): void {
  const tempModelVector = new THREE.Vector3();
  const xAxis = new THREE.Vector3(1, 0, 0);

  // cameraDirection 简写, 获取相机在X-Z平面上的方向，用于移动玩家
  const cD = cameraDirection.setY(0).normalize();

  // 获取玩家在X-Z平面上的方向，与相机进行比较
  this.personModel?.scene.getWorldDirection(tempModelVector);
  const playerDirection = tempModelVector.setY(0).normalize();

  // 获取到x轴的角度
  const cameraAngle = cD.angleTo(xAxis) * (cD.z > 0 ? 1 : -1);
  const playerAngle =
    playerDirection.angleTo(xAxis) * (playerDirection.z > 0 ? 1 : -1);

  // 获取旋转玩家面向相机方向所需的角度
  const angleToRotate = playerAngle - cameraAngle;

  // 获取最短的旋转角度
  let sanitisedAngle = angleToRotate;

  /**
   * 角度累积超过一个圆周时，校准转向
   */
  if (angleToRotate > Math.PI) {
    sanitisedAngle = angleToRotate - 2 * Math.PI;
  }
  if (angleToRotate < -Math.PI) {
    sanitisedAngle = angleToRotate + 2 * Math.PI;
  }

  // 旋转模型面向相机的方向 0.2 控制转向速度。越大越快
  this.personModel?.scene.rotateY(
    Math.max(-0.2, Math.min(sanitisedAngle, 0.2))
  );
}
