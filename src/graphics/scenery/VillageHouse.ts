/**
 * VillageHouse.ts
 * Module hiển thị Ngôi Nhà Tranh Vách Nứa Làng Quê Việt Nam Cổ Truyền:
 * - 🏠 Nhà tranh mái rạ, vách nứa, hiên tre mộc mạc
 * - 🏺 Chum nước gốm sành, thúng tre, bậc đá, hàng rào tre và bụi chuối xanh
 * - Nạp và render ảnh vẽ tay nghệ thuật độ phân giải cao
 */

import { GroundPlatform } from '../plants/GroundPlatform';

export class VillageHouse {
  // Tọa độ trung tâm ngôi nhà tại Đoạn 12 - 13 (x: 2380m)
  public readonly houseX = 2380;
  public readonly houseW = 530;
  public readonly houseH = 292;

  private image: HTMLImageElement = new Image();
  private isLoaded: boolean = false;

  constructor() {
    this.image.src = '/assets/environment/thatched_cottage.png?v=' + Date.now();
    this.image.onload = () => {
      this.isLoaded = true;
    };
  }

  public update(_dt: number, _groundY: number = 480): void {
    // Logic nhà tĩnh
  }

  /**
   * Render Ngôi Nhà Tranh Vách Nứa
   */
  public render(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    _animTimer: number,
    cameraX: number = 0,
    viewportW: number = 1400
  ): void {
    const minViewX = cameraX - 400;
    const maxViewX = cameraX + viewportW + 400;

    // Viewport Culling
    if (this.houseX + this.houseW / 2 < minViewX || this.houseX - this.houseW / 2 > maxViewX) {
      return;
    }

    const currentGroundY = GroundPlatform.getGroundY(this.houseX, groundY);
    const hX = this.houseX;
    const hY = currentGroundY;

    ctx.save();

    // 1. Bóng đổ nền mềm mại dưới chân nhà, hàng rào & chum nước
    const shadowGrad = ctx.createRadialGradient(hX, hY + 2, 40, hX, hY + 2, this.houseW * 0.52);
    shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
    shadowGrad.addColorStop(0.65, 'rgba(15, 23, 42, 0.2)');
    shadowGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(hX, hY + 3, this.houseW * 0.52, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Vẽ Bức Tranh Ngôi Nhà Tranh Vách Nứa
    if (this.isLoaded && this.image.complete) {
      const renderX = hX - this.houseW / 2;
      const renderY = hY - this.houseH + 12; // Căn chỉnh chân cột và bậc đá khớp mặt đất
      ctx.drawImage(this.image, renderX, renderY, this.houseW, this.houseH);
    }

    ctx.restore();
  }
}
