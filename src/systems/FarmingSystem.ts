import { RiceRenderer } from '../graphics/plants/RiceRenderer';
import { CornRenderer } from '../graphics/plants/CornRenderer';
import { WatermelonRenderer } from '../graphics/plants/WatermelonRenderer';
import { TomatoRenderer } from '../graphics/plants/TomatoRenderer';

export type CropType = 'rice' | 'corn' | 'watermelon' | 'tomato';

export interface CropInfo {
  name: string;
  seedCost: number;
  sellPrice: number;
  growTime: number;
  icon: string;
}

export const CROP_DATA: Record<CropType, CropInfo> = {
  rice: { name: 'Lúa Nước', seedCost: 10, sellPrice: 25, growTime: 6, icon: '🌾' },
  corn: { name: 'Bắp Ngô', seedCost: 15, sellPrice: 40, growTime: 9, icon: '🌽' },
  watermelon: { name: 'Dưa Hấu', seedCost: 25, sellPrice: 75, growTime: 14, icon: '🍉' },
  tomato: { name: 'Cà Chua', seedCost: 12, sellPrice: 30, growTime: 7, icon: '🍅' }
};

export interface FarmTile {
  gx: number;
  gy: number;
  x: number;
  y: number;
  sizeW: number;
  sizeH: number;
  tilled: boolean;
  watered: boolean;
  cropType: CropType | null;
  growth: number; // 0 -> 1
  swayOffset: number;
}

export class FarmingSystem {
  public static createFarmGrid(startX: number, startY: number, cols: number, rows: number): FarmTile[] {
    const tiles: FarmTile[] = [];
    const sizeW = 64;
    const sizeH = 40; // Chuẩn tỉ lệ góc nhìn nghiêng 2.5D (Tilted 2.5D Aspect Ratio)

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        tiles.push({
          gx: c,
          gy: r,
          x: startX + c * (sizeW + 10),
          y: startY + r * (sizeH + 12),
          sizeW,
          sizeH,
          tilled: true,
          watered: false,
          cropType: c % 4 === 0 ? 'rice' : (c % 4 === 1 ? 'corn' : (c % 4 === 2 ? 'watermelon' : 'tomato')),
          growth: 0.2 + (c * 0.25 + r * 0.15) % 0.8,
          swayOffset: Math.random() * Math.PI * 2
        });
      }
    }
    return tiles;
  }

  public static update(tiles: FarmTile[], dt: number): void {
    for (const t of tiles) {
      if (t.cropType && t.growth < 1.0) {
        const crop = CROP_DATA[t.cropType];
        const speed = (1 / crop.growTime) * (t.watered ? 1.8 : 1.0);
        t.growth = Math.min(1.0, t.growth + speed * dt);
      }
    }
  }

  public static render(ctx: CanvasRenderingContext2D, tiles: FarmTile[]): void {
    const time = Date.now() / 400;

    for (const t of tiles) {
      ctx.save();
      ctx.translate(t.x, t.y);

      // ============================================================
      // 1. LUỐNG ĐẤT CHUẨN GÓC NHÌN 2.5D (Tilted 2.5D Soil Bed)
      // ============================================================
      if (t.tilled) {
        // Thành bờ đất phía trước tạo chiều sâu 2.5D (Soil Depth Lip)
        ctx.fillStyle = t.watered ? '#1a0b01' : '#2d1403';
        ctx.beginPath();
        ctx.roundRect(0, 8, t.sizeW, t.sizeH, [0, 0, 10, 10]);
        ctx.fill();

        // Mặt luống đất nghiêng 2.5D
        const soilGrad = ctx.createLinearGradient(0, 0, 0, t.sizeH);
        soilGrad.addColorStop(0, t.watered ? '#381c07' : '#5c330a');
        soilGrad.addColorStop(0.7, t.watered ? '#261102' : '#452206');
        soilGrad.addColorStop(1, t.watered ? '#1a0b01' : '#331703');
        ctx.fillStyle = soilGrad;

        ctx.beginPath();
        ctx.roundRect(0, 0, t.sizeW, t.sizeH, 10);
        ctx.fill();

        // Viền bờ luống đất
        ctx.strokeStyle = t.watered ? '#150901' : '#261102';
        ctx.lineWidth = 1.6;
        ctx.stroke();

        // 2 Rãnh cày xới đất nằm ngang góc 2.5D
        ctx.strokeStyle = t.watered ? '#150901' : '#261102';
        ctx.lineWidth = 2.0;
        ctx.lineCap = 'round';
        for (let ry = 12; ry < t.sizeH - 6; ry += 12) {
          ctx.beginPath();
          ctx.moveTo(8, ry);
          ctx.quadraticCurveTo(t.sizeW * 0.5, ry + 1.5, t.sizeW - 8, ry);
          ctx.stroke();
        }

        // Cục đất nhỏ rải rác
        ctx.fillStyle = t.watered ? '#1e0e03' : '#3a1e06';
        ctx.beginPath();
        ctx.arc(14, 12, 1.8, 0, Math.PI * 2);
        ctx.arc(46, 18, 2.0, 0, Math.PI * 2);
        ctx.arc(26, 28, 1.6, 0, Math.PI * 2);
        ctx.fill();

        // Vệt ẩm ướt lấp lánh khi tưới nước góc 2.5D
        if (t.watered) {
          const wetGrad = ctx.createRadialGradient(t.sizeW / 2, t.sizeH / 2, 2, t.sizeW / 2, t.sizeH / 2, t.sizeW * 0.4);
          wetGrad.addColorStop(0, 'rgba(56, 189, 248, 0.32)');
          wetGrad.addColorStop(0.7, 'rgba(3, 105, 161, 0.12)');
          wetGrad.addColorStop(1, 'rgba(3, 105, 161, 0)');
          ctx.fillStyle = wetGrad;
          ctx.beginPath();
          ctx.ellipse(t.sizeW / 2, t.sizeH / 2, t.sizeW * 0.4, t.sizeH * 0.28, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ============================================================
      // 2. CÂY TRỒNG MỌC THẲNG ĐỨNG THEO TRỤC 2.5D
      // ============================================================
      if (t.cropType) {
        const cx = t.sizeW / 2;
        const cy = t.sizeH / 2 + 6;
        const g = t.growth;
        const sway = Math.sin(time + t.swayOffset) * (g * 2.8);

        ctx.save();
        ctx.translate(cx, cy);

        if (t.cropType === 'rice') {
          RiceRenderer.render(ctx, g, sway);
        } else if (t.cropType === 'corn') {
          CornRenderer.render(ctx, g, sway);
        } else if (t.cropType === 'watermelon') {
          WatermelonRenderer.render(ctx, g, sway);
        } else if (t.cropType === 'tomato') {
          TomatoRenderer.render(ctx, g, sway);
        }

        ctx.restore();
      }

      ctx.restore();
    }
  }
}
