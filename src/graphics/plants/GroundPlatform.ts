/**
 * GroundPlatform.ts
 * Module vẽ Địa Hình & Nền Cỏ Bờ Đê Bản Đồ Mở Rộng 4200m (Thêm 7 Phân Đoạn Lũy Tre):
 * - x: -500m -> 800m: Đồng bằng thấp & Vùng Ao Cá
 * - x: 800m -> 2600m: Đại Lũy Tre Làng 9 Phân Đoạn (800m -> 2600m)
 * - x: 2600m -> 3200m: Sườn đồi cỏ & Mô đất cao
 * - x: 3200m -> 4000m: Ruộng Lúa Nước 4 Giai Đoạn (4 Phân Đoạn)
 * - x: 4000m -> 4200m: Bờ Đê Cuối Cánh Đồng
 */

export class GroundPlatform {
  private groundCanvas: HTMLCanvasElement | null = null;
  private cachedW: number = 0;
  private cachedH: number = 0;
  private cachedGroundY: number = 0;

  public static getGroundY(x: number, baseGroundY: number): number {
    if (x <= 2600) {
      // 1. Đồng bằng thấp, Vùng Ao Cá & Đại Lũy Tre Làng 9 Phân Đoạn (x: -500m -> 2600m)
      return baseGroundY;
    } else if (x <= 2800) {
      // 2. Dốc lên mô đất / đồi cỏ xanh thoai thoải (2600m -> 2800m)
      const p = (x - 2600) / 200;
      const s = p * p * (3 - 2 * p);
      return baseGroundY - s * 65;
    } else if (x <= 3000) {
      // 3. Đỉnh mô đất / đồi cỏ xanh cao ráo (2800m -> 3000m)
      return baseGroundY - 65;
    } else if (x <= 3200) {
      // 4. Sườn dốc thoai thoải dẫn xuống ruộng lúa (3000m -> 3200m)
      const p = (x - 3000) / 200;
      const s = p * p * (3 - 2 * p);
      return (baseGroundY - 65) + s * 69;
    } else if (x <= 4000) {
      // 5. Thửa ruộng lúa nước 4 đoạn (3200m -> 4000m)
      return baseGroundY + 4;
    } else if (x <= 4080) {
      // 6. Bờ đê thoải lên cuối thửa ruộng (4000m -> 4080m)
      const p = (x - 4000) / 80;
      const s = p * p * (3 - 2 * p);
      return (baseGroundY + 4) - s * 4;
    } else {
      // 7. Bờ cỏ cuối cánh đồng (4080m -> 4200m)
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

    const minX = -500;
    const maxX = 4200;
    const bufferW = maxX - minX;
    const bufferH = height;

    if (!this.groundCanvas) {
      this.groundCanvas = document.createElement('canvas');
    }
    this.groundCanvas.width = bufferW;
    this.groundCanvas.height = bufferH;

    const bCtx = this.groundCanvas.getContext('2d');
    if (!bCtx) return;

    bCtx.save();
    bCtx.translate(-minX, 0);

    // ============================================================
    // 1. TẠO ĐƯỜNG BIÊN ĐỊA HÌNH (TERRAIN POLYGON PATH)
    // ============================================================
    bCtx.beginPath();
    bCtx.moveTo(minX, height);
    bCtx.lineTo(minX, GroundPlatform.getGroundY(minX, groundY));

    for (let x = minX; x <= maxX; x += 6) {
      bCtx.lineTo(x, GroundPlatform.getGroundY(x, groundY));
    }

    bCtx.lineTo(maxX, height);
    bCtx.closePath();

    // Clip để toàn bộ dải màu & hạt cỏ chỉ nằm trong lòng bờ đê / sườn đồi
    bCtx.save();
    bCtx.clip();

    // ============================================================
    // 2. CHUYỂN SẮC XANH CỎ CÂY MÀU NƯỚC SIÊU MƯỢT (LUSH GREEN GRADIENT)
    // ============================================================
    const greenGrad = bCtx.createLinearGradient(0, groundY - 70, 0, height);
    greenGrad.addColorStop(0.00, '#6ee7b7'); // Xanh nõn chuối tươi sáng ở đỉnh
    greenGrad.addColorStop(0.08, '#4ade80'); // Xanh cỏ non
    greenGrad.addColorStop(0.24, '#22c55e'); // Xanh đồng cỏ mượt mà
    greenGrad.addColorStop(0.46, '#16a34a'); // Xanh ngọc lục bảo
    greenGrad.addColorStop(0.70, '#15803d'); // Xanh rừng rêu
    greenGrad.addColorStop(0.88, '#14532d'); // Xanh lá đậm
    greenGrad.addColorStop(1.00, '#052e16'); // Đáy đồi sâu thẳm
    bCtx.fillStyle = greenGrad;
    bCtx.fillRect(minX, 0, bufferW, bufferH);

    // ============================================================
    // 3. VỆT LOANG MÀU NƯỚC XANH MỘC MẠC (ORGANIC WATERCOLOR WASHES)
    // ============================================================
    for (let x = minX + 40; x <= maxX - 40; x += 75) {
      const gY = GroundPlatform.getGroundY(x, groundY);
      const radY = gY + 25 + (Math.abs(x * 7) % 65);
      const radR = 40 + (Math.abs(x * 13) % 45);

      const radGrad = bCtx.createRadialGradient(x, radY, 4, x, radY, radR);
      radGrad.addColorStop(0, 'rgba(134, 239, 172, 0.15)'); // Vạt nắng xanh non
      radGrad.addColorStop(0.6, 'rgba(21, 128, 61, 0.08)');
      radGrad.addColorStop(1, 'rgba(0, 0, 0, 0.0)');

      bCtx.fillStyle = radGrad;
      bCtx.beginPath();
      bCtx.arc(x, radY, radR, 0, Math.PI * 2);
      bCtx.fill();
    }

    // ============================================================
    // 4. TẠO ĐỘ SẠN & VÂN HẠT CỎ NHẠT MỊN, SIÊU DÀY ĐẶC (FINE VELVETY STIPPLING)
    // ============================================================
    const grainColors = [
      'rgba(187, 247, 208, 0.16)', // Hạt xanh non dịu nhẹ
      'rgba(134, 239, 172, 0.14)', // Hạt xanh cỏ tươi
      'rgba(74, 222, 128, 0.15)',  // Hạt xanh ngọc mướt
      'rgba(21, 128, 61, 0.12)',   // Hạt xanh đậm trầm
      'rgba(20, 83, 45, 0.14)',    // Hạt rêu mềm
      'rgba(254, 240, 138, 0.10)'  // Hạt vàng nắng li ti mờ
    ];

    bCtx.lineWidth = 0.8;
    bCtx.lineCap = 'round';

    for (let x = minX + 5; x <= maxX - 5; x += 1.8) {
      const gY = GroundPlatform.getGroundY(x, groundY);
      for (let yOffset = 3; yOffset < 220; yOffset += 2.2 + ((Math.abs(x * 3 + yOffset) % 3) * 0.4)) {
        const py = gY + yOffset + ((Math.abs(x * 11 + yOffset * 7) % 3) - 1);
        const colIdx = Math.abs(Math.floor(x * 5 + yOffset * 7)) % grainColors.length;
        bCtx.fillStyle = grainColors[colIdx];
        bCtx.strokeStyle = grainColors[colIdx];

        const grainType = (Math.abs(Math.floor(x * 3 + yOffset)) % 3);
        if (grainType === 0) {
          const r = 0.5 + ((Math.abs(x * 3 + yOffset) % 5) * 0.08);
          bCtx.beginPath();
          bCtx.arc(x, py, r, 0, Math.PI * 2);
          bCtx.fill();
        } else if (grainType === 1) {
          const len = 1.5 + (Math.abs(x * 2) % 1.2);
          const lean = ((Math.abs(x * 7 + yOffset) % 4) - 2) * 0.25;
          bCtx.beginPath();
          bCtx.moveTo(x, py);
          bCtx.lineTo(x + lean, py - len);
          bCtx.stroke();
        } else {
          const r = 0.55;
          bCtx.beginPath();
          bCtx.arc(x - 0.4, py, r, 0, Math.PI * 2);
          bCtx.arc(x + 0.4, py, r, 0, Math.PI * 2);
          bCtx.fill();
        }
      }
    }

    // ============================================================
    // 5. ĐƯỜNG VIỀN MỰC XANH RÊU MẢNH TRÊN MẶT ĐẤT
    // ============================================================
    bCtx.strokeStyle = 'rgba(20, 83, 45, 0.55)';
    bCtx.lineWidth = 1.5;
    bCtx.beginPath();
    for (let x = minX; x <= maxX; x += 6) {
      const y = GroundPlatform.getGroundY(x, groundY) + 1;
      if (x === minX) bCtx.moveTo(x, y);
      else bCtx.lineTo(x, y);
    }
    bCtx.stroke();

    bCtx.restore();
    bCtx.restore();
  }
}
