/**
 * 动画模块
 * @author: peng-xiao-shuai
 * @date: 2023-10-26 15:07:23
 * @last Modified by: peng-xiao-shuai
 * @last Modified time: 2023-10-26 15:07:23
 */

import type { InitThree } from '.';

/**
 * 切换动画
 * @param {number|string} name
 */
export function switchAction(this: InitThree, name: number | string): void {
  let animation;
  if (typeof name === 'string') {
    animation = this.personModel?.animations.find(
      (animationClip) => animationClip.name === name
    );
  } else {
    animation = this.personModel?.animations[name];
  }

  if (!animation) {
    console.error(this.personModel?.animations, `中没有${name}`);
    return;
  }

  // 定义淡出淡出时长
  const duration = 0.5;
  const previousAction = this.activeAction;

  if (!this.mixer || !this.mixer.clipAction) return;

  this.activeAction = this.mixer.clipAction(animation);
  // 进行淡出
  previousAction?.fadeOut(duration);

  this.activeAction
    .reset()
    .setEffectiveTimeScale(1)
    .setEffectiveWeight(1)
    .fadeIn(duration)
    .play();
}

export const a = 1;
