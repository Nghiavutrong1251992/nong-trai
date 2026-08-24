/**
 * FishPond.ts
 * Module Quản Lý Ao Cá / Hồ Làng Quê Nông Thôn Việt Nam:
 * - Trải rộng trọn vẹn 4 phân đoạn (Đoạn 1, 2, 3, 4: X từ 30px -> 770px, rộng 740px)
 * - Tách riêng các Renderer đồ họa chuyên biệt:
 *   + FishRenderer: Vẽ chi tiết từng con cá (Cá chép vàng, Cá Koi Kohaku, Cá rô đồng, Cá cờ)
 *   + LotusRenderer: Vẽ hoa sen hồng nhiều lớp cánh, nụ sen, lá sen khổng lồ gân tỏa tròn và giọt sương đọng
 *   + PondBridgeRenderer: Vẽ cầu ao bằng thân tre già, cọc cắm đáy hồ, dây thừng bện và gáo dừa múc nước
 * - Logic AI đàn cá 14 con bơi lội tự nhiên, bọt khí, tương tác rải thức ăn cho cá [F]
 */

import { FishRenderer, FishRenderData, FishSpecies } from './FishRenderer';
import { AssetLoader } from '../../core/AssetLoader';

export interface Fish extends FishRenderData {
  vx: number;
  vy: number;
  swimSpeed: number;
  targetX: number;
  targetY: number;
  surfaceTimer: number;
}

export interface FoodPellet {
  x: number;
  y: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface WaterRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

export interface Bubble {
  x: number;
  y: number;
  vy: number;
  radius: number;
  alpha: number;
}

export type WaterPlantType =
  | 'rong_duoi_chon'
  | 'beo_tam'
  | 'rong_la_dai'
  | 'co_toc_nuoc'
  | 'rong_xuong_ca'
  | 'rong_diep';

const WATER_PLANT_PATHS: Record<WaterPlantType, string> = {
  rong_duoi_chon: '/assets/props/water_plants/rong_duoi_chon.png',
  beo_tam:        '/assets/props/water_plants/beo_tam.png',
  rong_la_dai:    '/assets/props/water_plants/rong_la_dai.png',
  co_toc_nuoc:    '/assets/props/water_plants/co_toc_nuoc.png',
  rong_xuong_ca:  '/assets/props/water_plants/rong_xuong_ca.png',
  rong_diep:      '/assets/props/water_plants/rong_diep.png',
};

export interface WaterPlantInstance {
  type: WaterPlantType;
  x: number;
  width: number;
  height: number;
  swaySpeed: number;
  swayAmp: number;
}

export class FishPond {
  public startX: number = 30;
  public endX: number = 770;
  public depth: number = 125;

  private fishes: Fish[] = [];
  private foodPellets: FoodPellet[] = [];
  private ripples: WaterRipple[] = [];
  private bubbles: Bubble[] = [];

  // 1. CÁC BỤI RONG THỦY SINH MỌC TỪ ĐÁY AO
  public underwaterPlants: WaterPlantInstance[] = [
    { type: 'rong_duoi_chon', x: 85,  width: 42, height: 54, swaySpeed: 1.6, swayAmp: 0.08 },
    { type: 'co_toc_nuoc',    x: 130, width: 38, height: 48, swaySpeed: 2.2, swayAmp: 0.10 },
    { type: 'rong_la_dai',    x: 185, width: 42, height: 64, swaySpeed: 1.4, swayAmp: 0.12 },
    { type: 'rong_diep',      x: 245, width: 46, height: 48, swaySpeed: 1.5, swayAmp: 0.07 },
    { type: 'rong_xuong_ca',  x: 305, width: 44, height: 52, swaySpeed: 1.8, swayAmp: 0.09 },
    { type: 'rong_duoi_chon', x: 445, width: 44, height: 56, swaySpeed: 1.5, swayAmp: 0.08 },
    { type: 'rong_la_dai',    x: 505, width: 42, height: 64, swaySpeed: 1.3, swayAmp: 0.12 },
    { type: 'co_toc_nuoc',    x: 560, width: 38, height: 48, swaySpeed: 2.0, swayAmp: 0.10 },
    { type: 'rong_diep',      x: 620, width: 46, height: 48, swaySpeed: 1.6, swayAmp: 0.07 },
    { type: 'rong_xuong_ca',  x: 675, width: 44, height: 52, swaySpeed: 1.7, swayAmp: 0.09 },
    { type: 'rong_duoi_chon', x: 725, width: 40, height: 50, swaySpeed: 1.5, swayAmp: 0.08 },
  ];

