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

import { FishRenderer, FishRenderData } from './FishRenderer';
import { LotusRenderer } from './LotusRenderer';
import { PondBridgeRenderer } from './PondBridgeRenderer';

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

export class FishPond {
  public startX: number = 30;
  public endX: number = 770;
  public depth: number = 58;

  private fishes: Fish[] = [];
  private foodPellets: FoodPellet[] = [];
  private ripples: WaterRipple[] = [];
  private bubbles: Bubble[] = [];

  // Vị trí 9 cụm hoa sen, nụ sen và lá sen trải dài khắp 4 đoạn
  public lotuses: Array<{ x: number; yOffset: number; variant: 'bloom' | 'bud' | 'leaf_only'; scale: number }> = [
    { x: 75,  yOffset: 12, variant: 'bloom',     scale: 0.95 },
    { x: 145, yOffset: 24, variant: 'bud',       scale: 1.10 },
    { x: 230, yOffset: 15, variant: 'leaf_only', scale: 1.25 },
    { x: 305, yOffset: 26, variant: 'bloom',     scale: 1.05 },
    { x: 450, yOffset: 14, variant: 'bloom',     scale: 1.15 },
    { x: 530, yOffset: 25, variant: 'bud',       scale: 1.00 },
    { x: 610, yOffset: 18, variant: 'leaf_only', scale: 1.20 },
    { x: 685, yOffset: 26, variant: 'bloom',     scale: 1.05 },
    { x: 735, yOffset: 12, variant: 'bud',       scale: 0.90 }
  ];

  // Các cụm bèo tấm xanh trôi nhẹ
  public duckweeds = [
    { x: 65,  yOffset: 18, radius: 14 },
    { x: 195, yOffset: 24, radius: 18 },
    { x: 280, yOffset: 16, radius: 15 },
    { x: 490, yOffset: 22, radius: 20 },
    { x: 580, yOffset: 15, radius: 16 },
    { x: 710, yOffset: 24, radius: 17 }
  ];

  constructor() {
    this.initFishes();
  }

  private initFishes(): void {
    this.fishes = [];
    const fishConfigs = [
      { type: 'carp_gold', color: '#f59e0b', tailColor: '#fbbf24', finColor: '#fde68a', size: 15 },
      { type: 'carp_red',  color: '#ea580c', tailColor: '#f97316', finColor: '#fed7aa', size: 16 },
      { type: 'carp_gold', color: '#eab308', tailColor: '#fde047', finColor: '#fef08a', size: 13 },
      { type: 'carp_red',  color: '#dc2626', tailColor: '#f87171', finColor: '#fecaca', size: 17 },
      { type: 'carp_black', color: '#334155', tailColor: '#64748b', finColor: '#94a3b8', size: 14 },
      { type: 'paradise',  color: '#0284c7', tailColor: '#ec4899', finColor: '#38bdf8', size: 12 },
      { type: 'carp_gold', color: '#f59e0b', tailColor: '#fbbf24', finColor: '#fde68a', size: 14 },
      { type: 'carp_red',  color: '#ea580c', tailColor: '#fb923c', finColor: '#fed7aa', size: 15 },
      { type: 'carp_black', color: '#1e293b', tailColor: '#475569', finColor: '#94a3b8', size: 13 },
      { type: 'paradise',  color: '#059669', tailColor: '#f43f5e', finColor: '#34d399', size: 12 },
      { type: 'carp_gold', color: '#facc15', tailColor: '#fef08a', finColor: '#ffffff', size: 13 },
      { type: 'carp_red',  color: '#e11d48', tailColor: '#fb7185', finColor: '#ffe4e6', size: 15 },
      { type: 'carp_gold', color: '#f59e0b', tailColor: '#fbbf24', finColor: '#fde68a', size: 14 },
      { type: 'carp_red',  color: '#ea580c', tailColor: '#f97316', finColor: '#fed7aa', size: 16 }
    ];

    fishConfigs.forEach((cfg) => {
      this.fishes.push({
        x: this.startX + 50 + Math.random() * (this.endX - this.startX - 100),
        y: 12 + Math.random() * (this.depth - 22),
        vx: (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 25),
        vy: (Math.random() - 0.5) * 8,
        size: cfg.size,
        type: cfg.type as any,
        color: cfg.color,
        tailColor: cfg.tailColor,
        finColor: cfg.finColor,
        swimPhase: Math.random() * Math.PI * 2,
        swimSpeed: 4.5 + Math.random() * 3.5,
        targetX: this.startX + 60 + Math.random() * (this.endX - this.startX - 120),
        targetY: 10 + Math.random() * (this.depth - 18),
        facing: 1,
        surfaceTimer: 3.0 + Math.random() * 6.0
      });
    });
  }

