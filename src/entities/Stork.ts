/**
 * Stork.ts
 * Quản lý Hoạt ảnh & Hành vi Chú Cò Trắng Đồng Quê (Egret / Stork):
 * - Đứng yên ngắm cảnh trên đồng cỏ / bờ ruộng (12 frames)
 * - Đập cánh bay vút lên bầu trời (44 frames)
 * - Liệng cánh sà xuống hạ cánh nhẹ nhàng (33 frames)
 * - Tự động đổi vị trí hoặc giật mình cất cánh khi người chơi tiến lại gần
 */

import { GroundPlatform } from '../graphics/plants/GroundPlatform';
import { AssetLoader } from '../core/AssetLoader';

export type StorkState = 'idle' | 'takeoff' | 'flying' | 'landing';

export class Stork {
  public x: number;
  public y: number;
  public targetX: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public facing: number = 1; // 1: quay phải, -1: quay trái
  public targetHeight: number = 42; // Thu nhỏ thêm 20% (42px) nhỏ nhắn, thanh thoát tự nhiên

  // Sprite Sheet 1: Đứng yên (12 frames)
  private idleSheet: HTMLImageElement;
  private idleLoaded: boolean = false;
  private idleFrames: number = 12;
  private idleFps: number = 8.0;

  // Sprite Sheet 2: Bay lên (44 frames)
  private takeoffSheet: HTMLImageElement;
  private takeoffLoaded: boolean = false;
  private takeoffFrames: number = 44;
  private takeoffFps: number = 18.0;

  // Sprite Sheet 3: Hạ cánh (33 frames)
  private landingSheet: HTMLImageElement;
  private landingLoaded: boolean = false;
  private landingFrames: number = 33;
  private landingFps: number = 16.0;

  private animTimer: number = 0;

  // State Machine
  public state: StorkState = 'idle';
  private stateTimer: number = 0;
  private groundBaselineY: number = 480;
  private flightAltitude: number = 160; // Độ cao khi bay lượn trên trời

  constructor(x: number = 1200, y: number = 480) {
    this.x = x;
    this.y = y;
    this.groundBaselineY = y;

    this.idleSheet = AssetLoader.getImage('/assets/characters/stork/stork_idle_custom.png');
    this.idleLoaded = this.idleSheet.complete && this.idleSheet.naturalWidth > 0;
    if (!this.idleLoaded) {
      this.idleSheet.addEventListener('load', () => { this.idleLoaded = true; }, { once: true });
    }

    this.takeoffSheet = AssetLoader.getImage('/assets/characters/stork/stork_takeoff_custom.png');
    this.takeoffLoaded = this.takeoffSheet.complete && this.takeoffSheet.naturalWidth > 0;
    if (!this.takeoffLoaded) {
      this.takeoffSheet.addEventListener('load', () => { this.takeoffLoaded = true; }, { once: true });
    }

    this.landingSheet = AssetLoader.getImage('/assets/characters/stork/stork_landing_custom.png');
    this.landingLoaded = this.landingSheet.complete && this.landingSheet.naturalWidth > 0;
    if (!this.landingLoaded) {
      this.landingSheet.addEventListener('load', () => { this.landingLoaded = true; }, { once: true });
    }
  }

