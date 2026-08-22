/**
 * WildGrass.ts
 * Module chuyên trách vẽ Thảm Cỏ Bờ Đê Tinh Tế Trên Bề Mặt Đất Nâu (Surface Grass Trim):
 * - 🌿 Chỉ vẽ thảm cỏ mọc tự nhiên trên mặt đất (Surface Grass Line), giữ nền bờ đê đất nâu sạch sẽ và thoáng đãng
 * - 🌾 3 Tầng Chiều Sâu Dọc (Hậu Cảnh - Trung Cảnh - Tiền Cảnh)
 * - 💨 Đung đưa theo gió nhịp nhàng, uốn dạt mềm mại khi người chơi chạy qua
 * - 🦋 Đàn bướm bay lượn chập chờn
 * - 🚀 Viewport Culling 60 FPS siêu nhẹ
 */

import { GroundPlatform } from './GroundPlatform';

export interface GrassBladeInstance {
  id: number;
  x: number;
  scale: number;
  baseW: number;
  baseH: number;
  yOffset: number;
  lean: number;
  isFlipped: boolean;
  phase: number;
  swaySens: number;
  tier: 0 | 1 | 2;
}

export interface Butterfly {
  x: number;
  baseX: number;
  baseYOffset: number;
  color: string;
  wingColor: string;
  size: number;
  speedX: number;
  speedY: number;
  flapSpeed: number;
  phase: number;
}

export class WildGrass {
  private bladeImg: HTMLImageElement | null = null;
  public imagesLoaded: boolean = false;

  private instances: GrassBladeInstance[] = [];
  private butterflies: Butterfly[] = [];

  constructor() {
    this.loadArtSprites();
    this.initGrassInstances();
    this.initButterflies();
  }

  private loadArtSprites(): void {
    const v = Date.now();
    this.bladeImg = new Image();
    this.bladeImg.src = `/assets/props/single_grass_blade.png?v=${v}`;
    this.bladeImg.onload = () => {
      this.imagesLoaded = true;
    };
  }

  private initButterflies(): void {
    this.butterflies = [
      { x: -180, baseX: -180, baseYOffset: -45, color: '#fef08a', wingColor: '#facc15', size: 6.5, speedX: 18, speedY: 12, flapSpeed: 14, phase: 0.2 },
      { x: 920,  baseX: 920,  baseYOffset: -50, color: '#fed7aa', wingColor: '#fb923c', size: 7.0, speedX: 16, speedY: 15, flapSpeed: 12, phase: 0.8 },
      { x: 1350, baseX: 1350, baseYOffset: -55, color: '#fbcfe8', wingColor: '#f472b6', size: 6.0, speedX: 20, speedY: 10, flapSpeed: 16, phase: 1.5 },
      { x: 1520, baseX: 1520, baseYOffset: -60, color: '#ffffff', wingColor: '#bae6fd', size: 6.8, speedX: 15, speedY: 14, flapSpeed: 13, phase: 2.2 },
      { x: 2680, baseX: 2680, baseYOffset: -48, color: '#fef08a', wingColor: '#eab308', size: 6.5, speedX: 18, speedY: 11, flapSpeed: 15, phase: 3.0 }
    ];
  }

  public initFlowers(_startX?: number, _endX?: number): void {
    this.initGrassInstances();
  }

  /**
   * Khởi tạo thảm cỏ mọc gọn gàng và tự nhiên trên bề mặt đất
   */
  public initGrassInstances(): void {
    this.instances = [];

    const startX = -450;
    const endX = 4200;
    const pondWaterStart = 42;
    const pondWaterEnd = 758;
    const paddyWaterStart = 3208;
    const paddyWaterEnd = 3992;


    let currentX = startX;
    let idCounter = 0;

    const baseW = 189;
    const baseH = 411;

    while (currentX < endX) {
      if (currentX >= pondWaterStart && currentX <= pondWaterEnd) {
        currentX = pondWaterEnd + 2;
        continue;
      }
      if (currentX >= paddyWaterStart && currentX <= paddyWaterEnd) {
        currentX = paddyWaterEnd + 2;
        continue;
      }

      const tier = (idCounter % 3) as 0 | 1 | 2;
      
      // Kích thước cỏ nhỏ nhắn gọn gàng (cao ~8px - 13px)
      let scale = 0.022 + Math.random() * 0.009;
      let yOff = 0;
      if (tier === 0) {
        scale = 0.024 + Math.random() * 0.008;
        yOff = -0.8 + (Math.random() - 0.5) * 0.8;
      } else if (tier === 1) {
        scale = 0.022 + Math.random() * 0.007;
        yOff = 0.4 + (Math.random() - 0.5) * 0.8;
      } else {
        scale = 0.019 + Math.random() * 0.006;
        yOff = 1.4 + (Math.random() - 0.5) * 0.8;
      }

      this.instances.push({
        id: idCounter++,
        x: currentX + (Math.random() - 0.5) * 0.8,
        scale: scale,
        baseW: baseW,
        baseH: baseH,
        yOffset: yOff,
        lean: (Math.random() - 0.5) * 0.25,
        isFlipped: Math.random() < 0.5,
        phase: Math.random() * Math.PI * 2,
        swaySens: 0.85 + Math.random() * 0.35,
        tier: tier
      });

      // Khoảng cách dày mịn vừa vặn (0.8px - 1.4px)
      currentX += 0.8 + Math.random() * 0.6;
    }
  }

