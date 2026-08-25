/**
 * BambooGrove.ts
 * Module chuyên trách vẽ Đại Lũy Tre Làng 9 Phân Đoạn Trải Dài (800m -> 2600m):
 * - 🎋 Phân bố thành các cụm bụi tre làng đan xen so le nghệ thuật, thoáng đãng
 * - 🎍 Đầy đủ 7 biến thể dáng tre tùy biến (cao vút, cong trái, cong phải, cao vừa, dáng thấp, bụi xòe, khóm 3 thân)
 * - ⚡ Viewport Culling 60 FPS siêu nhẹ
 */

import { GroundPlatform } from './GroundPlatform';

export type BambooVariant =
  | 'tall_straight'
  | 'tall_curve_l'
  | 'tall_curve_r'
  | 'mid_tall'
  | 'short_tall'
  | 'bushy'
  | 'cluster_short';

export interface BambooInstance {
  x: number;
  variant: BambooVariant;
  scale: number;
  lean: number;
  isFlipped: boolean;
  phase: number;
  swaySens: number;
}

export class BambooGrove {
  private images: Partial<Record<BambooVariant, HTMLImageElement>> = {};
  public isLoaded: boolean = false;

  private variantSpecs: Record<BambooVariant, { baseW: number; baseH: number; yAnchorOffset: number }> = {
    tall_straight: { baseW: 98,  baseH: 490, yAnchorOffset: 2 },
    tall_curve_l:  { baseW: 110, baseH: 485, yAnchorOffset: 2 },
    tall_curve_r:  { baseW: 110, baseH: 485, yAnchorOffset: 2 },
    mid_tall:      { baseW: 95,  baseH: 375, yAnchorOffset: 2 },
    short_tall:    { baseW: 88,  baseH: 270, yAnchorOffset: 2 },
    bushy:         { baseW: 165, baseH: 320, yAnchorOffset: 2 },
    cluster_short: { baseW: 125, baseH: 240, yAnchorOffset: 2 }
  };

  public instances: BambooInstance[] = [];

  constructor() {
    this.initBambooInstances();
    this.loadBambooSprites();
  }

  /**
   * Bố cục Đại Lũy Tre Làng 9 Phân Đoạn (x: 800m -> 2600m) theo các cụm bụi đan xen so le
   */
  private initBambooInstances(): void {
    this.instances = [];

    // Tạo các cụm bụi tre tự nhiên dọc theo đường làng (Đoạn 5 -> Đoạn 9: 800m -> 1700m)
    // Toàn bộ Đoạn 11 -> Đoạn 15 hoàn toàn sạch bóng tre để không gian làng quê và ngôi nhà thoáng đãng
    const clusterCenters = [
      860, 1060, 1260, 1460, 1660
    ];


    clusterCenters.forEach((cx, cIdx) => {
      // Mỗi cụm bụi gồm 4 - 6 cây/khóm đan xen đa tầng:
      // 1. Tre cao hậu cảnh vươn lên
      this.instances.push({
        x: cx - 45 + (Math.sin(cIdx * 1.3) * 10),
        variant: cIdx % 2 === 0 ? 'tall_curve_l' : 'tall_curve_r',
        scale: 0.96 + ((cIdx % 3) * 0.05),
        lean: cIdx % 2 === 0 ? -0.03 : 0.03,
        isFlipped: cIdx % 2 === 1,
        phase: (cIdx * 0.4) % (Math.PI * 2),
        swaySens: 1.15
      });

      this.instances.push({
        x: cx + 35 + (Math.cos(cIdx * 1.7) * 10),
        variant: 'tall_straight',
        scale: 1.02 + ((cIdx % 2) * 0.06),
        lean: 0.00,
        isFlipped: cIdx % 2 === 0,
        phase: (cIdx * 0.4 + 0.8) % (Math.PI * 2),
        swaySens: 1.20
      });

      // 2. Tre trung cảnh (Dáng vừa & Bụi xòe)
      this.instances.push({
        x: cx - 15 + (Math.sin(cIdx * 2.1) * 8),
        variant: cIdx % 2 === 0 ? 'bushy' : 'mid_tall',
        scale: 0.94 + ((cIdx % 3) * 0.04),
        lean: cIdx % 2 === 0 ? 0.02 : -0.02,
        isFlipped: cIdx % 3 === 0,
        phase: (cIdx * 0.4 + 1.4) % (Math.PI * 2),
        swaySens: 0.90
      });

      this.instances.push({
        x: cx + 55 + (Math.cos(cIdx * 2.5) * 8),
        variant: cIdx % 2 === 0 ? 'mid_tall' : 'bushy',
        scale: 0.90 + ((cIdx % 2) * 0.05),
        lean: 0.03,
        isFlipped: cIdx % 2 === 1,
        phase: (cIdx * 0.4 + 1.9) % (Math.PI * 2),
        swaySens: 0.85
      });

      // 3. Tiền cảnh (Khóm thấp 3 thân & Tre tơ)
      this.instances.push({
        x: cx - 25,
        variant: 'cluster_short',
        scale: 0.90 + ((cIdx % 2) * 0.06),
        lean: -0.02,
        isFlipped: cIdx % 2 === 0,
        phase: (cIdx * 0.4 + 2.3) % (Math.PI * 2),
        swaySens: 0.65
      });

      this.instances.push({
        x: cx + 20,
        variant: 'short_tall',
        scale: 0.88 + ((cIdx % 3) * 0.04),
        lean: 0.02,
        isFlipped: cIdx % 2 === 1,
        phase: (cIdx * 0.4 + 2.7) % (Math.PI * 2),
        swaySens: 0.70
      });

      // Cây đứng lẻ tự nhiên ở khoảng nối giữa 2 cụm
      if (cIdx < clusterCenters.length - 1) {
        const midX = (cx + clusterCenters[cIdx + 1]) / 2;
        this.instances.push({
          x: midX + (Math.sin(cIdx * 3.1) * 15),
          variant: cIdx % 2 === 0 ? 'tall_curve_r' : 'short_tall',
          scale: 0.88 + ((cIdx % 2) * 0.08),
          lean: cIdx % 2 === 0 ? 0.04 : -0.03,
          isFlipped: cIdx % 2 === 0,
          phase: (cIdx * 0.5 + 0.3) % (Math.PI * 2),
          swaySens: 1.05
        });
      }
    });

    // Sắp xếp lại theo trục X để render mượt mà
    this.instances.sort((a, b) => a.x - b.x);
  }

