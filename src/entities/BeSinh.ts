/**
 * BeSinh.ts
 * Nhân vật Bé Sinh - Bé gái làng quê Việt Nam:
 * - 3 Trạng thái hoạt ảnh chuẩn nét (Mỗi trạng thái 6 Frame):
 *   1. Đứng yên (Idle 6 frames)
 *   2. Đi bộ (Walk 6 frames)
 *   3. Chạy nhảy (Run 6 frames)
 * - Tự động đi lại, vui chơi quanh sân nhà ngói & đường làng (x: 2300m -> 2900m)
 */

import { GroundPlatform } from '../graphics/plants/GroundPlatform';
import { AssetLoader } from '../core/AssetLoader';

export type BeSinhState = 'idle' | 'walk' | 'school';

export class BeSinh {
  public x: number;
  public y: number;
  public vx: number = 0;
  public facing: number = 1; // 1: quay phải, -1: quay trái
  public targetHeight: number = 88; // Chiều cao trẻ em nông thôn (~88px)

  // 1. Idle Sheet (6 frames @ 301x713)
  private idleSheet: HTMLImageElement;
  private idleLoaded: boolean = false;
  private readonly idleFrames: number = 6;
  private readonly idleFps: number = 6.0;

  // 2. Walk Sheet (6 frames @ 298x613)
  private walkSheet: HTMLImageElement;
  private walkLoaded: boolean = false;
  private readonly walkFrames: number = 6;
  private readonly walkFps: number = 8.0;

  // 3. School Sheet (6 frames @ 320x620)
  private schoolSheet: HTMLImageElement;
  private schoolLoaded: boolean = false;
  private readonly schoolFrames: number = 6;
  private readonly schoolFps: number = 8.0;

  private animTimer: number = 0;
  public state: BeSinhState = 'idle';
  private stateTimer: number = 0;

  private minX: number = 2280;
  private maxX: number = 2950;

  constructor(x: number = 2450, y: number = 480) {
    this.x = x;
    this.y = y;

    this.idleSheet = AssetLoader.getImage('/assets/characters/be_sinh/be_sinh_idle_sheet.png');
    this.idleLoaded = this.idleSheet.complete && this.idleSheet.naturalWidth > 0;
    if (!this.idleLoaded) {
      this.idleSheet.addEventListener('load', () => { this.idleLoaded = true; }, { once: true });
    }

    this.walkSheet = AssetLoader.getImage('/assets/characters/be_sinh/be_sinh_walk_sheet.png');
    this.walkLoaded = this.walkSheet.complete && this.walkSheet.naturalWidth > 0;
    if (!this.walkLoaded) {
      this.walkSheet.addEventListener('load', () => { this.walkLoaded = true; }, { once: true });
    }

    this.schoolSheet = AssetLoader.getImage('/assets/characters/be_sinh/be_sinh_school_sheet.png');
    this.schoolLoaded = this.schoolSheet.complete && this.schoolSheet.naturalWidth > 0;
    if (!this.schoolLoaded) {
      this.schoolSheet.addEventListener('load', () => { this.schoolLoaded = true; }, { once: true });
    }

    this.pickNextState();
  }

  private pickNextState(): void {
    const roll = Math.random();
    if (roll < 0.35) {
      // 1. Đứng yên
      this.state = 'idle';
      this.stateTimer = 2.5 + Math.random() * 3.5;
      this.vx = 0;
    } else if (roll < 0.68) {
      // 2. Đi bộ lon ton
      this.state = 'walk';
      this.stateTimer = 3.0 + Math.random() * 4.0;
      this.facing = Math.random() < 0.5 ? 1 : -1;
      this.vx = this.facing * 35;
    } else {
      // 3. Đi học đeo cặp sách
      this.state = 'school';
      this.stateTimer = 3.5 + Math.random() * 4.5;
      this.facing = Math.random() < 0.5 ? 1 : -1;
      this.vx = this.facing * 38;
    }
  }

  public update(dt: number, groundY: number = 480, playerX?: number): void {
    this.animTimer += dt;
    this.stateTimer -= dt;

    if (this.stateTimer <= 0) {
      this.pickNextState();
    }

    // Nếu người chơi ở gần, bé có thể quay mặt về phía người chơi và đi lại vui vẻ
    if (playerX !== undefined && Math.abs(playerX - this.x) < 100 && Math.random() < 0.015 && this.state === 'idle') {
      this.facing = playerX > this.x ? 1 : -1;
    }

    // Di chuyển
    this.x += this.vx * dt;

    // Giới hạn biên an toàn
    if (this.x < this.minX) {
      this.x = this.minX;
      this.facing = 1;
      this.vx = Math.abs(this.vx);
    } else if (this.x > this.maxX) {
      this.x = this.maxX;
      this.facing = -1;
      this.vx = -Math.abs(this.vx);
    }

    this.y = GroundPlatform.getGroundY(this.x, groundY);
  }

  public render(ctx: CanvasRenderingContext2D, showLabel: boolean = true): void {
    let sheet = this.idleSheet;
    let totalFrames = this.idleFrames;
    let fps = this.idleFps;

    if (this.state === 'walk') {
      sheet = this.walkSheet;
      totalFrames = this.walkFrames;
      fps = this.walkFps;
    } else if (this.state === 'school') {
      sheet = this.schoolSheet;
      totalFrames = this.schoolFrames;
      fps = this.schoolFps;
    }

    if (!sheet || !sheet.complete || sheet.naturalWidth === 0) return;

    const frameW = sheet.naturalWidth / totalFrames;
    const frameH = sheet.naturalHeight;
    const currentFrame = Math.floor(this.animTimer * fps) % totalFrames;

    const scale = this.targetHeight / frameH;
    const drawW = frameW * scale;
    const drawH = this.targetHeight;

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));

    // Bóng đổ nhẹ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 0, drawW * 0.28, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Hướng mặt
    if (this.facing < 0) {
      ctx.scale(-1, 1);
    }

    ctx.drawImage(
      sheet,
      currentFrame * frameW, 0, frameW, frameH,
      -drawW / 2, -drawH + 4, drawW, drawH
    );

    ctx.restore();

    // Nhãn tên
    if (showLabel) {
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      ctx.beginPath();
      ctx.roundRect(this.x - 36, this.y - drawH - 18, 72, 18, 5);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('👧 Bé Sinh', this.x, this.y - drawH - 5);
      ctx.restore();
    }
  }
}
