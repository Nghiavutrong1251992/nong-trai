import { AnimalType, CONSTANTS } from '../constants';
import { Item, ItemType } from './Item';

export class Animal {
  public id: number;
  public x: number;
  public y: number;
  public type: AnimalType;
  public speed: number;
  public vx: number = 0;
  public vy: number = 0;
  public facing: number = 1; // 1: phải, -1: trái
  public wanderTimer: number = 0;
  public legPhase: number = 0;
  public dropTimer: number = 6 + Math.random() * 6;
  public startled: boolean = false;
  public startledTimer: number = 0;

  constructor(id: number, x: number, y: number, type: AnimalType = 'buffalo') {
    this.id = id;
    this.x = x;
    this.y = y;
    this.type = type;
    this.speed = type === 'buffalo' ? CONSTANTS.SPEED_BUFFALO : (type === 'duck' ? CONSTANTS.SPEED_DUCK : CONSTANTS.SPEED_CHICKEN);
    
    const ang = Math.random() * Math.PI * 2;
    this.vx = Math.cos(ang) * this.speed;
    this.vy = Math.sin(ang) * this.speed;
    this.facing = this.vx >= 0 ? 1 : -1;
  }

  public update(dt: number, bounds: { w: number; h: number }, items: Item[]): void {
    this.legPhase += dt * 9;
    this.wanderTimer -= dt;
    this.dropTimer -= dt;

    if (this.startledTimer > 0) {
      this.startledTimer -= dt;
      if (this.startledTimer <= 0) this.startled = false;
    }

    if (this.wanderTimer <= 0 && !this.startled) {
      const ang = Math.random() * Math.PI * 2;
      this.vx = Math.cos(ang) * this.speed;
      this.vy = Math.sin(ang) * this.speed;
      this.wanderTimer = 1.5 + Math.random() * 2.5;
    }

    if (Math.abs(this.vx) > 5) {
      this.facing = this.vx >= 0 ? 1 : -1;
    }

    const spdMult = this.startled ? 1.8 : 1.0;
    this.x += this.vx * spdMult * dt;
    this.y += this.vy * spdMult * dt;

    const pad = 35;
    if (this.x < pad) { this.x = pad; this.vx = Math.abs(this.vx); }
    if (this.x > bounds.w - pad) { this.x = bounds.w - pad; this.vx = -Math.abs(this.vx); }
    if (this.y < pad) { this.y = pad; this.vy = Math.abs(this.vy); }
    if (this.y > bounds.h - pad) { this.y = bounds.h - pad; this.vy = -Math.abs(this.vy); }

    if (this.dropTimer <= 0 && items.length < 25) {
      this.dropTimer = 8 + Math.random() * 8;
      const dropType: ItemType = this.type === 'buffalo' ? 'milk' : (this.type === 'duck' ? 'egg' : 'rice');
      items.push(new Item(this.x, this.y, dropType));
    }
  }

  public redirectInward(targetX: number, targetY: number): void {
    const toCenter = Math.atan2(targetY - this.y, targetX - this.x);
    this.vx = Math.cos(toCenter) * this.speed;
    this.vy = Math.sin(toCenter) * this.speed;
    this.facing = this.vx >= 0 ? 1 : -1;
    this.startled = true;
    this.startledTimer = 1.2;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.facing < 0) ctx.scale(-1, 1);

    const swing = Math.sin(this.legPhase) * 4.0;
    const bob = Math.sin(this.legPhase * 1.5) * 1.2;

    // 1. Bóng đổ tiếp xúc chân thực
    ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
    ctx.beginPath();
    ctx.ellipse(0, 16, this.type === 'buffalo' ? 24 : 12, this.type === 'buffalo' ? 7 : 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, bob);

