import { GroundPlatform } from './GroundPlatform';
import { AssetLoader } from '../../core/AssetLoader';

export interface BananaInstance {
  x: number;
  scale: number;
  hasFruit: boolean; // true: Cây có buồng chuối & bắp chuối tím | false: Cây xanh không quả
  isFlipped: boolean;
  phase: number;
  isBeingDug?: boolean; // Đang trong quá trình bị cuốc đào
}

export class BananaTree {
  private imgTree: HTMLImageElement;
  private imgFruit: HTMLImageElement;
  private treeLoaded = false;
  private fruitLoaded = false;

  private width = 147; // Thu nhỏ 30% so với trước (210 * 0.7)
  private height = 158; // Thu nhỏ 30% so với trước (225 * 0.7)


  // Bố trí các cây chuối trên tầng thấp và tầng đất cao ngắm cảnh
  public instances: BananaInstance[] = [
    { x: 480,  scale: 1.15, hasFruit: true,  isFlipped: false, phase: 0.2 }, // Cây chuối có buồng quả tầng thấp
    { x: 555,  scale: 0.72, hasFruit: false, isFlipped: true,  phase: 0.6 }, // Cây chuối con
    { x: 1180, scale: 1.25, hasFruit: true,  isFlipped: false, phase: 1.1 }, // Cây chuối to có quả trên tầng đất cao!
    { x: 1250, scale: 0.78, hasFruit: false, isFlipped: true,  phase: 1.5 }  // Cây chuối non trên tầng đất cao
  ];

  constructor() {
    this.imgTree = AssetLoader.getImage('/assets/props/banana_tree.png');
    this.treeLoaded = this.imgTree.complete && this.imgTree.naturalWidth > 0;
    if (!this.treeLoaded) {
      this.imgTree.addEventListener('load', () => { this.treeLoaded = true; }, { once: true });
    }

    this.imgFruit = AssetLoader.getImage('/assets/props/banana_tree_fruit.png');
    this.fruitLoaded = this.imgFruit.complete && this.imgFruit.naturalWidth > 0;
    if (!this.fruitLoaded) {
      this.imgFruit.addEventListener('load', () => { this.fruitLoaded = true; }, { once: true });
    }
  }

  /**
   * Tìm cây chuối gần vị trí người chơi nhất trong bán kính cho phép
   */
  public findNearby(playerX: number, maxDist: number = 75): { banana: BananaInstance; index: number; dist: number } | null {
    let closest: { banana: BananaInstance; index: number; dist: number } | null = null;
    let minDist = maxDist;

    for (let i = 0; i < this.instances.length; i++) {
      const b = this.instances[i];
      const dist = Math.abs(playerX - b.x);
      if (dist <= minDist) {
        minDist = dist;
        closest = { banana: b, index: i, dist };
      }
    }
    return closest;
  }

  /**
   * Bứng (đào) cây chuối tại vị trí index
   */
  public removeAt(index: number): BananaInstance | null {
    if (index >= 0 && index < this.instances.length) {
      const removed = this.instances.splice(index, 1)[0];
      removed.isBeingDug = false;
      return removed;
    }
    return null;
  }

  /**
   * Xóa một cây chuối cụ thể khỏi danh sách
   */
  public removeBanana(banana: BananaInstance): boolean {
    const idx = this.instances.indexOf(banana);
    if (idx !== -1) {
      this.instances.splice(idx, 1);
      banana.isBeingDug = false;
      return true;
    }
    return false;
  }

  /**
   * Trồng cây chuối mới tại tọa độ x
   */
  public plantAt(x: number, template?: Partial<BananaInstance>): BananaInstance {
    const newBanana: BananaInstance = {
      x,
      scale: template?.scale ?? (0.85 + Math.random() * 0.4),
      hasFruit: template?.hasFruit ?? (Math.random() > 0.5),
      isFlipped: template?.isFlipped ?? (Math.random() > 0.5),
      phase: template?.phase ?? (Math.random() * Math.PI * 2),
      isBeingDug: false
    };
    this.instances.push(newBanana);
    // Sắp xếp lại theo x để dễ quản lý
    this.instances.sort((a, b) => a.x - b.x);
    return newBanana;
  }

  /**
   * Render các cây chuối hoạt họa 2D đung đưa nhẹ nhàng trong gió
   */
  public render(ctx: CanvasRenderingContext2D, groundY: number, animTimer: number, playerX?: number): void {
    if (!this.treeLoaded || !this.fruitLoaded) return;

    const nearby = playerX !== undefined ? this.findNearby(playerX, 75) : null;

    this.instances.forEach(inst => {
      const currentGroundY = GroundPlatform.getGroundY(inst.x, groundY);
      const isDug = inst.isBeingDug;
      
      // Khi đang bị cuốc đào, cây chuối rung lắc mạnh. Bình thường chỉ đung đưa nhẹ theo làn gió thoảng
      const sway = isDug
        ? Math.sin(animTimer * 24) * 0.065
        : Math.sin(animTimer * 1.3 + inst.phase) * 0.022;

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

      // Hiệu ứng tương tác trực quan
      if (isDug) {
        ctx.save();
        const tagY = currentGroundY - h - 14;

        // Vòng đất rung chuyển dưới gốc
        ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.beginPath();
        ctx.ellipse(inst.x, currentGroundY, 36, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Badge trạng thái đang đào
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = '#f87171';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(inst.x - 65, tagY, 130, 26, 13);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fca5a5';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⛏️ Đang cuốc bứng...', inst.x, tagY + 17);
        ctx.restore();
      } else if (nearby && nearby.banana === inst) {
        ctx.save();
        const bounce = Math.sin(animTimer * 5) * 4;
        const tagY = currentGroundY - h - 14 + bounce;

        // Vẽ bóng đổ / vòng sáng nhỏ dưới gốc
        ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
        ctx.beginPath();
        ctx.ellipse(inst.x, currentGroundY, 32, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Badge gợi ý [E] Bứng Cây
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(inst.x - 58, tagY, 116, 26, 13);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎋 [E] Bứng Cây Chuối', inst.x, tagY + 17);
        ctx.restore();
      }
    });
  }
}