  // 2. CÁC CỤM BÈO TẤM NỔI DẬP DỀNH TRÊN MẶT NƯỚC
  public floatingPlants: Array<{ type: WaterPlantType; x: number; yOffset: number; width: number; height: number }> = [
    { type: 'beo_tam', x: 70,  yOffset: 3, width: 38, height: 24 },
    { type: 'beo_tam', x: 160, yOffset: 4, width: 44, height: 28 },
    { type: 'beo_tam', x: 260, yOffset: 3, width: 40, height: 25 },
    { type: 'beo_tam', x: 475, yOffset: 4, width: 42, height: 26 },
    { type: 'beo_tam', x: 580, yOffset: 3, width: 38, height: 24 },
    { type: 'beo_tam', x: 695, yOffset: 4, width: 42, height: 26 }
  ];

  constructor() {
    this.initFishes();
  }

  /**
   * Tính độ sâu đáy ao tại hoành độ X
   */
  public getPondBedY(x: number, groundY: number): number {
    const t = Math.max(0, Math.min(1, (x - this.startX) / (this.endX - this.startX)));
    const bedCurve = Math.sin(t * Math.PI);
    return groundY + bedCurve * (this.depth + 14);
  }

  private initFishes(): void {
    this.fishes = [];
    const fishConfigs: Array<{ species: FishSpecies; size: number; speed: number }> = [
      // 1. Cá Chép Vàng (thân vàng óng, râu mép)
      { species: 'ca_chep', size: 25, speed: 4.5 },
      { species: 'ca_chep', size: 28, speed: 4.0 },
      { species: 'ca_chep', size: 24, speed: 5.0 },

      // 2. Cá Trê Đồng (thân trơn râu dài, đuôi cong)
      { species: 'ca_tre', size: 27, speed: 3.8 },
      { species: 'ca_tre', size: 31, speed: 3.5 },

      // 3. Cá Rô Đồng (thân dẹp, vằn xám đen)
      { species: 'ca_ro', size: 20, speed: 5.5 },
      { species: 'ca_ro', size: 23, speed: 5.0 },
      { species: 'ca_ro', size: 21, speed: 5.2 },

      // 4. Cá Mè Bạc (mình thon dài lướt nhanh)
      { species: 'ca_me', size: 25, speed: 6.0 },
      { species: 'ca_me', size: 27, speed: 5.8 },
      { species: 'ca_me', size: 22, speed: 6.2 },

      // 5. Cá Lóc / Cá Quả (đầu rắn, hoa văn rằn ri)
      { species: 'ca_loc', size: 29, speed: 4.2 },
      { species: 'ca_loc', size: 32, speed: 3.9 },

      // 6. Cá Vàng Ba Đuôi (cam đỏ rực rỡ, đuôi xòe lụa)
      { species: 'ca_vang', size: 22, speed: 4.2 },
      { species: 'ca_vang', size: 25, speed: 3.8 },
      { species: 'ca_vang', size: 20, speed: 4.5 }
    ];

    fishConfigs.forEach((cfg) => {
      this.fishes.push({
        x: this.startX + 50 + Math.random() * (this.endX - this.startX - 100),
        y: 18 + Math.random() * (this.depth - 36),
        vx: (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 25),
        vy: (Math.random() - 0.5) * 8,
        size: cfg.size,
        species: cfg.species,
        swimPhase: Math.random() * Math.PI * 2,
        swimSpeed: cfg.speed + (Math.random() - 0.5) * 1.0,
        targetX: this.startX + 60 + Math.random() * (this.endX - this.startX - 120),
        targetY: 16 + Math.random() * (this.depth - 32),
        facing: 1,
        surfaceTimer: 3.0 + Math.random() * 6.0
      });
    });
  }