  private loadBambooSprites(): void {
    const v = Date.now();
    const files: Record<BambooVariant, string> = {
      tall_straight: `/assets/props/bamboo/bamboo_var_tall.png?v=${v}`,
      tall_curve_l:  `/assets/props/bamboo/bamboo_var_curve_left.png?v=${v}`,
      tall_curve_r:  `/assets/props/bamboo/bamboo_var_curve_right.png?v=${v}`,
      mid_tall:      `/assets/props/bamboo/bamboo_var_mid.png?v=${v}`,
      short_tall:    `/assets/props/bamboo/bamboo_var_short.png?v=${v}`,
      bushy:         `/assets/props/bamboo/bamboo2_bushy.png?v=${v}`,
      cluster_short: `/assets/props/bamboo/bamboo2_short.png?v=${v}`
    };

    let loadedCount = 0;
    const total = Object.keys(files).length;

    Object.entries(files).forEach(([variantKey, src]) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        loadedCount++;
        if (loadedCount >= total) {
          this.isLoaded = true;
        }
      };
      this.images[variantKey as BambooVariant] = img;
    });
  }

  /**
   * Render Rặng Tre Làng với Viewport Culling 60 FPS
   */
  public render(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    animTimer: number,
    cameraX: number = 0,
    viewportW: number = 1400,
    playerX?: number
  ): void {
    const minViewX = cameraX - 140;
    const maxViewX = cameraX + viewportW + 140;

    for (let i = 0; i < this.instances.length; i++) {
      const inst = this.instances[i];
      if (inst.x < minViewX || inst.x > maxViewX) continue;

      const img = this.images[inst.variant];
      if (!img || !img.complete || img.naturalWidth <= 0) continue;

      const spec = this.variantSpecs[inst.variant];
      const currentGroundY = GroundPlatform.getGroundY(inst.x, groundY);

      const sway = Math.sin(animTimer * 1.5 + inst.phase) * 0.022 * inst.swaySens;

      ctx.save();
      ctx.translate(inst.x, currentGroundY + spec.yAnchorOffset);
      ctx.rotate(sway + inst.lean);

      if (inst.isFlipped) {
        ctx.scale(-1, 1);
      }

      const w = spec.baseW * inst.scale;
      const h = spec.baseH * inst.scale;

      ctx.drawImage(img, -w / 2, -h + 2, w, h);

      ctx.restore();
    }
  }
}
