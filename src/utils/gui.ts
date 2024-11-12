import { GUI as DatGUI } from 'dat.gui';

export class GUI {
  private static instance: GUI;
  private gui: DatGUI | null;
  private folders: Map<string, dat.GUI>;
  private controllers: Map<string, dat.GUIController>;

  private constructor() {
    this.folders = new Map();
    this.controllers = new Map();
    this.gui = new DatGUI({ autoPlace: true });
    // 设置GUI面板的位置
    const guiContainer = this.gui.domElement.parentElement;
    if (guiContainer) {
      guiContainer.style.position = 'absolute';
      guiContainer.style.top = '0';
      guiContainer.style.right = '0';
      guiContainer.style.zIndex = '1000';
    }
  }

  /**
   * 获取 GUI 单例实例
   */
  public static getInstance(): GUI {
    if (!GUI.instance) {
      GUI.instance = new GUI();
    }
    return GUI.instance;
  }

  /**
   * 添加文件夹
   * @param name 文件夹名称
   */
  public addFolder(name: string): dat.GUI {
    if (this.folders.has(name)) {
      return this.folders.get(name)!;
    }
    const folder = this.gui!.addFolder(name);
    this.folders.set(name, folder);
    return folder;
  }

  /**
   * 添加控制器
   * @param object 要控制的对象
   * @param property 属性名
   * @param name 控制器名称（可选）
   * @param min 最小值（可选，用于数字类型）
   * @param max 最大值（可选，用于数字类型）
   * @param step 步进值（可选，用于数字类型）
   */
  public addController<T extends object>(
    object: T,
    property: keyof T,
    name?: string,
    min?: number,
    max?: number,
    step?: number
  ): dat.GUIController {
    const controller = this.gui!.add<T>(object, property);

    if (typeof min === 'number' && typeof max === 'number') {
      controller.min(min).max(max);
    }

    if (typeof step === 'number') {
      controller.step(step);
    }

    if (name) {
      controller.name(name);
      this.controllers.set(name, controller);
    }

    return controller;
  }

  /**
   * 添加颜色控制器
   * @param object 要控制的对象
   * @param property 属性名
   * @param name 控制器名称（可选）
   */
  public addColor(
    object: object,
    property: string,
    name?: string
  ): dat.GUIController {
    const controller = this.gui!.addColor(object, property);

    if (name) {
      controller.name(name);
      this.controllers.set(name, controller);
    }

    return controller;
  }

  /**
   * 获取指定名称的控制器
   * @param name 控制器名称
   */
  public getController(name: string): dat.GUIController | undefined {
    return this.controllers.get(name);
  }

  /**
   * 获取指定名称的文件夹
   * @param name 文件夹名称
   */
  public getFolder(name: string): dat.GUI | undefined {
    return this.folders.get(name);
  }

  /**
   * 销毁 GUI
   */
  public destroy(): void {
    if (this.gui) {
      // 移除所有控制器
      this.controllers.clear();
      // 移除所有文件夹
      this.folders.clear();
      // 销毁 dat.GUI 实例
      this.gui.destroy();
      // 移除 DOM 元素
      const guiContainer = this.gui.domElement.parentElement;
      if (guiContainer) {
        guiContainer.remove();
      }
      // 清空实例
      this.gui = null;
    }
    // 清空单例实例
    GUI.instance = null!;
  }
}
