/**
 * Buffalo.ts
 * Quản lý Hoạt ảnh & Hành vi Chú Trâu Làng Quê Đa Trạng Thái:
 * - Trạng thái 1: Bước đi thong dong (Walk - 5 frames từ 'trau di')
 * - Trạng thái 2: Đứng yên gặm cỏ nhai cỏ (Graze - 23 frames từ 'trâu ăn cỏ')
 */

import { GroundPlatform } from '../graphics/plants/GroundPlatform';

export class Buffalo {
  public x: number;
  public y: number;
  public vx: number = 26; // Tốc độ đi dạo chậm rãi
  public facing: number = 1; // 1: phải, -1: trái
  public targetHeight: number = 115;

  // Sprite Sheet 1: Đi dạo (26 frames)
  private walkSheet = new Image();
  private walkLoaded: boolean = false;
  private walkFrames: number = 26;
  private walkFps: number = 12.0;

  // Sprite Sheet 2: Ăn cỏ (33 frames)
  private grazeSheet = new Image();
  private grazeLoaded: boolean = false;
  private grazeFrames: number = 33;
  private grazeFps: number = 10.0;

  // Sprite Sheet 3: Đứng yên (21 frames)
  private idleSheet = new Image();
  private idleLoaded: boolean = false;
  private idleFrames: number = 21;
  private idleFps: number = 9.0;

  private animTimer: number = 0;

  // AI Roaming, Idle & Grazing State Machine (Mặc định đứng yên)
  public state: 'idle' | 'walk' | 'graze' = 'idle';
  private stateTimer: number = 0;
  private minX: number = 820; // Giới hạn chỉ đi trên bãi cỏ, không đi vào hồ nước (hồ nước: 30m -> 770m)
  private maxX: number = 2500;

  constructor(x: number = 980, y: number = 480) {
    this.x = x;
    this.y = y;

    this.walkSheet.src = '/assets/characters/brown_buffalo/buffalo_walk_sheet.png?v=' + Date.now();
    this.walkSheet.onload = () => {
      this.walkLoaded = true;
    };

    this.grazeSheet.src = '/assets/characters/brown_buffalo/buffalo_graze_sheet.png?v=' + Date.now();
    this.grazeSheet.onload = () => {
      this.grazeLoaded = true;
    };

    this.idleSheet.src = '/assets/characters/brown_buffalo/buffalo_idle_sheet.png?v=' + Date.now();
    this.idleSheet.onload = () => {
      this.idleLoaded = true;
    };
  }

  public update(dt: number, groundY: number): void {
    this.animTimer += dt;
    this.stateTimer += dt;
    this.y = GroundPlatform.getGroundY(this.x, groundY);

    // Chu kỳ tự nhiên: Đứng yên ngắm cảnh (Idle 4-6s) -> Cúi gặm cỏ (Graze 5.6s) -> Đi dạo (Walk 3.5-5s) -> Lặp lại
    if (this.state === 'idle') {
      if (this.stateTimer >= 4.0 + Math.random() * 2.0) {
        this.state = Math.random() < 0.6 ? 'graze' : 'walk';
        this.stateTimer = 0;
        this.animTimer = 0;
        if (this.state === 'walk') {
          this.facing = Math.random() < 0.5 ? 1 : -1;
          this.vx = this.facing * 22;
        }
      }
    } else if (this.state === 'graze') {
      const fullGrazeDuration = this.grazeFrames / this.grazeFps; // ~3.3s
      if (this.stateTimer >= fullGrazeDuration) {
        this.state = Math.random() < 0.5 ? 'idle' : 'walk';
        this.stateTimer = 0;
        this.animTimer = 0;
        if (this.state === 'walk') {
          this.facing = Math.random() < 0.5 ? 1 : -1;
          this.vx = this.facing * 22;
        }
      }
    } else if (this.state === 'walk') {
      if (this.stateTimer >= 3.5 + Math.random() * 1.5) {
        this.state = 'idle';
        this.stateTimer = 0;
        this.animTimer = 0;
        this.vx = 0;
      }
    }

    // Di chuyển vị trí khi ở trạng thái Walk (chỉ trên khu vực cỏ)
    if (this.state === 'walk') {
      this.x += this.vx * dt;
    }
    if (this.x < this.minX) {
      this.x = this.minX;
      this.facing = 1;
      this.vx = 22;
    } else if (this.x > this.maxX) {
      this.x = this.maxX;
      this.facing = -1;
      this.vx = -22;
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
    const feetYOffset = renderH - 8; // Căn chỉnh móng chân tiếp đất chuẩn xác

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));

    // 1. Hướng nhìn trái / phải (Sprite gốc quay sang PHẢI -> khi quay sang TRÁI cần scale -1)
    if (this.facing < 0) {
      ctx.scale(-1, 1);
    }

    // 2. Cắt và vẽ frame hiện tại
    const sx = Math.floor(currentFrame * frameW);
    ctx.drawImage(
      activeSheet,
      sx, 0, frameW, frameH,
      -renderW / 2, -feetYOffset, renderW, renderH
    );

    ctx.restore();

    // 3. Nhãn tên trên đầu Chú Trâu (Chỉ hiện khi bật)
    if (showLabel) {
      ctx.save();
      ctx.translate(Math.round(this.x), Math.round(this.y - feetYOffset - 8));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.beginPath();
      ctx.roundRect(-46, -9, 92, 18, 8);
      ctx.fill();
      ctx.strokeStyle = this.state === 'idle' ? 'rgba(56, 189, 248, 0.7)' : (this.state === 'graze' ? 'rgba(132, 204, 22, 0.7)' : 'rgba(250, 204, 21, 0.6)');
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = this.state === 'idle' ? '#7dd3fc' : (this.state === 'graze' ? '#bef264' : '#fde047');
      ctx.font = 'bold 9.5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      const stateLabel = this.state === 'idle' ? '🐃 Trâu Đang Đứng Yên' : (this.state === 'graze' ? '🌱 Trâu Đang Ăn Cỏ' : '🐃 Trâu Đi Dạo');
      ctx.fillText(stateLabel, 0, 3.5);
      ctx.restore();
    }
  }


  /**
   * Phương thức render tĩnh / tùy biến vị trí phục vụ Studio đo đạc hoạt ảnh
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
    const feetYOffset = renderH - 8;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    // Hướng nhìn (Sprite gốc quay sang PHẢI -> khi quay sang TRÁI cần scale -1)
    if (facing < 0) {
      ctx.scale(-1, 1);
    }

    const sx = Math.floor(currentFrame * frameW);
    ctx.drawImage(
      activeSheet,
      sx, 0, frameW, frameH,
      -renderW / 2, -feetYOffset, renderW, renderH
    );

    ctx.restore();
  }
}


