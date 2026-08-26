/**
 * FloraManager.ts
 * Bộ điều phối hệ thống Thực Vật & Cảnh Quan Làng Quê Mở Rộng:
 * - Đoạn 1, 2, 3, 4 (X: 0m -> 800m): Ao Cá / Đầm Sen Làng Quê Nước Biếc
 * - Đoạn 5, 6 (X: 800m -> 1200m): Cụm Đại Lũy Tre Xanh & Vườn Chuối Bờ Hồ
 * - Đoạn 7, 8 (X: 1200m -> 1800m): Mô Đất / Đồi Cỏ Xanh Cao Ráo
 * - Đoạn 9, 10, 11, 12, 13 (X: 1800m -> 2600m): Thửa Ruộng Lúa Nước Bạt Ngàn
 * - Đoạn 14 (X: 2600m -> 2800m): Bờ Đê Cuối Bản Đồ
 */

import { GroundPlatform } from './GroundPlatform';
import { WildGrass } from './WildGrass';
import { WildFlower } from './WildFlower';
import { RiceCrop } from './RiceCrop';
import { BambooGrove } from './BambooGrove';
import { BananaTree } from './BananaTree';
import { FishPond } from './FishPond';
import { VillageHouse } from '../scenery/VillageHouse';
import { ToolRack } from '../scenery/ToolRack';
export class FloraManager {
  public ground = new GroundPlatform();
  public wildGrass = new WildGrass();
  public wildFlower = new WildFlower();
  public riceCrop = new RiceCrop();
  public bamboo = new BambooGrove();
  public banana = new BananaTree();
  public fishPond = new FishPond();
  public house = new VillageHouse();
  public toolRack = new ToolRack();

  public mapWidth = 4200; // Mở rộng 4200m (Thêm 7 phân đoạn Lũy Tre Làng)
  public paddyStartX = 3200; // Ruộng Lúa Nước (3200m -> 4000m)
  public paddyEndX = 4000;

  constructor() {
    // 1. Cụm Đại Lũy Tre Làng 9 Phân Đoạn (800m -> 2600m) đã được khởi tạo trong BambooGrove

    // 2. Vùng Đồng Cỏ Hoa Làng Quê Mở Rộng Sang Phía Tây (-1200m -> 4200m)
    this.wildGrass.initFlowers(-1200, 4200);

    // 3. Các cây chuối cuối lũy tre & trên đỉnh đồi cỏ
    this.banana.instances = [
      { x: 2520, scale: 1.15, hasFruit: true,  isFlipped: false, phase: 0.2 },
      { x: 2580, scale: 0.85, hasFruit: false, isFlipped: true,  phase: 0.6 },
      { x: 2880, scale: 1.25, hasFruit: true,  isFlipped: false, phase: 1.1 }, // Trên đỉnh đồi cỏ
      { x: 2960, scale: 0.78, hasFruit: false, isFlipped: true,  phase: 1.5 }  // Sườn đồi cỏ
    ];

    // 4. Thửa Ruộng Lúa Nước 4 Giai Đoạn (từ 3200m -> 4000m)
    this.riceCrop.initRiceField(this.paddyStartX, this.paddyEndX);
  }

  public update(dt: number, groundY: number = 480, playerX?: number, playerVx: number = 0): void {
    this.riceCrop.update(dt);
    this.fishPond.update(dt, groundY);
    this.house.update(dt, groundY);
    this.toolRack.update(dt, playerX, playerVx);
  }

  public renderBackgroundTrees(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    animTimer: number,
    playerX?: number,
    cameraX: number = 0,
    screenW: number = 1400
  ): void {
    // 1. Vẽ Ngôi Nhà Mái Tranh tại Đoạn 12 - 13 (Hậu cảnh ấm cúng)
    this.house.render(ctx, groundY, animTimer, cameraX, screenW);
    // 2. Vẽ Giá Treo Khung Tre Đứng (Đầy đủ dụng cụ)
    this.toolRack.render(ctx, groundY, animTimer, cameraX, screenW);
    // 4. Vẽ Rặng Tre Làng và Vườn Chuối
    this.bamboo.render(ctx, groundY, animTimer, cameraX, screenW, playerX);
    this.banana.render(ctx, groundY, animTimer, playerX);
  }

  public renderGround(ctx: CanvasRenderingContext2D, width: number, height: number, groundY: number, animTimer: number = 0, playerX?: number): void {
    this.ground.render(ctx, this.mapWidth, height, groundY);
    this.fishPond.render(ctx, groundY, animTimer, playerX);
  }

  /**
   * Render Lớp Hậu Cảnh Ruộng Lúa (Mặt nước xanh biếc + Lớp lúa sau người)
   */
  public renderRiceBackground(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    playerX: number,
    animTimer: number,
    cameraX: number = 0,
    screenW: number = 1400
  ): void {
    this.riceCrop.render(ctx, groundY, playerX, animTimer, cameraX, screenW, 'background');
  }

  public showWildGrass: boolean = true; // Bật lớp cỏ hoa vẽ tay phủ tự nhiên lên nền đất nâu

  /**
   * Render Lớp Tiền Cảnh (Cây lúa tiền cảnh che ngang người chơi + Cỏ hoa đường làng)
   */
  public renderForegroundFlora(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    playerX: number,
    animTimer: number,
    cameraX: number = 0,
    screenW: number = 1400
  ): void {
    // 1. Cỏ dại hoa tươi trên đường cỏ mở rộng
    if (this.showWildGrass) {
      this.wildGrass.render(
        ctx,
        groundY,
        playerX,
        animTimer,
        -450,
        this.mapWidth,
        this.fishPond.startX,
        this.fishPond.endX,
        this.paddyStartX,
        this.paddyEndX,
        cameraX,
        screenW
      );
    }

    // 2. Hoa Dại Đồng Quê (Hoa Xuyến Chi, Hoa Cỏ May, Hoa Chua Me Đất Vàng)
    this.wildFlower.render(ctx, groundY, animTimer, playerX, cameraX, screenW);

    // 3. Lớp lúa tiền cảnh (Đứng trước che ngang người chơi tạo độ sâu 2.5D ngập lúa)
    this.riceCrop.render(ctx, groundY, playerX, animTimer, cameraX, screenW, 'foreground');
  }

  // TƯƠNG TÁC CÂY CHUỐI (ĐÀO & BỨNG TRỒNG)
  public findNearbyBanana(playerX: number, maxDist: number = 75) {
    return this.banana.findNearby(playerX, maxDist);
  }

  public digUpBanana(playerX: number): import('./BananaTree').BananaInstance | null {
    const nearby = this.banana.findNearby(playerX, 75);
    if (nearby) {
      return this.banana.removeAt(nearby.index);
    }
    return null;
  }

  public removeBanana(banana: import('./BananaTree').BananaInstance): boolean {
    return this.banana.removeBanana(banana);
  }

  public plantBanana(playerX: number, template?: Partial<import('./BananaTree').BananaInstance>): import('./BananaTree').BananaInstance {
    return this.banana.plantAt(playerX, template);
  }

  // TƯƠNG TÁC NÔNG NGHIỆP RUỘNG LÚA
  public plantSeedling(playerX: number, groundY: number): boolean {
    return this.riceCrop.plantSeedling(playerX, groundY);
  }

  public waterNearbyRice(playerX: number): boolean {
    return this.riceCrop.waterNearby(playerX);
  }

  public harvestNearbyRice(playerX: number): { harvested: boolean; count: number } {
    return this.riceCrop.harvestNearby(playerX);
  }
}
