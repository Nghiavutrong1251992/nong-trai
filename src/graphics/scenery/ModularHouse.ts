/**
 * ModularHouse.ts
 * Module Quản Lý Xây Dựng Ngôi Nhà Tranh Làng Quê Tuyệt Đẹp (Chuẩn 100% Phong Cách Gốc):
 * - 🌾 Sử dụng 100% lớp vẽ nghệ thuật nguyên bản từ thatched_cottage.png
 * - 📐 Khớp chính xác tuyệt đối từng pixel (Full-canvas Shared Coordinate System)
 * - 🔨 5 Bước xây dựng tuần tự:
 *   + Bước 1: Nền Móng Đất Nện & Sàn Hiên Tre (01_foundation_deck.png)
 *   + Bước 2: Khung Cột Tre & Vách Nứa 3 Gian (02_walls_framework.png)
 *   + Bước 3: Cánh Cửa Gỗ Mở 2 Bên & Gian Nhà Trong (03_doors_interior.png)
 *   + Bước 4: Lợp Mái Rơm Rạ Vàng Óng Ả (04_thatched_roof.png) - Nhà kín mưa nắng!
 *   + Bước 5: Ngoại Thất Chum Nước Sành & Bụi Chuối Quả Vàng (05_props_and_banana.png) - Hoàn thiện 100%!
 * - 🎮 Phím Tắt [G]: Xây từng bước / Tháo dỡ trải nghiệm lại từ đầu
 */

import { GroundPlatform } from '../plants/GroundPlatform';
import { AssetLoader } from '../../core/AssetLoader';

export interface CottageStep {
  name: string;
  desc: string;
}

export class ModularHouse {
  // Tọa độ đặt nhà tranh tại Đoạn 0C bên trái ao cá (x: -600m)
  public readonly x: number = -600;
  public readonly w: number = 460;
  public readonly h: number = 253;
  public readonly yOffset: number = 4;

  // Số lượng công đoạn đã xây (Khởi đầu = 0: Bãi cỏ trống bắt đầu đắp móng)
  public stepCount: number = 0;
  public readonly maxSteps: number = 5;

  public readonly steps: CottageStep[] = [
    { name: 'Nền Móng & Sàn Hiên Tre', desc: 'Đắp nền đất nện, bậc thềm đá và mặt sàn tre mộc mạc' },
    { name: 'Khung Cột & Vách Nứa 3 Gian', desc: 'Dựng cột tre già, đan phên vách nứa và cửa sổ chấn song tre' },
    { name: 'Cánh Cửa Gỗ & Gian Trong', desc: 'Lắp cặp cánh cửa gỗ mở rộng đón gió gian chính diện' },
    { name: 'Mái Tranh Rạ Vàng Óng Ả', desc: 'Lợp lớp rơm rạ vàng óng ả dày dặn che kín mưa nắng' },
    { name: 'Ngoại Thất Chum Sành & Bụi Chuối', desc: 'Đặt chum nước gốm sành & trồng bụi chuối vàng hoàn thiện 100%!' }
  ];

  // 5 Lớp Vẽ Liền Mạch (1391 x 766)
  private layerImgs: HTMLImageElement[] = [];

  constructor() {
    const paths = [
      '/assets/environment/cottage_seamless/01_foundation_deck.png',
      '/assets/environment/cottage_seamless/02_walls_framework.png',
      '/assets/environment/cottage_seamless/03_doors_interior.png',
      '/assets/environment/cottage_seamless/04_thatched_roof.png',
      '/assets/environment/cottage_seamless/05_props_and_banana.png'
    ];

    this.layerImgs = paths.map(p => AssetLoader.getImage(p));
  }

  /**
   * Tiến hành xây tiếp 1 công đoạn khi bấm phím [G]
   */
  public assembleNextPiece(): { success: boolean; msg: string; current: number; total: number } {
    if (this.stepCount < this.maxSteps) {
      this.stepCount++;
      const current = this.steps[this.stepCount - 1];
      return {
        success: true,
        msg: `🔨 [${this.stepCount}/${this.maxSteps}] Đã xây: ${current.name} (${current.desc})`,
        current: this.stepCount,
        total: this.maxSteps
      };
    } else {
      // Khi đã hoàn thiện 5/5, nhấn G lần nữa sẽ tháo dỡ để trải nghiệm xây lại từ đầu
      this.stepCount = 0;
      return {
        success: true,
        msg: `🔄 Đã dọn sạch công trình về bãi cỏ ban đầu! Nhấn [G] để bắt đầu đắp nền móng.`,
        current: 0,
        total: this.maxSteps
      };
    }
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

    const currentGroundY = GroundPlatform.getGroundY(this.x, groundY);
    const px = this.x;
    const py = currentGroundY;

    ctx.save();

    // 1. Bóng đổ tiếp đất khi đã bắt đầu xây (Từ Bước 1 trở đi)
    if (this.stepCount >= 1) {
      const sRx = this.w * 0.48;
      const sRy = 9;
      const shadowGrad = ctx.createRadialGradient(px, py + 2, 8, px, py + 2, sRx);
      shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
      shadowGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.16)');
      shadowGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(px, py + 2, sRx, sRy, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Vẽ Từng Lớp Cấu Kiện Liền Mạch 100%
    if (this.stepCount <= 0) {
      // Khi chưa xây: 4 cọc tre định vị ranh giới móng
      ctx.fillStyle = '#a16207';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1;
      const offsets = [-this.w * 0.44, -this.w * 0.15, this.w * 0.15, this.w * 0.44];
      offsets.forEach(rx => {
        ctx.fillRect(px + rx - 2, py - 18, 4, 18);
        ctx.strokeRect(px + rx - 2, py - 18, 4, 18);
      });
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.75)';
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(px - this.w * 0.44, py - 11);
      ctx.lineTo(px + this.w * 0.44, py - 11);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const drawX = px - this.w / 2;
      const drawY = py + this.yOffset - this.h;

      // Vẽ tuần tự các lớp đã xây dựng chồng khít 100%
      for (let i = 0; i < this.stepCount; i++) {
        const img = this.layerImgs[i];
        if (img && img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, drawX, drawY, this.w, this.h);
        }
      }
    }

    // 3. Bảng Hiển Thị Tiến Độ & Hướng Dẫn Phím [G]
    const badgeY = py - (this.stepCount >= 4 ? this.h + 18 : 80);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(px - 150, badgeY, 300, 26, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';

    const percent = Math.round((this.stepCount / this.maxSteps) * 100);
    if (this.stepCount === 0) {
      ctx.fillText(`🌾 KHU ĐẤT DỰNG NHÀ TRANH [0/5] - Ấn [G] Đắp Móng`, px, badgeY + 17);
    } else if (this.stepCount < 4) {
      ctx.fillText(`🔨 XÂY PHẦN THÔ [${this.stepCount}/${this.maxSteps}] (${percent}%) - Ấn [G] Xây Tiếp`, px, badgeY + 17);
    } else if (this.stepCount < this.maxSteps) {
      ctx.fillText(`🌾 LỢP MÁI HOÀN TẤT [4/5] (80%) - Ấn [G] Tiếp`, px, badgeY + 17);
    } else {
      ctx.fillText(`✨ NHÀ TRANH HOÀN THIỆN [5/5] (100%) - [G] Xây Lại`, px, badgeY + 17);
    }

    ctx.restore();
  }
}
