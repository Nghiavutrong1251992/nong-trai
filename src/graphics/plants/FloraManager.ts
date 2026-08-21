/**
 * FloraManager.ts
 * Bộ điều phối hệ thống Thực Vật & Thửa Ruộng Lúa Nước (Kích thước 1/4: 660px)
 */

import { GroundPlatform } from './GroundPlatform';
import { WildGrass } from './WildGrass';
import { RiceCrop } from './RiceCrop';
import { BambooGrove } from './BambooGrove';
import { BananaTree } from './BananaTree';

export class FloraManager {
  public ground = new GroundPlatform();
  public wildGrass = new WildGrass();
  public riceCrop = new RiceCrop();
  public bamboo = new BambooGrove();
  public banana = new BananaTree();

  public mapWidth = 2400; // Tổng chiều dài bản đồ làng quê gọn gàng
  public paddyStartX = 1400; // Đoạn 8 (1400m)
  public paddyEndX = 2200;   // Đoạn 11 (2200m)

  constructor() {
    // 1. Cụm Đại Lũy Tre Làng Cao Vút, dày dặn đan cài nhiều lớp (Đoạn 2: 200m -> 400m)
    this.bamboo.instances = [
      { x: 230, scale: 1.05, variant: 'green',  isFlipped: true,  phase: 0.1 }, // Bụi tre xanh cao vút bên trái
      { x: 275, scale: 1.32, variant: 'yellow', isFlipped: false, phase: 0.3 }, // Cụm tre già cao lớn uy nghi trung tâm
      { x: 315, scale: 1.20, variant: 'green',  isFlipped: false, phase: 0.6 }, // Cụm tre xanh dày vươn cao
      { x: 350, scale: 1.10, variant: 'yellow', isFlipped: true,  phase: 0.8 }, // Cụm tre vàng nứa đan bên phải
      { x: 380, scale: 0.98, variant: 'green',  isFlipped: false, phase: 1.1 }  // Bụi tre xanh bên phải
    ];

    // 2. Vùng Đồng Cỏ Hoa Làng Quê (Đoạn 1-4: 20m -> 800m & Đoạn 12: 2220m -> 2380m)
    this.wildGrass.initFlowers(20, 800);

    // 3. Các cây chuối (Đoạn 3: 480m, 550m & Đoạn 6 trên gò cao: 1080m, 1150m)
    this.banana.instances = [
      { x: 480,  scale: 1.15, hasFruit: true,  isFlipped: false, phase: 0.2 },
      { x: 550,  scale: 0.72, hasFruit: false, isFlipped: true,  phase: 0.6 },
      { x: 1080, scale: 1.25, hasFruit: true,  isFlipped: false, phase: 1.1 },
      { x: 1150, scale: 0.78, hasFruit: false, isFlipped: true,  phase: 1.5 }
    ];

    // 4. Thửa Ruộng Lúa Nước (4 Đoạn: Đoạn 8, 9, 10, 11 từ 1400m -> 2200m)
    this.riceCrop.initRiceField(this.paddyStartX, this.paddyEndX);
  }

  public update(dt: number): void {
    this.riceCrop.update(dt);
  }

  public renderBackgroundTrees(ctx: CanvasRenderingContext2D, groundY: number, animTimer: number): void {
    this.bamboo.render(ctx, groundY, animTimer);
    this.banana.render(ctx, groundY, animTimer);
  }

  public renderGround(ctx: CanvasRenderingContext2D, width: number, height: number, groundY: number): void {
    this.ground.render(ctx, this.mapWidth, height, groundY);
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
    // 1. Cỏ dại hoa tươi trên đường cỏ mở rộng (-450m -> 2400m)
    this.wildGrass.render(ctx, groundY, playerX, animTimer, -450, 2400);

    // 2. Lớp lúa tiền cảnh (Đứng trước che ngang người chơi tạo độ sâu 2.5D ngập lúa)
    this.riceCrop.render(ctx, groundY, playerX, animTimer, cameraX, screenW, 'foreground');
  }

  // TƯƠNG TÁC NÔNG NGHIỆP
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