  /**
   * Render thảm cỏ với Viewport Culling 60 FPS siêu nhẹ
   */
  public render(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    playerX: number,
    animTimer: number,
    startX: number = -450,
    endX: number = 4200,
    pondStartX: number = 30,
    pondEndX: number = 770,
    paddyStartX: number = 3200,
    paddyEndX: number = 4000,
    cameraX: number = 0,
    screenW: number = 1400
  ): void {

    ctx.save();

    if (!this.bladeImg || !this.bladeImg.complete || this.bladeImg.naturalWidth <= 0) {
      ctx.restore();
      return;
    }

    const minViewX = cameraX - 25;
    const maxViewX = cameraX + screenW + 25;

    for (let i = 0; i < this.instances.length; i++) {
      const g = this.instances[i];
      if (g.x < minViewX || g.x > maxViewX) continue;
      if (g.x < startX - 10 || g.x > endX + 10) continue;

      if ((g.x >= pondStartX + 20 && g.x <= pondEndX - 20) || (g.x >= paddyStartX + 10 && g.x <= paddyEndX - 10)) {
        continue;
      }

      const surfaceY = GroundPlatform.getGroundY(g.x, groundY);
      const rootY = surfaceY + 1.0 + g.yOffset;
      const dist = Math.abs(g.x - playerX);

      // Gió thổi đung đưa
      let sway = Math.sin(animTimer * 2.2 + g.phase) * 0.04 * g.swaySens;

      // Uốn dạt khi người chơi bước qua
      if (dist < 24) {
        const dir = g.x > playerX ? 1 : -1;
        sway += dir * (1 - dist / 24) * 0.14 * g.swaySens;
      }

      ctx.save();
      ctx.translate(g.x, rootY);
      ctx.rotate(sway + g.lean);

      if (g.isFlipped) {
        ctx.scale(-1, 1);
      }

      const w = g.baseW * g.scale;
      const h = g.baseH * g.scale;

      ctx.drawImage(this.bladeImg, -w / 2, -h + 1, w, h);

      ctx.restore();
    }

    // ------------------------------------------------------------
    // 2. BƯỚM VÀNG & BƯỚM TRẮNG CHẬP CHỜN TRÊN THẢM CỎ
    // ------------------------------------------------------------
    this.butterflies.forEach(bt => {
      const flyX = bt.baseX + Math.sin(animTimer * 1.5 + bt.phase) * 35;
      if (flyX < minViewX || flyX > maxViewX) return;

      const groundAtX = GroundPlatform.getGroundY(flyX, groundY);
      const flyY = groundAtX + bt.baseYOffset + Math.sin(animTimer * 3.0 + bt.phase) * 12;
      const wingFlap = Math.max(0.05, Math.abs(Math.sin(animTimer * bt.flapSpeed + bt.phase)));

      ctx.save();
      ctx.translate(flyX, flyY);

      ctx.fillStyle = bt.wingColor;
      ctx.beginPath();
      ctx.ellipse(-bt.size * wingFlap * 0.7, -bt.size * 0.3, Math.max(0.5, bt.size * wingFlap), Math.max(0.5, bt.size * 0.65), -0.3, 0, Math.PI * 2);
      ctx.ellipse(bt.size * wingFlap * 0.7, -bt.size * 0.3, Math.max(0.5, bt.size * wingFlap), Math.max(0.5, bt.size * 0.65), 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = bt.color;
      ctx.beginPath();
      ctx.arc(-bt.size * wingFlap * 0.6, -bt.size * 0.3, Math.max(0.3, bt.size * wingFlap * 0.45), 0, Math.PI * 2);
      ctx.arc(bt.size * wingFlap * 0.6, -bt.size * 0.3, Math.max(0.3, bt.size * wingFlap * 0.45), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    ctx.restore();
  }
}
