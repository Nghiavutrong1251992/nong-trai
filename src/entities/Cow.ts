/**
 * Cow.ts
 * Quản lý Hoạt ảnh & Hành vi Chú Bò Vàng Làng Quê (Cow):
 * - Bộ lông vàng óng caramel (Bò Vàng Việt Nam)
 * - Tự do đi dạo, đứng yên ngắm cảnh và gặm cỏ trên đồng
 */

import { GroundPlatform } from '../graphics/plants/GroundPlatform';

export class Cow {
  public x: number;
  public y: number;
  public vx: number = 20; // Tốc độ bước đi thong thả
  public facing: number = -1; // -1: quay trái, 1: quay phải
  public targetHeight: number = 96; // Chiều cao cân đối chuẩn

  // Sprite Sheet 1: Đi dạo (5 frames)
  private walkSheet = new Image();
  private walkLoaded: boolean = false;
  private walkFrames: number = 5;
  private walkFps: number = 6.8;

  // Sprite Sheet 2: Ăn cỏ (34 frames)
  private grazeSheet = new Image();
  private grazeLoaded: boolean = false;
  private grazeFrames: number = 34;
  private grazeFps: number = 5.8;

  // Sprite Sheet 3: Đứng yên (8 frames)
  private idleSheet = new Image();
  private idleLoaded: boolean = false;
  private idleFrames: number = 8;
  private idleFps: number = 6.0;

  private animTimer: number = 0;

  // AI Roaming & Grazing State Machine (Mặc định đứng yên gặm cỏ)
  public state: 'idle' | 'walk' | 'graze' = 'idle';
  private stateTimer: number = 0;
  private minX: number = 820; // Giới hạn chỉ đi trên bãi cỏ, không đi vào hồ nước
  private maxX: number = 2500;

  constructor(x: number = 1150, y: number = 480) {
    this.x = x;
    this.y = y;

    this.walkSheet.src = '/assets/characters/cow/cow_walk_custom.png?v=' + Date.now();
    this.walkSheet.onload = () => {
      this.walkLoaded = true;
    };

    this.grazeSheet.src = '/assets/characters/cow/cow_graze_custom.png?v=' + Date.now();
    this.grazeSheet.onload = () => {
      this.grazeLoaded = true;
    };

    this.idleSheet.src = '/assets/characters/cow/cow_idle_custom.png?v=' + Date.now();
    this.idleSheet.onload = () => {
      this.idleLoaded = true;
    };

  }

  public update(dt: number, groundY: number): void {
    this.animTimer += dt;
    this.stateTimer += dt;
    this.y = GroundPlatform.getGroundY(this.x, groundY);

    // AI nhàn nhã: Đứng yên ngắm cảnh -> Cúi gặm cỏ -> Đi dạo
    if (this.state === 'idle') {
      if (this.stateTimer >= 3.5 + Math.random() * 2.5) {
        this.state = Math.random() < 0.6 ? 'graze' : 'walk';
        this.stateTimer = 0;
        this.animTimer = 0;
        if (this.state === 'walk') {
          this.facing = Math.random() < 0.5 ? 1 : -1;
          this.vx = this.facing * 20;
        }
      }
    } else if (this.state === 'graze') {
      const fullGrazeDuration = this.grazeFrames / this.grazeFps; // ~3.5s
      if (this.stateTimer >= fullGrazeDuration) {
        this.state = Math.random() < 0.5 ? 'idle' : 'walk';
        this.stateTimer = 0;
        this.animTimer = 0;
        if (this.state === 'walk') {
          this.facing = Math.random() < 0.5 ? 1 : -1;
          this.vx = this.facing * 20;
        }
      }
    } else if (this.state === 'walk') {
      if (this.stateTimer >= 3.5 + Math.random() * 2.0) {
        this.state = 'idle';
        this.stateTimer = 0;
        this.animTimer = 0;
        this.vx = 0;
      }
    }

    // Di chuyển khi ở trạng thái Walk (chỉ trên khu vực cỏ)
    if (this.state === 'walk') {
      this.x += this.vx * dt;
    }
    if (this.x < this.minX) {
      this.x = this.minX;
      this.facing = 1;
      this.vx = 20;
    } else if (this.x > this.maxX) {
      this.x = this.maxX;
      this.facing = -1;
      this.vx = -20;
    }
  }

