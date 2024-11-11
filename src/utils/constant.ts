/**
 * 运动相关常量
 */
export const MOTION = {
  /**
   * 移动速度
   */
  MOVE_SPEED: 0.5,
  /**
   * 转向速度
   */
  STEERING_SPEED: 0.2,

  /**
   * 重力加速度
   */
  GRAVITY: 9,
  /**
   * 初始速度
   */
  VELOCITY: 0,

  /**
   * 跳跃重力。越大重力越小
   */
  JUMP_GRAVITY: -5,
  /**
   * 跳跃速度。越大跳跃越高
   */
  JUMP_VELOCITY: 18,
  /**
   * 跳跃加速度
   */
  JUMP_ACCELERATION: 5,
};

/**
 * 动画相关常量
 */
export const ANIMATION = {
  /**
   * 动作切换时时长
   */
  CONNECTION_DURATION: 0.15,
};

/**
 * 射线相关常量
 */
export const RADIAL = {
  /**
   * 地板射线初始高度
   */
  FLOOR_RAY_ORIGIN_HEIGHT: 10,
  /**
   * 辅助射线初始长度
   */
  FAR: 10,
  /**
   * 辅助射线宽度
   */
  THRESHOLD: 5,
  /**
   * 射线离物体多少距离无法前进，需要更具模型大小设置
   */
  MIN_DISTANCE_TO_OBJECT: 3,
};
