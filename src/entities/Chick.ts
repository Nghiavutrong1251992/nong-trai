/**
 * Chick.ts
 * Tác Phẩm Gà Con Vẽ Thuần Canvas 2D Nghệ Thuật Hội Họa Đỉnh Cao (Hyper-Detailed Procedural Chick):
 * - Tái hiện chuẩn xác 100% tỷ lệ, cấu trúc giải phẫu học và hiệu ứng màu nước của bản vẽ tranh truyện
 * - Lông tơ viền mềm (Downy fringe), cánh phân lớp lông bay có đốm hoa dâu, mắt sâu thẳm có viền mí và điểm sáng tự nhiên, mỏ có sống mũi và lỗ thở, chân có vảy sừng và móng vuốt
 * - ĐẦY ĐỦ CÁC HOẠT HỌA CỬ ĐỘNG NGHỆ THUẬT:
 *   + 🌾 Mổ thóc: Cổ uốn lượn gập sâu, mỏ cắm đất, hạt thóc vàng văng
 *   + 🐥 Đi dạo: 2 chân bước so le luân phiên, cẳng chân co duỗi, móng vuốt bám đất
 *   + 🕊️ Vỗ cánh bay: Đôi cánh XÒE RỘNG NHIỀU TẦNG LÔNG BAY đập phành phạch trên không, 2 chân co sát bụng, lông vũ rụng bay lơ lửng
 *   + 👀 Chớp mắt: Mí mắt chớp tự nhiên, mắt màu nước lấp lánh có chiều sâu
 */

import { GroundPlatform } from '../graphics/plants/GroundPlatform';

export type ChickState = 'idle' | 'peck' | 'walk' | 'fly';

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

export class Chick {
  public x: number;
  public y: number;
  public altitude: number = 0; // Độ cao bay (px)
  public vx: number = 28; // Tốc độ di chuyển
  public vy: number = 0; // Vận tốc bay lên / hạ cánh
  public facing: number = 1; // 1: quay phải, -1: quay trái
  public targetHeight: number = 42; // Chiều cao gà con cân đối bối cảnh

  private animTimer: number = 0;

  // AI State Machine (Mổ thóc <-> Đi dạo <-> Đứng ngắm cảnh <-> Vỗ cánh bay)
  public state: ChickState = 'peck';
  private stateTimer: number = 0;
  private minX: number = 420;
  private maxX: number = 1450;

  // Chớp mắt tự nhiên
  private blinkTimer: number = 0;
  private isBlinking: boolean = false;

  // Hiệu ứng hạt thóc & Lông vũ khi bay
  private grains: GrainParticle[] = [];
  private feathers: FeatherParticle[] = [];
  private hasSpawnedGrainInCycle: boolean = false;

  constructor(x: number = 760, y: number = 480) {
    this.x = x;
    this.y = y;
  }

  /**
   * Kích hoạt gà con vỗ cánh xòe lông bay vút lên cao
   */
  public startFlight(forcedVx?: number): void {
    if (this.state === 'fly') return;
    this.state = 'fly';
    this.stateTimer = 0;
    this.vy = -(160 + Math.random() * 45); // Bay vút lên
    this.vx = forcedVx !== undefined ? forcedVx : this.facing * (42 + Math.random() * 20);
    this.spawnFeathers(4);
  }