  public render(ctx: CanvasRenderingContext2D, showLabel: boolean = false): void {
    let activeSheet = this.idleSheet;
    let isLoaded = this.idleLoaded;
    let totalFrames = this.idleFrames;
    let fps = this.idleFps;

    if (this.state === 'graze') {
      activeSheet = this.grazeSheet;
      isLoaded = this.grazeLoaded;
      totalFrames = this.grazeFrames;
      fps = this.grazeFps;
    } else if (this.state === 'walk') {
      activeSheet = this.walkSheet;
      isLoaded = this.walkLoaded;
      totalFrames = this.walkFrames;
      fps = this.walkFps;
    }

    if (!isLoaded || !activeSheet.complete || activeSheet.naturalWidth === 0) return;

    const frameW = activeSheet.naturalWidth / totalFrames;
    const frameH = activeSheet.naturalHeight;
    const currentFrame = Math.floor(this.animTimer * fps) % totalFrames;

    const scale = this.targetHeight / frameH;
    const renderW = frameW * scale;
    const renderH = this.targetHeight;
    const feetYOffset = (196.0 / frameH) * renderH;

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));

    // Hướng nhìn trái / phải
    if (this.facing > 0) {
      ctx.scale(-1, 1);
    }

    const sx = Math.floor(currentFrame * frameW);
    ctx.drawImage(
      activeSheet,
      sx, 0, frameW, frameH,
      -renderW / 2, -feetYOffset + 4, renderW, renderH
    );

    ctx.restore();

    // Nhãn tên trên đầu Bò Nâu (Chỉ hiện khi bật)
    if (showLabel) {
      ctx.save();
      ctx.translate(Math.round(this.x), Math.round(this.y - feetYOffset - 8));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.beginPath();
      ctx.roundRect(-46, -9, 92, 18, 8);
      ctx.fill();
      ctx.strokeStyle = this.state === 'idle' ? 'rgba(249, 115, 22, 0.75)' : (this.state === 'graze' ? 'rgba(132, 204, 22, 0.75)' : 'rgba(250, 204, 21, 0.75)');
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = this.state === 'idle' ? '#fed7aa' : (this.state === 'graze' ? '#bef264' : '#fde047');
      ctx.font = 'bold 9.5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      const stateLabel = this.state === 'idle' ? '🐄 Bò Nâu Đứng Yên' : (this.state === 'graze' ? '🌱 Bò Nâu Ăn Cỏ' : '🐮 Bò Nâu Đi Dạo');
      ctx.fillText(stateLabel, 0, 3.5);
      ctx.restore();
    }
  }



  /**
   * Render tĩnh phục vụ Studio
   */
  public renderAt(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: 'idle' | 'walk' | 'graze',
    animTimer: number,
    facing: number = 1,
    customHeight?: number
  ): void {
    let activeSheet = this.idleSheet;
    let isLoaded = this.idleLoaded;
    let totalFrames = this.idleFrames;
    let fps = this.idleFps;

    if (state === 'graze') {
      activeSheet = this.grazeSheet;
      isLoaded = this.grazeLoaded;
      totalFrames = this.grazeFrames;
      fps = this.grazeFps;
    } else if (state === 'walk') {
      activeSheet = this.walkSheet;
      isLoaded = this.walkLoaded;
      totalFrames = this.walkFrames;
      fps = this.walkFps;
    }

    if (!isLoaded || !activeSheet.complete || activeSheet.naturalWidth === 0) return;

    const frameW = activeSheet.naturalWidth / totalFrames;
    const frameH = activeSheet.naturalHeight;
    const currentFrame = Math.floor(animTimer * fps) % totalFrames;

    const targetH = customHeight ?? this.targetHeight;
    const scale = targetH / frameH;
    const renderW = frameW * scale;
    const renderH = targetH;
    const feetYOffset = (196.0 / frameH) * renderH;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    if (facing > 0) {
      ctx.scale(-1, 1);
    }


    const sx = Math.floor(currentFrame * frameW);
    ctx.drawImage(
      activeSheet,
      sx, 0, frameW, frameH,
      -renderW / 2, -feetYOffset + 4, renderW, renderH
    );

    ctx.restore();
  }
}
