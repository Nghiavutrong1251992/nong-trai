/**
 * WildFlower.ts
 * Quản lý sự xuất hiện và tương tác của 3 loài Hoa Dại tiêu biểu Đồng Quê Việt Nam trong bản đồ:
 * 1. 🌼 Hoa Xuyến Chi (Cúc Áo) — Cánh trắng nhụy vàng ven đường làng & bờ ruộng
 * 2. 🌾 Hoa Cỏ May / Cỏ Mần Trầu — Bông tím thon thả ven bờ đê & triền đồi
 * 3. ☘️ Hoa Chua Me Đất Vàng — Bông vàng tươi 3 lá hình tim mọc sát mặt đất
 */

import { GroundPlatform } from './GroundPlatform';
import { AssetLoader } from '../../core/AssetLoader';

export type FlowerType = 'xuyen_chi' | 'co_may' | 'chua_me_dat';

export interface WildFlowerInstance {
  id: number;
  type: FlowerType;
  x: number;
  scale: number;
  isFlipped: boolean;
  phase: number;
  swaySens: number;
  baseH: number;
}

export class WildFlower {
  private imgXuyenChi: HTMLImageElement | null = null;
  private imgCoMay: HTMLImageElement | null = null;
  private imgChuaMeDat: HTMLImageElement | null = null;

  public instances: WildFlowerInstance[] = [];

  constructor() {
    this.imgXuyenChi = AssetLoader.getImage('/assets/props/flowers/hoa_xuyen_chi.png');
    this.imgCoMay = AssetLoader.getImage('/assets/props/flowers/hoa_co_may.png');
    this.imgChuaMeDat = AssetLoader.getImage('/assets/props/flowers/hoa_chua_me_dat.png');

    this.initFlowerPlacements();
  }

  /**
   * Bố trí các cụm hoa dại tự nhiên dọc suốt chiều dài 4200m của bản đồ
   */
  public initFlowerPlacements(): void {
    this.instances = [];

    // Vùng nước (tránh cắm hoa giữa lòng hồ sâu và lòng ruộng lúa ngập nước)
    const pondWaterStart = 60;
    const pondWaterEnd = 740;
    const paddyWaterStart = 3220;
    const paddyWaterEnd = 3980;

    const isInsideWater = (x: number) => {
      return (x >= pondWaterStart && x <= pondWaterEnd) || (x >= paddyWaterStart && x <= paddyWaterEnd);
    };

    // Danh sách tọa độ cắm hoa tự nhiên theo các phân vùng cảnh quan
    const flowerSpots: Array<{ x: number; type: FlowerType; scale: number; baseH: number }> = [
      // 1. VÙNG ĐẦU BẢN ĐỒ & CỔNG LÀNG (-350m -> 50m)
      { x: -320, type: 'xuyen_chi', scale: 0.95, baseH: 42 },
      { x: -280, type: 'chua_me_dat', scale: 0.85, baseH: 26 },
      { x: -210, type: 'co_may', scale: 1.05, baseH: 46 },
      { x: -140, type: 'xuyen_chi', scale: 0.88, baseH: 40 },
      { x: -70,  type: 'chua_me_dat', scale: 0.90, baseH: 28 },
      { x: 10,   type: 'co_may', scale: 1.00, baseH: 44 },

      // 2. VÙNG BỜ AO & CÂY CẦU GỖ (760m -> 1200m)
      { x: 770,  type: 'chua_me_dat', scale: 0.95, baseH: 28 },
      { x: 820,  type: 'xuyen_chi', scale: 1.05, baseH: 44 },
      { x: 890,  type: 'co_may', scale: 1.10, baseH: 48 },
      { x: 960,  type: 'chua_me_dat', scale: 0.85, baseH: 25 },
      { x: 1040, type: 'xuyen_chi', scale: 0.92, baseH: 40 },
      { x: 1120, type: 'co_may', scale: 1.00, baseH: 45 },
      { x: 1180, type: 'chua_me_dat', scale: 0.90, baseH: 27 },

      // 3. VÙNG RẶNG TRE & ĐỒI CỎ XANH CHĂN THẢ TRÂU BÒ (1200m -> 2200m)
      { x: 1260, type: 'xuyen_chi', scale: 1.10, baseH: 46 },
      { x: 1330, type: 'co_may', scale: 1.15, baseH: 50 },
      { x: 1410, type: 'chua_me_dat', scale: 0.88, baseH: 26 },
      { x: 1520, type: 'xuyen_chi', scale: 0.95, baseH: 42 },
      { x: 1610, type: 'co_may', scale: 1.05, baseH: 46 },
      { x: 1720, type: 'chua_me_dat', scale: 0.92, baseH: 27 },
      { x: 1840, type: 'xuyen_chi', scale: 1.00, baseH: 43 },
      { x: 1950, type: 'co_may', scale: 1.10, baseH: 48 },
      { x: 2060, type: 'chua_me_dat', scale: 0.85, baseH: 25 },
      { x: 2180, type: 'xuyen_chi', scale: 1.05, baseH: 45 },

      // 4. VÙNG NGÔI NHÀ TRANH 3 GIAN & SÂN GẠCH (2200m -> 3200m)
      { x: 2280, type: 'chua_me_dat', scale: 0.95, baseH: 28 },
      { x: 2360, type: 'xuyen_chi', scale: 1.00, baseH: 44 },
      { x: 2470, type: 'co_may', scale: 1.12, baseH: 49 },
      { x: 2620, type: 'xuyen_chi', scale: 1.08, baseH: 45 },
      { x: 2740, type: 'chua_me_dat', scale: 0.90, baseH: 27 },
      { x: 2850, type: 'co_may', scale: 1.05, baseH: 47 },
      { x: 2980, type: 'xuyen_chi', scale: 1.15, baseH: 48 },
      { x: 3080, type: 'chua_me_dat', scale: 0.92, baseH: 27 },
      { x: 3160, type: 'co_may', scale: 1.00, baseH: 45 },

      // 5. VÙNG BỜ ĐÊ CUỐI BẢN ĐỒ (4000m -> 4200m)
      { x: 4020, type: 'chua_me_dat', scale: 0.90, baseH: 26 },
      { x: 4080, type: 'xuyen_chi', scale: 1.05, baseH: 45 },
      { x: 4140, type: 'co_may', scale: 1.15, baseH: 50 }
    ];

    flowerSpots.forEach((spot, i) => {
      if (!isInsideWater(spot.x)) {
        this.instances.push({
          id: i,
          type: spot.type,
          x: spot.x,
          scale: spot.scale,
          isFlipped: (i % 2 === 0),
          phase: (i * 0.73) % (Math.PI * 2),
          swaySens: 0.85 + (i % 5) * 0.1,
          baseH: spot.baseH
        });
      }
    });
  }

