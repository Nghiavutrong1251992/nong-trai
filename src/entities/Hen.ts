/**
 * Hen.ts
 * Gà Mái Mẹ Nghệ Thuật Đồng Bộ Nét Vẽ Nhân Vật Chính:
 * - Dùng bức vẽ màu nước làng quê đồng bộ 100% với Cậu Bé và Trâu Mẹ
 * - Khóa Điểm Neo Chân (Foot Lock Anchor) triệt tiêu 100% rung giật
 * - CƠ CHẾ GÀ MÁI VỖ CÁNH BAY (Mother Hen Flight & Flutter):
 *   + Khi cậu bé chạy sát lại gần (< 75px), gà mái giật mình vỗ cánh bay vút lên không trung
 *   + Lông vũ nâu vàng lơ lửng rụng trong gió
 *   + Lượn cánh bồng bềnh rồi sà xuống đất êm dịu
 */

import { GroundPlatform } from '../graphics/plants/GroundPlatform';

export type HenState = 'idle' | 'peck' | 'walk' | 'fly';

interface GrainParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

interface FeatherParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export class Hen {
  public x: number;
  public y: number;
  public altitude: number = 0; // Độ cao bay trên không (px)
  public vx: number = 22; // Vận tốc đi bộ / bay
  public vy: number = 0; // Vận tốc bay lên / hạ cánh
  public facing: number = -1; // 1: quay phải, -1: quay trái (Sprite gốc quay sang TRÁI)
  public targetHeight: number = 60; // Chiều cao gà mái mẹ to dĩnh (60px)

  // Sprite Sheets màu nước nghệ thuật Animated Drawings 2D Skeletal
  private peckSheet = new Image();
  private peckLoaded: boolean = false;
  private peckFrames: number = 16;
  private peckFps: number = 12.0;

  private walkSheet = new Image();
  private walkLoaded: boolean = false;
  private walkFrames: number = 16;
  private walkFps: number = 11.0;

  private flySheet = new Image();
  private flyLoaded: boolean = false;
  private flyFrames: number = 16;
  private flyFps: number = 18.0;

  private animTimer: number = 0;

  // AI State Machine (Mổ thóc <-> Đi dạo <-> Đứng ngắm cảnh <-> Vỗ cánh bay)
  public state: HenState = 'peck';
  private stateTimer: number = 0;
  private minX: number = 520;
  private maxX: number = 1500;

  // Hiệu ứng hạt thóc & Lông vũ khi bay
  private grains: GrainParticle[] = [];
  private feathers: FeatherParticle[] = [];
  private lastPeckFrame: number = -1;

  constructor(x: number = 830, y: number = 480) {
    this.x = x;
    this.y = y;

    this.peckSheet.src = '/assets/characters/hen_art/hen_animated_peck.png?v=' + Date.now();
    this.peckSheet.onload = () => {
      this.peckLoaded = true;
    };

    this.walkSheet.src = '/assets/characters/hen_art/hen_animated_walk.png?v=' + Date.now();
    this.walkSheet.onload = () => {
      this.walkLoaded = true;
    };

    this.flySheet.src = '/assets/characters/hen_art/hen_animated_fly.png?v=' + Date.now();
    this.flySheet.onload = () => {
      this.flyLoaded = true;
    };
  }

  /**
   * Kích hoạt gà mái vỗ cánh bay lên
   */
  public startFlight(forcedVx?: number): void {
    if (this.state === 'fly') return;
    this.state = 'fly';
    this.stateTimer = 0;
    this.vy = -(145 + Math.random() * 40); // Bay vút lên
    this.vx = forcedVx !== undefined ? forcedVx : this.facing * (35 + Math.random() * 20);
    this.spawnFeathers(5);
  }

