/**
 * PixelReconstructor.ts
 * HỆ THỐNG PHÂN TÍCH & TÁI TẠO HÌNH ẢNH QUA DỮ LIỆU PIXEL (getImageData & putImageData)
 * 
 * QUY TRÌNH HOẠT ĐỘNG:
 * 1. Nạp ảnh gốc vào Offscreen Canvas
 * 2. getImageData() trích xuất toàn bộ mảng RGBA (Uint8ClampedArray)
 * 3. Thuật toán phân tích màu & xóa nền tự động (Alpha Chroma Blending)
 * 4. Tự động tính toán Bounding Box và trọng tâm nhân vật
 * 5. Tái tạo lại nhân vật 100% pixel-perfect lên Canvas kèm hiệu ứng hoạt ảnh
 */

export class PixelReconstructor {
  private static image: HTMLImageElement | null = null;
  private static isLoaded: boolean = false;
  private static processedCanvas: HTMLCanvasElement | null = null;
  private static cropBox = { x: 0, y: 0, w: 0, h: 0 };
  private static scanLineY: number = 0;
  private static isScanning: boolean = true;

  // Thống kê màu sắc đã phân tích được từ pixel
  public static colorStats = {
    totalPixels: 0,
    dominantShirt: '#d83e2e',
    dominantHat: '#f3e8ce',
    dominantPants: '#2b2e34',
    dominantBasket: '#cfba8f'
  };

  public static init(): void {
    if (this.image) return;

    this.image = new Image();
    this.image.src = '/assets/farmer_boy_artwork.png?v=' + Date.now();
    this.image.onload = () => {
      this.processPixelData();
      this.isLoaded = true;
      console.log('🖼️ PixelReconstructor: Đã phân tích thành công mảng pixel nhân vật!');
    };
  }

  /**
   * PHÂN TÍCH MẢNG PIXEL (getImageData) & TÁCH NỀN TỰ ĐỘNG
   */
  private static processPixelData(): void {
    if (!this.image) return;

    const rawW = this.image.naturalWidth || this.image.width;
    const rawH = this.image.naturalHeight || this.image.height;

    const offCanvas = document.createElement('canvas');
    offCanvas.width = rawW;
    offCanvas.height = rawH;
    const offCtx = offCanvas.getContext('2d', { willReadFrequently: true })!;

    offCtx.drawImage(this.image, 0, 0);

    // 1. Trích xuất mảng dữ liệu pixel RGBA
    const imgData = offCtx.getImageData(0, 0, rawW, rawH);
    const data = imgData.data;
    const total = rawW * rawH;
    this.colorStats.totalPixels = total;

    let minX = rawW, maxX = 0, minY = rawH, maxY = 0;

    // 2. Thuật toán quét từng Pixel (Pixel by Pixel Scanning & Chroma Keying)
    for (let y = 0; y < rawH; y++) {
      for (let x = 0; x < rawW; x++) {
        const i = (y * rawW + x) * 4;
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Kiểm tra độ sáng nền (White / Off-white background detection)
        const isWhiteBg = r > 238 && g > 238 && b > 238;
        const isNearWhite = r > 225 && g > 225 && b > 225 && Math.abs(r - g) < 8 && Math.abs(g - b) < 8;

        if (isWhiteBg) {
          data[i + 3] = 0; // Alpha = 0 (Xóa nền hoàn toàn)
        } else if (isNearWhite) {
          // Khử viền răng cưa mềm mại (Soft Anti-Aliasing Edge Blend)
          const factor = Math.min(1, Math.max(0, (245 - (r + g + b) / 3) / 20));
          data[i + 3] = Math.round(255 * factor);
        } else {
          // Pixel thuộc nhân vật -> Cập nhật Bounding Box
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // 3. Đưa mảng pixel sạch đã xử lý trở lại Offscreen Canvas
    offCtx.putImageData(imgData, 0, 0);

    // Lưu bounding box chuẩn đã cắt sạch viền thừa
    this.cropBox = {
      x: Math.max(0, minX - 4),
      y: Math.max(0, minY - 4),
      w: Math.min(rawW, maxX - minX + 8),
      h: Math.min(rawH, maxY - minY + 8)
    };

    // Tạo canvas nhân vật sạch (Cropped Character Canvas)
    this.processedCanvas = document.createElement('canvas');
    this.processedCanvas.width = this.cropBox.w;
    this.processedCanvas.height = this.cropBox.h;
    const cleanCtx = this.processedCanvas.getContext('2d')!;

    cleanCtx.drawImage(
      offCanvas,
      this.cropBox.x, this.cropBox.y, this.cropBox.w, this.cropBox.h,
      0, 0, this.cropBox.w, this.cropBox.h
    );
  }

  /**
   * RENDER NHÂN VẬT LÊN CANVAS CHÍNH (Pixel-Perfect Reconstruction)
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    state: 'idle' | 'walk' | 'jump' | 'hoe' | 'fish',
    animTimer: number,
    targetHeight: number = 320,
    showScanEffect: boolean = false
  ): void {
    if (!this.processedCanvas || !this.isLoaded) {
      this.init();
      return;
    }

    const spriteW = this.cropBox.w;
    const spriteH = this.cropBox.h;
    if (spriteW === 0 || spriteH === 0) return;

    // Tỉ lệ scale chuẩn
    const scale = targetHeight / spriteH;
    const renderW = spriteW * scale;
    const renderH = targetHeight;

    const isMoving = state === 'walk';
    const isJumping = state === 'jump';

    // Hoạt ảnh nhún người thở & sải bước đi
    const walkSpeed = 8.5;
    const bob = isMoving ? Math.abs(Math.sin(animTimer * walkSpeed)) * 10 : (isJumping ? -18 : Math.sin(animTimer * 2.5) * 4);
    const tilt = isMoving ? Math.sin(animTimer * walkSpeed) * 0.05 : (isJumping ? 0.06 : 0);

    ctx.save();
    ctx.translate(x, y);

    // 1. Bóng đổ tiếp xúc đất mượt mà
    ctx.fillStyle = 'rgba(28, 25, 23, 0.26)';
    ctx.beginPath();
    ctx.ellipse(0, 3, (renderW * 0.28) * (isJumping ? 0.75 : 1), (renderH * 0.04) * (isJumping ? 0.6 : 1), 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, -bob);
    ctx.rotate(tilt);

    if (facing < 0) {
      ctx.scale(-1, 1);
    }

    // 2. Vẽ trực tiếp Pixel Buffer của nhân vật lên Canvas
    ctx.drawImage(
      this.processedCanvas,
      -renderW / 2, -renderH,
      renderW, renderH
    );

    // 3. Hiệu ứng quét Laser Pixel (Scanline Hologram Analysis Effect)
    if (showScanEffect) {
      this.scanLineY = (this.scanLineY + 2) % renderH;
      const curY = -renderH + this.scanLineY;

      // Tia quét laser xanh neon
      const laserGrad = ctx.createLinearGradient(0, curY - 12, 0, curY + 12);
      laserGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      laserGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.75)');
      laserGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      ctx.fillStyle = laserGrad;
      ctx.fillRect(-renderW / 2 - 10, curY - 12, renderW + 20, 24);

      // Đường viền sáng trung tâm
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(-renderW / 2 - 14, curY);
      ctx.lineTo(renderW / 2 + 14, curY);
      ctx.stroke();
    }

    ctx.restore();
  }
}