  /**
   * Render toàn bộ hoa dại theo chiều sâu và chuyển động gió
   */
  public render(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    animTimer: number,
    playerX: number = 0,
    cameraX: number = 0,
    screenW: number = 1400
  ): void {
    const minVisX = cameraX - 120;
    const maxVisX = cameraX + screenW + 120;

    for (let i = 0; i < this.instances.length; i++) {
      const f = this.instances[i];
      if (f.x < minVisX || f.x > maxVisX) continue;

      let img: HTMLImageElement | null = null;
      if (f.type === 'xuyen_chi') img = this.imgXuyenChi;
      else if (f.type === 'co_may') img = this.imgCoMay;
      else if (f.type === 'chua_me_dat') img = this.imgChuaMeDat;

      if (!img || !img.complete || img.naturalWidth === 0) continue;

      const fy = GroundPlatform.getGroundY(f.x, groundY);

      // 1. Hiệu ứng gió đung đưa nhịp nhàng tự nhiên
      let windSway = Math.sin(animTimer * 2.2 + f.phase) * 0.045 * f.swaySens;

      // 2. Hiệu ứng cọ xát khi người chơi chạy qua (uốn dạt sang một bên)
      const pDist = playerX - f.x;
      if (Math.abs(pDist) < 36) {
        const pushDir = pDist > 0 ? -1 : 1;
        const pushMag = (1.0 - Math.abs(pDist) / 36) * 0.12;
        windSway += pushDir * pushMag;
      }

      const drawH = f.baseH * f.scale;
      const aspect = img.naturalWidth / img.naturalHeight;
      const drawW = drawH * aspect;

      ctx.save();
      ctx.translate(Math.round(f.x), Math.round(fy));

      // Bóng đổ mờ dưới gốc
      ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
      ctx.beginPath();
      ctx.ellipse(0, 0, drawW * 0.35, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Lật hướng
      if (f.isFlipped) {
        ctx.scale(-1, 1);
      }

      // Xoay uốn theo gió quanh gốc
      ctx.rotate(windSway);

      // Vẽ hoa từ gốc lên trên
      ctx.drawImage(img, -drawW / 2, -drawH + 3, drawW, drawH);

      ctx.restore();
    }
  }
}