  public update(dt: number, groundY: number): void {
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
            y: groundY + 4,
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
          fish.targetY = 10 + Math.random() * (this.depth - 18);
        }

        const desiredVx = (dx > 0 ? 1 : -1) * (20 + Math.random() * 20);
        fish.vx += (desiredVx - fish.vx) * dt * 2.0;
        fish.vy += ((dy > 0 ? 1 : -1) * 8 - fish.vy) * dt * 2.0;
        fish.facing = fish.vx >= 0 ? 1 : -1;

        fish.surfaceTimer -= dt;
        if (fish.surfaceTimer <= 0) {
          fish.surfaceTimer = 4.0 + Math.random() * 8.0;
          fish.targetY = 5;
          this.ripples.push({
            x: fish.x,
            y: groundY + 3,
            radius: 2,
            maxRadius: 14,
            alpha: 0.7
          });
        }
      }

      fish.x += fish.vx * dt;
      fish.y += fish.vy * dt;

      fish.x = Math.max(this.startX + 30, Math.min(this.endX - 30, fish.x));
      fish.y = Math.max(6, Math.min(this.depth - 10, fish.y));
    });

    // 2. CẬP NHẬT THỨC ĂN RƠI XUỐNG NƯỚC
    for (let i = this.foodPellets.length - 1; i >= 0; i--) {
      const f = this.foodPellets[i];
      f.life += dt;
      f.y += f.vy * dt;

      if (f.y >= groundY + 8) {
        f.vy = 12;
      }

      if (f.life >= f.maxLife || f.y >= groundY + this.depth - 4) {
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

    // 4. CẬP NHẬT BỌT KHÍ (BUBBLES)
    if (Math.random() < 0.12) {
      this.bubbles.push({
        x: this.startX + 40 + Math.random() * (this.endX - this.startX - 80),
        y: groundY + this.depth - 8,
        vy: 22 + Math.random() * 20,
        radius: 1.5 + Math.random() * 2.0,
        alpha: 0.75
      });
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.y -= b.vy * dt;
      if (b.y <= groundY + 4) {
        this.ripples.push({
          x: b.x,
          y: groundY + 3,
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
      y: groundY + 3,
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
    const waterH = this.depth + 15;

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

    // 3. GỢN SÓNG NƯỚC LẤP LÁNH & VÒNG SÓNG (WATER RIPPLES)
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

    // 4. VẼ BỌT KHÍ NỔI LÊN (BUBBLES)
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

    // 5. VẼ ĐÀN CÁ BƠI LỘI TUNG TĂNG (GỌI TỪNG CON QUA FishRenderer)
    this.fishes.forEach(fish => {
      FishRenderer.renderFish(ctx, { ...fish, y: groundY + fish.y }, animTimer);
    });

    // 6. VẼ VIÊN THỨC ĂN CHO CÁ (FOOD PELLETS)
    this.foodPellets.forEach(f => {
      ctx.save();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(f.x, f.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 7. CỤM BÈO TẤM & LÁ SEN HOA SEN NỔI TRÊN MẶT NƯỚC (GỌI TỪNG CỤM QUA LotusRenderer)
    this.duckweeds.forEach(dw => {
      ctx.save();
      const waveY = Math.sin(animTimer * 2.0 + dw.x * 0.08) * 1.5;
      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.arc(dw.x, waterY + dw.yOffset + waveY, dw.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(dw.x - 3, waterY + dw.yOffset + waveY - 2, dw.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    this.lotuses.forEach(lot => {
      const waveY = Math.sin(animTimer * 1.8 + lot.x * 0.06) * 2.0;
      LotusRenderer.render(ctx, lot.x, waterY + lot.yOffset + waveY, lot.variant, animTimer);
    });

    // 8. CẦU AO BẮC RA MẶT NƯỚC Ở TRUNG TÂM HỒ (X = 365m)
    const pierX = 365;
    const pierW = 70;
    PondBridgeRenderer.render(ctx, pierX, groundY, pierW, this.depth);

    // 9. BỜ AO KÈ ĐÁ CUỘI & RÊU XANH
    ctx.save();
    const stones = [
      { x: this.startX + 6, y: groundY - 2, r: 9, color: '#78716c' },
      { x: this.startX + 20, y: groundY, r: 12, color: '#a8a29e' },
      { x: this.startX + 35, y: groundY + 3, r: 10, color: '#57534e' },
      { x: this.endX - 35, y: groundY + 3, r: 10, color: '#78716c' },
      { x: this.endX - 20, y: groundY, r: 13, color: '#a8a29e' },
      { x: this.endX - 6, y: groundY - 2, r: 9, color: '#57534e' }
    ];

    stones.forEach(st => {
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(st.x - 2, st.y - st.r * 0.4, st.r * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    ctx.restore();
  }
}
