import { CharacterAnimator } from '../graphics/renderers/CharacterAnimator';
import { SoundManager } from '../core/SoundManager';
import { GroundPlatform } from '../graphics/plants/GroundPlatform';

export class Player {
  public x: number = 240;
  public y: number = 360;
  public vx: number = 0;
  public vy: number = 0;
  public width: number = 36;
  public height: number = 52;
  public isGrounded: boolean = false;
  public facing: number = 1; // 1: phải, -1: trái
  public state: 'idle' | 'walk' | 'jump' | 'hoe' | 'cam_cuoc' | 'cam_thung_nuoc' | 'cam_liem' | 'harvest' | 'water' | 'fish' = 'idle';
  public activeTool: 'none' | 'hoe' | 'water' | 'sickle' = 'none';
  public animTimer: number = 0;
  public speed: number = 190;
  public jumpForce: number = -380;
  public actionTimer: number = 0;

  // RPG & Farming Stats
  public hp: number = 100;
  public maxHp: number = 100;
  public exp: number = 35;
  public maxExp: number = 100;
  public level: number = 1;
  public coins: number = 250;

  private animator: CharacterAnimator;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.animator = new CharacterAnimator(110);

    this.animator.registerClip('walk', {
      src: '/assets/characters/player/walk.png',
      frames: 10,
      fps: 10.5
    });

    this.animator.registerClip('idle', {
      src: '/assets/characters/player/idle.png',
      frames: 24,
      fps: 8.0,
      loopMode: 'loop'
    });

    this.animator.registerClip('cam_cuoc', {
      src: '/assets/characters/player/cam_cuoc.png',
      frames: 12,
      fps: 8.0,
      loopMode: 'pingpong'
    });

    this.animator.registerClip('cam_thung_nuoc', {
      src: '/assets/characters/player/cam_thung_nuoc.png',
      frames: 8,
      fps: 8.0,
      loopMode: 'pingpong'
    });

    this.animator.registerClip('cam_liem', {
      src: '/assets/characters/player/cam_liem.png',
      frames: 12,
      fps: 10.0,
      loopRange: [7, 11]
    });

    this.animator.registerClip('harvest', {
      src: '/assets/characters/player/harvest.png',
      frames: 38,
      fps: 18.0,
      scaleMultiplier: 1.05,
      anchorOffsetX: 29.8,
      loopMode: 'loop'
    });

    this.animator.registerClip('hoe', {
      src: '/assets/characters/player/hoe.png',
      frames: 68,
      fps: 18.0,
      anchorOffsetX: -28.0,
      loopMode: 'loop'
    });

