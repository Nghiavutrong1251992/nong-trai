/**
 * Rooster.ts
 * Chú Gà Trống Dân Gian Làng Quê Việt Nam:
 * - 3 Hoạt ảnh chuẩn nét: Gà Đi (26 frames), Gà Ăn / Mổ thóc (27 frames), Gà Đứng Yên vỗ cánh (9 frames)
 * - Tách nền trong suốt không viền sáng, lông đuôi ánh xanh đen, ức vàng cam óng ả
 * - Giới hạn an toàn chỉ đi trên bãi cỏ & quanh sân (x: 820m -> 2300m), không đi vào hồ nước
 */

import { GroundPlatform } from '../graphics/plants/GroundPlatform';

export type RoosterState = 'idle' | 'eat' | 'walk';

interface GrainParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export class Rooster {
  public x: number;
  public y: number;
  public vx: number = 24; // Vận tốc đi bộ dũng mãnh
  public facing: number = 1; // 1: quay phải, -1: quay trái (Sprite gốc quay sang PHẢI)
  public targetHeight: number = 74; // Chiều cao gà trống cao ráo dũng mãnh (74px)

  // Sprite Sheet 1: Đi dạo (26 frames)
  private walkSheet = new Image();
  private walkLoaded: boolean = false;
  private walkFrames: number = 26;
  private walkFps: number = 14.0;

  // Sprite Sheet 2: Mổ thóc / Ăn (27 frames)
  private eatSheet = new Image();
  private eatLoaded: boolean = false;
  private eatFrames: number = 27;
  private eatFps: number = 13.0;

  // Sprite Sheet 3: Đứng yên vỗ cánh oai vệ (9 frames)
  private idleSheet = new Image();
  private idleLoaded: boolean = false;
  private idleFrames: number = 9;
  private idleFps: number = 8.0;

  private animTimer: number = 0;

  // AI State Machine (Đứng yên vỗ cánh <-> Mổ thóc <-> Đi dạo)
  public state: RoosterState = 'idle';
  private stateTimer: number = 0;
  private minX: number = 820; // Giới hạn chỉ đi trên bãi cỏ, không đi vào hồ nước
  private maxX: number = 2300;

  // Hiệu ứng hạt thóc
  private grains: GrainParticle[] = [];
  private lastPeckFrame: number = -1;

  constructor(x: number = 940, y: number = 480) {
    this.x = x;
    this.y = y;

    this.walkSheet.src = '/assets/characters/rooster/rooster_walk_sheet.png?v=' + Date.now();
    this.walkSheet.onload = () => {
      this.walkLoaded = true;
    };

    this.eatSheet.src = '/assets/characters/rooster/rooster_eat_sheet.png?v=' + Date.now();
    this.eatSheet.onload = () => {
      this.eatLoaded = true;
    };

    this.idleSheet.src = '/assets/characters/rooster/rooster_idle_sheet.png?v=' + Date.now();
    this.idleSheet.onload = () => {
      this.idleLoaded = true;
    };
  }

  public update(dt: number, groundY: number, _playerX?: number): void {
    this.animTimer += dt;
    this.stateTimer += dt;
    this.y = GroundPlatform.getGroundY(this.x, groundY);

    // 1. Cập nhật hiệu ứng hạt thóc khi gà mổ
    for (let i = this.grains.length - 1; i >= 0; i--) {
      const g = this.grains[i];
      g.life -= dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.vy += 260 * dt;
      if (g.life <= 0) {
        this.grains.splice(i, 1);
      }
    }

    // 2. AI State Machine
    if (this.state === 'idle') {
      const fullIdleDuration = (this.idleFrames / this.idleFps) * (2 + Math.floor(Math.random() * 2));
      if (this.stateTimer >= fullIdleDuration) {
        if (Math.random() < 0.6) {
          this.state = 'eat';
        } else {
          this.state = 'walk';
          this.facing = Math.random() < 0.5 ? 1 : -1;
          this.vx = this.facing * (22 + Math.random() * 8);
        }
        this.stateTimer = 0;
        this.animTimer = 0;
      }
    } else if (this.state === 'eat') {
      const currentFrame = Math.floor(this.animTimer * this.eatFps) % this.eatFrames;

      // Khi mỏ cúi mổ đất
      if ((currentFrame >= 6 && currentFrame <= 12) && this.lastPeckFrame !== currentFrame) {
        this.spawnGrainParticles();
      }
      this.lastPeckFrame = currentFrame;

      const fullEatDuration = (this.eatFrames / this.eatFps) * (1.5 + Math.random() * 1.5);
      if (this.stateTimer >= fullEatDuration) {
        if (Math.random() < 0.5) {
          this.state = 'idle';
        } else {
          this.state = 'walk';
          this.facing = Math.random() < 0.5 ? 1 : -1;
          this.vx = this.facing * (22 + Math.random() * 8);
        }
        this.stateTimer = 0;
        this.animTimer = 0;
      }
    } else if (this.state === 'walk') {
      this.x += this.vx * dt;

      if (this.stateTimer >= 3.5 + Math.random() * 2.0) {
        this.state = Math.random() < 0.6 ? 'eat' : 'idle';
        this.vx = 0;
        this.stateTimer = 0;
        this.animTimer = 0;
      }
    }

    // Đảm bảo gà trống luôn ở trên khu vực cỏ (x: 820m -> 2300m)
    if (this.x < this.minX) {
      this.x = this.minX;
      this.facing = 1;
      this.vx = Math.abs(this.vx) || 22;
    } else if (this.x > this.maxX) {
      this.x = this.maxX;
      this.facing = -1;
      this.vx = -Math.abs(this.vx) || -22;
    }
  }