    if (this.type === 'buffalo') {
      // ============================================================
      // 🐃 CHÚ TRÂU NƯỚC CHUẨN ICON (Water Buffalo Iconic Style)
      // ============================================================
      // 4 Chân guốc vững chãi (Hooves)
      const drawBuffaloLeg = (lx: number, legSwing: number) => {
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(lx, 6, 5.5, 9 + legSwing * 0.3, 1.5);
        ctx.fill();

        // Móng guốc đen
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(lx - 0.5, 13 + legSwing * 0.3, 6.5, 3.2, 1);
        ctx.fill();
      };

      drawBuffaloLeg(-14, swing);
      drawBuffaloLeg(-6, -swing);
      drawBuffaloLeg(4, swing);
      drawBuffaloLeg(12, -swing);

      // Thân trâu có u vai cao (Shoulder Hump)
      const bodyGrad = ctx.createLinearGradient(-18, -10, 18, 10);
      bodyGrad.addColorStop(0, '#475569');
      bodyGrad.addColorStop(0.5, '#334155');
      bodyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = bodyGrad;

      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.quadraticCurveTo(-14, -8, -6, -8);     // Lưng sau
      ctx.quadraticCurveTo(2, -12, 10, -7);     // U vai trâu nhô cao
      ctx.quadraticCurveTo(16, -2, 16, 7);      // Ngực trâu
      ctx.lineTo(-16, 7);                       // Bụng trâu
      ctx.closePath();
      ctx.fill();

      // Đầu trâu chúc nhẹ
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(17, -2, 7.5, 6.5, 0.2, 0, Math.PI * 2);
      ctx.fill();

      // Mõm trâu & 2 lỗ mũi
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.ellipse(22, 1, 4.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(22, 1, 0.9, 0, Math.PI * 2);
      ctx.arc(24, 1, 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Mắt trâu to tròn đen láy
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(17, -4, 2.0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(17.4, -4, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(17.2, -4.5, 0.55, 0, Math.PI * 2);
      ctx.fill();

      // CẶP SỪNG TRÂU CONG LƯỠI LIỀM VỀ PHÍA SAU (Iconic Curved Horns)
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(16, -6);
      ctx.quadraticCurveTo(10, -18, -2, -15); // Sừng cong vút về sau lưng
      ctx.stroke();

      // Vạch sáng trên sừng
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(14, -7);
      ctx.quadraticCurveTo(9, -16, -1, -14);
      ctx.stroke();

      // Tai trâu vểnh ngang
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(13, -3, 3.5, 2, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // ĐUÔI TRÂU DÀI CÓ TÚM LÔNG Ở NGỌN
      const tailWag = Math.sin(Date.now() / 200) * 4;
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-18, 0);
      ctx.quadraticCurveTo(-24, 4 + tailWag, -22, 10 + tailWag * 1.2);
      ctx.stroke();

      // Túm lông đuôi đen nhánh
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(-22, 10 + tailWag * 1.2, 2.5, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'duck') {
      // ============================================================
      // 🦆 CHÚ VỊT AO SEN (Tilted Swimming Duck)
      // ============================================================
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, 11, 14, 4.5, 0, 0, Math.PI * 2);
      ctx.stroke();

      const duckGrad = ctx.createLinearGradient(-10, -5, 10, 10);
      duckGrad.addColorStop(0, '#ffffff');
      duckGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = duckGrad;
      ctx.beginPath();
      ctx.ellipse(0, 2, 11, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(-9, 0); ctx.lineTo(-14, -3); ctx.lineTo(-9, 4);
      ctx.fill();

      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.ellipse(-2, 1, 6.5, 3.5, -0.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(8, -4, 5.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.roundRect(11, -3.5, 6.5, 3.2, 1.5);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(7.5, -5.5, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(7.2, -6.0, 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
      ctx.beginPath();
      ctx.arc(7, -3, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // ============================================================
      // 🐥 CHÚ GÀ SÂN THÓC (Tilted Chicken)
      // ============================================================
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-2, 8); ctx.lineTo(-2 + swing, 14);
      ctx.moveTo(3, 8); ctx.lineTo(3 - swing, 14);
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.ellipse(0, 1, 9, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(-2, 1, 5.5, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(6, -4, 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(6, -9, 2.2, 0, Math.PI * 2);
      ctx.arc(8, -8, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(9, -4); ctx.lineTo(13, -3); ctx.lineTo(9, -2);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(6, -5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
