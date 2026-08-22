/**
 * Hệ Thống Diều Sáo Dân Gian Việt Nam (Flute Kite Physics & Layered Rendering)
 * - Tự động tách nền trong suốt cho ảnh diều sáo
 * - Mô phỏng lực căng dây, độ võng theo gió và bay chao liệng
 * - Vẽ dải lụa đuôi diều uốn lượn mềm mại theo chuyển động
 */
export class FluteKite {
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public angle: number = 0;
  public isActive: boolean = true; // Mặc định BẬT để luôn thấy diều bay lơ lửng

  public toggleActive(): boolean {
    this.isActive = !this.isActive;
    return this.isActive;
  }


  private img: HTMLImageElement | null = null;
  private transparentCanvas: HTMLCanvasElement | null = null;
  private isLoaded: boolean = false;
  private time: number = 0;

  // Dải lụa đuôi diều (Physics Ribbon Tails)
  private leftTail: Array<{ x: number; y: number }> = [];
  private midTail: Array<{ x: number; y: number }> = [];
  private rightTail: Array<{ x: number; y: number }> = [];

  constructor() {
    this.img = new Image();
    this.img.src = '/assets/props/flute_kite.jpg';
    this.img.onload = () => {
      this.processTransparency();
      this.isLoaded = true;
    };

    // Khởi tạo các điểm đuôi lụa
    for (let i = 0; i < 8; i++) {
      this.leftTail.push({ x: 0, y: 0 });
      this.midTail.push({ x: 0, y: 0 });
      this.rightTail.push({ x: 0, y: 0 });
    }
  }

  /**
   * Tách nền trắng thành trong suốt tự động trên Offscreen Canvas
   */
  private processTransparency(): void {
    if (!this.img) return;
    try {
      const w = this.img.naturalWidth || 512;
      const h = this.img.naturalHeight || 512;

      this.transparentCanvas = document.createElement('canvas');
      this.transparentCanvas.width = w;
      this.transparentCanvas.height = h;
      const ctx = this.transparentCanvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(this.img, 0, 0);
      const imgData = ctx.getImageData(0, 0, w, h);
      const d = imgData.data;

      for (let i = 0; i < d.length; i += 4) {
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        // Nếu là màu trắng hoặc gần trắng (nền tranh vẽ) -> Làm trong suốt
        if (r > 230 && g > 230 && b > 230) {
          d[i + 3] = 0;
        } else if (r > 200 && g > 200 && b > 200) {
          // Khử răng cưa viền (Feathering)
          const alpha = Math.min(255, Math.max(0, 255 - ((r + g + b) / 3 - 200) * 8.5));
          d[i + 3] = Math.round(alpha);
        }
      }

      ctx.putImageData(imgData, 0, 0);
    } catch {
      // Fallback
    }
  }

  /**
   * Cập nhật vật lý bay của con diều dựa trên vị trí và tốc độ người chơi
   */
  public update(dt: number, playerX: number, playerY: number, playerVx: number, facing: number): void {
    if (!this.isActive) return;

    this.time += dt;

    // Vị trí cuộn dây gỗ trên bàn tay giơ cao của cậu bé
    const handX = playerX + (facing > 0 ? 18 : -18);
    const handY = playerY - 82;

    // Nếu mới khởi tạo
    if (this.x === 0 && this.y === 0) {
      this.x = handX - facing * 120;
      this.y = handY - 190;
    }

    // Tốc độ di chuyển của người chơi làm tăng lực nâng của gió
    const speedMagnitude = Math.abs(playerVx);
    const windLift = speedMagnitude > 20 ? 70 : 0;
    const trailOffset = facing > 0 ? -130 : 130;

    // Điểm mục tiêu con diều muốn bay tới (Target Altitude & Position)
    const targetX = handX + trailOffset + Math.sin(this.time * 1.8) * 30;
    const targetY = handY - 200 - windLift + Math.cos(this.time * 2.2) * 20;

    // Quán tính đàn hồi kéo diều theo gió (Spring & Damping)
    this.vx += (targetX - this.x) * 3.5 * dt;
    this.vy += (targetY - this.y) * 3.5 * dt;
    this.vx *= 0.88;
    this.vy *= 0.88;

    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Góc nghiêng chao liệng của cánh diều
    const baseAngle = (this.vx * 0.002) + (facing > 0 ? 0.15 : -0.15);
    this.angle = baseAngle + Math.sin(this.time * 3.0) * 0.1;

    // Cập nhật dải đuôi lụa ngũ sắc uốn lượn theo gió
    this.updateTails(dt);
  }