  public update(dt: number, groundY: number, playerX?: number): void {
    this.animTimer += dt;
    this.stateTimer += dt;
    this.y = GroundPlatform.getGroundY(this.x, groundY);

    // 1. Phản xạ giật mình bay lên khi người chơi chạy sát lại gần (< 75px)
    if (this.state !== 'fly' && playerX !== undefined) {
      const dist = Math.abs(this.x - playerX);
      if (dist < 75) {
        const escapeDir = this.x > playerX ? 1 : -1;
        this.facing = escapeDir;
        this.startFlight(escapeDir * (48 + Math.random() * 18));
      }
    }

    // 2. Cập nhật hiệu ứng hạt thóc
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

    // 3. Cập nhật lông vũ bay trong gió
    for (let i = this.feathers.length - 1; i >= 0; i--) {
      const f = this.feathers[i];
      f.life -= dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.rotSpeed * dt;
      f.vy += 40 * dt; // Trọng lực nhẹ
      f.vx *= 0.98;
      if (f.life <= 0) {
        this.feathers.splice(i, 1);
      }
    }

    // 4. AI State Machine
    if (this.state === 'fly') {
      // Vật lý bay bồng bềnh
      this.x += this.vx * dt;
      this.altitude += -this.vy * dt;
      this.vy += 135 * dt; // Trọng lực rơi từ từ

      // Rụng lông vũ ngẫu nhiên khi đang bay
      if (Math.random() < 0.1) {
        this.spawnFeathers(1);
      }

      // Giới hạn biên
      if (this.x < this.minX) {
        this.x = this.minX;
        this.facing = 1;
        this.vx = Math.abs(this.vx);
      } else if (this.x > this.maxX) {
        this.x = this.maxX;
        this.facing = -1;
        this.vx = -Math.abs(this.vx);
      }

      // Khi chạm đất
      if (this.altitude <= 0) {
        this.altitude = 0;
        this.vy = 0;
        this.state = 'idle';
        this.stateTimer = 0;
        this.animTimer = 0;
      }
    } else if (this.state === 'peck') {
      const currentFrame = Math.floor(this.animTimer * this.peckFps) % this.peckFrames;

      if ((currentFrame === 5 || currentFrame === 6) && this.lastPeckFrame !== currentFrame) {
        this.spawnGrainParticles();
      }
      this.lastPeckFrame = currentFrame;

      const fullPeckDuration = (this.peckFrames / this.peckFps) * (2 + Math.floor(Math.random() * 3));
      if (this.stateTimer >= fullPeckDuration) {
        const rand = Math.random();
        if (rand < 0.20) {
          this.startFlight(); // 20% bay chuyền
        } else if (rand < 0.65) {
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
        const rand = Math.random();
        if (rand < 0.18) {
          this.startFlight();
        } else if (rand < 0.65) {
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

      // Đảo hướng khi chạm biên
      if (this.x < this.minX) {
        this.x = this.minX;
        this.facing = 1;
        this.vx = Math.abs(this.vx);
      } else if (this.x > this.maxX) {
        this.x = this.maxX;
        this.facing = -1;
        this.vx = -Math.abs(this.vx);
      }

      if (this.stateTimer >= 3.5 + Math.random() * 2.0) {
        if (Math.random() < 0.25) {
          this.startFlight();
        } else {
          this.state = 'peck';
          this.vx = 0;
        }
        this.stateTimer = 0;
        this.animTimer = 0;
      }
    }
  }

  private spawnGrainParticles(): void {
    if (this.grains.length > 16) return;
    const beakOffsetX = this.facing * 22;
    const beakOffsetY = -3;
    for (let i = 0; i < 3; i++) {
      this.grains.push({
        x: this.x + beakOffsetX + (Math.random() - 0.5) * 6,
        y: this.y + beakOffsetY,
        vx: (this.facing * (20 + Math.random() * 25)) + (Math.random() - 0.5) * 20,
        vy: -(26 + Math.random() * 35),
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.6,
        size: 1.8 + Math.random() * 1.2,
      });
    }
  }

  private spawnFeathers(count: number = 3): void {
    if (this.feathers.length > 25) return;
    for (let i = 0; i < count; i++) {
      this.feathers.push({
        x: this.x + (Math.random() - 0.5) * 20,
        y: this.y - this.altitude - 22 + (Math.random() - 0.5) * 12,
        vx: (Math.random() - 0.5) * 40,
        vy: -(18 + Math.random() * 30),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 5,
        life: 0.9 + Math.random() * 0.7,
        maxLife: 1.6,
        size: 3.2 + Math.random() * 2.0,
        color: Math.random() < 0.6 ? '#f59e0b' : '#b45309', // Lông nâu vàng ấm áp
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, showLabel: boolean = false): void {
    let activeSheet = this.peckSheet;
    let isLoaded = this.peckLoaded;
    let totalFrames = this.peckFrames;
    let fps = this.peckFps;

    if (this.state === 'walk') {
      activeSheet = this.walkSheet;
      isLoaded = this.walkLoaded;
      totalFrames = this.walkFrames;
      fps = this.walkFps;
    } else if (this.state === 'idle') {
      activeSheet = this.walkSheet;
      isLoaded = this.walkLoaded;
      totalFrames = 1;
      fps = 1.0;
    } else if (this.state === 'fly') {
      activeSheet = this.flySheet;
      isLoaded = this.flyLoaded;
      totalFrames = this.flyFrames;
      fps = this.flyFps; // 18 fps vỗ cánh khi bay
    }

    if (!isLoaded || !activeSheet.complete || activeSheet.naturalWidth === 0) return;

    const frameH = activeSheet.naturalHeight;
    const frameW = frameH;
    const currentFrame = Math.floor(this.animTimer * fps) % totalFrames;

    const scale = this.targetHeight / 170.0;
    const renderW = frameW * scale;
    const renderH = frameH * scale;

    const anchorX = (frameW * 0.50) * scale;
    const anchorY = (frameH * 0.92) * scale;

    let hopY = 0;
    let flightRotation = 0;

    if (this.state === 'fly') {
      hopY = -this.altitude + Math.sin(this.animTimer * 22.0) * 2.5;
      flightRotation = this.vy < 0 ? (this.facing > 0 ? -0.14 : 0.14) : (this.facing > 0 ? 0.10 : -0.10);
    }

    // 1. BÓNG ĐỔ DƯỚI CHÂN GÀ MÁI (Thu nhỏ và mờ khi bay cao)
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));
    const shadowScale = this.state === 'fly' 
      ? Math.max(0.35, 1.0 - (this.altitude / 120))
      : 1.0;
    const shadowAlpha = this.state === 'fly' ? Math.max(0.08, 0.24 - (this.altitude / 600)) : 0.24;

    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 16 * shadowScale, 5 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. VẼ THÂN GÀ MÁI MÀU NƯỚC NGHỆ THUẬT
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y + hopY));

    // Lật hướng nhìn
    if (this.facing > 0) {
      ctx.scale(-1, 1);
    }

    if (flightRotation !== 0) {
      ctx.rotate(flightRotation);
    }

    const sx = Math.floor(currentFrame * frameW);
    ctx.drawImage(
      activeSheet,
      sx, 0, frameW, frameH,
      -anchorX, -anchorY, renderW, renderH
    );

    ctx.restore();

    // 3. VẼ HẠT THÓC VĂNG
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

    // 4. VẼ LÔNG VŨ RỤNG BAY TRONG GIÓ
    if (this.feathers.length > 0) {
      ctx.save();
      for (const f of this.feathers) {
        const alpha = Math.max(0, f.life / f.maxLife);
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.fillStyle = f.color;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.ellipse(0, 0, f.size, f.size * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // 5. PHỤ ĐỀ / NHÃN TÊN KHI BẬT [N]
    if (showLabel) {
      ctx.save();
      ctx.translate(Math.round(this.x), Math.round(this.y - this.targetHeight - this.altitude - 10));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.beginPath();
      ctx.roundRect(-46, -8, 92, 16, 6);
      ctx.fill();
      ctx.strokeStyle = this.state === 'fly' ? 'rgba(56, 189, 248, 0.9)' : (this.state === 'peck' ? 'rgba(250, 204, 21, 0.8)' : 'rgba(74, 222, 128, 0.8)');
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = this.state === 'fly' ? '#7dd3fc' : (this.state === 'peck' ? '#fde047' : '#86efac');
      ctx.font = 'bold 8.5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      const stateLabel = this.state === 'fly' ? '🕊️ Gà Mái Vỗ Cánh Bay' : (this.state === 'peck' ? '🌾 Gà Mái Mổ Thóc' : (this.state === 'walk' ? '🐔 Gà Mái Đi Dạo' : '🐔 Gà Mái Ngắm Cảnh'));
      ctx.fillText(stateLabel, 0, 3.5);
      ctx.restore();
    }
  }
}