  public update(dt: number, groundY: number, playerX?: number): void {
    this.animTimer += dt;
    this.stateTimer += dt;
    this.groundBaselineY = GroundPlatform.getGroundY(this.x, groundY);

    // 1. TRẠNG THÁI: ĐỨNG YÊN TRÊN MẶT ĐẤT
    if (this.state === 'idle') {
      this.y = this.groundBaselineY;

      // Giật mình bay lên khi người chơi tiến lại gần (< 100px)
      const distToPlayer = playerX !== undefined ? Math.abs(this.x - playerX) : 999;
      const shouldFlee = distToPlayer < 90;

      // Hoặc tự động cất cánh sau 6-12 giây
      if (shouldFlee || this.stateTimer >= 8.0 + Math.random() * 5.0) {
        this.state = 'takeoff';
        this.stateTimer = 0;
        this.animTimer = 0;

        // Chọn bến đỗ mới trên bãi cỏ & ruộng lúa (từ 850m -> 3450m, tránh hồ nước)
        this.targetX = 850 + Math.random() * 2600;
        this.facing = this.targetX > this.x ? 1 : -1;
      }
    }

    // 2. TRẠNG THÁI: CẤT CÁNH BAY LÊN (Takeoff)
    else if (this.state === 'takeoff') {
      const duration = this.takeoffFrames / this.takeoffFps; // ~2.4s
      const progress = Math.min(1.0, this.stateTimer / duration);

      // Cò vút lên độ cao bay lượn
      this.y = this.groundBaselineY - Math.sin(progress * Math.PI * 0.5) * this.flightAltitude;
      this.x += this.facing * 75 * dt;

      if (this.stateTimer >= duration) {
        this.state = 'flying';
        this.stateTimer = 0;
      }
    }

    // 3. TRẠNG THÁI: BAY LƯỢN TRÊN TRỜI (Flying)
    else if (this.state === 'flying') {
      // Bay lượn nhấp nhô theo sóng sin
      const flightBaseY = groundY - this.flightAltitude;
      this.y = flightBaseY + Math.sin(this.stateTimer * 3.0) * 15;

      const dx = this.targetX - this.x;
      this.facing = dx > 0 ? 1 : -1;
      this.x += this.facing * 95 * dt;

      // Khi gần tới điểm hạ cánh (< 120px) -> Chuyển sang hạ cánh
      if (Math.abs(dx) < 100 || this.stateTimer > 10.0) {
        this.state = 'landing';
        this.stateTimer = 0;
        this.animTimer = 0;
      }
    }

    // 4. TRẠNG THÁI: SÀ XUỐNG HẠ CÁNH (Landing)
    else if (this.state === 'landing') {
      const duration = this.landingFrames / this.landingFps; // ~2.0s
      const progress = Math.min(1.0, this.stateTimer / duration);

      const flightBaseY = groundY - this.flightAltitude;
      const targetGroundY = GroundPlatform.getGroundY(this.x, groundY);

      // Hạ độ cao mượt mà
      this.y = flightBaseY + (targetGroundY - flightBaseY) * Math.sin(progress * Math.PI * 0.5);
      this.x += this.facing * 45 * (1.0 - progress) * dt;

      if (this.stateTimer >= duration) {
        this.state = 'idle';
        this.stateTimer = 0;
        this.animTimer = 0;
        this.y = targetGroundY;
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D, showLabel: boolean = false): void {
    let activeSheet = this.idleSheet;
    let isLoaded = this.idleLoaded;
    let totalFrames = this.idleFrames;
    let fps = this.idleFps;

    if (this.state === 'takeoff') {
      activeSheet = this.takeoffSheet;
      isLoaded = this.takeoffLoaded;
      totalFrames = this.takeoffFrames;
      fps = this.takeoffFps;
    } else if (this.state === 'flying') {
      // Khi bay dùng đoạn đập cánh của takeoff (frames 20..43)
      activeSheet = this.takeoffSheet;
      isLoaded = this.takeoffLoaded;
      totalFrames = this.takeoffFrames;
      fps = this.takeoffFps;
    } else if (this.state === 'landing') {
      activeSheet = this.landingSheet;
      isLoaded = this.landingLoaded;
      totalFrames = this.landingFrames;
      fps = this.landingFps;
    }

    if (!isLoaded || !activeSheet.complete || activeSheet.naturalWidth === 0) return;

    const frameW = activeSheet.naturalWidth / totalFrames;
    const frameH = activeSheet.naturalHeight;

    let currentFrame = 0;
    if (this.state === 'flying') {
      // Loop flapping frames (24 -> 43: 20 frames)
      const flapFrames = 20;
      currentFrame = 24 + (Math.floor(this.stateTimer * 12) % flapFrames);
    } else {
      currentFrame = Math.floor(this.animTimer * fps) % totalFrames;
    }

    const scale = this.targetHeight / (frameH * 0.75);
    const renderW = frameW * scale;
    const renderH = frameH * scale;
    const feetYOffset = (220.0 / frameH) * renderH;

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));

    // Hướng nhìn (Sprite gốc quay sang TRÁI -> khi facing > 0 bay sang PHẢI thì scale -1)
    if (this.facing > 0) {
      ctx.scale(-1, 1);
    }

    const sx = Math.floor(currentFrame * frameW);
    ctx.drawImage(
      activeSheet,
      sx, 0, frameW, frameH,
      -renderW / 2, -feetYOffset, renderW, renderH
    );

    ctx.restore();

    // Nhãn tên trên đầu Con Cò (Chỉ hiện khi bật [N])
    if (showLabel) {
      ctx.save();
      ctx.translate(Math.round(this.x), Math.round(this.y - feetYOffset - 8));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.beginPath();
      ctx.roundRect(-42, -8.5, 84, 17, 7);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 8.5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      const label = this.state === 'idle' ? '🕊️ Cò Đứng Yên' : (this.state === 'landing' ? '🕊️ Cò Hạ Cánh' : '🕊️ Cò Bay Lượn');
      ctx.fillText(label, 0, 3);
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
    state: StorkState,
    animTimer: number,
    facing: number = 1,
    customHeight?: number
  ): void {
    let activeSheet = this.idleSheet;
    let isLoaded = this.idleLoaded;
    let totalFrames = this.idleFrames;
    let fps = this.idleFps;

    if (state === 'takeoff' || state === 'flying') {
      activeSheet = this.takeoffSheet;
      isLoaded = this.takeoffLoaded;
      totalFrames = this.takeoffFrames;
      fps = this.takeoffFps;
    } else if (state === 'landing') {
      activeSheet = this.landingSheet;
      isLoaded = this.landingLoaded;
      totalFrames = this.landingFrames;
      fps = this.landingFps;
    }

    if (!isLoaded || !activeSheet.complete || activeSheet.naturalWidth === 0) return;

    const frameW = activeSheet.naturalWidth / totalFrames;
    const frameH = activeSheet.naturalHeight;
    const currentFrame = Math.floor(animTimer * fps) % totalFrames;

    const targetH = customHeight ?? this.targetHeight;
    const scale = targetH / (frameH * 0.75);
    const renderW = frameW * scale;
    const renderH = frameH * scale;
    const feetYOffset = (220.0 / frameH) * renderH;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    if (facing > 0) {
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
