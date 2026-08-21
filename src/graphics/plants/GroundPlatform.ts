/**
 * GroundPlatform.ts
 * Module vẽ Mặt Đất & Đồi Cỏ Xanh Mướt Đồng Quê Đa Tầng
 * Mở rộng đồng cỏ vô tận sang bên trái (x: -500px -> 2400px) tạo cảnh quan bao la, không bị cụt mép.
 */

export class GroundPlatform {
  private groundCanvas: HTMLCanvasElement | null = null;
  private cachedW: number = 0;
  private cachedH: number = 0;
  private cachedGroundY: number = 0;

  public static getGroundY(x: number, baseGroundY: number): number {
    if (x <= 800) {
      // 1. Đồng cỏ thấp (Mở rộng từ x: -500m -> 800m)
      return baseGroundY;
    } else if (x <= 1000) {
      // 2. Đoạn 5 (800 -> 1000m): Dốc lên đồi cỏ xanh thoai thoải
      const p = (x - 800) / 200;
      const s = p * p * (3 - 2 * p);
      return baseGroundY - s * 65;
    } else if (x <= 1200) {
      // 3. Đoạn 6 (1000 -> 1200m): Đỉnh đồi cỏ xanh cao ráo
      return baseGroundY - 65;
    } else if (x <= 1400) {
      // 4. Đoạn 7 (1200 -> 1400m): Sườn dốc thoai thoải dẫn xuống ruộng lúa
      const p = (x - 1200) / 200;
      const s = p * p * (3 - 2 * p);
      return (baseGroundY - 65) + s * 69;
    } else if (x <= 2200) {
      // 5. Đoạn 8, 9, 10, 11 (1400 -> 2200m): Thửa ruộng lúa nước
      return baseGroundY + 4;
    } else if (x <= 2280) {
      // 6. Đoạn 12 (2200 -> 2280m): Bờ đê thoải lên cuối thửa ruộng
      const p = (x - 2200) / 80;
      const s = p * p * (3 - 2 * p);
      return (baseGroundY + 4) - s * 4;
    } else {
      // 7. Đoạn 12 (2280 -> 2400m): Bờ cỏ cuối cánh đồng
      return baseGroundY;
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    groundY: number
  ): void {
    this.updateBuffer(width, height, groundY);
    if (this.groundCanvas) {
      ctx.drawImage(this.groundCanvas, -500, 0);
    }
  }

  private updateBuffer(width: number, height: number, groundY: number): void {
    if (
      this.groundCanvas &&
      this.cachedW === width &&
      this.cachedH === height &&
      this.cachedGroundY === groundY
    ) {
      return;
    }

    this.cachedW = width;
    this.cachedH = height;
    this.cachedGroundY = groundY;

    const minX = -500; // Mở rộng sang trái 500px
    const maxX = width + 300;
    const totalW = maxX - minX;

    const c = document.createElement('canvas');
    c.width = totalW;
    c.height = height;
    const gCtx = c.getContext('2d')!;

    const paddyStartX = 1400; // Đoạn 8
    const paddyEndX = 2200;   // Đoạn 11

    // Dịch tọa độ sang buffer cục bộ
    gCtx.translate(-minX, 0);

    // ------------------------------------------------------------
    // 1. TẦNG ĐẤT THỊT SÂU MÀU NÂU ĐEN XUYÊN SUỐT TOÀN BỘ ĐỊA HÌNH (-500px -> maxX)
    // ------------------------------------------------------------
    const soilGrad = gCtx.createLinearGradient(0, groundY - 75, 0, height);
    soilGrad.addColorStop(0, '#543015');
    soilGrad.addColorStop(0.18, '#3d200c');
    soilGrad.addColorStop(0.55, '#291407');
    soilGrad.addColorStop(1, '#1a0b04');
    gCtx.fillStyle = soilGrad;

    gCtx.beginPath();
    gCtx.moveTo(minX, height);
    gCtx.lineTo(minX, GroundPlatform.getGroundY(minX, groundY) + 2);

    for (let x = minX; x <= maxX; x += 4) {
      const gy = GroundPlatform.getGroundY(x, groundY);
      gCtx.lineTo(x, gy + 2);
    }

    gCtx.lineTo(maxX, height);
    gCtx.closePath();
    gCtx.fill();

    // Sỏi đá cuội tự nhiên dưới tầng đất
    for (let sx = minX + 14; sx < maxX; sx += 28) {
      const surfaceY = GroundPlatform.getGroundY(sx, groundY);
      const pebbleW = 7 + (Math.abs(sx) % 6);
      const pebbleH = 3.5 + (Math.abs(sx) % 4);
      const pebbleY = surfaceY + 12 + (Math.abs(sx) % 10);

      gCtx.fillStyle = Math.abs(sx) % 2 === 0 ? '#65391a' : '#854d0e';
      gCtx.beginPath();
      gCtx.ellipse(sx, pebbleY, pebbleW * 0.7, pebbleH * 0.7, 0.1, 0, Math.PI * 2);
      gCtx.fill();

      gCtx.fillStyle = 'rgba(254, 240, 138, 0.15)';
      gCtx.beginPath();
      gCtx.ellipse(sx - 1, pebbleY - 1, pebbleW * 0.35, pebbleH * 0.35, 0, 0, Math.PI * 2);
      gCtx.fill();
    }

    // ------------------------------------------------------------
    // 2. THẢM ĐỒI CỎ XANH MƯỚT (-500px -> 1400m & 2200m -> maxX)
    // ------------------------------------------------------------
    const turfGrad = gCtx.createLinearGradient(0, groundY - 80, 0, groundY + 15);
    turfGrad.addColorStop(0, '#84cc16'); // Xanh mạ non ấm áp
    turfGrad.addColorStop(0.35, '#65a30d'); // Xanh lá cây tươi tắn
    turfGrad.addColorStop(0.75, '#4d7c0f'); // Xanh lục đầm ấm
    turfGrad.addColorStop(1, '#3b1d07');    // Chuyển sang màu đất thịt
    gCtx.fillStyle = turfGrad;

    // A. Đoạn đồi cỏ trước: từ -500px -> 1400m
    gCtx.beginPath();
    gCtx.moveTo(minX, GroundPlatform.getGroundY(minX, groundY) - 6);
    for (let x = minX; x <= paddyStartX; x += 4) {
      const gy = GroundPlatform.getGroundY(x, groundY);
      gCtx.lineTo(x, gy - 6);
    }
    for (let x = paddyStartX; x >= minX; x -= 4) {
      const gy = GroundPlatform.getGroundY(x, groundY);
      gCtx.lineTo(x, gy + 8);
    }
    gCtx.closePath();
    gCtx.fill();

    // B. Đoạn bờ đê sau: từ 2200m -> maxX
    if (maxX > paddyEndX) {
      gCtx.beginPath();
      gCtx.moveTo(paddyEndX, GroundPlatform.getGroundY(paddyEndX, groundY) - 6);
      for (let x = paddyEndX; x <= maxX; x += 4) {
        const gy = GroundPlatform.getGroundY(x, groundY);
        gCtx.lineTo(x, gy - 6);
      }
      for (let x = maxX; x >= paddyEndX; x -= 4) {
        const gy = GroundPlatform.getGroundY(x, groundY);
        gCtx.lineTo(x, gy + 8);
      }
      gCtx.closePath();
      gCtx.fill();
    }

    // ------------------------------------------------------------
    // 3. VIỀN SÁNG MỀM MẠI TRÊN ĐỈNH ĐỒI CỎ (Soft Hilltop Highlights)
    // ------------------------------------------------------------
    gCtx.fillStyle = 'rgba(190, 242, 100, 0.45)';
    gCtx.beginPath();
    gCtx.moveTo(minX, GroundPlatform.getGroundY(minX, groundY) - 6);
    for (let x = minX; x <= paddyStartX; x += 4) {
      const gy = GroundPlatform.getGroundY(x, groundY);
      gCtx.lineTo(x, gy - 6);
    }
    for (let x = paddyStartX; x >= minX; x -= 4) {
      const gy = GroundPlatform.getGroundY(x, groundY);
      gCtx.lineTo(x, gy - 2);
    }
    gCtx.closePath();
    gCtx.fill();

    // ------------------------------------------------------------
    // 4. MẦM CỎ TƠ MỀM MẠI TỰ NHIÊN (-500px -> 1400m)
    // ------------------------------------------------------------
    gCtx.fillStyle = '#a3e635';
    gCtx.beginPath();
    gCtx.moveTo(minX, GroundPlatform.getGroundY(minX, groundY) - 4);

    for (let x = minX; x <= paddyStartX; x += 6) {
      const gy = GroundPlatform.getGroundY(x, groundY);
      let bladeH = 4 + Math.sin(x * 0.15) * 2 + ((Math.abs(x) * 7) % 3);

      if (x > 1340) {
        const fade = Math.max(0, 1 - (x - 1340) / 60);
        bladeH = bladeH * fade;
      }

      gCtx.lineTo(x + 3, gy - 6 - bladeH);
      gCtx.lineTo(x + 6, gy - 4);
    }

    gCtx.lineTo(paddyStartX, GroundPlatform.getGroundY(paddyStartX, groundY) + 4);
    gCtx.lineTo(minX, GroundPlatform.getGroundY(minX, groundY) + 4);
    gCtx.closePath();
    gCtx.fill();

    // Mầm cỏ bờ đê sau
    if (maxX > paddyEndX) {
      gCtx.beginPath();
      gCtx.moveTo(paddyEndX, GroundPlatform.getGroundY(paddyEndX, groundY) - 4);
      for (let x = paddyEndX; x <= maxX; x += 6) {
        const gy = GroundPlatform.getGroundY(x, groundY);
        let bladeH = 4 + Math.sin(x * 0.15) * 2 + ((Math.abs(x) * 7) % 3);
        if (x < paddyEndX + 40) {
          const fade = (x - paddyEndX) / 40;
          bladeH = bladeH * fade;
        }
        gCtx.lineTo(x + 3, gy - 6 - bladeH);
        gCtx.lineTo(x + 6, gy - 4);
      }
      gCtx.lineTo(maxX, GroundPlatform.getGroundY(maxX, groundY) + 4);
      gCtx.lineTo(paddyEndX, GroundPlatform.getGroundY(paddyEndX, groundY) + 4);
      gCtx.closePath();
      gCtx.fill();
    }

    this.groundCanvas = c;
  }
}
