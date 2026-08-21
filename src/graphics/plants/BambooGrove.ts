/**
 * BambooGrove.ts
 * Module chuyên trách vẽ Cụm Tre Làng Quê 2D Đúng Phong Cách Hoạt Họa Mẫu
 * - Hỗ trợ 2 Biến Thể:
 *   1. 'yellow': Thân tre vàng nứa kinh điển theo ảnh mẫu
 *   2. 'green': Thân tre xanh tươi đậm đà, tán lá dày dặn sum suê
 * - Tách nền trong suốt $100\%$, đung đưa nhịp nhàng theo làn gió tự nhiên.
 */

import { GroundPlatform } from './GroundPlatform';

export interface BambooInstance {
  x: number;
  scale: number;
  variant: 'yellow' | 'green';
  isFlipped: boolean;
  phase: number;
}

export class BambooGrove {
  private imgYellow = new Image();
  private imgGreen = new Image();

  private canvasYellow: HTMLCanvasElement | null = null;
  private canvasGreen: HTMLCanvasElement | null = null;

  private isYellowLoaded: boolean = false;
  private isGreenLoaded: boolean = false;

  private baseWidth: number = 300;
  private baseHeight: number = 440;

  // Bố trí cụm tre làng đan xen cả tre vàng nứa & tre xanh dày dặn tại Đoạn 2 (x: 200m -> 400m)
  public instances: BambooInstance[] = [
    { x: 210, scale: 0.92, variant: 'green',  isFlipped: true,  phase: 0.1 }, // Cây tre xanh dày dặn bên trái
    { x: 285, scale: 1.18, variant: 'yellow', isFlipped: false, phase: 0.4 }, // Cây tre vàng nứa cao lớn ở giữa
    { x: 360, scale: 1.05, variant: 'green',  isFlipped: false, phase: 0.8 }  // Cây tre xanh dày dặn bên phải
  ];

  constructor() {
    this.imgYellow.src = '/assets/props/bamboo_exact.jpg';
    this.imgYellow.onload = () => {
      this.canvasYellow = this.processTransparentSprite(this.imgYellow);
      this.isYellowLoaded = true;
    };

    this.imgGreen.src = '/assets/props/bamboo_green.jpg';
    this.imgGreen.onload = () => {
      this.canvasGreen = this.processTransparentSprite(this.imgGreen);
      this.isGreenLoaded = true;
    };
  }

  /**
   * Khử sạch hoàn toàn nền trắng và triệt tiêu quầng sáng viền (Advanced Defringe)
   */
  private processTransparentSprite(img: HTMLImageElement): HTMLCanvasElement {
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;

    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;

    ctx.drawImage(img, 0, 0);

    const imgData = ctx.getImageData(0, 0, w, h);
    const d = imgData.data;

    for (let i = 0; i < d.length; i += 4) {
      const r = d[i];
      const g = d[i + 1];
      const b = d[i + 2];

      const maxC = Math.max(r, Math.max(g, b));
      const minC = Math.min(r, Math.min(g, b));
      const sat = maxC - minC; // Độ bão hòa màu sắc

      // 1. Khử nền trắng và toàn bộ các vệt trắng trong kẽ cành tre (Brightness cao, Saturation thấp)
      if (minC > 175 && sat < 45) {
        if (minC >= 220) {
          // Trắng hoặc gần trắng -> Trong suốt hoàn toàn 100%
          d[i + 3] = 0;
        } else {
          // Viền chuyển tiếp -> Mịn màng không lộ viền trắng (Defringe)
          const alphaFactor = (220 - minC) / 45;
          d[i + 3] = Math.round(Math.pow(alphaFactor, 1.4) * 255);

          // Triệt tiêu màu trắng thừa, hòa sắc vào màu viền đen/xanh đậm
          d[i] = Math.round(r * 0.35);
          d[i + 1] = Math.round(g * 0.5);
          d[i + 2] = Math.round(b * 0.3);
        }
      }
      // 2. Xử lý các điểm sáng trắng lóa ở rìa cành lá
      else if (minC > 210 && sat < 60) {
        if (minC >= 235) {
          d[i + 3] = 0;
        } else {
          const alphaFactor = (235 - minC) / 25;
          d[i + 3] = Math.round(alphaFactor * 255);
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    return c;
  }

  /**
   * Render các cụm tre hoạt họa 2D đung đưa nhẹ nhàng trong gió
   */
  public render(ctx: CanvasRenderingContext2D, groundY: number, animTimer: number): void {
    this.instances.forEach(inst => {
      const sprite = inst.variant === 'green' ? this.canvasGreen : this.canvasYellow;
      const isLoaded = inst.variant === 'green' ? this.isGreenLoaded : this.isYellowLoaded;

      if (!isLoaded || !sprite) return;

      const currentGroundY = GroundPlatform.getGroundY(inst.x, groundY);
      // Gió làng quê làm ngọn tre đung đưa êm ái
      const sway = Math.sin(animTimer * 1.4 + inst.phase) * 0.022;

      ctx.save();
      ctx.translate(inst.x, currentGroundY + 6);
      ctx.rotate(sway);

      if (inst.isFlipped) {
        ctx.scale(-1, 1);
      }

      const w = this.baseWidth * inst.scale;
      const h = this.baseHeight * inst.scale;

      ctx.drawImage(sprite, -w / 2, -h + 8, w, h);

      ctx.restore();
    });
  }
}
