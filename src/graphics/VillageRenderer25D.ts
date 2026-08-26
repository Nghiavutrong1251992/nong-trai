/**
 * VillageRenderer25D.ts
 * Renderer chính cho Bản Đồ Làng Quê 2.5D:
 * - Tất cả dùng ẢNH VẼ (PNG) — không dùng gradient code
 * - Lớp 1: Nền đất sân làng (ảnh texture)
 * - Lớp 2: Bờ sông chuyển tiếp
 * - Lớp 3: Mặt sông nước (ảnh texture + animation gợn sóng)
 * - Lớp 4: Nhà cửa, cây cối, giếng nước (PNG images depth-sorted)
 * - Lớp 5: Nhân vật & thú nuôi (xen giữa các lớp theo Y)
 * - Lớp 6: Bụi cỏ tiền cảnh bờ sông
 */

import { VillageMap25D, DepthSortable } from '../world/VillageMap25D';
import {
  MAP_25D,
  WALKABLE_POLYGON,
  ANIMAL_OBSTACLES,
  AnimalObstacle,
  VILLAGE_SCENERY,
  SceneryItem,
  GROUND_TEXTURE_PATH,
  RIVER_TEXTURE_PATH,
  RIVERBANK_TEXTURE_PATH,
} from '../world/VillageMapData';
import { WORLD_UNIT, ASSET_METRICS, calculateAssetScale, pxToH } from '../world/WorldMetrics';
import { AssetLoader } from '../core/AssetLoader';

export interface YSortableEntity {
  feetY: number;
  render: (ctx: CanvasRenderingContext2D) => void;
}

interface RiverWave {
  x: number;
  phase: number;
  speed: number;
  amplitude: number;
}

interface LotusFloat {
  x: number;
  y: number;
  size: number;
  phase: number;
  type: 'flower' | 'leaf';
}

interface ShoreRipple {
  baseX: number;
  baseY: number;
  len: number;
  speed: number;
  phase: number;
  width: number;
  isHighlight: boolean;
}

interface ShoreReed {
  x: number;
  y: number;
  height: number;
  leanAngle: number;
  bladeCount: number;
}

interface RiverRockProp {
  x: number;
  y: number;
  w: number;
  h: number;
  flipX: boolean;
  scale?: number;
  submerged?: number;
}

interface RiverReedProp {
  x: number;
  y: number;
  w: number;
  h: number;
  flipX: boolean;
  swaySpeed: number;
  phase: number;
  scale?: number;
}

interface SubmergedPlant {
  x: number;
  y: number;
  w: number;
  h: number;
  type: string;
  swaySpeed: number;
  phase: number;
  opacity: number;
  scale: number;
}

interface SwimmingFish {
  x: number;
  y: number;
  baseY: number;
  speed: number;
  dir: 1 | -1;
  type: string;
  size: number;
  depth: 'shallow' | 'mid' | 'deep';
  opacity: number;
  tailSpeed: number;
  phase: number;
  minX: number;
  maxX: number;
}

interface WaterBubble {
  x: number;
  y: number;
  baseY: number;
  speed: number;
  size: number;
  phase: number;
  opacity: number;
}

interface SubmergedMossPatch {
  x: number;
  y: number;
  rx: number;
  ry: number;
  opacity: number;
}

// ============================================================
// RENDERER CLASS
// ============================================================

export class VillageRenderer25D {
  private map: VillageMap25D;

  // Ảnh texture
  private groundImg: HTMLImageElement = new Image();
  private riverImg: HTMLImageElement = new Image();
  private riverbankImg: HTMLImageElement = new Image();
  private groundLoaded = false;
  private riverLoaded = false;
  private riverbankLoaded = false;

  // Riverside Props (Cỏ & Đá bờ sông)
  private reedSprite: HTMLImageElement = new Image();
  private rockSprite: HTMLImageElement = new Image();
  private reedLoaded = false;
  private rockLoaded = false;
  private riverRocks: RiverRockProp[] = [];
  private riverReeds: RiverReedProp[] = [];

  // Underwater Assets (Cá & Rong rêu dưới nước)
  private fishImages: Map<string, HTMLImageElement> = new Map();
  private plantImages: Map<string, HTMLImageElement> = new Map();
  private submergedPlants: SubmergedPlant[] = [];
  private swimmingFishes: SwimmingFish[] = [];
  private waterBubbles: WaterBubble[] = [];
  private mossPatches: SubmergedMossPatch[] = [];

  // Masked Tile Canvas Buffers (Destination-in feather mask)
  private roadTileNormal: HTMLCanvasElement | null = null;
  private roadTileFaded: HTMLCanvasElement | null = null;
  private roadTileFadedFlipped: HTMLCanvasElement | null = null;

  private bankTileNormal: HTMLCanvasElement | null = null;
  private bankTileFaded: HTMLCanvasElement | null = null;
  private bankTileFadedFlipped: HTMLCanvasElement | null = null;

  // River animation
  private waves: RiverWave[] = [];
  private lotuses: LotusFloat[] = [];
  private shoreRipples: ShoreRipple[] = [];
  private shoreReeds: ShoreReed[] = [];
  private animTimer: number = 0;

  constructor(map: VillageMap25D) {
    this.map = map;
    this.loadTextures();
    this.initRiverDecor();
  }

  // ============================================================
  // ASSET LOADING & MASKED TILE BUFFER GENERATION
  // ============================================================

  private loadTextures(): void {
    this.groundImg.src = GROUND_TEXTURE_PATH;
    this.groundImg.onload = () => {
      this.groundLoaded = true;
      this.buildRoadBuffers();
    };

    this.riverImg.src = RIVER_TEXTURE_PATH;
    this.riverImg.onload = () => { this.riverLoaded = true; };

    this.riverbankImg.src = RIVERBANK_TEXTURE_PATH;
    this.riverbankImg.onload = () => {
      this.riverbankLoaded = true;
      this.buildBankBuffers();
    };

    this.reedSprite.src = '/assets/environment/village25d/props/river_reed_sprite.png';
    this.reedSprite.onload = () => { this.reedLoaded = true; };

    this.rockSprite.src = '/assets/environment/village25d/props/river_rock_sprite.png';
    this.rockSprite.onload = () => { this.rockLoaded = true; };

    // Load Fish Images
    const fishTypes = ['ca_chep', 'ca_loc', 'ca_me', 'ca_ro', 'ca_tre', 'ca_vang'];
    for (const f of fishTypes) {
      const img = new Image();
      img.src = `/assets/props/fishes/${f}.png`;
      this.fishImages.set(f, img);
    }

    // Load Water Plant Images
    const plantTypes = ['rong_duoi_chon', 'rong_la_dai', 'rong_diep', 'co_toc_nuoc', 'rong_xuong_ca', 'beo_tam'];
    for (const p of plantTypes) {
      const img = new Image();
      img.src = `/assets/props/water_plants/${p}.png`;
      this.plantImages.set(p, img);
    }
  }

  /**
   * Tạo Canvas buffer áp dụng mặt nạ gradient alpha mờ dần (destination-in feather mask)
   */
  private createFeatherMaskCanvas(
    img: HTMLImageElement,
    renderW: number,
    renderH: number,
    overlap: number,
    flipX: boolean = false,
    topFadeH: number = 0
  ): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = renderW;
    canvas.height = renderH;
    const ctx = canvas.getContext('2d')!;

