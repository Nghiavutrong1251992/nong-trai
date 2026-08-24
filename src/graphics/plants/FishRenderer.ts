/**
 * FishRenderer.ts
 * Chuyên trách vẽ ĐỒ HỌA 6 LOÀI CÁ ĐỒNG QUÊ VIỆT NAM từ bộ ảnh gốc:
 * 1. 🎏 Cá Chép Vàng (ca_chep): Thân vàng óng, râu mép, vảy óng ánh
 * 2. 🐟 Cá Trê Đồng (ca_tre): Thân trơn dài, râu dài, đuôi uốn dẻo
 * 3. 🐟 Cá Rô Đồng / Rô Phi (ca_ro): Thân dẹp, vằn xám đen, vây lưng gai
 * 4. 🐟 Cá Mè / Cá Trôi Bạc (ca_me): Mình thon dài lướt nhanh, vảy ánh bạc
 * 5. 🐊 Cá Lóc / Cá Quả (ca_loc): Đầu rắn, thân hoa văn rằn ri, vây lưng dài
 * 6. 🐠 Cá Vàng Ba Đuôi (ca_vang): Thân cam đỏ rực rỡ, đuôi xòe lụa mềm mại
 */

import { AssetLoader } from '../../core/AssetLoader';

export type FishSpecies = 'ca_chep' | 'ca_tre' | 'ca_ro' | 'ca_me' | 'ca_loc' | 'ca_vang';

export interface FishRenderData {
  x: number;
  y: number;
  size: number;
  species: FishSpecies;
  swimPhase: number;
  facing: number; // 1: sang phải, -1: sang trái
}

export class FishRenderer {
  private static readonly SPRITE_PATHS: Record<FishSpecies, string> = {
    ca_chep: '/assets/props/fishes/ca_chep.png',
    ca_tre:  '/assets/props/fishes/ca_tre.png',
    ca_ro:   '/assets/props/fishes/ca_ro.png',
    ca_me:   '/assets/props/fishes/ca_me.png',
    ca_loc:  '/assets/props/fishes/ca_loc.png',
    ca_vang: '/assets/props/fishes/ca_vang.png',
  };

  /**
   * Vẽ một chú cá chi tiết bơi lội mềm mại dưới mặt nước
   */
  public static renderFish(ctx: CanvasRenderingContext2D, fish: FishRenderData, animTimer: number): void {
    const imgPath = this.SPRITE_PATHS[fish.species] || this.SPRITE_PATHS.ca_chep;
    const img = AssetLoader.getImage(imgPath);

    ctx.save();
    ctx.translate(fish.x, fish.y);

    const s = fish.size;
    const wag = Math.sin(fish.swimPhase);
    const pitch = Math.sin(fish.swimPhase * 0.8) * 0.08;

    // 1. BÓNG ĐỔ DƯỚI ĐÁY NƯỚC SÂU
    ctx.save();
    ctx.fillStyle = 'rgba(2, 24, 39, 0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 10, s * 0.55, s * 0.22, wag * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. HƯỚNG MẶT & ĐỘ NGHIÊNG BƠI
    // Ảnh gốc cá quay sang trái (đầu bên trái, đuôi bên phải)
    // Khi facing = 1 (bơi sang phải) -> lật ngang scale(-1, 1)
    if (fish.facing > 0) {
      ctx.scale(-1, 1);
    } else {
      ctx.scale(1, 1);
    }

    ctx.rotate(pitch);

    if (img && img.complete && img.naturalWidth > 0) {
      const aspect = img.naturalHeight / img.naturalWidth;
      const drawW = s;
      const drawH = s * aspect;

      // Hiệu ứng uốn lượn nhẹ khi bơi dưới nước
      ctx.save();
      const waveY = wag * 1.5;
      ctx.translate(0, waveY);

      // Vẽ thân cá từ sprite sheet
      ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);

      // Ánh sáng nước phản chiếu nhẹ trên thân cá
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.ellipse(-drawW * 0.1, -drawH * 0.1, drawW * 0.3, drawH * 0.25, 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    } else {
      // Fallback nếu ảnh đang nạp
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.45, s * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }
}
