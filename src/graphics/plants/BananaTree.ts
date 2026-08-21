import { GroundPlatform } from './GroundPlatform';

export interface BananaInstance {
  x: number;
  scale: number;
  hasFruit: boolean; // true: Cây có buồng chuối & bắp chuối tím | false: Cây xanh không quả
  isFlipped: boolean;
  phase: number;
}

export class BananaTree {
  private imgTree = new Image();
  private imgFruit = new Image();
  private treeLoaded = false;
  private fruitLoaded = false;

  private width = 210;
  private height = 225;

  // Bố trí các cây chuối trên tầng thấp và tầng đất cao ngắm cảnh
  public instances: BananaInstance[] = [
    { x: 480,  scale: 1.15, hasFruit: true,  isFlipped: false, phase: 0.2 }, // Cây chuối có buồng quả tầng thấp
    { x: 555,  scale: 0.72, hasFruit: false, isFlipped: true,  phase: 0.6 }, // Cây chuối con
    { x: 1180, scale: 1.25, hasFruit: true,  isFlipped: false, phase: 1.1 }, // Cây chuối to có quả trên tầng đất cao!
    { x: 1250, scale: 0.78, hasFruit: false, isFlipped: true,  phase: 1.5 }  // Cây chuối non trên tầng đất cao
  ];

  constructor() {
    this.imgTree.src = '/assets/props/banana_tree.png';
    this.imgTree.onload = () => {
      this.treeLoaded = true;
    };

    this.imgFruit.src = '/assets/props/banana_tree_fruit.png';
    this.imgFruit.onload = () => {
      this.fruitLoaded = true;
    };
  }

  /**
   * Render các cây chuối hoạt họa 2D đung đưa nhẹ nhàng trong gió
   */
  public render(ctx: CanvasRenderingContext2D, groundY: number, animTimer: number): void {
    if (!this.treeLoaded || !this.fruitLoaded) return;

    this.instances.forEach(inst => {
      const currentGroundY = GroundPlatform.getGroundY(inst.x, groundY);
      const sway = Math.sin(animTimer * 1.3 + inst.phase) * 0.022;

      ctx.save();
      ctx.translate(inst.x, currentGroundY + 4);
      ctx.rotate(sway);

      if (inst.isFlipped) {
        ctx.scale(-1, 1);
      }

      const w = this.width * inst.scale;
      const h = this.height * inst.scale;

      const imgToDraw = inst.hasFruit ? this.imgFruit : this.imgTree;
      ctx.drawImage(imgToDraw, -w / 2, -h + 8, w, h);

      ctx.restore();
    });
  }
}