    ctx.save();
    if (flipX) {
      ctx.translate(renderW, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(img, 0, 0, renderW, renderH);
    ctx.restore();

    // Dùng gradient làm mặt nạ alpha (destination-in feather mask)
    ctx.globalCompositeOperation = 'destination-in';

    // 1. Horizontal left-fade mask
    if (overlap > 0) {
      const mask = ctx.createLinearGradient(0, 0, renderW, 0);
      mask.addColorStop(0, 'rgba(0, 0, 0, 0)');
      mask.addColorStop(Math.min(1, overlap / renderW), 'rgba(0, 0, 0, 1)');
      mask.addColorStop(1, 'rgba(0, 0, 0, 1)');

      ctx.fillStyle = mask;
      ctx.fillRect(0, 0, renderW, renderH);
    }

    // 2. Vertical top-fade mask
    if (topFadeH > 0) {
      const maskY = ctx.createLinearGradient(0, 0, 0, renderH);
      maskY.addColorStop(0, 'rgba(0, 0, 0, 0)');
      maskY.addColorStop(Math.min(1, topFadeH / renderH), 'rgba(0, 0, 0, 1)');
      maskY.addColorStop(1, 'rgba(0, 0, 0, 1)');

      ctx.fillStyle = maskY;
      ctx.fillRect(0, 0, renderW, renderH);
    }

    return canvas;
  }

  private buildRoadBuffers(): void {
    if (!this.groundImg.complete || this.groundImg.naturalWidth <= 0) return;
    const roadH = 320;
    const aspect = this.groundImg.naturalWidth / this.groundImg.naturalHeight;
    const tileW = Math.round(roadH * aspect);
    const overlap = 100;
    const topFade = 8;

    this.roadTileNormal = this.createFeatherMaskCanvas(this.groundImg, tileW, roadH, 0, false, topFade);
    this.roadTileFaded = this.createFeatherMaskCanvas(this.groundImg, tileW, roadH, overlap, false, topFade);
    this.roadTileFadedFlipped = this.createFeatherMaskCanvas(this.groundImg, tileW, roadH, overlap, true, topFade);
  }

  private buildBankBuffers(): void {
    // Không dùng ảnh bờ sông riêng nữa - đã tích hợp chung vào unified terrain
  }

  private initRiverDecor(): void {
    // 1. Hoa sen & lá sen trôi trên sông (Nổi trên mặt nước, không bị nước phủ)
    const lotusDefs: Array<{ x: number; y: number; type: 'flower' | 'leaf' }> = [
      { x: 120, y: 688, type: 'leaf' },
      { x: 200, y: 725, type: 'leaf' },
      { x: 350, y: 755, type: 'flower' },
      { x: 440, y: 692, type: 'leaf' },
      { x: 500, y: 735, type: 'leaf' },
      { x: 650, y: 765, type: 'flower' },
      { x: 780, y: 690, type: 'flower' },
      { x: 850, y: 725, type: 'leaf' },
      { x: 1000, y: 750, type: 'flower' },
      { x: 1150, y: 740, type: 'leaf' },
      { x: 1260, y: 692, type: 'leaf' },
      { x: 1350, y: 760, type: 'leaf' },

      // Phân đoạn 2 (1600m -> 3200m)
      { x: 1680, y: 688, type: 'leaf' },
      { x: 1800, y: 725, type: 'leaf' },
      { x: 1950, y: 755, type: 'flower' },
      { x: 2050, y: 690, type: 'flower' },
      { x: 2100, y: 735, type: 'leaf' },
      { x: 2250, y: 765, type: 'flower' },
      { x: 2380, y: 690, type: 'leaf' },
      { x: 2450, y: 725, type: 'leaf' },
      { x: 2600, y: 750, type: 'flower' },
      { x: 2750, y: 740, type: 'leaf' },
      { x: 2880, y: 692, type: 'leaf' },
      { x: 2950, y: 760, type: 'leaf' },
    ];

    for (const d of lotusDefs) {
      this.lotuses.push({
        x: d.x,
        y: d.y,
        size: 12 + Math.random() * 10,
        phase: Math.random() * Math.PI * 2,
        type: d.type,
      });
    }

    // 2. Cụm đá bờ sông đa dạng (Scale 0.7 - 1.15, lật hướng, chìm nước, khoảng trống tự nhiên)
    this.riverRocks = [
      { x: 240, y: 673, w: 82, h: 35, flipX: false, scale: 1.12, submerged: 0 },
      { x: 620, y: 675, w: 82, h: 35, flipX: true, scale: 0.82, submerged: 3 },
      { x: 1050, y: 677, w: 82, h: 35, flipX: false, scale: 0.70, submerged: 6 },
      // Khoảng trống dài không có đá (1100 -> 1680px)
      { x: 1720, y: 673, w: 82, h: 35, flipX: true, scale: 1.15, submerged: 1 },
      { x: 2280, y: 676, w: 82, h: 35, flipX: false, scale: 0.88, submerged: 5 },
      // Khoảng trống dài không có đá (2350 -> 2820px)
      { x: 2860, y: 674, w: 82, h: 35, flipX: true, scale: 0.95, submerged: 2 },
    ];

    // 3. Cụm cỏ nến bờ sông bất đối xứng (Khoảng cách 250 - 700px, cụm đôi, scale 0.75 - 1.15)
    this.riverReeds = [
      // Cụm đôi 1
      { x: 180, y: 673, w: 42, h: 62, flipX: false, scale: 1.05, swaySpeed: 1.4, phase: 0.2 },
      { x: 215, y: 676, w: 42, h: 62, flipX: true, scale: 0.80, swaySpeed: 1.2, phase: 1.5 },
      // Cụm đơn
      { x: 560, y: 672, w: 42, h: 62, flipX: false, scale: 0.95, swaySpeed: 1.3, phase: 0.7 },
      // Khoảng trống dài ~600px
      { x: 1180, y: 674, w: 42, h: 62, flipX: false, scale: 1.10, swaySpeed: 1.5, phase: 2.8 },
      { x: 1420, y: 675, w: 42, h: 62, flipX: true, scale: 0.85, swaySpeed: 1.2, phase: 4.1 },
      // Cụm đôi 2
      { x: 1620, y: 673, w: 42, h: 62, flipX: false, scale: 1.00, swaySpeed: 1.4, phase: 1.9 },
      { x: 1660, y: 676, w: 42, h: 62, flipX: true, scale: 0.78, swaySpeed: 1.1, phase: 3.2 },
      // Cụm đơn
      { x: 2100, y: 672, w: 42, h: 62, flipX: false, scale: 0.92, swaySpeed: 1.3, phase: 0.4 },
      // Khoảng trống dài ~600px
      // Cụm đôi 3
      { x: 2740, y: 673, w: 42, h: 62, flipX: false, scale: 1.12, swaySpeed: 1.5, phase: 1.8 },
      { x: 2780, y: 676, w: 42, h: 62, flipX: true, scale: 0.82, swaySpeed: 1.2, phase: 4.6 },
      // Cụm đơn cuối
      { x: 3080, y: 674, w: 42, h: 62, flipX: true, scale: 0.95, swaySpeed: 1.3, phase: 3.0 },
    ];

    // 4. Mảng rêu chìm đáy sông (Submerged Moss Patches - màu xanh tối, mềm mại)
    this.mossPatches = [
      { x: 280, y: 760, rx: 55, ry: 18, opacity: 0.35 },
      { x: 740, y: 780, rx: 65, ry: 20, opacity: 0.38 },
      { x: 1250, y: 750, rx: 50, ry: 16, opacity: 0.32 },
      { x: 1780, y: 770, rx: 70, ry: 22, opacity: 0.40 },
      { x: 2320, y: 790, rx: 60, ry: 19, opacity: 0.35 },
      { x: 2900, y: 765, rx: 65, ry: 20, opacity: 0.36 },
    ];

    // 5. Rong rêu chìm dưới nước (55% sát bờ, 25% giữa sông, ngả theo dòng nước)
    this.submergedPlants = [
      // Rong sát bờ (y = 680 - 720, cao 30-55px, opacity 0.55-0.70)
      { x: 140, y: 700, w: 32, h: 42, type: 'rong_duoi_chon', swaySpeed: 1.2, phase: 0.4, opacity: 0.65, scale: 0.9 },
      { x: 270, y: 705, w: 36, h: 48, type: 'rong_la_dai', swaySpeed: 1.0, phase: 1.2, opacity: 0.60, scale: 0.85 },
      { x: 480, y: 695, w: 30, h: 38, type: 'co_toc_nuoc', swaySpeed: 1.3, phase: 2.1, opacity: 0.55, scale: 0.8 },
      { x: 820, y: 710, w: 38, h: 50, type: 'rong_xuong_ca', swaySpeed: 1.1, phase: 0.8, opacity: 0.68, scale: 0.95 },
      { x: 1020, y: 700, w: 34, h: 44, type: 'rong_diep', swaySpeed: 1.2, phase: 3.0, opacity: 0.60, scale: 0.85 },
      { x: 1380, y: 705, w: 36, h: 46, type: 'rong_duoi_chon', swaySpeed: 1.0, phase: 1.7, opacity: 0.62, scale: 0.9 },
      { x: 1700, y: 698, w: 35, h: 48, type: 'rong_la_dai', swaySpeed: 1.2, phase: 2.5, opacity: 0.65, scale: 0.92 },
      { x: 2020, y: 705, w: 32, h: 40, type: 'co_toc_nuoc', swaySpeed: 1.4, phase: 0.5, opacity: 0.58, scale: 0.8 },
      { x: 2420, y: 702, w: 38, h: 52, type: 'rong_xuong_ca', swaySpeed: 1.1, phase: 1.9, opacity: 0.66, scale: 0.95 },
      { x: 2820, y: 698, w: 34, h: 45, type: 'rong_diep', swaySpeed: 1.3, phase: 2.8, opacity: 0.60, scale: 0.88 },

      // Rong giữa sông (y = 740 - 790, thưa, ngọn lay động theo dòng, opacity 0.40-0.50)
      { x: 380, y: 760, w: 30, h: 36, type: 'rong_duoi_chon', swaySpeed: 0.9, phase: 0.7, opacity: 0.45, scale: 0.75 },
      { x: 940, y: 770, w: 32, h: 38, type: 'rong_la_dai', swaySpeed: 0.8, phase: 2.2, opacity: 0.42, scale: 0.78 },
      { x: 1540, y: 765, w: 28, h: 34, type: 'rong_diep', swaySpeed: 0.9, phase: 1.4, opacity: 0.40, scale: 0.72 },
      { x: 2180, y: 775, w: 34, h: 40, type: 'rong_xuong_ca', swaySpeed: 0.85, phase: 3.1, opacity: 0.45, scale: 0.8 },
      { x: 2680, y: 760, w: 30, h: 36, type: 'co_toc_nuoc', swaySpeed: 0.95, phase: 0.9, opacity: 0.42, scale: 0.75 },
    ];

    // 6. Cá bơi ở các độ sâu (1 đàn 4 con nhỏ, cá vừa bơi riêng, bóng cá sâu, 70% sông để trống)
    this.swimmingFishes = [
      // Đàn cá nhỏ bơi gần mặt nước (y = 695 - 715, opacity 72-78%, size 18-24px)
      { x: 320, y: 700, baseY: 700, speed: 22, dir: 1, type: 'ca_ro', size: 22, depth: 'shallow', opacity: 0.76, tailSpeed: 8, phase: 0.1, minX: 180, maxX: 650 },
      { x: 355, y: 708, baseY: 708, speed: 22, dir: 1, type: 'ca_ro', size: 20, depth: 'shallow', opacity: 0.74, tailSpeed: 8.2, phase: 0.5, minX: 180, maxX: 650 },
      { x: 335, y: 718, baseY: 718, speed: 20, dir: 1, type: 'ca_vang', size: 19, depth: 'shallow', opacity: 0.75, tailSpeed: 7.8, phase: 1.0, minX: 180, maxX: 650 },
      { x: 380, y: 704, baseY: 704, speed: 23, dir: 1, type: 'ca_ro', size: 18, depth: 'shallow', opacity: 0.72, tailSpeed: 8.5, phase: 1.6, minX: 180, maxX: 650 },

      // Cá vừa bơi riêng lẻ ở độ sâu trung bình (y = 735 - 765, opacity 58-64%, size 34-44px)
      { x: 1200, y: 745, baseY: 745, speed: 16, dir: -1, type: 'ca_chep', size: 40, depth: 'mid', opacity: 0.62, tailSpeed: 5, phase: 2.0, minX: 950, maxX: 1450 },
      { x: 2350, y: 755, baseY: 755, speed: 18, dir: 1, type: 'ca_me', size: 44, depth: 'mid', opacity: 0.58, tailSpeed: 5.5, phase: 3.4, minX: 2100, maxX: 2650 },

      // Bóng cá lớn bơi sâu dưới đáy sông (y = 815 - 840, opacity 38-44%, size 56-64px)
      { x: 1850, y: 825, baseY: 825, speed: 12, dir: 1, type: 'ca_loc', size: 60, depth: 'deep', opacity: 0.40, tailSpeed: 3.5, phase: 1.2, minX: 1550, maxX: 2200 },
      { x: 2920, y: 830, baseY: 830, speed: 10, dir: -1, type: 'ca_tre', size: 54, depth: 'deep', opacity: 0.38, tailSpeed: 3.2, phase: 4.5, minX: 2700, maxX: 3150 },
    ];

    // 7. Bọt khí nhỏ từ đáy sông nổi lên
    for (let i = 0; i < 18; i++) {
      this.waterBubbles.push({
        x: 100 + Math.random() * (MAP_25D.WORLD_W - 200),
        y: 720 + Math.random() * 140,
        baseY: 850 + Math.random() * 40,
        speed: 12 + Math.random() * 16,
        size: 1.5 + Math.random() * 2.2,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.25 + Math.random() * 0.30,
      });
    }
  }

  // ============================================================
  // UPDATE
  // ============================================================

  public update(dt: number): void {
    this.animTimer += dt;

    // Cập nhật cá bơi lội
    for (const fish of this.swimmingFishes) {
      fish.x += fish.dir * fish.speed * dt;
      fish.y = fish.baseY + Math.sin(this.animTimer * 1.2 + fish.phase) * 3;
      if (fish.dir > 0 && fish.x > fish.maxX) {
        fish.dir = -1;
      } else if (fish.dir < 0 && fish.x < fish.minX) {
        fish.dir = 1;
      }
    }

    // Cập nhật bọt khí nổi lên từ đáy sông
    for (const b of this.waterBubbles) {
      b.y -= b.speed * dt;
      if (b.y < 673) {
        b.y = b.baseY;
        b.x = (b.x + (Math.random() - 0.5) * 60 + MAP_25D.WORLD_W) % MAP_25D.WORLD_W;
      }
    }
  }

  // ============================================================
  // MAIN RENDER (UNIFIED TERRAIN & MULTI-LAYER UNDERWATER PIPELINE)
  // ============================================================

  public render(
    ctx: CanvasRenderingContext2D,
    viewportW: number,
    viewportH: number,
    playerFeetY: number,
    renderPlayer: () => void,
    animalRenderers?: YSortableEntity[],
    dynamicObstacles?: AnimalObstacle[],
    showWalkableBoundaries: boolean = false
  ): void {
    ctx.save();

    // Áp dụng camera transform 2.5D
    const cam = this.map.camera;
    ctx.translate(-cam.x, -cam.y);
    ctx.scale(cam.scale, cam.scale);

    // LỚP 1: NỀN ĐẤT & ĐƯỜNG LÀNG TỔNG HỢP (Unified Road + Riverbank Terrain)
    this.renderGround(ctx);

    // LỚP 2A: NỀN NƯỚC SÔNG VỚI GRADIENT ĐỘ SÂU (Depth Gradient)
    this.renderBaseRiver(ctx);

    // LỚP 2B: MẢNG RÊU & ĐÁ CHÌM ĐÁY SÔNG
    this.renderSubmergedMossAndFloor(ctx);

    // LỚP 2C: RONG RÊU CHÌM DƯỚI NƯỚC (Lay động theo dòng nước)
    this.renderSubmergedPlants(ctx);

    // LỚP 2D: CÁ BƠI THEO CÁC TẦNG ĐỘ SÂU (Đàn cá nhỏ, cá vừa, bóng cá sâu)
    this.renderSubmergedFishes(ctx);

    // LỚP 2E: LỚP MÀU NƯỚC BÁN TRONG SUỐT PHỦ LÊN CÁ VÀ RONG (Translucent Water Veil)
    this.renderTranslucentWaterVeil(ctx);

    // LỚP 2F: GỢN SÁNG MẶT NƯỚC, BỌT KHÍ & VỆT SÁNG CHE THÂN CÁ
    this.renderWaterSurfaceLighting(ctx);

    // LỚP 3: GRADIENT NƯỚC NÔNG & PHẢN CHIẾU MỜ SÁT BỜ (25-35px uốn lượn tự nhiên)
    this.renderShallowWaterGradient(ctx);

    // LỚP 4: BÓNG TIẾP XÚC SÁT CHÂN BỜ ĐẤT (Multiply Gradient Shadow)
    this.renderContactShadow(ctx);

    // LỚP 5: TRANG TRÍ BỜ SÔNG & HOA SEN NỔI TRÊN CÙNG (Sprite Cỏ, Đá bờ & Sen nổi)
    this.renderFloatingLotuses(ctx);
    this.renderRiversideProps(ctx);

    // LỚP 6: BACK OBJECTS — Cụm tre xa / Cảnh quan phía sau (depthY < 380)
    this.renderBackObjects(ctx);

    // LỚP 7: Y-SORTED MAIN LAYER — Nhà cửa, Cây cối, Giếng nước, Nhân vật & Từng con vật (Y-sorting chung)
    this.renderYSortedMainLayer(ctx, playerFeetY, renderPlayer, animalRenderers);

    // LỚP OVERLAY: Ranh giới đa giác vùng di chuyển & khối cản (Chỉ vẽ khi BẬT)
    if (showWalkableBoundaries) {
      this.renderWalkableBoundaries(ctx, dynamicObstacles);
    }

    ctx.restore();
  }

  // ============================================================
  // LỚP 1: TERRAIN BASE CHÍNH — ĐƯỜNG ĐẤT & BỜ SÔNG NẰM CHUNG 1 ẢNH
  // ============================================================

  private renderGround(ctx: CanvasRenderingContext2D): void {
    const gTop = MAP_25D.HOUSE_ZONE_TOP;
    const gBottom = MAP_25D.RIVERBANK_BOTTOM;

    // 1. Nền cỏ xanh mượt phẳng tự nhiên chạy liên tục phía trên
    const groundGrad = ctx.createLinearGradient(0, gTop, 0, gBottom);
    groundGrad.addColorStop(0, '#647b2c'); // Cỏ xanh mượt phía trên (gần nhà)
    groundGrad.addColorStop(0.5, '#586f24'); // Vùng cỏ tươi
    groundGrad.addColorStop(1, '#4c601d'); // Cỏ mượt ven bờ
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, gTop, MAP_25D.WORLD_W, gBottom - gTop);

    // 2. Lớp màu đất liên tục từ vàng khô xuống nâu ẩm chạy ngầm bên dưới
    const dirtGrad = ctx.createLinearGradient(0, 366, 0, 686);
    dirtGrad.addColorStop(0, '#e5b35a');   // Vàng cát khô trên đường
    dirtGrad.addColorStop(0.45, '#c99850'); // Đất vàng đất thịt
    dirtGrad.addColorStop(0.80, '#8c6328'); // Đất chuyển màu tối
    dirtGrad.addColorStop(1.0, '#4a3618');  // Đất ẩm sẫm màu sát nước
    ctx.fillStyle = dirtGrad;
    ctx.fillRect(0, 366, MAP_25D.WORLD_W, 320);

    // 3. Texture Terrain Tổng Hợp (Unified Road & Shore) với Overlap 100px và Feather Mask
    if (this.groundLoaded && this.groundImg.complete && this.groundImg.naturalWidth > 0) {
      if (!this.roadTileNormal) this.buildRoadBuffers();

      const roadY = 366; // Chồng lên nền cỏ phía trên 6px để triệt tiêu hoàn toàn viền trắng
      const roadH = 320;
      const aspect = this.groundImg.naturalWidth / this.groundImg.naturalHeight;
      const tileW = Math.round(roadH * aspect);
      const roadOverlap = 100;
      const roadStep = tileW - roadOverlap;

      ctx.save();
      ctx.globalAlpha = 1.0;

      let idx = 0;
      for (let x = -40; x < MAP_25D.WORLD_W; x += roadStep, idx++) {
        // Mảnh đầu vẽ bình thường, các mảnh sau dùng feather mask (và đảo lật flipX để tránh lặp mẫu A->A->A)
        const tileCanvas = idx === 0
          ? this.roadTileNormal
          : (idx % 2 === 0 ? this.roadTileFadedFlipped : this.roadTileFaded);

        if (tileCanvas) {
          ctx.drawImage(tileCanvas, Math.round(x), Math.round(roadY));
        } else {
          ctx.drawImage(
            this.groundImg,
            Math.round(x),
            Math.round(roadY),
            Math.ceil(tileW) + 2,
            Math.round(roadH)
          );
        }
      }
      ctx.restore();
    }
  }

