import { CharacterAnimator } from '../graphics/renderers/CharacterAnimator';
import { SoundManager } from '../core/SoundManager';

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
  public activeTool: 'none' | 'hoe' | 'water' | 'sickle' = 'none'; // Dụng cụ đang chọn
  public animTimer: number = 0;
  public speed: number = 190;
  public jumpForce: number = -460;
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
    this.animator = new CharacterAnimator(110); // Kích thước chibi 110px vừa vặn 1 khung hình cảnh

    // ============================================================
    // ĐĂNG KÝ CÁC BỘ HOẠT ẢNH TỪ THƯ MỤC CHUẨN (/assets/characters/player/)
    // ============================================================
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
      loopMode: 'pingpong' // Hít thở nhẹ nhàng khi đang cầm cuốc
    });

    this.animator.registerClip('cam_thung_nuoc', {
      src: '/assets/characters/player/cam_thung_nuoc.png',
      frames: 8,
      fps: 8.0,
      loopMode: 'pingpong' // Hít thở nhẹ nhàng khi đang xách thùng nước
    });

    this.animator.registerClip('cam_liem', {
      src: '/assets/characters/player/cam_liem.png',
      frames: 12,
      fps: 10.0,
      loopRange: [7, 11] // Chạy 001->012 lần đầu, sau đó lặp vô tận giữa frame 012 và frame 008
    });

    this.animator.registerClip('harvest', {
      src: '/assets/characters/player/harvest.png',
      frames: 38,
      fps: 18.0, // 38 frames (frames 22-59 gặt lúa dứt khoát)
      scaleMultiplier: 1.05, // Cao thêm 5% theo yêu cầu
      loopMode: 'loop'
    });

    this.animator.registerClip('hoe', {
      src: '/assets/characters/player/hoe.png',
      frames: 68,
      fps: 18.0, // 68 frames ở 18 FPS = 3.8s (Cuốc đất + Lau mồ hôi chuẩn scale 1:1)
      loopMode: 'loop'
    });

    this.animator.registerClip('water', {
      src: '/assets/characters/player/water.png',
      frames: 63,
      fps: 18.0, // 63 frames ở 18 FPS = 3.5s (Hành động tưới nước đồng bộ 100% 380px)
      loopMode: 'loop'
    });
  }

  public selectTool(tool: 'none' | 'hoe' | 'water' | 'sickle'): void {
    if (this.activeTool === tool) {
      this.activeTool = 'none'; // Bấm lại để cất dụng cụ
    } else {
      this.activeTool = tool;
    }

    if (this.actionTimer <= 0 && this.state !== 'walk' && this.state !== 'jump') {
      if (this.activeTool === 'hoe') this.state = 'cam_cuoc';
      else if (this.activeTool === 'water') this.state = 'cam_thung_nuoc';
      else if (this.activeTool === 'sickle') this.state = 'cam_liem';
      else this.state = 'idle';
      this.animTimer = 0;
    }
  }

  /**
   * Phím Q: Rút -> Đổi -> Cất dụng cụ theo chu kỳ
   */
  public cycleTool(): { tool: 'none' | 'hoe' | 'water' | 'sickle'; label: string } {
    const sequence: ('none' | 'hoe' | 'water' | 'sickle')[] = ['none', 'hoe', 'water', 'sickle'];
    const currentIdx = sequence.indexOf(this.activeTool);
    const nextTool = sequence[(currentIdx + 1) % sequence.length];
    this.activeTool = nextTool;

    if (this.actionTimer <= 0 && this.state !== 'walk' && this.state !== 'jump') {
      if (this.activeTool === 'hoe') this.state = 'cam_cuoc';
      else if (this.activeTool === 'water') this.state = 'cam_thung_nuoc';
      else if (this.activeTool === 'sickle') this.state = 'cam_liem';
      else this.state = 'idle';
      this.animTimer = 0;
    }

    const labels: Record<'none' | 'hoe' | 'water' | 'sickle', string> = {
      none: '🌿 Đã cất dụng cụ (Đứng yên tay không)',
      hoe: '⛏️ Đã rút: Cuốc Đất (Ấn E để cuốc)',
      water: '💧 Đã rút: Thùng Nước (Ấn E để tưới)',
      sickle: '🌾 Đã rút: Liềm Cắt Lúa (Ấn E để thu hoạch)'
    };

    return { tool: this.activeTool, label: labels[this.activeTool] };
  }

  /**
   * Phím E: Tiến hành dùng dụng cụ đang cầm
   */
  public useTool(sound: SoundManager): { success: boolean; msg: string } {
    if (this.actionTimer > 0) return { success: false, msg: 'Đang thực hiện hành động...' };
    if (!this.isGrounded) return { success: false, msg: 'Không thể dùng dụng cụ khi đang nhảy!' };

    if (this.activeTool === 'hoe') {
      this.state = 'hoe';
      this.actionTimer = 3.8; // 68 frames cuốc đất & lau mồ hôi
      this.animTimer = 0;
      sound.playWhack();
      return { success: true, msg: '💥 Đang cuốc đất & lau mồ hôi...' };
    } else if (this.activeTool === 'water') {
      this.state = 'water';
      this.actionTimer = 3.5; // 63 frames tưới nước
      this.animTimer = 0;
      sound.playWhack();
      return { success: true, msg: '🌊 Đang tưới nước cho cây trồng...' };
    } else if (this.activeTool === 'sickle') {
      this.state = 'harvest';
      this.actionTimer = 2.16; // 39 frames thu hoạch
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
    groundY: number,
    sound: SoundManager
  ): void {
    this.animTimer += dt;
    if (this.actionTimer > 0) this.actionTimer -= dt;

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

    // 2. Nhảy lên
    if (input.jump && this.isGrounded && this.actionTimer <= 0) {
      this.vy = this.jumpForce;
      this.isGrounded = false;
      sound.playWhack();
    }

    // 3. Các hành động nông trại
    if (input.hoe && this.actionTimer <= 0 && this.isGrounded) {
      this.state = 'hoe';
      this.activeTool = 'hoe';
      this.actionTimer = 3.8; // Chạy trọn vẹn 68 frames
      this.animTimer = 0;
      sound.playWhack();
    } else if (input.water && this.actionTimer <= 0 && this.isGrounded) {
      this.state = 'water';
      this.activeTool = 'water';
      this.actionTimer = 3.5; // Chạy trọn vẹn 63 frames tưới nước
      this.animTimer = 0;
      sound.playWhack();
    } else if (input.sickle && this.actionTimer <= 0 && this.isGrounded) {
      this.state = 'harvest';
      this.activeTool = 'sickle';
      this.actionTimer = 2.16; // Chạy trọn vẹn 39 frames thu hoạch
      this.animTimer = 0;
      sound.playWhack();
    } else if (input.fish && this.actionTimer <= 0 && this.isGrounded) {
      this.state = 'fish';
      this.actionTimer = 0.5;
    }

    // 4. Trọng lực
    const gravity = 980;
    this.vy += gravity * dt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // 5. Va chạm đất
    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // 6. Cập nhật State
    if (this.actionTimer > 0) {
      // Đang thực hiện action
    } else if (!this.isGrounded) {
      this.state = 'jump';
    } else if (Math.abs(this.vx) > 0) {
      this.state = 'walk';
    } else {
      // Đứng yên: Kiểm tra dụng cụ đang cầm
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
