/**
 * HouseFoundation.ts
 * Module Nền Móng Nhà 3 Gian Lắp Ghép Mô-Đun (Modular House Foundation):
 * - 🏛️ Bậc tam cấp đá khối, chân tảng đá hoa sen kê 6 cột trụ, sàn hiên ván tre/gỗ mộc mạc
 * - 🌾 Đặt tại phân đoạn đồng cỏ mở rộng phía Tây bên trái Ao Cá (x: -600m)
 * - 🚶 Nhân vật có thể bước lên bậc thềm, đứng trên sàn hiên ngắm cảnh
 * - ⚡ 60 FPS Viewport Culling tối ưu
 */

import { GroundPlatform } from '../plants/GroundPlatform';

export class HouseFoundation {
  // Tọa độ đặt nền móng tại phân đoạn đồng cỏ mới bên trái ao cá (x: -600m)
  public readonly x: number = -600;
  public readonly w: number = 520;
  public readonly h: number = 118;
  public readonly yOffset: number = 4; // Căn móng cắm sâu vào nền cỏ

  private image: HTMLImageElement = new Image();
  public isLoaded: boolean = false;

  constructor() {
    this.image.src = '/assets/environment/modular_house_foundation.png?v=' + Date.now();
    this.image.onload = () => {
      this.isLoaded = true;
    };
  }

  public render(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    _animTimer: number = 0,
    cameraX: number = 0,
    viewportW: number = 1400
  ): void {
    const minViewX = cameraX - 350;
    const maxViewX = cameraX + viewportW + 350;

    if (this.x + this.w / 2 < minViewX || this.x - this.w / 2 > maxViewX) {
      return;
    }

    if (!this.isLoaded || !this.image.complete || this.image.naturalWidth <= 0) {
      return;
    }

    const currentGroundY = GroundPlatform.getGroundY(this.x, groundY);
    const px = this.x;
    const py = currentGroundY;

    ctx.save();

    // 1. Bóng đổ tiếp đất 2D dưới chân khối móng đá
    const sRx = this.w * 0.48;
    const sRy = 10;
    const shadowGrad = ctx.createRadialGradient(px, py + 2, 8, px, py + 2, sRx);
    shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.48)');
    shadowGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.18)');
    shadowGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(px, py + 2, sRx, sRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Vẽ hình ảnh nền móng đá bậc tam cấp & sàn hiên gỗ
    ctx.drawImage(this.image, px - this.w / 2, py + this.yOffset - this.h, this.w, this.h);

    // 3. Biển tên công trình đang chuẩn bị xây
    const tagY = py - this.h - 18;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(px - 95, tagY, 190, 24, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏡 NỀN MÓNG NHÀ 3 GIAN (MÔ-ĐUN)', px, tagY + 16);

    ctx.restore();
  }
}