  private spawnGrainParticles(): void {
    if (this.grains.length > 16) return;
    const beakOffsetX = this.facing * 22;
    const beakOffsetY = -4;
    for (let i = 0; i < 3; i++) {
      this.grains.push({
        x: this.x + beakOffsetX + (Math.random() - 0.5) * 6,
        y: this.y + beakOffsetY,
        vx: (this.facing * (18 + Math.random() * 20)) + (Math.random() - 0.5) * 16,
        vy: -(22 + Math.random() * 28),
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.5,
        size: 1.8 + Math.random() * 1.0,
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, showLabel: boolean = false): void {
    let activeSheet = this.idleSheet;
    let isLoaded = this.idleLoaded;
    let totalFrames = this.idleFrames;
    let currentFrame = Math.floor(this.animTimer * this.idleFps) % totalFrames;

    if (this.state === 'walk') {
      activeSheet = this.walkSheet;
      isLoaded = this.walkLoaded;
      totalFrames = this.walkFrames;
      currentFrame = Math.floor(this.animTimer * this.walkFps) % totalFrames;
    } else if (this.state === 'eat') {
      activeSheet = this.eatSheet;
      isLoaded = this.eatLoaded;
      totalFrames = this.eatFrames;
      currentFrame = Math.floor(this.animTimer * this.eatFps) % totalFrames;
    }

    if (!isLoaded || !activeSheet.complete || activeSheet.naturalWidth === 0) return;

    const frameW = activeSheet.naturalWidth / totalFrames;
    const frameH = activeSheet.naturalHeight;

    const scale = this.targetHeight / frameH;
    const renderW = frameW * scale;
    const renderH = this.targetHeight;
    const feetYOffset = renderH - 4; // Móng chân tiếp đất chuẩn xác

    // 1. BÓNG ĐỔ DƯỚI CHÂN GÀ TRỐNG
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. VẼ THÂN CHÚ GÀ TRỐNG
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));

    // Lật hướng nhìn (Sprite gốc quay sang PHẢI -> khi facing < 0 thì scale -1)
    if (this.facing < 0) {
      ctx.scale(-1, 1);
    }

    const sx = Math.floor(currentFrame * frameW);
    ctx.drawImage(
      activeSheet,
      sx, 0, frameW, frameH,
      -renderW / 2, -feetYOffset, renderW, renderH
    );

    ctx.restore();

    // 3. VẼ HẠT THÓC VĂNG
    if (this.grains.length > 0) {
      ctx.save();
      for (const g of this.grains) {
        const alpha = Math.max(0, g.life / g.maxLife);
        ctx.fillStyle = `rgba(250, 204, 21, ${alpha})`;
        ctx.beginPath();
        ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. PHỤ ĐỀ / NHÃN TÊN KHI BẬT [N]
    if (showLabel) {
      ctx.save();
      ctx.translate(Math.round(this.x), Math.round(this.y - this.targetHeight - 10));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.beginPath();
      ctx.roundRect(-46, -8, 92, 16, 6);
      ctx.fill();
      ctx.strokeStyle = this.state === 'idle' ? 'rgba(239, 68, 68, 0.8)' : (this.state === 'eat' ? 'rgba(250, 204, 21, 0.8)' : 'rgba(74, 222, 128, 0.8)');
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = this.state === 'idle' ? '#fca5a5' : (this.state === 'eat' ? '#fde047' : '#86efac');
      ctx.font = 'bold 8.5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      const stateLabel = this.state === 'idle' ? '🐓 Gà Trống Đứng Oai Vệ' : (this.state === 'eat' ? '🌾 Gà Trống Mổ Thóc' : '🐓 Gà Trống Đi Dạo');
      ctx.fillText(stateLabel, 0, 3.5);
      ctx.restore();
    }
  }
}