  public update(dt: number, groundY: number): void {
    const waterY = groundY + 4;

    // 1. CẬP NHẬT ĐÀN CÁ BƠI
    this.fishes.forEach(fish => {
      fish.swimPhase += fish.swimSpeed * dt;

      let nearestFood: FoodPellet | null = null;
      let minDist = 160;
      this.foodPellets.forEach(f => {
        const d = Math.hypot(f.x - fish.x, f.y - (groundY + fish.y));
        if (d < minDist) {
          minDist = d;
          nearestFood = f;
        }
      });

      if (nearestFood) {
        const targetFoodX = (nearestFood as FoodPellet).x;
        const targetFoodY = (nearestFood as FoodPellet).y - groundY;
        const dx = targetFoodX - fish.x;
        const dy = targetFoodY - fish.y;
        fish.vx = (dx > 0 ? 1 : -1) * 65;
        fish.vy = Math.max(-20, Math.min(20, dy * 2.0));
        fish.facing = dx >= 0 ? 1 : -1;

        if (Math.hypot(dx, dy) < 14) {
          this.ripples.push({
            x: fish.x,
            y: waterY,
            radius: 3,
            maxRadius: 18,
            alpha: 0.8
          });
          const idx = this.foodPellets.indexOf(nearestFood);
          if (idx !== -1) this.foodPellets.splice(idx, 1);
        }
      } else {
        const dx = fish.targetX - fish.x;
        const dy = fish.targetY - fish.y;

        if (Math.abs(dx) < 20 || Math.random() < 0.015) {
          fish.targetX = this.startX + 50 + Math.random() * (this.endX - this.startX - 100);
          fish.targetY = 10 + Math.random() * (this.depth - 22);
        }

        const desiredVx = (dx > 0 ? 1 : -1) * (20 + Math.random() * 20);
        fish.vx += (desiredVx - fish.vx) * dt * 2.0;
        fish.vy += ((dy > 0 ? 1 : -1) * 8 - fish.vy) * dt * 2.0;
        fish.facing = fish.vx >= 0 ? 1 : -1;

        fish.surfaceTimer -= dt;
        if (fish.surfaceTimer <= 0) {
          fish.surfaceTimer = 4.0 + Math.random() * 8.0;
          fish.targetY = 6;
          this.ripples.push({
            x: fish.x,
            y: waterY,
            radius: 2,
            maxRadius: 14,
            alpha: 0.7
          });
        }
      }

      fish.x += fish.vx * dt;
      fish.y += fish.vy * dt;

      // Giới hạn biên cá bơi không tràn ra ngoài lòng hồ
      fish.x = Math.max(this.startX + 35, Math.min(this.endX - 35, fish.x));
      const t = Math.max(0, Math.min(1, (fish.x - this.startX) / (this.endX - this.startX)));
      const maxBedDepth = Math.sin(t * Math.PI) * (this.depth + 4);
      fish.y = Math.max(6, Math.min(Math.max(10, maxBedDepth - 10), fish.y));
    });

    // 2. CẬP NHẬT THỨC ĂN RƠI XUỐNG NƯỚC
    for (let i = this.foodPellets.length - 1; i >= 0; i--) {
      const f = this.foodPellets[i];
      f.life += dt;
      f.y += f.vy * dt;

      if (f.y >= waterY) {
        f.vy = 12;
      }

      const bedY = this.getPondBedY(f.x, groundY);
      if (f.life >= f.maxLife || f.y >= bedY - 2) {
        this.foodPellets.splice(i, 1);
      }
    }

    // 3. CẬP NHẬT VÒNG SÓNG NƯỚC (RIPPLES)
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rp = this.ripples[i];
      rp.radius += dt * 18;
      rp.alpha = Math.max(0, rp.alpha - dt * 0.9);
      if (rp.alpha <= 0 || rp.radius >= rp.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }

    // 4. CẬP NHẬT BỌT KHÍ (BUBBLES): Sinh ra từ đáy ao và vỡ tan khi chạm mặt nước
    if (Math.random() < 0.15) {
      const bx = this.startX + 45 + Math.random() * (this.endX - this.startX - 90);
      const bedY = this.getPondBedY(bx, groundY);
      this.bubbles.push({
        x: bx,
        y: bedY - 6,
        vy: 22 + Math.random() * 18,
        radius: 1.5 + Math.random() * 2.0,
        alpha: 0.75
      });
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.y -= b.vy * dt;

      // Khi bong bóng chạm mặt nước thì vỡ tạo gợn sóng
      if (b.y <= waterY) {
        this.ripples.push({
          x: b.x,
          y: waterY,
          radius: 1.5,
          maxRadius: 8,
          alpha: 0.6
        });
        this.bubbles.splice(i, 1);
      }
    }
  }

  /**
   * Tương tác: Rải thức ăn cho cá tại tọa độ X
   */
  public feedFish(x: number, groundY: number): boolean {
    const dropX = Math.max(this.startX + 40, Math.min(this.endX - 40, x));
    for (let i = 0; i < 5; i++) {
      this.foodPellets.push({
        x: dropX + (Math.random() - 0.5) * 35,
        y: groundY - 10 - Math.random() * 15,
        vy: 70 + Math.random() * 40,
        life: 0,
        maxLife: 6.0
      });
    }

    this.ripples.push({
      x: dropX,
      y: groundY + 4,
      radius: 4,
      maxRadius: 22,
      alpha: 0.85
    });

    return true;
  }