  private updateTails(dt: number): void {
    const attachY = this.y + 30;
    const attachX = this.x;

    // Điểm gốc đuôi
    this.leftTail[0] = { x: attachX - 12, y: attachY };
    this.midTail[0] = { x: attachX, y: attachY + 6 };
    this.rightTail[0] = { x: attachX + 12, y: attachY };

    const updateRibbon = (ribbon: Array<{ x: number; y: number }>, swayFreq: number, swayAmp: number) => {
      for (let i = 1; i < ribbon.length; i++) {
        const prev = ribbon[i - 1];
        const curr = ribbon[i];
        const segDist = 10;
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const dist = Math.hypot(dx, dy) || 1;

        // Kéo đuôi bay theo gió và võng xuống do trọng lực
        const targetX = prev.x - dx / dist * segDist + Math.sin(this.time * swayFreq + i * 0.6) * swayAmp;
        const targetY = prev.y + 11;

        curr.x += (targetX - curr.x) * 12 * dt;
        curr.y += (targetY - curr.y) * 12 * dt;
      }
    };

    updateRibbon(this.leftTail, 4.0, 4.0);
    updateRibbon(this.midTail, 4.5, 4.5);
    updateRibbon(this.rightTail, 3.8, 4.0);
  }

  /**
   * Vẽ sợi dây diều từ tay cậu bé lên cánh diều và hiển thị diều sáo
   */
  public render(ctx: CanvasRenderingContext2D, playerX: number, playerY: number, facing: number): void {
    if (!this.isActive) return;

    const handX = playerX + (facing > 0 ? 18 : -18);
    const handY = playerY - 82;

    if (this.x === 0 && this.y === 0) {
      this.x = handX - facing * 120;
      this.y = handY - 190;
    }

    ctx.save();

    // ------------------------------------------------------------
    // 1. VẼ SỢI DÂY DIỀU (DYNAMIC SAG CURVE)
    // ------------------------------------------------------------
    const kiteTieX = this.x;
    const kiteTieY = this.y + 15;

    // Điểm uốn cong của sợi dây do sức cản không khí
    const midX = (handX + kiteTieX) / 2 + (facing > 0 ? -20 : 20);
    const midY = (handY + kiteTieY) / 2 + 22; // Võng xuống tự nhiên

    ctx.strokeStyle = 'rgba(254, 240, 138, 0.85)'; // Dây dù vàng nhạt
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    ctx.quadraticCurveTo(midX, midY, kiteTieX, kiteTieY);
    ctx.stroke();

    // ------------------------------------------------------------
    // 2. VẼ DẢI ĐUÔI LỤA NGŨ SẮC (RIBBON TAILS)
    // ------------------------------------------------------------
    const drawRibbonPath = (ribbon: Array<{ x: number; y: number }>, color: string, width: number) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(ribbon[0].x, ribbon[0].y);
      for (let i = 1; i < ribbon.length; i++) {
        ctx.lineTo(ribbon[i].x, ribbon[i].y);
      }
      ctx.stroke();
    };

    drawRibbonPath(this.leftTail, '#ef4444', 3.5);   // Đuôi đỏ
    drawRibbonPath(this.midTail, '#fbbf24', 4.0);    // Đuôi vàng
    drawRibbonPath(this.rightTail, '#38bdf8', 3.5);  // Đuôi xanh

    // ------------------------------------------------------------
    // 3. VẼ CÁNH DIỀU SÁO TRUYỀN THỐNG
    // ------------------------------------------------------------
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    const drawSource = this.transparentCanvas || this.img;
    const kiteWidth = 96;
    const kiteHeight = 96;

    if (drawSource && (this.isLoaded || (drawSource instanceof HTMLImageElement && drawSource.complete) || drawSource instanceof HTMLCanvasElement)) {
      ctx.drawImage(
        drawSource,
        -kiteWidth / 2,
        -kiteHeight / 2,
        kiteWidth,
        kiteHeight
      );
    } else {
      // Fallback vẽ cánh diều sáo vector trong khi ảnh đang tải
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(0, -35);
      ctx.lineTo(45, 10);
      ctx.lineTo(0, 30);
      ctx.lineTo(-45, 10);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.restore();
  }
}
