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

export interface YSortableEntity {
  feetY: number;
  render: (ctx: CanvasRenderingContext2D) => void;
}

// ============================================================
// RIVER ANIMATION STATE
// ============================================================
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

  // River animation
  private waves: RiverWave[] = [];
  private lotuses: LotusFloat[] = [];
  private animTimer: number = 0;

  constructor(map: VillageMap25D) {
    this.map = map;
    this.loadTextures();
    this.initRiverDecor();
  }

  // ============================================================
  // ASSET LOADING
  // ============================================================

  private loadTextures(): void {
    this.groundImg.src = GROUND_TEXTURE_PATH;
    this.groundImg.onload = () => { this.groundLoaded = true; };

    this.riverImg.src = RIVER_TEXTURE_PATH;
    this.riverImg.onload = () => { this.riverLoaded = true; };

    this.riverbankImg.src = RIVERBANK_TEXTURE_PATH;
    this.riverbankImg.onload = () => { this.riverbankLoaded = true; };
  }

  private initRiverDecor(): void {
    // Gợn sóng nước
    for (let i = 0; i < 24; i++) {
      this.waves.push({
        x: Math.random() * MAP_25D.WORLD_W,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5,
        amplitude: 2 + Math.random() * 3,
      });
    }

    // Hoa sen & lá sen trôi trên sông (Mở rộng 3200px)
    const lotusDefs: Array<{ x: number; y: number; type: 'flower' | 'leaf' }> = [
      { x: 200, y: 720, type: 'leaf' },
      { x: 350, y: 750, type: 'flower' },
      { x: 500, y: 730, type: 'leaf' },
      { x: 650, y: 760, type: 'flower' },
      { x: 850, y: 720, type: 'leaf' },
      { x: 1000, y: 745, type: 'flower' },
      { x: 1150, y: 735, type: 'leaf' },
      { x: 1350, y: 755, type: 'leaf' },

      // Phân đoạn 2 (1600m -> 3200m)
      { x: 1800, y: 720, type: 'leaf' },
      { x: 1950, y: 750, type: 'flower' },
      { x: 2100, y: 730, type: 'leaf' },
      { x: 2250, y: 760, type: 'flower' },
      { x: 2450, y: 720, type: 'leaf' },
      { x: 2600, y: 745, type: 'flower' },
      { x: 2750, y: 735, type: 'leaf' },
      { x: 2950, y: 755, type: 'leaf' },
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
  }

  // ============================================================
  // UPDATE
  // ============================================================

  public update(dt: number): void {
    this.animTimer += dt;
  }

  // ============================================================
  // MAIN RENDER
  // ============================================================

  // ============================================================
  // MAIN RENDER (7-LAYER RENDERING PIPELINE)
  // ============================================================

  /**
   * Render toàn bộ cảnh làng 2.5D theo quy chuẩn 7 Lớp Hình Ảnh
   * @param playerFeetY - vị trí Y bàn chân nhân vật để Y-sorting
   * @param renderPlayer - callback vẽ nhân vật
   * @param animalRenderers - danh sách callback vẽ từng con vật kèm feetY riêng biệt
   */
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

    // LỚP 2: GROUND — Toàn bộ nền đất/cỏ đường làng
    this.renderGround(ctx);

    // LỚP 3: BACK OBJECTS — Cụm tre xa / Cảnh quan phía sau (depthY < 380)
    this.renderBackObjects(ctx);

    // LỚP 4: Y-SORTED MAIN LAYER — Nhà cửa, Cây cối, Giếng nước, Nhân vật & Từng con vật (Y-sorting chung)
    this.renderYSortedMainLayer(ctx, playerFeetY, renderPlayer, animalRenderers);

    // LỚP 5: FRONT EDGE — Bờ đá & dải cỏ sát bờ sông
    this.renderRiverbank(ctx);

    // LỚP 6: WATER — Mặt sông nước, hoa sen, lá sen, thuyền nan lắc lư
    this.renderRiver(ctx);
    this.renderLotuses(ctx);

    // LỚP OVERLAY: Ranh giới đa giác vùng di chuyển & khối cản (Chỉ vẽ khi BẬT)
    if (showWalkableBoundaries) {
      this.renderWalkableBoundaries(ctx, dynamicObstacles);
    }

    ctx.restore();
  }

  // ============================================================
  // LỚP 1: NỀN ĐẤT SÂN LÀNG
  // ============================================================

  private renderGround(ctx: CanvasRenderingContext2D): void {
    const gTop = MAP_25D.HOUSE_ZONE_TOP;
    const gBottom = MAP_25D.RIVERBANK_BOTTOM;

    // 1. Nền cỏ xanh tươi phẳng tự nhiên (Tông màu cỏ mượt chuẩn mẫu mới)
    const groundGrad = ctx.createLinearGradient(0, gTop, 0, gBottom);
    groundGrad.addColorStop(0, '#647b2c'); // Cỏ xanh mượt phía trên (gần nhà)
    groundGrad.addColorStop(0.5, '#586f24'); // Vùng cỏ tươi
    groundGrad.addColorStop(1, '#4c601d'); // Cỏ mượt ven bờ

    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, gTop, MAP_25D.WORLD_W, gBottom - gTop);

    // 2. Dải Đường Đất Vàng Ấm Nối Liền Mạch (Hand-drawn Dirt Road)
    if (this.groundLoaded && this.groundImg.complete && this.groundImg.naturalWidth > 0) {
      const roadY = 380;
      const roadH = 195;
      const aspect = this.groundImg.naturalWidth / this.groundImg.naturalHeight;
      const tileW = roadH * aspect;

      ctx.save();
      ctx.globalAlpha = 0.88;
      for (let x = 0; x < MAP_25D.WORLD_W; x += tileW - 1) {
        ctx.drawImage(this.groundImg, x, roadY, tileW, roadH);
      }
      ctx.restore();
    }
  }

  // ============================================================
  // LỚP 2: BỜ SÔNG CHUẨN MẪU PNG MỚI TRONG SUỐT 1024x259 (HAND-DRAWN RIVERBANK PNG)
  // ============================================================

  private renderRiverbank(ctx: CanvasRenderingContext2D): void {
    const bTop = 535;
    const bH = 150;

    // 1. Vẽ dải bờ sông PNG mới trong suốt chuẩn 100% từ ảnh mẫu của người dùng
    if (this.riverbankLoaded && this.riverbankImg.complete && this.riverbankImg.naturalWidth > 0) {
      const aspect = this.riverbankImg.naturalWidth / this.riverbankImg.naturalHeight;
      const tileW = bH * aspect;

      for (let x = 0; x < MAP_25D.WORLD_W; x += tileW - 1) {
        ctx.drawImage(this.riverbankImg, x, bTop, tileW, bH);
      }
    } else {
      // Fallback: Đất ẩm & đá
      ctx.fillStyle = '#586f24';
      ctx.fillRect(0, bTop, MAP_25D.WORLD_W, bH);
    }

    // 2. Mảng bóng tối phản chiếu xanh thẫm dưới mép nước sát bờ
    const shadowGrad = ctx.createLinearGradient(0, bTop + bH - 12, 0, bTop + bH + 24);
    shadowGrad.addColorStop(0, 'rgba(12, 40, 35, 0.75)');
    shadowGrad.addColorStop(1, 'rgba(12, 40, 35, 0.0)');
    ctx.fillStyle = shadowGrad;
    ctx.fillRect(0, bTop + bH - 12, MAP_25D.WORLD_W, 36);
  }

  // ============================================================
  // LỚP 3: MẶT SÔNG NƯỚC
  // ============================================================

  private renderRiver(ctx: CanvasRenderingContext2D): void {
    const rTop = MAP_25D.RIVER_TOP;
    const rBottom = MAP_25D.RIVER_BOTTOM;

    if (this.riverLoaded && this.riverImg.complete && this.riverImg.naturalWidth > 0) {
      ctx.drawImage(this.riverImg, 0, rTop, MAP_25D.WORLD_W, rBottom - rTop);
    } else {
      // Fallback: Nước xanh
      ctx.fillStyle = '#3a8a7a';
      ctx.fillRect(0, rTop, MAP_25D.WORLD_W, rBottom - rTop);

      // Nước trong hơn ở giữa
      ctx.fillStyle = 'rgba(72, 166, 167, 0.5)';
      ctx.fillRect(0, rTop + 20, MAP_25D.WORLD_W, rBottom - rTop - 40);
    }

    // Gợn sóng nước animation
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.2;
    for (const wave of this.waves) {
      const waveY = rTop + 30 + ((wave.x * 0.3) % (rBottom - rTop - 60));
      const offsetX = Math.sin(this.animTimer * wave.speed + wave.phase) * 20;
      ctx.beginPath();
      ctx.moveTo(wave.x - 30 + offsetX, waveY);
      ctx.quadraticCurveTo(
        wave.x + offsetX,
        waveY - wave.amplitude * Math.sin(this.animTimer * wave.speed * 1.5),
        wave.x + 30 + offsetX,
        waveY
      );
      ctx.stroke();
    }
  }

  // ============================================================
  // HOA SEN & LÁ SEN TRÊN SÔNG
  // ============================================================

  private renderLotuses(ctx: CanvasRenderingContext2D): void {
    for (const lotus of this.lotuses) {
      const bobY = lotus.y + Math.sin(this.animTimer * 0.8 + lotus.phase) * 2;
      const bobX = lotus.x + Math.sin(this.animTimer * 0.3 + lotus.phase * 2) * 3;

      if (lotus.type === 'leaf') {
        // Lá sen tròn xanh
        ctx.fillStyle = '#2d7a3a';
        ctx.beginPath();
        ctx.ellipse(bobX, bobY, lotus.size, lotus.size * 0.65, 0.1, 0, Math.PI * 2);
        ctx.fill();
        // Gân lá
        ctx.strokeStyle = 'rgba(100, 200, 100, 0.5)';
        ctx.lineWidth = 0.8;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.moveTo(bobX, bobY);
          ctx.lineTo(bobX + Math.cos(a) * lotus.size * 0.8, bobY + Math.sin(a) * lotus.size * 0.5);
          ctx.stroke();
        }
      } else {
        // Hoa sen hồng
        const petalCount = 8;
        for (let i = 0; i < petalCount; i++) {
          const angle = (i / petalCount) * Math.PI * 2 + this.animTimer * 0.05;
          const px = bobX + Math.cos(angle) * lotus.size * 0.5;
          const py = bobY + Math.sin(angle) * lotus.size * 0.3;
          ctx.fillStyle = i % 2 === 0 ? '#f472b6' : '#ec4899';
          ctx.beginPath();
          ctx.ellipse(px, py, 5, 8, angle, 0, Math.PI * 2);
          ctx.fill();
        }
        // Nhụy vàng
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(bobX, bobY, 4, 0, Math.PI * 2);
        ctx.fill();
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
      // Giữ đúng 100% tỷ lệ khung hình tự nhiên của ảnh gốc (Tự động tính theo naturalAspect)
      const aspect = img.naturalWidth / img.naturalHeight;
      let renderW = item.width;
      let renderH = item.height;

      if (item.width && item.height) {
        // Ưu tiên chiều rộng khai báo và tính chiều cao chuẩn theo aspect ratio tự nhiên
        renderH = renderW / aspect;
      } else if (item.width) {
        renderH = renderW / aspect;
      } else if (item.height) {
        renderW = renderH * aspect;
      } else {
        renderW = img.naturalWidth;
        renderH = img.naturalHeight;
      }

      const dX = item.x - renderW / 2;
      const dY = item.y - renderH;

      // Vẽ ảnh PNG (hỗ trợ flipX)
      if (item.flipX) {
        ctx.save();
        ctx.translate(item.x, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(img, -renderW / 2, dY, renderW, renderH);
        ctx.restore();
      } else {
        ctx.drawImage(img, dX, dY, renderW, renderH);
      }
    } else {
      // PLACEHOLDER: Vẽ hình chữ nhật + tên
      this.renderPlaceholder(ctx, item, drawX, drawY);
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

    ctx.restore();
  }
}