  // ============================================================
  // LỚP 2A: NỀN NƯỚC SÔNG VỚI GRADIENT ĐỘ SÂU (DEPTH GRADIENT)
  // ============================================================

  private renderBaseRiver(ctx: CanvasRenderingContext2D): void {
    const rTop = 673; // Mặt nước bắt đầu chồng lên mép dưới bờ (ngập 12px)
    const rBottom = MAP_25D.RIVER_BOTTOM;

    // Gradient chuyển sắc màu sông ngọc lục bảo mượt mà từ sáng gần bờ đến sâu tối ở dưới:
    // linear-gradient(to bottom, #4fa9a0 0%, #3f9893 30%, #2f7f7d 70%, #286b6d 100%)
    const riverGrad = ctx.createLinearGradient(0, rTop, 0, rBottom);
    riverGrad.addColorStop(0, '#4fa9a0');    // Sát bờ sáng hơn và có sắc ngọc rêu nhẹ
    riverGrad.addColorStop(0.30, '#3f9893'); // Tầng nước giữa nông
    riverGrad.addColorStop(0.70, '#2f7f7d'); // Tầng nước sâu
    riverGrad.addColorStop(1.0, '#286b6d');  // Chiều sâu tối đáy sông
    ctx.fillStyle = riverGrad;
    ctx.fillRect(0, rTop, MAP_25D.WORLD_W, rBottom - rTop);
  }