    this.animator.registerClip('water', {
      src: '/assets/characters/player/water.png',
      frames: 63,
      fps: 18.0,
      anchorOffsetX: -18.9,
      loopMode: 'loop'
    });
  }

  public selectTool(tool: 'none' | 'hoe' | 'water' | 'sickle'): void {
    if (this.activeTool === tool) {
      this.activeTool = 'none';
    } else {
      this.activeTool = tool;
    }
  }

  public cycleTool(): { tool: string; label: string } {
    const order: Array<'none' | 'hoe' | 'water' | 'sickle'> = ['none', 'hoe', 'water', 'sickle'];
    const currIdx = order.indexOf(this.activeTool);
    const nextTool = order[(currIdx + 1) % order.length];
    this.activeTool = nextTool;

    if (nextTool === 'hoe') {
      return { tool: 'hoe', label: '⛏️ Đã trang bị: Cuốc Đất (Ấn E để xới đất & lau mồ hôi)' };
    } else if (nextTool === 'water') {
      return { tool: 'water', label: '💧 Đã trang bị: Thùng Tưới Nước (Ấn E để tưới cây)' };
    } else if (nextTool === 'sickle') {
      return { tool: 'sickle', label: '🌾 Đã trang bị: Liềm Cắt Lúa (Ấn E để thu hoạch)' };
    } else {
      return { tool: 'none', label: '🌿 Đã cất toàn bộ dụng cụ (Tay không thoải mái)' };
    }
  }

  public useTool(sound: SoundManager): { success: boolean; msg: string } {
    if (this.actionTimer > 0) return { success: false, msg: 'Đang thực hiện hành động...' };
    if (!this.isGrounded) return { success: false, msg: 'Không thể dùng dụng cụ khi đang nhảy!' };

    if (this.activeTool === 'hoe') {
      this.state = 'hoe';
      this.actionTimer = 3.8;
      this.animTimer = 0;
      sound.playWhack();
      return { success: true, msg: '💥 Đang cuốc đất & lau mồ hôi...' };
    } else if (this.activeTool === 'water') {
      this.state = 'water';
      this.actionTimer = 3.5;
      this.animTimer = 0;
      sound.playWhack();
      return { success: true, msg: '🌊 Đang tưới nước cho cây trồng...' };
    } else if (this.activeTool === 'sickle') {
      this.state = 'harvest';
      this.actionTimer = 2.16;
      this.animTimer = 0;
      sound.playWhack();
      return { success: true, msg: '🌾 Đang cắt lúa & thu hoạch nông sản...' };
    } else {
      return { success: false, msg: '👉 Hãy ấn [Q] để rút dụng cụ (Cuốc, Thùng nước, Liềm) trước!' };
    }
  }

  public update(
    dt: number,
    input: { left: boolean; right: boolean; jump: boolean; hoe?: boolean; water?: boolean; sickle?: boolean; fish?: boolean },
    baseGroundY: number,
    sound: SoundManager
  ): void {
    this.animTimer += dt;
    if (this.actionTimer > 0) this.actionTimer -= dt;

    const isOnSlopeArea = this.x >= 730 && this.x <= 980;

    // 1. Di chuyển ngang
    if (input.left && this.actionTimer <= 0) {
      this.vx = -this.speed;
      this.facing = -1;
    } else if (input.right && this.actionTimer <= 0) {
      this.vx = this.speed;
      this.facing = 1;
    } else {
      this.vx = 0;
    }

    // 2. Đi lên dốc khi ấn nút Nhảy / Up hoặc đi bộ tiến lên dốc
    if (input.jump && this.actionTimer <= 0) {
      if (isOnSlopeArea) {
        // Khi ở khu vực chân dốc / sườn dốc: Tiến hành đi bước lên dốc thoai thoải
        this.vx = this.speed * 1.1;
        this.facing = 1;
        this.state = 'walk';
      } else if (this.isGrounded) {
        // Nhảy nhẹ nhàng
        this.vy = this.jumpForce;
        this.isGrounded = false;
        sound.playWhack();
      }
    }

    // 3. Trọng lực & Di chuyển
    const gravity = 980;
    this.vy += gravity * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 4. Va chạm & Bám sát bề mặt địa hình dốc (Smooth Slope Walking)
    const currentGroundY = GroundPlatform.getGroundY(this.x, baseGroundY);

    if (this.isGrounded && this.vy >= 0) {
      // Khi đang đi bộ trên mặt đất, bám sát theo độ cao dốc mượt mà
      this.y = currentGroundY;
      this.vy = 0;
    } else if (this.y >= currentGroundY) {
      this.y = currentGroundY;
      this.vy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // 5. Cập nhật State
    if (this.actionTimer > 0) {
      // Đang thực hiện action
    } else if (!this.isGrounded) {
      this.state = 'jump';
    } else if (Math.abs(this.vx) > 0) {
      this.state = 'walk';
    } else {
      if (this.activeTool === 'hoe') {
        this.state = 'cam_cuoc';
      } else if (this.activeTool === 'water') {
        this.state = 'cam_thung_nuoc';
      } else if (this.activeTool === 'sickle') {
        this.state = 'cam_liem';
      } else {
        this.state = 'idle';
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    this.animator.render(
      ctx,
      this.x,
      this.y,
      this.facing,
      this.state,
      this.animTimer
    );
  }

  public renderAt(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    state: string,
    animTimer: number,
    facing: number = 1
  ): void {
    this.animator.render(
      ctx,
      x,
      y,
      facing,
      state,
      animTimer
    );
  }
}