  /**
   * Render Toàn Bộ Hồ Cá Trải Dài 4 Đoạn
   */
  public render(ctx: CanvasRenderingContext2D, groundY: number, animTimer: number, playerX?: number): void {
    ctx.save();

    const waterY = groundY + 4;
    const waterH = this.depth + 16;

    // 1. VẼ LÒNG HỒ VÀ NỀN BÙN SÂU
    const mudGrad = ctx.createLinearGradient(0, groundY, 0, groundY + waterH);
    mudGrad.addColorStop(0, '#042f2e');
    mudGrad.addColorStop(0.5, '#083344');
    mudGrad.addColorStop(1, '#021827');
    ctx.fillStyle = mudGrad;

    ctx.beginPath();
    ctx.moveTo(this.startX, groundY);
    ctx.bezierCurveTo(this.startX + 45, groundY + waterH, this.endX - 45, groundY + waterH, this.endX, groundY);
    ctx.lineTo(this.endX, groundY + waterH + 30);
    ctx.lineTo(this.startX, groundY + waterH + 30);
    ctx.closePath();
    ctx.fill();

    // 2. MẶT NƯỚC XANH NGỌC BÍCH TRONG VẮT
    const waterGrad = ctx.createLinearGradient(0, waterY, 0, waterY + this.depth);
    waterGrad.addColorStop(0, 'rgba(6, 182, 212, 0.45)');
    waterGrad.addColorStop(0.4, 'rgba(14, 116, 144, 0.65)');
    waterGrad.addColorStop(1, 'rgba(15, 23, 42, 0.85)');
    ctx.fillStyle = waterGrad;

    ctx.beginPath();
    ctx.moveTo(this.startX + 8, waterY);
    ctx.bezierCurveTo(this.startX + 50, waterY + this.depth, this.endX - 50, waterY + this.depth, this.endX - 8, waterY);
    ctx.closePath();
    ctx.fill();

    // 3. VẼ CÁC BỤI RONG THỦY SINH MỌC TỪ ĐÁY AO (UỐN LƯỢN MỀM MẠI THEO DÒNG NƯỚC)
    this.underwaterPlants.forEach(p => {
      const imgPath = WATER_PLANT_PATHS[p.type];
      const img = AssetLoader.getImage(imgPath);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        const bedY = this.getPondBedY(p.x, groundY);
        const sway = Math.sin(animTimer * p.swaySpeed + p.x * 0.08) * p.swayAmp;

        ctx.translate(p.x, bedY - 2);
        ctx.rotate(sway);

        // Hiệu ứng chìm dưới nước tự nhiên
        ctx.globalAlpha = 0.92;
        ctx.drawImage(img, -p.width / 2, -p.height, p.width, p.height);
        ctx.restore();
      }
    });

    // 4. GỢN SÓNG NƯỚC LẤP LÁNH & VÒNG SÓNG (WATER RIPPLES)
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.2;
    for (let x = this.startX + 40; x < this.endX - 40; x += 60) {
      const wave = Math.sin(animTimer * 2.5 + x * 0.05) * 2.0;
      ctx.beginPath();
      ctx.ellipse(x, waterY + 4 + wave, 22, 2.4, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    this.ripples.forEach(rp => {
      ctx.strokeStyle = `rgba(255, 255, 255, ${rp.alpha * 0.8})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(rp.x, rp.y, rp.radius, rp.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.restore();

    // 5. VẼ BỌT KHÍ NỔI LÊN (BUBBLES - chỉ nổi trong lòng nước)
    this.bubbles.forEach(b => {
      ctx.save();
      ctx.fillStyle = `rgba(224, 242, 254, ${b.alpha * 0.6})`;
      ctx.strokeStyle = `rgba(255, 255, 255, ${b.alpha * 0.9})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // 6. VẼ ĐÀN CÁ BƠI LỘI TUNG TĂNG (FishRenderer)
    this.fishes.forEach(fish => {
      FishRenderer.renderFish(ctx, { ...fish, y: groundY + fish.y }, animTimer);
    });

    // 7. VẼ VIÊN THỨC ĂN CHO CÁ (FOOD PELLETS)
    this.foodPellets.forEach(f => {
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(f.x, f.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 8. VẼ CỤM BÈO TẤM NỔI TRÊN MẶT NƯỚC (DẬP DỀNH THEO SÓNG)
    this.floatingPlants.forEach(fp => {
      const imgPath = WATER_PLANT_PATHS[fp.type];
      const img = AssetLoader.getImage(imgPath);
      if (img && img.complete && img.naturalWidth > 0) {
        ctx.save();
        const waveY = Math.sin(animTimer * 2.0 + fp.x * 0.08) * 1.5;
        ctx.translate(fp.x, waterY + fp.yOffset + waveY);
        ctx.drawImage(img, -fp.width / 2, -fp.height / 2, fp.width, fp.height);
        ctx.restore();
      }
    });

    ctx.restore();
  }
}
