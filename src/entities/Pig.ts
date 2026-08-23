/**
 * Pig.ts
 * Chú Heo Hồng Làng Quê Việt Nam:
 * - 3 Hoạt ảnh chuẩn nét: Heo Đi (23 frames), Heo Ăn / Mũi húc đất (26 frames), Heo Đứng Yên lắc tai nguẩy đuôi (21 frames)
 * - Tách nền trong suốt không viền sáng, thân hồng tròn trịa, đuôi xoăn tít
 * - Giới hạn an toàn chỉ đi trên bãi cỏ & quanh sân (x: 820m -> 2350m), không đi vào hồ nước
 */

import { GroundPlatform } from '../graphics/plants/GroundPlatform';

export type PigState = 'idle' | 'eat' | 'walk';

export class Pig {
  public x: number;
  public y: number;
  public vx: number = 22; // Vận tốc đi lon ton
  public facing: number = 1; // 1: quay phải, -1: quay trái (Sprite gốc quay sang PHẢI)
  public targetHeight: number = 62; // Chiều cao chú heo hồng ủn ỉn (62px)

  // Sprite Sheet 1: Đi dạo (23 frames)
  private walkSheet = new Image();
  private walkLoaded: boolean = false;
  private walkFrames: number = 23;
  private walkFps: number = 11.0;

  // Sprite Sheet 2: Ăn / Húc đất (26 frames)
  private eatSheet = new Image();
  private eatLoaded: boolean = false;
  private eatFrames: number = 26;
  private eatFps: number = 11.0;

  // Sprite Sheet 3: Đứng yên lắc tai (21 frames)
  private idleSheet = new Image();
  private idleLoaded: boolean = false;
  private idleFrames: number = 21;
  private idleFps: number = 8.0;

  private animTimer: number = 0;

  // AI State Machine (Đứng yên <-> Ăn / Húc đất <-> Đi dạo)
  public state: PigState = 'idle';
  private stateTimer: number = 0;
  private minX: number = 820; // Giới hạn chỉ đi trên bãi cỏ, không đi vào hồ nước
  private maxX: number = 2350;

  constructor(x: number = 1020, y: number = 480) {
    this.x = x;
    this.y = y;

    this.walkSheet.src = '/assets/characters/pig/pig_walk_sheet.png?v=' + Date.now();
    this.walkSheet.onload = () => {
      this.walkLoaded = true;
    };

    this.eatSheet.src = '/assets/characters/pig/pig_eat_sheet.png?v=' + Date.now();
    this.eatSheet.onload = () => {
      this.eatLoaded = true;
    };

    this.idleSheet.src = '/assets/characters/pig/pig_idle_sheet.png?v=' + Date.now();
    this.idleSheet.onload = () => {
      this.idleLoaded = true;
    };
  }

  public update(dt: number, groundY: number): void {
    this.animTimer += dt;
    this.stateTimer += dt;
    this.y = GroundPlatform.getGroundY(this.x, groundY);

    // AI State Machine
    if (this.state === 'idle') {
      const fullIdleDuration = (this.idleFrames / this.idleFps) * (1.5 + Math.random() * 1.5);
      if (this.stateTimer >= fullIdleDuration) {
        if (Math.random() < 0.6) {
          this.state = 'eat';
        } else {
          this.state = 'walk';
          this.facing = Math.random() < 0.5 ? 1 : -1;
          this.vx = this.facing * (18 + Math.random() * 8);
        }
        this.stateTimer = 0;
        this.animTimer = 0;
      }
    } else if (this.state === 'eat') {
      const fullEatDuration = (this.eatFrames / this.eatFps) * (1.5 + Math.random() * 1.5);
      if (this.stateTimer >= fullEatDuration) {
        if (Math.random() < 0.5) {
          this.state = 'idle';
        } else {
          this.state = 'walk';
          this.facing = Math.random() < 0.5 ? 1 : -1;
          this.vx = this.facing * (18 + Math.random() * 8);
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

    // Đảm bảo chú heo luôn ở trên khu vực cỏ (x: 820m -> 2350m)
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
    const feetYOffset = renderH - 4; // Móng chân chạm đất chuẩn xác

    // 1. BÓNG ĐỔ DƯỚI CHÂN CHÚ HEO
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. VẼ THÂN CHÚ HEO
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

    // 3. PHỤ ĐỀ / NHÃN TÊN KHI BẬT [N]
    if (showLabel) {
      ctx.save();
      ctx.translate(Math.round(this.x), Math.round(this.y - this.targetHeight - 10));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.beginPath();
      ctx.roundRect(-46, -8, 92, 16, 6);
      ctx.fill();
      ctx.strokeStyle = this.state === 'idle' ? 'rgba(244, 114, 182, 0.8)' : (this.state === 'eat' ? 'rgba(250, 204, 21, 0.8)' : 'rgba(74, 222, 128, 0.8)');
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = this.state === 'idle' ? '#fbcfe8' : (this.state === 'eat' ? '#fde047' : '#86efac');
      ctx.font = 'bold 8.5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      const stateLabel = this.state === 'idle' ? '🐷 Heo Đứng Lắc Tai' : (this.state === 'eat' ? '🌱 Heo Đang Ăn' : '🐷 Heo Đi Dạo');
      ctx.fillText(stateLabel, 0, 3.5);
      ctx.restore();
    }
  }
}
