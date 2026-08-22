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
import { RiceCrop } from './RiceCrop';
import { BambooGrove } from './BambooGrove';
import { BananaTree } from './BananaTree';
import { FishPond } from './FishPond';

export class FloraManager {
  public ground = new GroundPlatform();
  public wildGrass = new WildGrass();
  public riceCrop = new RiceCrop();
  public bamboo = new BambooGrove();
  public banana = new BananaTree();
  public fishPond = new FishPond();

  public mapWidth = 2800; // Mở rộng 2800m chứa trọn vẹn 4 đoạn Ao Cá
  public paddyStartX = 1800; // Đoạn 9 (1800m)
  public paddyEndX = 2600;   // Đoạn 13 (2600m)

  constructor() {
    // 1. Cụm Đại Lũy Tre Làng Cao Vút (Đoạn 5, 6: 840m -> 1060m)
    this.bamboo.instances = [
      { x: 860,  scale: 1.05, variant: 'green',  isFlipped: true,  phase: 0.1 },
      { x: 910,  scale: 1.32, variant: 'yellow', isFlipped: false, phase: 0.3 },
      { x: 960,  scale: 1.20, variant: 'green',  isFlipped: false, phase: 0.6 },
      { x: 1010, scale: 1.10, variant: 'yellow', isFlipped: true,  phase: 0.8 },
      { x: 1050, scale: 0.98, variant: 'green',  isFlipped: false, phase: 1.1 }
    ];

    // 2. Vùng Đồng Cỏ Hoa Làng Quê
    this.wildGrass.initFlowers(-300, 1200);

    // 3. Các cây chuối quanh bờ ao & trên đỉnh đồi cỏ
    this.banana.instances = [
      { x: 1100, scale: 1.15, hasFruit: true,  isFlipped: false, phase: 0.2 },
      { x: 1170, scale: 0.85, hasFruit: false, isFlipped: true,  phase: 0.6 },
      { x: 1480, scale: 1.25, hasFruit: true,  isFlipped: false, phase: 1.1 }, // Trên đỉnh đồi cỏ
      { x: 1550, scale: 0.78, hasFruit: false, isFlipped: true,  phase: 1.5 }  // Sườn đồi cỏ
    ];

    // 4. Thửa Ruộng Lúa Nước (Đoạn 9-13: từ 1800m -> 2600m)
    this.riceCrop.initRiceField(this.paddyStartX, this.paddyEndX);
  }

  public update(dt: number, groundY: number = 480): void {
    this.riceCrop.update(dt);
    this.fishPond.update(dt, groundY);
  }

  public renderBackgroundTrees(ctx: CanvasRenderingContext2D, groundY: number, animTimer: number, playerX?: number): void {
    this.bamboo.render(ctx, groundY, animTimer);
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
    // 1. Cỏ dại hoa tươi trên đường cỏ mở rộng (-450m -> 2800m), tự động né hồ cá và ruộng lúa
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
      this.paddyEndX
    );


    // 2. Lớp lúa tiền cảnh (Đứng trước che ngang người chơi tạo độ sâu 2.5D ngập lúa)
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
