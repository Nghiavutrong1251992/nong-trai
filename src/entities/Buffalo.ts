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
  public vx: number = 24; // Tốc độ đi dạo chậm rãi
  public facing: number = 1; // 1: phải, -1: trái
  public targetHeight: number = 100;

  // Sprite Sheet 1: Đi dạo (5 frames)
  private walkSheet = new Image();
  private walkLoaded: boolean = false;
  private walkFrames: number = 5;
  private walkFps: number = 7.0;

  // Sprite Sheet 2: Ăn cỏ (34 frames loại bỏ frame 044)
  private grazeSheet = new Image();
  private grazeLoaded: boolean = false;
  private grazeFrames: number = 34;
  private grazeFps: number = 6.0; // Nhịp nhai cỏ chậm rãi, thong thả

  private animTimer: number = 0;

  // AI Roaming & Grazing State Machine (Mặc định đứng yên gặm cỏ)
  public state: 'walk' | 'graze' = 'graze';
  private stateTimer: number = 0;
  private minX: number = 180;
  private maxX: number = 1340;

  constructor(x: number = 520, y: number = 480) {
    this.x = x;
    this.y = y;

    this.walkSheet.src = '/assets/characters/buffalo/buffalo_walk_custom.png';
    this.walkSheet.onload = () => {
      this.walkLoaded = true;
    };

    this.grazeSheet.src = '/assets/characters/buffalo/buffalo_graze_custom.png';
    this.grazeSheet.onload = () => {
      this.grazeLoaded = true;
    };
  }

  public update(dt: number, groundY: number): void {
    this.animTimer += dt;
    this.stateTimer += dt;
    this.y = GroundPlatform.getGroundY(this.x, groundY);

    // Chu kỳ chuẩn: Ăn cỏ trọn vẹn 1 lượt (Cúi đầu -> Nhai cỏ -> Ngẩng đầu) -> Đi dạo một đoạn -> Lặp lại
    if (this.state === 'graze') {
      const fullGrazeDuration = this.grazeFrames / this.grazeFps; // ~5.67s trọn vẹn 1 lượt ăn cỏ
      // Khi đã hoàn thành 1 chu kỳ ăn cỏ trọn vẹn
      if (this.stateTimer >= fullGrazeDuration) {
        this.state = 'walk';
        this.stateTimer = 0;
        this.animTimer = 0;
        // Đổi hướng ngẫu nhiên khi bước đi
        this.facing = Math.random() < 0.5 ? 1 : -1;
        this.vx = this.facing * 22;
      }
    } else if (this.state === 'walk') {
      // Đi dạo một đoạn ngắn khoảng 3.5 - 5.0 giây rồi dừng lại ăn cỏ
      if (this.stateTimer >= 3.5 + Math.random() * 1.5) {
        this.state = 'graze';
        this.stateTimer = 0;
        this.animTimer = 0; // Bắt đầu lại từ frame 0 (cúi đầu)
        this.vx = 0;
      }
    }

    // Di chuyển vị trí khi ở trạng thái Walk
    if (this.state === 'walk') {
      this.x += this.vx * dt;
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
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const isGraze = this.state === 'graze';
    const activeSheet = isGraze ? this.grazeSheet : this.walkSheet;
    const isLoaded = isGraze ? this.grazeLoaded : this.walkLoaded;
    const totalFrames = isGraze ? this.grazeFrames : this.walkFrames;
    const fps = isGraze ? this.grazeFps : this.walkFps;

    if (!isLoaded || !activeSheet.complete || activeSheet.naturalWidth === 0) return;

    const frameW = activeSheet.naturalWidth / totalFrames;
    const frameH = activeSheet.naturalHeight;

    const currentFrame = Math.floor(this.animTimer * fps) % totalFrames;

    const scale = this.targetHeight / frameH;
    const renderW = frameW * scale;
    const renderH = this.targetHeight;
    const feetYOffset = (196.0 / frameH) * renderH; // Căn chỉnh móng chân tiếp đất chuẩn xác

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));

    // 1. Bóng đổ chân trâu vững chắc dưới móng chân
    ctx.fillStyle = 'rgba(28, 25, 23, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 3, renderW * 0.28, renderH * 0.042, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Hướng nhìn trái / phải (Sprite gốc quay sang TRÁI -> khi đi sang PHẢI cần scale -1)
    if (this.facing > 0) {
      ctx.scale(-1, 1);
    }

    // 3. Cắt và vẽ frame hiện tại
    const sx = Math.floor(currentFrame * frameW);
    ctx.drawImage(
      activeSheet,
      sx, 0, frameW, frameH,
      -renderW / 2, -feetYOffset + 4, renderW, renderH
    );

    ctx.restore();

    // 4. Nhãn tên trên đầu Chú Trâu
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y - feetYOffset - 8));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.beginPath();
    ctx.roundRect(-44, -9, 88, 18, 8);
    ctx.fill();
    ctx.strokeStyle = isGraze ? 'rgba(132, 204, 22, 0.7)' : 'rgba(250, 204, 21, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = isGraze ? '#bef264' : '#fde047';
    ctx.font = 'bold 9.5px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isGraze ? '🌱 Trâu Đang Ăn Cỏ' : '🐃 Trâu Làng Quê', 0, 3.5);
    ctx.restore();
  }
}
