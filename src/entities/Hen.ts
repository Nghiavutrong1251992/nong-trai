/**
 * Hen.ts
 * Gà Mái Loại 2 Nghệ Thuật Làng Quê Việt Nam:
 * - 2 Hoạt ảnh chính mượt mà: Gà Đi (45 frames) & Gà Ăn / Mổ thóc (15 frames)
 * - Tách nền trong suốt sạch sẽ, không viền halo
 * - Chu kỳ tự nhiên: Mổ thóc <-> Đi dạo <-> Đứng ngắm cảnh
 */

import { GroundPlatform } from '../graphics/plants/GroundPlatform';
import { AssetLoader } from '../core/AssetLoader';

export type HenState = 'idle' | 'peck' | 'walk';

interface GrainParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export class Hen {
  public x: number;
  public y: number;
  public vx: number = 22; // Vận tốc đi bộ
  public facing: number = 1; // 1: quay phải, -1: quay trái (Sprite gốc quay sang PHẢI)
  public targetHeight: number = 41; // Thu nhỏ 40% (68 * 0.60 = 41px)

  // Sprite Sheets Gà Mái Loại 2
  private walkSheet: HTMLImageElement;
  private walkLoaded: boolean = false;
  private walkFrames: number = 45;
  private walkFps: number = 16.0;

  private eatSheet: HTMLImageElement;
  private eatLoaded: boolean = false;
  private eatFrames: number = 15;
  private eatFps: number = 12.0;

  private animTimer: number = 0;

  // AI State Machine (Mổ thóc <-> Đi dạo <-> Đứng ngắm cảnh)
  public state: HenState = 'peck';
  private stateTimer: number = 0;
  private minX: number = 820; // Giới hạn chỉ đi trên bãi cỏ, không đi vào hồ nước
  private maxX: number = 2200;

  // Hiệu ứng hạt thóc
  private grains: GrainParticle[] = [];
  private lastPeckFrame: number = -1;

  constructor(x: number = 880, y: number = 480) {
    this.x = x;
    this.y = y;

    this.walkSheet = AssetLoader.getImage('/assets/characters/hen_v2/hen_walk_sheet.png');
    this.walkLoaded = this.walkSheet.complete && this.walkSheet.naturalWidth > 0;
    if (!this.walkLoaded) {
      this.walkSheet.addEventListener('load', () => { this.walkLoaded = true; }, { once: true });
    }

    this.eatSheet = AssetLoader.getImage('/assets/characters/hen_v2/hen_eat_sheet.png');
    this.eatLoaded = this.eatSheet.complete && this.eatSheet.naturalWidth > 0;
    if (!this.eatLoaded) {
      this.eatSheet.addEventListener('load', () => { this.eatLoaded = true; }, { once: true });
    }
  }

  public update(dt: number, groundY: number, _playerX?: number): void {
    this.animTimer += dt;
    this.stateTimer += dt;
    this.y = GroundPlatform.getGroundY(this.x, groundY);

    // 1. Cập nhật hiệu ứng hạt thóc
    for (let i = this.grains.length - 1; i >= 0; i--) {
      const g = this.grains[i];
      g.life -= dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.vy += 260 * dt; // Trọng lực
      if (g.life <= 0) {
        this.grains.splice(i, 1);
      }
    }

    // 2. AI State Machine
    if (this.state === 'peck') {
      const currentFrame = Math.floor(this.animTimer * this.eatFps) % this.eatFrames;

      // Khi mỏ cúi sát đất (frame 5-8)
      if ((currentFrame >= 5 && currentFrame <= 8) && this.lastPeckFrame !== currentFrame) {
        this.spawnGrainParticles();
      }
      this.lastPeckFrame = currentFrame;

      const fullPeckDuration = (this.eatFrames / this.eatFps) * (2 + Math.floor(Math.random() * 3));
      if (this.stateTimer >= fullPeckDuration) {
        if (Math.random() < 0.70) {
          this.state = 'walk';
          this.facing = Math.random() < 0.5 ? 1 : -1;
          this.vx = this.facing * (20 + Math.random() * 8);
        } else {
          this.state = 'idle';
        }
        this.stateTimer = 0;
        this.animTimer = 0;
      }
    } else if (this.state === 'idle') {
      if (this.stateTimer >= 3.0 + Math.random() * 2.0) {
        if (Math.random() < 0.65) {
          this.state = 'peck';
        } else {
          this.state = 'walk';
          this.facing = Math.random() < 0.5 ? 1 : -1;
          this.vx = this.facing * (20 + Math.random() * 8);
        }
        this.stateTimer = 0;
        this.animTimer = 0;
      }
    } else if (this.state === 'walk') {
      this.x += this.vx * dt;

      if (this.stateTimer >= 3.5 + Math.random() * 2.0) {
        this.state = 'peck';
        this.vx = 0;
        this.stateTimer = 0;
        this.animTimer = 0;
      }
    }

    // Đảm bảo gà mái luôn ở trong khu vực bãi cỏ (x: 820m -> 2200m)
    if (this.x < this.minX) {
      this.x = this.minX;
      this.facing = 1;
      this.vx = Math.abs(this.vx) || 20;
    } else if (this.x > this.maxX) {
      this.x = this.maxX;
      this.facing = -1;
      this.vx = -Math.abs(this.vx) || -20;
    }
  }

  private spawnGrainParticles(): void {
    if (this.grains.length > 16) return;
    const beakOffsetX = this.facing * 20;
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
    let activeSheet = this.eatSheet;
    let isLoaded = this.eatLoaded;
    let totalFrames = this.eatFrames;
    let currentFrame = Math.floor(this.animTimer * this.eatFps) % totalFrames;

    if (this.state === 'walk') {
      activeSheet = this.walkSheet;
      isLoaded = this.walkLoaded;
      totalFrames = this.walkFrames;
      currentFrame = Math.floor(this.animTimer * this.walkFps) % totalFrames;
    } else if (this.state === 'idle') {
      activeSheet = this.walkSheet;
      isLoaded = this.walkLoaded;
      totalFrames = this.walkFrames;
      currentFrame = 0; // Frame 0 đứng yên thong dong
    }

    if (!isLoaded || !activeSheet.complete || activeSheet.naturalWidth === 0) return;

    const frameW = activeSheet.naturalWidth / totalFrames;
    const frameH = activeSheet.naturalHeight;

    const scale = this.targetHeight / frameH;
    const renderW = frameW * scale;
    const renderH = this.targetHeight;
    const feetYOffset = renderH - 4; // Móng chân chạm sát cỏ

    // 1. BÓNG ĐỔ DƯỚI CHÂN GÀ MÁI
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. VẼ THÂN GÀ MÁI LOẠI 2
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

    // 3. VẼ HẠT THÓC VĂNG KHI MỔ
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
      ctx.strokeStyle = this.state === 'peck' ? 'rgba(250, 204, 21, 0.8)' : 'rgba(74, 222, 128, 0.8)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = this.state === 'peck' ? '#fde047' : '#86efac';
      ctx.font = 'bold 8.5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      const stateLabel = this.state === 'peck' ? '🌾 Gà Mái Mổ Thóc' : (this.state === 'walk' ? '🐔 Gà Mái Đi Dạo' : '🐔 Gà Mái Đứng Yên');
      ctx.fillText(stateLabel, 0, 3.5);
      ctx.restore();
    }
  }
}
