/**
 * VillageMap25D.ts
 * Module quản lý hệ tọa độ & logic bản đồ Làng Quê 2.5D:
 * - Chuyển đổi tọa độ World → Screen (có scale theo viewport)
 * - Depth-sorting: entity gần camera (Y lớn) vẽ sau
 * - Collision detection: Chặn nhân vật đi vào nhà, sông
 * - Camera 2.5D: Bám theo nhân vật, giới hạn biên
 */

import {
  MAP_25D,
  WALKABLE_POLYGON,
  ANIMAL_OBSTACLES,
  AnimalObstacle,
  VILLAGE_SCENERY,
  SceneryItem,
} from './VillageMapData';

// ============================================================
// CAMERA 2.5D
// ============================================================

export interface Camera25D {
  x: number; // World-space offset X
  y: number; // World-space offset Y
  scale: number; // Zoom scale (fit viewport)
}

// ============================================================
// DEPTH SORTABLE INTERFACE
// ============================================================

export interface DepthSortable {
  depthY: number;
  render: (ctx: CanvasRenderingContext2D) => void;
}

// ============================================================
// VILLAGE MAP 2.5D CLASS
// ============================================================

export class VillageMap25D {
  public camera: Camera25D = { x: 0, y: 0, scale: 1 };

  /** Tải tất cả ảnh scenery items */
  private sceneryImages: Map<string, HTMLImageElement> = new Map();
  private imagesLoaded: boolean = false;

  constructor() {
    this.loadSceneryImages();
  }

  // ============================================================
  // ASSET LOADING
  // ============================================================

  private loadSceneryImages(): void {
    let loadCount = 0;
    const totalItems = VILLAGE_SCENERY.length;

    for (const item of VILLAGE_SCENERY) {
      const img = new Image();
      img.src = item.imagePath ? (item.imagePath.includes('?') ? item.imagePath : `${item.imagePath}?v=3`) : '';
      img.onload = () => {
        loadCount++;
        if (loadCount >= totalItems) {
          this.imagesLoaded = true;
        }
      };
      img.onerror = () => {
        // Ảnh chưa tồn tại — vẽ placeholder
        loadCount++;
        if (loadCount >= totalItems) {
          this.imagesLoaded = true;
        }
      };
      this.sceneryImages.set(item.id, img);
    }
  }

  public getSceneryImage(id: string): HTMLImageElement | undefined {
    return this.sceneryImages.get(id);
  }

  // ============================================================
  // CAMERA — FIT VIEWPORT & FOLLOW PLAYER
  // ============================================================

  /**
   * Cập nhật camera để fit bản đồ vào viewport và bám theo nhân vật
   */
  public updateCamera(
    viewportW: number,
    viewportH: number,
    playerWorldX: number,
    playerWorldY: number
  ): void {
    // Scale sao cho world fit vào viewport (giữ aspect ratio, lấy min scale)
    const scaleX = viewportW / MAP_25D.WORLD_W;
    const scaleY = viewportH / MAP_25D.WORLD_H;
    this.camera.scale = Math.max(scaleX, scaleY); // Fill viewport

    // Kích thước thế giới sau scale
    const scaledW = MAP_25D.WORLD_W * this.camera.scale;
    const scaledH = MAP_25D.WORLD_H * this.camera.scale;

    // Tâm camera theo player (world space → screen space)
    let targetX = playerWorldX * this.camera.scale - viewportW / 2;
    let targetY = playerWorldY * this.camera.scale - viewportH / 2;

    // Clamp camera không vượt biên thế giới
    const maxOffX = Math.max(0, scaledW - viewportW);
    const maxOffY = Math.max(0, scaledH - viewportH);
    targetX = Math.max(0, Math.min(maxOffX, targetX));
    targetY = Math.max(0, Math.min(maxOffY, targetY));

    // Smooth lerp
    this.camera.x += (targetX - this.camera.x) * 0.08;
    this.camera.y += (targetY - this.camera.y) * 0.08;
  }

  // ============================================================
  // COORDINATE CONVERSION
  // ============================================================

  /** World → Screen X */
  public worldToScreenX(wx: number): number {
    return wx * this.camera.scale - this.camera.x;
  }

  /** World → Screen Y */
  public worldToScreenY(wy: number): number {
    return wy * this.camera.scale - this.camera.y;
  }

  /** World size → Screen size */
  public worldToScreenSize(size: number): number {
    return size * this.camera.scale;
  }

  // ============================================================
  // COLLISION — CAN PLAYER WALK TO (wx, wy)?
  // ============================================================

  /**
   * Kiểm tra vị trí (wx, wy) có nằm trong WALKABLE_POLYGON uốn lượn hay không
   */
  public isInsideWalkablePolygon(wx: number, wy: number): boolean {
    const poly = WALKABLE_POLYGON;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;

      const intersect =
        yi > wy !== yj > wy &&
        wx < ((xj - xi) * (wy - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  /**
   * Kiểm tra xem vị trí (wx, wy) trong world space có đi được không
   */
  public canWalkTo(
    wx: number,
    wy: number,
    playerW: number = 16,
    dynamicObstacles?: AnimalObstacle[]
  ): boolean {
    // 1. Phải nằm hoàn toàn bên trong WALKABLE POLYGON đường làng uốn lượn
    if (!this.isInsideWalkablePolygon(wx, wy)) {
      return false;
    }

    // 2. Kiểm tra va chạm AABB với các Scenery Items (Nhà cửa, Giếng nước, Cây cối)
    for (const item of VILLAGE_SCENERY) {
      if (!item.blocking || !item.collisionBox) continue;

      const cb = item.collisionBox;
      const boxLeft = item.x + cb.offX;
      const boxRight = boxLeft + cb.w;
      const boxTop = item.y + cb.offY;
      const boxBottom = boxTop + cb.h;

      if (
        wx + playerW / 2 > boxLeft &&
        wx - playerW / 2 < boxRight &&
        wy > boxTop &&
        wy < boxBottom
      ) {
        return false;
      }
    }

    // 3. Kiểm tra va chạm AABB với Thú nuôi & Con vật (Trâu, Lợn, Gà, Cò, Bé Sinh...)
    const obstacles = dynamicObstacles ?? ANIMAL_OBSTACLES;
    for (const obstacle of obstacles) {
      const boxLeft = obstacle.x - obstacle.w / 2;
      const boxRight = obstacle.x + obstacle.w / 2;
      const boxTop = obstacle.y - obstacle.h * 0.5;
      const boxBottom = obstacle.y + 6;

      if (
        wx + playerW / 2 > boxLeft &&
        wx - playerW / 2 < boxRight &&
        wy > boxTop &&
        wy < boxBottom
      ) {
        return false;
      }
    }

    return true;
  }

  // ============================================================
  // DEPTH SORTING — SẮP XẾP CÁC ENTITY THEO Y
  // ============================================================

  /**
   * Sắp xếp một danh sách các drawable items theo depthY (tăng dần)
   * Items có depthY nhỏ (xa camera) vẽ trước, depthY lớn (gần camera) vẽ sau
   */
  public depthSort(items: DepthSortable[]): DepthSortable[] {
    return items.sort((a, b) => a.depthY - b.depthY);
  }

  /**
   * Lấy depthY cho scenery item
   */
  public getSceneryDepthY(item: SceneryItem): number {
    return item.depthY ?? item.y;
  }
}
