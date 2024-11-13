/**
 * 运动相关常量
 */
export const MOTION = {
  /**
   * 移动速度
   * @default 2
   */
  MOVE_SPEED: 2,
  /**
   * 转向速度
   */
  STEERING_SPEED: 0.2,

  /**
   * 越大重力越大
   * @default 10
   */
  GRAVITY: 10,
  /**
   * 重力速度。越大跳跃越高
   * @default 10
   */
  GRAVITY_VELOCITY: 10,

  /**
   * 平滑度，越小越平滑 不能 <= 0
   * @default 0.1
   */
  HEIGHT_SMOOTH_FACTOR: 0.1,
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
  FAR: 100,
  /**
   * 辅助射线宽度
   */
  THRESHOLD: 5,
  /**
   * 射线离物体多少距离无法前进，需要更具模型大小设置
   */
  MIN_DISTANCE_TO_OBJECT: 3,
};
