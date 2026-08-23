/**
 * Calf.ts
 * Quản lý Hoạt ảnh & Hành vi Chú Nghé Con / Trâu Con (Calf):
 * - Vóc dáng nhỏ nhắn, dễ thương (targetHeight ~ 68px)
 * - Tự do đi dạo lon ton, đứng yên và gặm cỏ cùng trâu mẹ
 */

import { GroundPlatform } from '../graphics/plants/GroundPlatform';

export class Calf {
  public x: number;
  public y: number;
  public vx: number = 26; // Lon ton bước nhanh nhẹn
  public facing: number = 1; // 1: quay phải, -1: quay trái
  public targetHeight: number = 68; // Vóc dáng nghé con nhỏ nhắn, đáng yêu

  // Sprite Sheet 1: Đi lon ton (32 frames)
  private walkSheet = new Image();
  private walkLoaded: boolean = false;
  private walkFrames: number = 32;
  private walkFps: number = 12.0;

  // Sprite Sheet 2: Ăn cỏ (28 frames)
  private grazeSheet = new Image();
  private grazeLoaded: boolean = false;
  private grazeFrames: number = 28;
  private grazeFps: number = 7.0;

  // Sprite Sheet 3: Đứng yên (13 frames)
  private idleSheet = new Image();
  private idleLoaded: boolean = false;
  private idleFrames: number = 13;
  private idleFps: number = 7.5;
  private animTimer: number = 0;

  // AI Roaming & Grazing State Machine
  public state: 'idle' | 'walk' | 'graze' = 'idle';
  private stateTimer: number = 0;
  private minX: number = 820; // Giới hạn chỉ đi trên bãi cỏ, không đi vào hồ nước
  private maxX: number = 2500;

  constructor(x: number = 1040, y: number = 480) {
    this.x = x;
    this.y = y;

    this.walkSheet.src = '/assets/characters/calf/calf_walk_custom.png?v=' + Date.now();
    this.walkSheet.onload = () => {
      this.walkLoaded = true;
    };

    this.grazeSheet.src = '/assets/characters/calf/calf_graze_custom.png?v=' + Date.now();
    this.grazeSheet.onload = () => {
      this.grazeLoaded = true;
    };

    this.idleSheet.src = '/assets/characters/calf/calf_idle_custom.png?v=' + Date.now();
    this.idleSheet.onload = () => {
      this.idleLoaded = true;
    };
  }

  public update(dt: number, groundY: number, motherX?: number): void {
    this.animTimer += dt;
    this.stateTimer += dt;
    this.y = GroundPlatform.getGroundY(this.x, groundY);

    // AI lon ton: Đứng yên ngắm cảnh -> Cúi ăn cỏ -> Đi dạo gần trâu mẹ
    if (this.state === 'idle') {
      if (this.stateTimer >= 3.0 + Math.random() * 2.0) {
        this.state = Math.random() < 0.5 ? 'graze' : 'walk';
        this.stateTimer = 0;
        this.animTimer = 0;
        if (this.state === 'walk') {
          // Xu hướng đi về phía trâu mẹ nếu ở quá xa
          if (motherX !== undefined && Math.abs(this.x - motherX) > 220) {
            this.facing = this.x < motherX ? 1 : -1;
          } else {
            this.facing = Math.random() < 0.5 ? 1 : -1;
          }
          this.vx = this.facing * 26;
        }
      }
    } else if (this.state === 'graze') {
      const fullGrazeDuration = this.grazeFrames / this.grazeFps; // ~3.6s
      if (this.stateTimer >= fullGrazeDuration) {
        this.state = Math.random() < 0.5 ? 'idle' : 'walk';
        this.stateTimer = 0;
        this.animTimer = 0;
        if (this.state === 'walk') {
          if (motherX !== undefined && Math.abs(this.x - motherX) > 220) {
            this.facing = this.x < motherX ? 1 : -1;
          } else {
            this.facing = Math.random() < 0.5 ? 1 : -1;
          }
          this.vx = this.facing * 26;
        }
      }
    } else if (this.state === 'walk') {
      if (this.stateTimer >= 3.0 + Math.random() * 1.8) {
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
      this.vx = 26;
    } else if (this.x > this.maxX) {
      this.x = this.maxX;
      this.facing = -1;
      this.vx = -26;
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

    // Hướng nhìn (Sprite gốc quay sang TRÁI -> khi facing > 0 thì scale -1)
    if (this.facing > 0) {
      ctx.scale(-1, 1);
    }

    const sx = Math.floor(currentFrame * frameW);
    ctx.drawImage(
      activeSheet,
      sx, 0, frameW, frameH,
      -renderW / 2, -feetYOffset + 3, renderW, renderH
    );

    ctx.restore();

    // Nhãn tên trên đầu Nghé Con (Chỉ hiện khi bật)
    if (showLabel) {
      ctx.save();
      ctx.translate(Math.round(this.x), Math.round(this.y - feetYOffset - 7));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.beginPath();
      ctx.roundRect(-45, -8.5, 90, 17, 7);
      ctx.fill();
      ctx.strokeStyle = this.state === 'idle' ? 'rgba(56, 189, 248, 0.75)' : (this.state === 'graze' ? 'rgba(163, 230, 53, 0.75)' : 'rgba(250, 204, 21, 0.75)');
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = this.state === 'idle' ? '#7dd3fc' : (this.state === 'graze' ? '#bef264' : '#fde047');
      ctx.font = 'bold 8.5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      const stateLabel = this.state === 'idle' ? '🍼 Nghé Con Đứng Yên' : (this.state === 'graze' ? '🌱 Nghé Con Ăn Cỏ' : '🍼 Nghé Con Lon Ton');
      ctx.fillText(stateLabel, 0, 3);
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
      -renderW / 2, -feetYOffset + 3, renderW, renderH
    );

    ctx.restore();
  }
}