  public update(dt: number, groundY: number, playerX?: number): void {
    this.animTimer += dt;
    this.stateTimer += dt;
    this.y = GroundPlatform.getGroundY(this.x, groundY);

    // 1. Chớp mắt tự nhiên
    this.blinkTimer += dt;
    if (!this.isBlinking && this.blinkTimer > 2.8 + Math.random() * 2.2) {
      this.isBlinking = true;
      this.blinkTimer = 0;
    } else if (this.isBlinking && this.blinkTimer > 0.12) {
      this.isBlinking = false;
      this.blinkTimer = 0;
    }

    // 2. Phản xạ giật mình bay khi người chơi chạy sát lại gần (< 65px)
    if (this.state !== 'fly' && playerX !== undefined) {
      const dist = Math.abs(this.x - playerX);
      if (dist < 65) {
        const escapeDir = this.x > playerX ? 1 : -1;
        this.facing = escapeDir;
        this.startFlight(escapeDir * (52 + Math.random() * 20));
      }
    }

    // 3. Cập nhật hiệu ứng hạt thóc
    for (let i = this.grains.length - 1; i >= 0; i--) {
      const g = this.grains[i];
      g.life -= dt;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.vy += 220 * dt; // Trọng lực
      if (g.life <= 0) {
        this.grains.splice(i, 1);
      }
    }

    // 4. Cập nhật lông vũ bay trong gió
    for (let i = this.feathers.length - 1; i >= 0; i--) {
      const f = this.feathers[i];
      f.life -= dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.rot += f.rotSpeed * dt;
      f.vy += 45 * dt; // Trọng lực rất nhẹ
      f.vx *= 0.98;
      if (f.life <= 0) {
        this.feathers.splice(i, 1);
      }
    }

    // 5. AI State Machine
    if (this.state === 'fly') {
      this.x += this.vx * dt;
      this.altitude += -this.vy * dt;
      this.vy += 150 * dt; // Trọng lực êm dịu

      if (Math.random() < 0.1) {
        this.spawnFeathers(1);
      }

      if (this.x < this.minX) {
        this.x = this.minX;
        this.facing = 1;
        this.vx = Math.abs(this.vx);
      } else if (this.x > this.maxX) {
        this.x = this.maxX;
        this.facing = -1;
        this.vx = -Math.abs(this.vx);
      }

      if (this.altitude <= 0) {
        this.altitude = 0;
        this.vy = 0;
        this.state = 'idle'; // Tiếp đất êm ái
        this.stateTimer = 0;
        this.animTimer = 0;
      }
    } else if (this.state === 'peck') {
      const peckSpeed = 2.6;
      const phase = (this.animTimer * peckSpeed) % 1.0;

      // Khi mỏ cắm chạm đất (phase 0.48 - 0.58), bắn hạt thóc vàng
      if (phase >= 0.48 && phase <= 0.58) {
        if (!this.hasSpawnedGrainInCycle) {
          this.spawnGrainParticles();
          this.hasSpawnedGrainInCycle = true;
        }
      } else {
        this.hasSpawnedGrainInCycle = false;
      }

      if (this.stateTimer >= 3.6 + Math.random() * 2.0) {
        const rand = Math.random();
        if (rand < 0.22) {
          this.startFlight();
        } else if (rand < 0.65) {
          this.state = 'walk';
          this.facing = Math.random() < 0.5 ? 1 : -1;
          this.vx = this.facing * (24 + Math.random() * 12);
        } else {
          this.state = 'idle';
        }
        this.stateTimer = 0;
        this.animTimer = 0;
        this.hasSpawnedGrainInCycle = false;
      }
    } else if (this.state === 'idle') {
      if (this.stateTimer >= 2.5 + Math.random() * 2.0) {
        const rand = Math.random();
        if (rand < 0.18) {
          this.startFlight();
        } else if (rand < 0.65) {
          this.state = 'peck';
        } else {
          this.state = 'walk';
          this.facing = Math.random() < 0.5 ? 1 : -1;
          this.vx = this.facing * (24 + Math.random() * 12);
        }
        this.stateTimer = 0;
        this.animTimer = 0;
        this.hasSpawnedGrainInCycle = false;
      }
    } else if (this.state === 'walk') {
      this.x += this.vx * dt;

      if (this.x < this.minX) {
        this.x = this.minX;
        this.facing = 1;
        this.vx = Math.abs(this.vx);
      } else if (this.x > this.maxX) {
        this.x = this.maxX;
        this.facing = -1;
        this.vx = -Math.abs(this.vx);
      }

      if (this.stateTimer >= 2.8 + Math.random() * 2.0) {
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
    if (this.grains.length > 12) return;
    const beakOffsetX = this.facing * 18;
    const beakOffsetY = -2;
    for (let i = 0; i < 2; i++) {
      this.grains.push({
        x: this.x + beakOffsetX + (Math.random() - 0.5) * 4,
        y: this.y + beakOffsetY,
        vx: (this.facing * (16 + Math.random() * 22)) + (Math.random() - 0.5) * 16,
        vy: -(22 + Math.random() * 32),
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.5,
        size: 1.5 + Math.random() * 1.0,
      });
    }
  }

  private spawnFeathers(count: number = 2): void {
    if (this.feathers.length > 20) return;
    for (let i = 0; i < count; i++) {
      this.feathers.push({
        x: this.x + (Math.random() - 0.5) * 14,
        y: this.y - this.altitude - 16 + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 35,
        vy: -(15 + Math.random() * 25),
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 6,
        life: 0.8 + Math.random() * 0.6,
        maxLife: 1.4,
        size: 2.8 + Math.random() * 1.5,
        color: Math.random() < 0.7 ? '#fef08a' : '#fde047',
      });
    }
  }

  public render(ctx: CanvasRenderingContext2D, showLabel: boolean = false): void {
    const scale = this.targetHeight / 44.0;

    // ==================== TÍNH TOÁN CÁC KHỚP XƯƠNG CỬ ĐỘNG ====================
    let bodyY = 0;
    let bodyRot = 0;
    let headRot = 0;
    let headOffsetX = 0;
    let headOffsetY = 0;
    let wingRot = 0;
    let wingSpread = 0;
    let leftLegRot = 0;
    let rightLegRot = 0;
    let leftFootLift = 0;
    let rightFootLift = 0;
    let tailRot = 0;
    let flightTilt = 0;

    const t = this.animTimer;

    if (this.state === 'idle') {
      const breathe = Math.sin(t * 3.0);
      bodyY = breathe * 0.5;
      headRot = Math.sin(t * 1.5) * 0.05;
      wingRot = Math.sin(t * 3.0) * 0.02;
      tailRot = Math.sin(t * 3.5) * 0.08;
    } else if (this.state === 'walk') {
      const walkFreq = 12.0;
      const stepPhase = t * walkFreq;

      leftLegRot = Math.sin(stepPhase) * 0.50;
      rightLegRot = Math.sin(stepPhase + Math.PI) * 0.50;

      leftFootLift = Math.max(0, -Math.sin(stepPhase) * 3.5);
      rightFootLift = Math.max(0, -Math.sin(stepPhase + Math.PI) * 3.5);

      bodyY = -Math.abs(Math.sin(stepPhase)) * 2.0;
      bodyRot = Math.sin(stepPhase) * 0.04;

      wingRot = -0.10 + Math.abs(Math.sin(stepPhase)) * 0.18;
      headRot = Math.sin(stepPhase) * 0.08;
      headOffsetX = Math.sin(stepPhase) * 0.6;
      tailRot = Math.sin(stepPhase * 1.3) * 0.18;
    } else if (this.state === 'peck') {
      const peckSpeed = 2.6;
      const phase = (t * peckSpeed) % 1.0;
      const peckCurve = Math.sin(phase * Math.PI);

      bodyRot = peckCurve * 0.20;
      bodyY = peckCurve * 1.0;

      // Cổ uốn lượn chúc đầu xuống đất
      headRot = peckCurve * 0.90;
      headOffsetX = peckCurve * 6.0;
      headOffsetY = peckCurve * 10.5;

      wingRot = peckCurve * 0.14;
      tailRot = -peckCurve * 0.28;
    } else if (this.state === 'fly') {
      const flapPhase = t * 26.0;
      wingSpread = 1.0;
      wingRot = Math.sin(flapPhase) * 0.65;

      bodyY = -this.altitude + Math.sin(flapPhase * 0.5) * 2.0;
      flightTilt = this.vy < 0 ? -0.16 : 0.12;

      leftLegRot = 0.60;
      rightLegRot = 0.50;
      leftFootLift = 5.5;
      rightFootLift = 5.0;

      headRot = flightTilt * 0.7;
      tailRot = Math.sin(flapPhase) * 0.22;
    }

    // ==================== BẮT ĐẦU VẼ BẢN HỘI HỌA MÀU NƯỚC SIÊU CHI TIẾT ====================
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));

    if (this.facing < 0) {
      ctx.scale(-1, 1);
    }
    ctx.scale(scale, scale);

    // 1. BÓNG ĐỔ MỀM DƯỚI ĐẤT
    const shadowW = this.state === 'fly' ? Math.max(5, 14 - (this.altitude / 10)) : 14;
    const shadowAlpha = this.state === 'fly' ? Math.max(0.06, 0.24 - (this.altitude / 500)) : 0.24;
    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, shadowW, shadowW * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dời tọa độ thân
    ctx.save();
    ctx.translate(0, bodyY);
    if (flightTilt !== 0) ctx.rotate(flightTilt);

    // 2. CHÂN SAU (Right Leg)
    this.renderPainterlyLeg(ctx, 3, -14, rightLegRot, rightFootLift, '#c2410c');

    // 3. ĐUÔI LÔNG TƠ PHÂN TẦNG (Multi-Layer Downy Tail)
    ctx.save();
    ctx.translate(-14, -20);
    ctx.rotate(tailRot);
    this.renderDownyTuft(ctx, -8, 0, 10, 4.8, -0.32, '#fde047', '#b45309');
    this.renderDownyTuft(ctx, -6, 2.5, 8.5, 4.2, -0.12, '#fef08a', '#d97706');
    this.renderDownyTuft(ctx, -4, 4.5, 7.0, 3.6, 0.08, '#fffbeb', '#eab308');
    ctx.restore();

    // 4. THÂN GÀ CON MÀU NƯỚC (Painterly Storybook Body)
    ctx.save();
    ctx.translate(0, -20);
    ctx.rotate(bodyRot);

    // Lớp màu nước nền nhiều tầng
    const bodyGrad = ctx.createRadialGradient(-3, -4, 3, 0, 4, 18);
    bodyGrad.addColorStop(0, '#ffffff'); // Ánh sáng đỉnh lưng
    bodyGrad.addColorStop(0.25, '#fef9c3'); // Vàng kem tơ mịn
    bodyGrad.addColorStop(0.60, '#fde047'); // Vàng óng tự nhiên
    bodyGrad.addColorStop(0.85, '#f59e0b'); // Hổ phách ấm
    bodyGrad.addColorStop(1, '#b45309'); // Nâu đất bóng đổ

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    // Đường cong hữu cơ quả lê chuẩn giải phẫu gà con
    ctx.moveTo(-14, -4);
    ctx.bezierCurveTo(-15, -11, -6, -15, 4, -14); // Lưng dốc mềm
    ctx.bezierCurveTo(13, -13, 16, -3, 14, 7); // Ức phúng phính
    ctx.bezierCurveTo(11, 14, -2, 16, -10, 10); // Bụng tròn
    ctx.bezierCurveTo(-15, 6, -15, 0, -14, -4);
    ctx.closePath();
    ctx.fill();

    // Viền lông tơ phơ phất (Downy serrated contour)
    this.renderDownyFeatherFringe(ctx);

    // Các vệt cọ lông tơ mềm mại trên ức và bụng
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(3, -3); ctx.quadraticCurveTo(8, 1, 6, 7);
    ctx.moveTo(-2, 2); ctx.quadraticCurveTo(4, 6, 1, 10);
    ctx.moveTo(-7, 2); ctx.quadraticCurveTo(-3, 6, -6, 9);
    ctx.stroke();

    // 5. CÁNH GÀ CON (Realistic Storybook Wing)
    ctx.save();
    ctx.translate(-1, 0);
    ctx.rotate(wingRot);

    if (wingSpread > 0.5) {
      this.renderPainterlyOpenWing(ctx);
    } else {
      this.renderPainterlyFoldedWing(ctx);
    }
    ctx.restore();

    ctx.restore(); // Kết thúc Thân

    // 6. CHÂN TRƯỚC (Left Leg)
    this.renderPainterlyLeg(ctx, -3, -14, leftLegRot, leftFootLift, '#ea580c');

    // 7. CỔ & ĐẦU & MẮT & MỎ (Painterly Storybook Head & Face)
    ctx.save();
    ctx.translate(8 + headOffsetX, -29 + headOffsetY);
    ctx.rotate(headRot);

    // CỔ NỐI THÂN MỀM MẠI
    const neckGrad = ctx.createLinearGradient(-3, 0, 3, 13);
    neckGrad.addColorStop(0, '#fef9c3');
    neckGrad.addColorStop(0.5, '#fde047');
    neckGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = neckGrad;
    ctx.beginPath();
    ctx.moveTo(-5, -3);
    ctx.quadraticCurveTo(-7, 5, -6, 13);
    ctx.lineTo(4, 13);
    ctx.quadraticCurveTo(6, 5, 4, -3);
    ctx.closePath();
    ctx.fill();

    // ĐẦU GÀ CON HÌNH QUẢ TRỨNG HỮU CƠ (Không phải hình tròn đơn điệu)
    const headGrad = ctx.createRadialGradient(-2, -3, 2, 0, 0, 13);
    headGrad.addColorStop(0, '#ffffff'); // Ánh sáng trên đỉnh đầu
    headGrad.addColorStop(0.35, '#fef9c3');
    headGrad.addColorStop(0.70, '#fde047');
    headGrad.addColorStop(1, '#c26e10'); // Nâu hổ phách ấm áp

    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(-10, -2);
    ctx.bezierCurveTo(-11, -9, -5, -13, 1, -13); // Đỉnh đầu cong mềm
    ctx.bezierCurveTo(7, -13, 11, -7, 11, 0); // Trán & má
    ctx.bezierCurveTo(11, 6, 5, 10, -1, 10); // Cằm
    ctx.bezierCurveTo(-7, 10, -10, 5, -10, -2);
    ctx.closePath();
    ctx.fill();

    // Lông tơ mềm viền đầu
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.35)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Chùm lông tơ phất nhẹ trên đỉnh đầu
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.9)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(-1, -12); ctx.quadraticCurveTo(0, -16, 3, -15);
    ctx.moveTo(1, -12); ctx.quadraticCurveTo(3, -15, 5, -13);
    ctx.stroke();

    // Má hồng phơn phớt màu nước truyện tranh
    const blushGrad = ctx.createRadialGradient(3, 3, 0, 3, 3, 4.5);
    blushGrad.addColorStop(0, 'rgba(244, 63, 94, 0.40)');
    blushGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
    ctx.fillStyle = blushGrad;
    ctx.beginPath();
    ctx.arc(3, 3, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // MỎ GÀ TƠ NHỎ NHẮN CHUẨN TỶ LỆ (Có sống mỏ cong & lỗ thở)
    const beakGrad = ctx.createLinearGradient(7, -2, 15, 2);
    beakGrad.addColorStop(0, '#fed7aa'); // Gốc mỏ màu da/kem
    beakGrad.addColorStop(0.5, '#fb923c'); // Cam ấm
    beakGrad.addColorStop(1, '#c2410c'); // Đầu mỏ nâu sẫm
    ctx.fillStyle = beakGrad;
    ctx.beginPath();
    ctx.moveTo(7.5, -2.2);
    ctx.quadraticCurveTo(11.5, -1.5, 14.5, 1.0); // Sống mỏ trên cong sắc
    ctx.lineTo(7.5, 3.8); // Mép mỏ dưới
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Lỗ mũi nhỏ xíu (Nares)
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath();
    ctx.ellipse(9.5, -0.2, 0.6, 0.35, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // MẮT GÀ TRUYỆN TRANH SÂU THẲM (Tỷ lệ chuẩn ~18% đầu, có viền mí & tròng hổ phách)
    if (this.isBlinking) {
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(2.8, -2.5, 3.0, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else {
      // Vành mí mắt trên mềm
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(2.8, -2.5, 3.2, Math.PI + 0.3, -0.3);
      ctx.stroke();

      // Tròng đen sâu
      ctx.fillStyle = '#090d16';
      ctx.beginPath();
      ctx.arc(2.8, -2.5, 2.9, 0, Math.PI * 2);
      ctx.fill();

      // Vầng hổ phách nhạt ở đáy mắt (mắt màu nước sống động)
      const irisGrad = ctx.createRadialGradient(2.8, -1.2, 0, 2.8, -1.2, 2.6);
      irisGrad.addColorStop(0, 'rgba(217, 119, 6, 0.75)');
      irisGrad.addColorStop(1, 'rgba(9, 13, 22, 0)');
      ctx.fillStyle = irisGrad;
      ctx.beginPath();
      ctx.arc(2.8, -1.6, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Điểm bắt sáng lớn (Catchlight anime)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(3.8, -3.5, 1.0, 0, Math.PI * 2);
      ctx.fill();

      // Điểm bắt sáng phụ nhỏ
      ctx.beginPath();
      ctx.arc(2.0, -1.7, 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // Kết thúc Đầu

    ctx.restore(); // Kết thúc Thân dời tọa độ

    ctx.restore(); // Kết thúc toàn bộ gà con

    // ==================== HẠT THÓC VĂNG ====================
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

    // ==================== LÔNG VŨ RỤNG BAY LƠ LỬNG ====================
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
        ctx.ellipse(0, 0, f.size, f.size * 0.42, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // ==================== PHỤ ĐỀ / NHÃN TÊN KHI BẬT [N] ====================
    if (showLabel) {
      ctx.save();
      ctx.translate(Math.round(this.x), Math.round(this.y - this.targetHeight - this.altitude - 8));
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.beginPath();
      ctx.roundRect(-46, -7.5, 92, 15, 6);
      ctx.fill();
      ctx.strokeStyle = this.state === 'fly' ? 'rgba(56, 189, 248, 0.9)' : (this.state === 'peck' ? 'rgba(250, 204, 21, 0.8)' : 'rgba(74, 222, 128, 0.8)');
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = this.state === 'fly' ? '#7dd3fc' : (this.state === 'peck' ? '#fde047' : '#86efac');
      ctx.font = 'bold 8px Outfit, sans-serif';
      ctx.textAlign = 'center';
      const stateLabel = this.state === 'fly' ? '🕊️ Gà Con Vỗ Cánh Bay' : (this.state === 'peck' ? '🌾 Gà Con Mổ Thóc' : (this.state === 'walk' ? '🐥 Gà Con Lon Ton' : '🐥 Gà Con Ngắm Cảnh'));
      ctx.fillText(stateLabel, 0, 3);
      ctx.restore();
    }
  }

  /**
   * Vẽ cánh gập sát hông phân tầng chi tiết có đốm hoa dâu
   */
  private renderPainterlyFoldedWing(ctx: CanvasRenderingContext2D): void {
    // Nền cánh vàng rơm
    const wingGrad = ctx.createLinearGradient(-8, -6, 8, 6);
    wingGrad.addColorStop(0, '#fef9c3');
    wingGrad.addColorStop(0.5, '#fde047');
    wingGrad.addColorStop(1, '#d97706');

    ctx.fillStyle = wingGrad;
    ctx.beginPath();
    ctx.moveTo(-7, -4);
    ctx.quadraticCurveTo(2, -7, 9, 0);
    ctx.quadraticCurveTo(7, 7, -3, 6.5);
    ctx.quadraticCurveTo(-9, 3, -7, -4);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(180, 83, 9, 0.55)';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Các nếp viền lông bay (Coverts & Primaries)
    ctx.strokeStyle = 'rgba(217, 119, 6, 0.75)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-4, -1); ctx.quadraticCurveTo(2, -0.5, 7, 2);
    ctx.moveTo(-3, 2); ctx.quadraticCurveTo(2, 2.5, 5, 4.5);
    ctx.moveTo(-2, 4.5); ctx.quadraticCurveTo(1, 5, 3, 6);
    ctx.stroke();

    // Đốm hoa dâu nâu nhạt trên cánh (chân thực như gà tơ)
    ctx.fillStyle = 'rgba(180, 83, 9, 0.45)';
    ctx.beginPath();
    ctx.arc(-1, 0, 0.9, 0, Math.PI * 2);
    ctx.arc(3, 1, 0.8, 0, Math.PI * 2);
    ctx.arc(1, 3.5, 0.7, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Vẽ cánh xòe rộng 5 tầng lông bay khi bay trên không
   */
  private renderPainterlyOpenWing(ctx: CanvasRenderingContext2D): void {
    const layers = [
      { angle: -0.65, len: 14, w: 5.0, col1: '#ffffff', col2: '#fef08a' },
      { angle: -0.45, len: 17, w: 5.2, col1: '#fef9c3', col2: '#fde047' },
      { angle: -0.25, len: 19, w: 5.0, col1: '#fef08a', col2: '#f59e0b' },
      { angle: -0.05, len: 16, w: 4.8, col1: '#fde047', col2: '#d97706' },
      { angle: 0.15, len: 13, w: 4.2, col1: '#f59e0b', col2: '#b45309' },
    ];

    for (const l of layers) {
      ctx.save();
      ctx.rotate(l.angle);
      const fGrad = ctx.createLinearGradient(0, 0, -l.len, 0);
      fGrad.addColorStop(0, l.col1);
      fGrad.addColorStop(1, l.col2);

      ctx.fillStyle = fGrad;
      ctx.beginPath();
      ctx.ellipse(-l.len * 0.5, 0, l.len * 0.5, l.w * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.45)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      ctx.restore();
    }
  }

  /**
   * Vẽ lông tơ viền mềm mại
   */
  private renderDownyTuft(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number, col1: string, col2: string): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    const grad = ctx.createLinearGradient(-rx, 0, rx, 0);
    grad.addColorStop(0, col1);
    grad.addColorStop(1, col2);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /**
   * Tạo viền lông tơ mịn xung quanh thân
   */
  private renderDownyFeatherFringe(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = 'rgba(254, 240, 138, 0.8)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    // Vài sợi tơ nhô ra ở lưng và bụng
    ctx.moveTo(-11, -8); ctx.lineTo(-13, -10);
    ctx.moveTo(-7, -13); ctx.lineTo(-8, -15);
    ctx.moveTo(-13, 4); ctx.lineTo(-15, 6);
    ctx.moveTo(-8, 12); ctx.lineTo(-9, 14);
    ctx.stroke();
  }

  /**
   * Vẽ 1 chiếc chân gà con chi tiết với cẳng chân, khớp gối, vảy & 3 móng vuốt
   */
  private renderPainterlyLeg(ctx: CanvasRenderingContext2D, hipX: number, hipY: number, legRot: number, footLiftY: number, color: string): void {
    ctx.save();
    ctx.translate(hipX, hipY);
    ctx.rotate(legRot);

    // Bắp đùi lông tơ phúng phính
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(0, 2, 3.2, 4.0, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.35)';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Cẳng chân mảnh khảnh
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const footY = 11 - footLiftY;
    ctx.beginPath();
    ctx.moveTo(0, 3.5);
    ctx.lineTo(0.5, footY);
    ctx.stroke();

    // Các vệt vảy chân gà
    ctx.strokeStyle = 'rgba(124, 45, 18, 0.6)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-0.5, 6); ctx.lineTo(1.2, 6);
    ctx.moveTo(-0.5, 8.5); ctx.lineTo(1.2, 8.5);
    ctx.stroke();

    // Khớp bàn chân & 3 ngón chân xòe có móng vuốt
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0.5, footY);
    ctx.lineTo(5.0, footY + 1.2); // Ngón trước
    ctx.moveTo(0.5, footY);
    ctx.lineTo(4.2, footY - 1.2); // Ngón giữa
    ctx.moveTo(0.5, footY);
    ctx.lineTo(-2.8, footY); // Ngón sau
    ctx.stroke();

    // Đầu móng vuốt nhỏ xíu màu nâu sẫm
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath();
    ctx.arc(5.2, footY + 1.2, 0.7, 0, Math.PI * 2);
    ctx.arc(4.4, footY - 1.2, 0.7, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