  // ============================================================
  // LỚP 2B: MẢNG RÊU & ĐÁ CHÌM ĐÁY SÔNG (SUBMERGED MOSS & FLOOR)
  // ============================================================

  private renderSubmergedMossAndFloor(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const patch of this.mossPatches) {
      ctx.fillStyle = 'rgba(20, 52, 44, ' + patch.opacity + ')';
      ctx.beginPath();
      ctx.ellipse(patch.x, patch.y, patch.rx, patch.ry, 0.05, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ============================================================
  // LỚP 2C: RONG RÊU CHÌM DƯỚI NƯỚC (SUBMERGED AQUATIC PLANTS)
  // ============================================================

  private renderSubmergedPlants(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const plant of this.submergedPlants) {
      const img = this.plantImages.get(plant.type);
      if (!img || !img.complete || img.naturalWidth <= 0) continue;

      const sway = Math.sin(this.animTimer * plant.swaySpeed + plant.phase) * 0.08;
      const pw = plant.w * plant.scale;
      const ph = plant.h * plant.scale;

      ctx.save();
      ctx.globalAlpha = plant.opacity;
      ctx.translate(plant.x, plant.y);
      ctx.rotate(sway);
      ctx.drawImage(img, -pw / 2, -ph, pw, ph);
      ctx.restore();
    }
    ctx.restore();
  }

  // ============================================================
  // LỚP 2D: CÁ BƠI THEO CÁC TẦNG ĐỘ SÂU (SUBMERGED SWIMMING FISHES)
  // ============================================================

  private renderSubmergedFishes(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    for (const fish of this.swimmingFishes) {
      const img = this.fishImages.get(fish.type);
      if (!img || !img.complete || img.naturalWidth <= 0) continue;

      const aspect = img.naturalWidth / img.naturalHeight;
      const fw = fish.size;
      const fh = Math.round(fw / aspect);
      const tailWiggle = Math.sin(this.animTimer * fish.tailSpeed + fish.phase) * 0.06;

      ctx.save();
      ctx.globalAlpha = fish.opacity;
      ctx.translate(fish.x, fish.y);
      // Ảnh sprite gốc của cá có đầu hướng sang TRÁI (<-)
      // Do đó khi bơi sang PHẢI (dir = 1), cần lật ngang scale(-1, 1) để đầu cá hướng sang PHẢI
      ctx.scale(-fish.dir, 1);
      ctx.rotate(tailWiggle);

      // Bóng mờ nhẹ dưới thân cá trong nước (không dùng bóng oval trên mặt nước)
      ctx.fillStyle = 'rgba(15, 45, 38, 0.18)';
      ctx.beginPath();
      ctx.ellipse(0, fh * 0.35, fw * 0.45, fh * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();

      // Vẽ sprite cá
      ctx.drawImage(img, -fw / 2, -fh / 2, fw, fh);

      ctx.restore();
    }
    ctx.restore();
  }

  // ============================================================
  // LỚP 2E: LỚP MÀU NƯỚC BÁN TRONG SUỐT PHỦ LÊN CÁ VÀ RONG (WATER VEIL)
  // ============================================================

  private renderTranslucentWaterVeil(ctx: CanvasRenderingContext2D): void {
    const rTop = 673;
    const rBottom = MAP_25D.RIVER_BOTTOM;
    ctx.save();
    // Lớp màu nước xanh ngọc bán trong suốt phủ lên cá và rong giúp nhấn chìm tự nhiên
    ctx.fillStyle = 'rgba(38, 137, 134, 0.26)';
    ctx.fillRect(0, rTop, MAP_25D.WORLD_W, rBottom - rTop);
    ctx.restore();
  }

  // ============================================================
  // LỚP 2F: GỢN SÁNG MẶT NƯỚC, BỌT KHÍ & VỆT SÁNG CHE THÂN CÁ
  // ============================================================

  private renderWaterSurfaceLighting(ctx: CanvasRenderingContext2D): void {
    ctx.save();

    // 1. Các dải phản chiếu mờ ngang lớn (Horizontal Sheen Bands mềm mại)
    const sheen1 = ctx.createLinearGradient(0, 712, 0, 728);
    sheen1.addColorStop(0, 'rgba(220, 245, 235, 0.0)');
    sheen1.addColorStop(0.5, 'rgba(220, 245, 235, 0.08)');
    sheen1.addColorStop(1.0, 'rgba(220, 245, 235, 0.0)');
    ctx.fillStyle = sheen1;
    ctx.fillRect(0, 712, MAP_25D.WORLD_W, 16);

    const sheen2 = ctx.createLinearGradient(0, 770, 0, 792);
    sheen2.addColorStop(0, 'rgba(200, 240, 230, 0.0)');
    sheen2.addColorStop(0.5, 'rgba(200, 240, 230, 0.06)');
    sheen2.addColorStop(1.0, 'rgba(200, 240, 230, 0.0)');
    ctx.fillStyle = sheen2;
    ctx.fillRect(0, 770, MAP_25D.WORLD_W, 22);

    // 2. Gợn sáng lượn mềm mại che ngang thân cá trên mặt nước (êm dịu tan mờ ở hai đầu)
    for (const fish of this.swimmingFishes) {
      const halfW = fish.size * 0.55;
      const rippleY = fish.y - 4 + Math.sin(this.animTimer * 2 + fish.x * 0.02) * 2;
      const grad = ctx.createLinearGradient(fish.x - halfW, rippleY, fish.x + halfW, rippleY);
      grad.addColorStop(0, 'rgba(220, 245, 240, 0.0)');
      grad.addColorStop(0.5, 'rgba(220, 245, 240, 0.16)');
      grad.addColorStop(1.0, 'rgba(220, 245, 240, 0.0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(fish.x - halfW, rippleY);
      ctx.quadraticCurveTo(fish.x, rippleY - 2, fish.x + halfW, rippleY);
      ctx.stroke();
    }

    // 3. Bọt khí nhỏ từ đáy sông nổi lên
    ctx.fillStyle = 'rgba(230, 250, 245, 0.35)';
    for (const b of this.waterBubbles) {
      const wobbleX = b.x + Math.sin(this.animTimer * 1.5 + b.phase) * 3;
      ctx.beginPath();
      ctx.arc(wobbleX, b.y, b.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // ============================================================
  // LỚP 3: GRADIENT NƯỚC NÔNG UỐN LƯỢN & PHẢN CHIẾU MỜ SÁT BỜ (25-35PX)
  // ============================================================

  private renderShallowWaterGradient(ctx: CanvasRenderingContext2D): void {
    const waterLine = 673;
    const shallowH = 34;

    ctx.save();

    // 1. Dải nước nông tối hữu cơ (Uốn lượn tự nhiên & vài chỗ ăn nhẹ vào bờ 3-6px)
    ctx.beginPath();
    ctx.moveTo(0, waterLine);
    for (let x = 0; x <= MAP_25D.WORLD_W; x += 30) {
      const shorelineWave = Math.sin(x * 0.035) * 3.5 + Math.cos(x * 0.07) * 2.0;
      ctx.lineTo(x, waterLine + shallowH + shorelineWave);
    }
    ctx.lineTo(MAP_25D.WORLD_W, waterLine);
    ctx.closePath();

    const shallowGrad = ctx.createLinearGradient(0, waterLine, 0, waterLine + shallowH);
    shallowGrad.addColorStop(0, 'rgba(32, 58, 46, 0.70)');      // Xanh rêu tối sát mép bờ
    shallowGrad.addColorStop(0.40, 'rgba(40, 95, 82, 0.38)');  // Xanh ngọc rêu
    shallowGrad.addColorStop(1.0, 'rgba(54, 145, 136, 0.0)');  // Hòa tan êm dịu vào nước chính
    ctx.fillStyle = shallowGrad;
    ctx.fill();

    // 2. Dải đất ẩm tối dưới chân bờ (8-12px)
    const dampEarthGrad = ctx.createLinearGradient(0, waterLine, 0, waterLine + 12);
    dampEarthGrad.addColorStop(0, 'rgba(28, 20, 14, 0.42)');
    dampEarthGrad.addColorStop(1, 'rgba(28, 20, 14, 0.0)');
    ctx.fillStyle = dampEarthGrad;
    ctx.fillRect(0, waterLine, MAP_25D.WORLD_W, 12);

    // 3. Phản chiếu mờ dịu của mép bờ xuống mặt nước (15-20px, opacity 12%)
    ctx.globalAlpha = 0.12;
    const reflectionGrad = ctx.createLinearGradient(0, waterLine, 0, waterLine + 20);
    reflectionGrad.addColorStop(0, '#5a4220');
    reflectionGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = reflectionGrad;
    ctx.fillRect(0, waterLine, MAP_25D.WORLD_W, 20);

    ctx.restore();
  }

  // ============================================================
  // LỚP 4: BÓNG TIẾP XÚC SÁT CHÂN BỜ ĐẤT (MULTIPLY GRADIENT SHADOW)
  // ============================================================

  private renderContactShadow(ctx: CanvasRenderingContext2D): void {
    const waterY = 673;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';

    // Dải bóng xanh nâu đậm uốn lượn theo hình hài bờ đất, dùng gradient multiply
    const shadowGrad = ctx.createLinearGradient(0, waterY, 0, waterY + 28);
    shadowGrad.addColorStop(0, 'rgba(36, 70, 60, 0.45)');
    shadowGrad.addColorStop(0.45, 'rgba(42, 105, 94, 0.22)');
    shadowGrad.addColorStop(1.0, 'rgba(42, 105, 94, 0.0)');

    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.moveTo(0, waterY);

    for (let x = 0; x <= MAP_25D.WORLD_W; x += 25) {
      const bankBump = Math.sin(x * 0.045) * 3.0 + Math.cos(x * 0.08) * 1.5;
      ctx.lineTo(x, waterY + 10 + bankBump);
    }
    ctx.lineTo(MAP_25D.WORLD_W, waterY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  // ============================================================
  // LỚP 5A: HOA SEN & LÁ SEN TRÔI TRÊN MẶT NƯỚC (HỒNG SEN THANH THOÁT)
  // ============================================================

  private renderFloatingLotuses(ctx: CanvasRenderingContext2D): void {
    for (const lotus of this.lotuses) {
      const bobY = lotus.y + Math.sin(this.animTimer * 0.8 + lotus.phase) * 2;
      const bobX = lotus.x + Math.sin(this.animTimer * 0.3 + lotus.phase * 2) * 3;

      if (lotus.type === 'leaf') {
        // Lá sen tròn xanh
        ctx.fillStyle = '#2d7a3a';
        ctx.beginPath();
        ctx.ellipse(bobX, bobY, lotus.size, lotus.size * 0.65, 0.1, 0, Math.PI * 2);
        ctx.fill();
        // Gân lá mờ dịu
        ctx.strokeStyle = 'rgba(80, 160, 90, 0.4)';
        ctx.lineWidth = 0.8;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.moveTo(bobX, bobY);
          ctx.lineTo(bobX + Math.cos(a) * lotus.size * 0.8, bobY + Math.sin(a) * lotus.size * 0.5);
          ctx.stroke();
        }
      } else {
        // Hoa sen hồng (Đã giảm độ rực 18% - Dùng hồng sen thanh thoát dịu mắt)
        const petalCount = 8;
        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI * 2 + this.animTimer * 0.05;
          const px = bobX + Math.cos(angle) * lotus.size * 0.5;
          const py = bobY + Math.sin(angle) * lotus.size * 0.3;
          ctx.fillStyle = i % 2 === 0 ? '#db6f95' : '#c85a80';
          ctx.beginPath();
          ctx.ellipse(px, py, 5, 8, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        // Nhụy vàng ấm dịu
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(bobX, bobY, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ============================================================
  // LỚP 5B: ĐÁ & CỎ BỜ SÔNG (ĐA DẠNG SCALE, SUBMERGE & BẤT ĐỐI XỨNG)
  // ============================================================

  private renderRiversideProps(ctx: CanvasRenderingContext2D): void {
    // 1. Vẽ các cụm đá bờ sông (River Rock Sprites với scale & độ chìm nước)
    if (this.rockLoaded && this.rockSprite.complete && this.rockSprite.naturalWidth > 0) {
      for (const rock of this.riverRocks) {
        const s = rock.scale || 1.0;
        const submerged = rock.submerged || 0;
        const rw = rock.w * s;
        const rh = rock.h * s;
        const renderY = rock.y + submerged;

        ctx.save();
        // Bóng tiếp xúc dưới chân cụm đá
        ctx.fillStyle = 'rgba(20, 28, 18, 0.30)';
        ctx.beginPath();
        ctx.ellipse(rock.x, renderY + 1, rw * 0.45, rh * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(rock.x, renderY);
        if (rock.flipX) ctx.scale(-1, 1);
        ctx.drawImage(this.rockSprite, -rw / 2, -rh + 3, rw, rh);

        // Hiệu ứng nước nông phủ nhẹ 15-20% lên phần chân đá bị chìm
        if (submerged > 0) {
          ctx.fillStyle = 'rgba(36, 95, 85, 0.25)';
          ctx.fillRect(-rw / 2, -submerged, rw, submerged + 4);
        }

        ctx.restore();
      }
    }

    // 2. Vẽ các cụm cỏ nến / cỏ bờ sông (River Reed Sprites with varied scale & wind animation)
    if (this.reedLoaded && this.reedSprite.complete && this.reedSprite.naturalWidth > 0) {
      for (const reed of this.riverReeds) {
        const s = reed.scale || 1.0;
        const rw = reed.w * s;
        const rh = reed.h * s;
        const sway = Math.sin(this.animTimer * reed.swaySpeed + reed.phase) * 0.05;

        ctx.save();
        ctx.translate(reed.x, reed.y);
        ctx.rotate(sway);
        if (reed.flipX) ctx.scale(-1, 1);

        // Bóng nhẹ dưới gốc cỏ
        ctx.fillStyle = 'rgba(15, 25, 15, 0.24)';
        ctx.beginPath();
        ctx.ellipse(0, 1, rw * 0.35, rh * 0.1, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(this.reedSprite, -rw / 2, -rh, rw, rh);
        ctx.restore();
      }
    }
  }

  // ============================================================
  // LỚP 3: BACK OBJECTS (Cụm tre xa / Vật thể nền Y < 380)
  // ============================================================

  private renderBackObjects(ctx: CanvasRenderingContext2D): void {
    for (const item of VILLAGE_SCENERY) {
      const depthY = this.map.getSceneryDepthY(item);
      if (depthY < 380) {
        const img = this.map.getSceneryImage(item.id);
        this.renderSceneryItem(ctx, item, img);
      }
    }
  }

  // ============================================================
  // LỚP 4: Y-SORTED MAIN LAYER (Nhà cửa, Cây cối, Giếng, Nhân vật & Từng con vật)
  // ============================================================

  private renderYSortedMainLayer(
    ctx: CanvasRenderingContext2D,
    playerFeetY: number,
    renderPlayer: () => void,
    animalRenderers?: YSortableEntity[]
  ): void {
    const drawList: DepthSortable[] = [];

    // 1. Thêm Scenery items (depthY >= 380: Nhà cửa, Giếng nước, Cây chuối...)
    for (const item of VILLAGE_SCENERY) {
      const depthY = this.map.getSceneryDepthY(item);
      if (depthY >= 380) {
        const img = this.map.getSceneryImage(item.id);
        drawList.push({
          depthY,
          render: (c: CanvasRenderingContext2D) => {
            this.renderSceneryItem(c, item, img);
          },
        });
      }
    }

    // 2. Thêm Nhân vật với feetY chính xác
    drawList.push({
      depthY: playerFeetY,
      render: () => {
        renderPlayer();
      },
    });

    // 3. Thêm Từng con vật với feetY riêng biệt
    if (animalRenderers) {
      for (const animal of animalRenderers) {
        drawList.push({
          depthY: animal.feetY,
          render: (c: CanvasRenderingContext2D) => {
            animal.render(c);
          },
        });
      }
    }

    // 4. Sắp xếp tăng dần theo depthY (feetY)
    const sorted = this.map.depthSort(drawList);
    for (const item of sorted) {
      item.render(ctx);
    }
  }

  // ============================================================
  // RENDER SINGLE SCENERY ITEM (PNG IMAGE hoặc PLACEHOLDER)
  // ============================================================

  private renderSceneryItem(
    ctx: CanvasRenderingContext2D,
    item: SceneryItem,
    img?: HTMLImageElement
  ): void {
    const drawX = item.x - item.width / 2;
    const drawY = item.y - item.height;

    // Bóng đổ mềm dưới chân
    if (item.blocking) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.beginPath();
      ctx.ellipse(item.x, item.y + 3, item.width * 0.4, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    if (img && img.complete && img.naturalWidth > 0) {
      let renderW = item.width;
      let renderH = item.height;

      // 1. Nếu có định nghĩa H-Metric trong ASSET_METRICS, scale chính xác theo 1H = 96px
      if (item.metricKey && ASSET_METRICS[item.metricKey]) {
        const metricScale = calculateAssetScale(item.metricKey, WORLD_UNIT);
        renderW = Math.round(img.naturalWidth * metricScale);
        renderH = Math.round(img.naturalHeight * metricScale);
      } else {
        // Giữ đúng 100% tỷ lệ khung hình tự nhiên của ảnh gốc
        const aspect = img.naturalWidth / img.naturalHeight;
        if (item.width && item.height) {
          renderH = renderW / aspect;
        } else if (item.width) {
          renderH = renderW / aspect;
        } else if (item.height) {
          renderW = renderH * aspect;
        } else {
          renderW = img.naturalWidth;
          renderH = img.naturalHeight;
        }
      }

      // Điểm neo (Anchor) thống nhất: Bottom-Center (anchorX = 0.5, anchorY = 1.0)
      const dX = item.x - renderW * 0.5;
      const dY = item.y - renderH * 1.0;

      // Vẽ ảnh PNG (hỗ trợ flipX & hiệu ứng rung nhẹ tán lá cho Cây Đa cổ thụ)
      ctx.save();
      ctx.translate(item.x, item.y);

      if (item.flipX) {
        ctx.scale(-1, 1);
      }

      // Đối với Cây Đa Cổ Thụ: Gốc cây cố định 100%, chỉ biến dạng nghiêng nhẹ tán lá theo gió (Shear X)
      if (item.metricKey === 'cay_da_co_thu') {
        const canopySway = Math.sin(this.animTimer * 1.2 + item.x * 0.01) * 0.005; // ~0.28 độ lay nhẹ
        ctx.transform(1, 0, canopySway, 1, 0, 0);
      }

      ctx.drawImage(img, -renderW / 2, -renderH, renderW, renderH);
      ctx.restore();

      // Nếu là Cây Đa Cổ Thụ: Vẽ thêm 8 chùm rễ buông đung đưa nhẹ nhàng theo làn gió
      if (item.metricKey === 'cay_da_co_thu') {
        this.renderBanyanHangingRoots(ctx, item.x, item.y, renderW, renderH);
      }
    } else {
      // PLACEHOLDER: Vẽ hình chữ nhật + tên
      this.renderPlaceholder(ctx, item, drawX, drawY);
    }
  }

  // ============================================================
  // RENDER RỄ CÂY ĐA BUÔNG RỦ ĐUNG ĐƯA THEO GIÓ (4 SỢI RIÊNG BIỆT)
  // ============================================================

  private renderBanyanHangingRoots(
    ctx: CanvasRenderingContext2D,
    treeX: number,
    treeY: number,
    treeW: number,
    treeH: number
  ): void {
    // Danh sách 8 điểm thả rễ buông bám theo các nhánh cành cây đa
    const roots = [
      { key: 're_da_1', relX: -160, relY: -220, freq: 1.1, phase: 0.0, maxAngle: 2.8 },
      { key: 're_da_3', relX: -120, relY: -245, freq: 1.3, phase: 1.2, maxAngle: 2.4 },
      { key: 're_da_2', relX: -75,  relY: -210, freq: 1.5, phase: 2.5, maxAngle: 3.2 },
      { key: 're_da_4', relX: -145, relY: -265, freq: 1.8, phase: 0.8, maxAngle: 3.6 },
      { key: 're_da_2', relX: 80,   relY: -210, freq: 1.4, phase: 3.1, maxAngle: 3.0 },
      { key: 're_da_3', relX: 125,  relY: -245, freq: 1.2, phase: 4.4, maxAngle: 2.5 },
      { key: 're_da_1', relX: 165,  relY: -220, freq: 1.05, phase: 5.6, maxAngle: 2.7 },
      { key: 're_da_4', relX: 140,  relY: -265, freq: 1.7, phase: 2.1, maxAngle: 3.5 },
    ];

    for (const r of roots) {
      const rootImg = AssetLoader.getImage(`/assets/environment/village25d/scenery/${r.key}.png`);
      if (!rootImg || !rootImg.complete || rootImg.naturalWidth <= 0) continue;

      const scale = calculateAssetScale(r.key, WORLD_UNIT);
      const rootW = Math.max(2, Math.round(rootImg.naturalWidth * scale));
      const rootH = Math.round(rootImg.naturalHeight * scale);

      // Điểm treo cành trên cây
      const attachX = treeX + r.relX * (treeW / 480);
      const attachY = treeY + r.relY * (treeH / 400);

      // Góc lắc con lắc trong gió (dao động chính + sóng hài bậc 2 tạo cảm giác mềm mại)
      const angleRad = (
        Math.sin(this.animTimer * r.freq + r.phase) * r.maxAngle +
        Math.sin(this.animTimer * r.freq * 2.1 + r.phase * 1.5) * (r.maxAngle * 0.25)
      ) * (Math.PI / 180);

      ctx.save();
      ctx.translate(attachX, attachY);
      ctx.rotate(angleRad);
      ctx.drawImage(rootImg, -rootW / 2, 0, rootW, rootH);
      ctx.restore();
    }
  }

  private renderPlaceholder(
    ctx: CanvasRenderingContext2D,
    item: SceneryItem,
    drawX: number,
    drawY: number
  ): void {
    // Background box
    let fillColor = '#8B7355'; // Nâu đất mặc định

    if (item.id.startsWith('nha_tranh')) {
      fillColor = '#d4a574'; // Nâu vàng nhà tranh
      this.renderPlaceholderThatchedHouse(ctx, item, drawX, drawY);
      return;
    } else if (item.id.startsWith('nha_ngoi')) {
      fillColor = '#c55a11'; // Cam đỏ nhà ngói
      this.renderPlaceholderTileHouse(ctx, item, drawX, drawY);
      return;
    } else if (item.id === 'cay_da') {
      this.renderPlaceholderBanyanTree(ctx, item, drawX, drawY);
      return;
    } else if (item.id === 'gieng_nuoc') {
      this.renderPlaceholderWell(ctx, item);
      return;
    } else if (item.id === 'thuyen_nan') {
      this.renderPlaceholderBoat(ctx, item);
      return;
    }

    ctx.fillStyle = fillColor;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(drawX, drawY, item.width, item.height);
    ctx.globalAlpha = 1;

    // Label
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.id, item.x, item.y - item.height / 2);
  }

  // ============================================================
  // PLACEHOLDER DRAWINGS (đẹp mắt, dùng khi chưa có ảnh PNG)
  // ============================================================

  /** Nhà tranh mái lá placeholder */
  private renderPlaceholderThatchedHouse(
    ctx: CanvasRenderingContext2D,
    item: SceneryItem,
    drawX: number,
    drawY: number
  ): void {
    const w = item.width;
    const h = item.height;
    const cx = item.x;

    // Tường vách đất vàng
    ctx.fillStyle = '#deb887';
    ctx.fillRect(drawX + w * 0.1, drawY + h * 0.4, w * 0.8, h * 0.55);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(drawX + w * 0.1, drawY + h * 0.4, w * 0.8, h * 0.55);

    // Cửa
    ctx.fillStyle = '#5c3317';
    ctx.fillRect(cx - 10, drawY + h * 0.55, 20, h * 0.4);

    // Mái rạ vàng
    ctx.fillStyle = '#b8860b';
    ctx.beginPath();
    ctx.moveTo(drawX, drawY + h * 0.42);
    ctx.lineTo(cx, drawY + h * 0.08);
    ctx.lineTo(drawX + w, drawY + h * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8B6914';
    ctx.stroke();

    // Vạch rơm
    ctx.strokeStyle = 'rgba(139, 105, 20, 0.5)';
    ctx.lineWidth = 0.8;
    for (let rx = drawX + 10; rx < drawX + w - 10; rx += 12) {
      ctx.beginPath();
      ctx.moveTo(rx, drawY + h * 0.42);
      ctx.lineTo(cx + (rx - cx) * 0.3, drawY + h * 0.12);
      ctx.stroke();
    }
  }

  /** Nhà ngói lớn placeholder */
  private renderPlaceholderTileHouse(
    ctx: CanvasRenderingContext2D,
    item: SceneryItem,
    drawX: number,
    drawY: number
  ): void {
    const w = item.width;
    const h = item.height;
    const cx = item.x;

    // Tường vàng nhạt
    ctx.fillStyle = '#f5deb3';
    ctx.fillRect(drawX + w * 0.05, drawY + h * 0.35, w * 0.9, h * 0.6);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 2;
    ctx.strokeRect(drawX + w * 0.05, drawY + h * 0.35, w * 0.9, h * 0.6);

    // Cột gỗ
    ctx.fillStyle = '#6b3a1f';
    for (const col of [0.15, 0.4, 0.6, 0.85]) {
      ctx.fillRect(drawX + w * col - 3, drawY + h * 0.35, 6, h * 0.6);
    }

    // Cửa đôi
    ctx.fillStyle = '#4a2511';
    ctx.fillRect(cx - 15, drawY + h * 0.5, 30, h * 0.45);
    ctx.strokeStyle = '#d4a574';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, drawY + h * 0.5);
    ctx.lineTo(cx, drawY + h * 0.95);
    ctx.stroke();

    // Mái ngói đỏ
    ctx.fillStyle = '#c55a11';
    ctx.beginPath();
    ctx.moveTo(drawX - 10, drawY + h * 0.38);
    ctx.lineTo(cx, drawY + h * 0.05);
    ctx.lineTo(drawX + w + 10, drawY + h * 0.38);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8B2500';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Rãnh ngói
    ctx.strokeStyle = 'rgba(139, 37, 0, 0.4)';
    ctx.lineWidth = 1;
    for (let rx = drawX; rx < drawX + w; rx += 15) {
      ctx.beginPath();
      ctx.moveTo(rx, drawY + h * 0.38);
      ctx.lineTo(cx + (rx - cx) * 0.4, drawY + h * 0.08);
      ctx.stroke();
    }

    // Đỉnh nóc
    ctx.fillStyle = '#8B2500';
    ctx.fillRect(drawX - 12, drawY + h * 0.03, w + 24, 5);
  }

  /** Cây đa cổ thụ placeholder */
  private renderPlaceholderBanyanTree(
    ctx: CanvasRenderingContext2D,
    item: SceneryItem,
    _drawX: number,
    drawY: number
  ): void {
    const cx = item.x;
    const h = item.height;

    // Thân cây to
    ctx.fillStyle = '#5c4033';
    ctx.beginPath();
    ctx.moveTo(cx - 25, item.y);
    ctx.lineTo(cx - 15, drawY + h * 0.5);
    ctx.lineTo(cx + 15, drawY + h * 0.5);
    ctx.lineTo(cx + 25, item.y);
    ctx.closePath();
    ctx.fill();

    // Rễ phụ
    ctx.strokeStyle = '#5c4033';
    ctx.lineWidth = 3;
    for (const rx of [-30, -15, 18, 32]) {
      ctx.beginPath();
      ctx.moveTo(cx + rx * 0.5, drawY + h * 0.55);
      ctx.quadraticCurveTo(cx + rx, drawY + h * 0.75, cx + rx * 1.2, item.y);
      ctx.stroke();
    }

    // Tán lá tròn lớn
    ctx.fillStyle = '#2d5a27';
    ctx.beginPath();
    ctx.ellipse(cx, drawY + h * 0.35, item.width * 0.45, h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lá xanh nhạt hơn
    ctx.fillStyle = '#3a7a33';
    ctx.beginPath();
    ctx.ellipse(cx - 30, drawY + h * 0.3, 50, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + 40, drawY + h * 0.32, 45, 38, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Giếng nước placeholder */
  private renderPlaceholderWell(
    ctx: CanvasRenderingContext2D,
    item: SceneryItem
  ): void {
    const cx = item.x;
    const cy = item.y;

    // Thành giếng đá
    ctx.fillStyle = '#708090';
    ctx.strokeStyle = '#4a5568';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 10, 25, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Lòng giếng
    ctx.fillStyle = '#1a4a5a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 10, 18, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Mặt nước
    ctx.fillStyle = '#5aadca';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 10, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2 cột gỗ + xà ngang
    ctx.strokeStyle = '#5c3317';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 5);
    ctx.lineTo(cx - 18, cy - 40);
    ctx.moveTo(cx + 18, cy - 5);
    ctx.lineTo(cx + 18, cy - 40);
    ctx.moveTo(cx - 18, cy - 40);
    ctx.lineTo(cx + 18, cy - 40);
    ctx.stroke();

    // Ròng rọc
    ctx.fillStyle = '#8B4513';
    ctx.beginPath();
    ctx.arc(cx, cy - 37, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  /** Thuyền nan placeholder */
  private renderPlaceholderBoat(
    ctx: CanvasRenderingContext2D,
    item: SceneryItem
  ): void {
    const cx = item.x;
    const cy = item.y;
    const bobY = cy + Math.sin(this.animTimer * 0.6) * 3;

    // Thân thuyền
    ctx.fillStyle = '#b8860b';
    ctx.beginPath();
    ctx.moveTo(cx - 60, bobY);
    ctx.quadraticCurveTo(cx - 50, bobY + 20, cx, bobY + 15);
    ctx.quadraticCurveTo(cx + 50, bobY + 20, cx + 60, bobY);
    ctx.quadraticCurveTo(cx + 40, bobY - 5, cx, bobY - 3);
    ctx.quadraticCurveTo(cx - 40, bobY - 5, cx - 60, bobY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nan tre bên trong
    ctx.strokeStyle = 'rgba(139, 105, 20, 0.4)';
    ctx.lineWidth = 0.8;
    for (let rx = cx - 40; rx < cx + 40; rx += 12) {
      ctx.beginPath();
      ctx.moveTo(rx, bobY - 2);
      ctx.lineTo(rx, bobY + 12);
      ctx.stroke();
    }

    // Mái che tre phía sau
    ctx.fillStyle = '#a07020';
    ctx.beginPath();
    ctx.moveTo(cx + 10, bobY - 3);
    ctx.lineTo(cx + 15, bobY - 25);
    ctx.lineTo(cx + 55, bobY - 5);
    ctx.closePath();
    ctx.fill();
  }

  // ============================================================
  // HIỂN THỊ RANH GIỚI VÙNG ĐI ĐƯỢC (WALKABLE POLYGON & BLOCKING BOUNDARIES)
  // ============================================================

  private renderWalkableBoundaries(
    ctx: CanvasRenderingContext2D,
    dynamicObstacles?: AnimalObstacle[]
  ): void {
    const poly = WALKABLE_POLYGON;
    if (!poly || poly.length === 0) return;

    ctx.save();

    // 1. Phủ màu mờ + đường viền uốn lượn nét đứt cho ĐA GIÁC ĐƯỜNG LÀNG (WALKABLE POLYGON)
    ctx.beginPath();
    ctx.moveTo(poly[0].x, poly[0].y);
    for (let i = 1; i < poly.length; i++) {
      ctx.lineTo(poly[i].x, poly[i].y);
    }
    ctx.closePath();

    // Phủ màu xanh lá nhạt cho vùng được đi
    ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
    ctx.fill();

    // Vẽ đường nét đứt màu xanh lá uốn lượn theo đa giác
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Vẽ các nút đỉnh của Đa giác uốn lượn (Polygon Vertices)
    ctx.fillStyle = '#15803d';
    for (const p of poly) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nhãn hướng dẫn đường đi
    ctx.font = 'bold 12px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#15803d';
    ctx.fillRect(60, 435, 340, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillText('🛣️ WALKABLE POLYGON (Đa giác đường làng uốn lượn)', 68, 449);

    // 2. Hiển thị VÙNG VẬT CẢN CHÂN (Nhà cửa, Giếng nước, Cây cối)
    for (const item of VILLAGE_SCENERY) {
      if (!item.blocking || !item.collisionBox) continue;

      const cb = item.collisionBox;
      const boxLeft = item.x + cb.offX;
      const boxTop = item.y + cb.offY;

      // Phủ màu đỏ mờ cảnh báo vật cản
      ctx.fillStyle = 'rgba(239, 68, 68, 0.38)';
      ctx.fillRect(boxLeft, boxTop, cb.w, cb.h);

      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxLeft, boxTop, cb.w, cb.h);

      // Điểm tiếp đất (Anchor Point)
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.arc(item.x, item.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Nhãn vật cản
      ctx.fillStyle = 'rgba(185, 28, 28, 0.9)';
      ctx.fillRect(boxLeft, boxTop - 15, Math.max(60, cb.w), 15);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⛔ ' + item.id, boxLeft + cb.w / 2, boxTop - 4);
    }

    // 3. Hiển thị FOOT COLLIDERS CHO TẤT CẢ CON VẬT (Trâu, Lợn, Gà trống, Gà mái, Cò, Bé Sinh)
    const obstacles = dynamicObstacles ?? ANIMAL_OBSTACLES;
    for (const obstacle of obstacles) {
      const boxLeft = obstacle.x - obstacle.w / 2;
      const boxTop = obstacle.y - obstacle.h;

      // Phủ màu cam đỏ mờ cảnh báo foot collider của con vật
      ctx.fillStyle = 'rgba(249, 115, 22, 0.45)';
      ctx.fillRect(boxLeft, boxTop, obstacle.w, obstacle.h + 10);

      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2;
      ctx.strokeRect(boxLeft, boxTop, obstacle.w, obstacle.h + 10);

      // Điểm tiếp đất bàn chân con vật (Anchor Point)
      ctx.fillStyle = '#c2410c';
      ctx.beginPath();
      ctx.arc(obstacle.x, obstacle.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Nhãn vật cản con vật
      const labelText = '⛔ ' + obstacle.id;
      const labelW = Math.max(60, obstacle.w);
      ctx.fillStyle = 'rgba(194, 65, 12, 0.9)';
      ctx.fillRect(obstacle.x - labelW / 2, boxTop - 15, labelW, 15);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(labelText, obstacle.x, boxTop - 4);
    }

    // 4. LƯỚI THƯỚC ĐO ĐƠN VỊ CHUẨN H-UNIT (1H = 96PX) & BÓNG THAM CHIẾU NHÂN VẬT
    ctx.save();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.18)';
    ctx.lineWidth = 1;

    // Các đường lưới dọc mỗi 1H (96px)
    for (let gx = 0; gx <= MAP_25D.WORLD_W; gx += WORLD_UNIT) {
      ctx.beginPath();
      ctx.moveTo(gx, 350);
      ctx.lineTo(gx, 700);
      ctx.stroke();

      const hIndex = Math.round(gx / WORLD_UNIT);
      ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.font = 'bold 9px monospace';
      ctx.fillText(`${hIndex}H`, gx + 2, 365);
    }

    // Các đường lưới ngang mỗi 1H (96px)
    for (let gy = 384; gy <= 672; gy += WORLD_UNIT) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(MAP_25D.WORLD_W, gy);
      ctx.stroke();
    }

    // 5. HIỂN THỊ THƯỚC ĐO H & BÓNG THAM CHIẾU NHÂN VẬT 1H CẠNH TỪNG VẬT THỂ
    for (const item of VILLAGE_SCENERY) {
      const hWidth = (item.width / WORLD_UNIT).toFixed(2);
      const hHeight = (item.height / WORLD_UNIT).toFixed(2);

      // Nhãn tỷ lệ H-Unit
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(item.x - 60, item.y - item.height - 18, 120, 16);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1;
      ctx.strokeRect(item.x - 60, item.y - item.height - 18, 120, 16);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`📏 ${hWidth}H × ${hHeight}H`, item.x, item.y - item.height - 6);

      // Vẽ bóng silhouette nhân vật tham chiếu 1H (96px) đứng cạnh vật thể
      const silX = item.x + item.width / 2 + 16;
      const silY = item.y;
      if (silX < MAP_25D.WORLD_W - 30) {
        // Thân nhân vật 1H (cao 96px)
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;

        // Đầu & Nón lá
        ctx.beginPath();
        ctx.arc(silX, silY - 82, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Nón lá tam giác
        ctx.beginPath();
        ctx.moveTo(silX - 16, silY - 84);
        ctx.lineTo(silX, silY - 96);
        ctx.lineTo(silX + 16, silY - 84);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Thân & Chân
        ctx.fillRect(silX - 10, silY - 72, 20, 48);
        ctx.strokeRect(silX - 10, silY - 72, 20, 48);
        ctx.fillRect(silX - 8, silY - 24, 6, 24);
        ctx.fillRect(silX + 2, silY - 24, 6, 24);

        // Nhãn 1.0H
        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('1.0H (96px)', silX, silY + 12);
      }
    }

    ctx.restore();
    ctx.restore();
  }
}
