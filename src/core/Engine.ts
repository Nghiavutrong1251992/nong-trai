/**
 * Engine.ts
 * Nhạc trưởng điều phối lõi Game Loop, Thế giới & Dữ liệu:
 * - Canvas & DPR Scaling
 * - Vòng lặp trò chơi Update & Render
 * - Quản lý Lưu / Tải thế giới (SaveManager)
 * - Điều phối InputController, WorldRenderer, StudioRenderer và Entities
 */

import { SoundManager } from './SoundManager';
import { Player } from '../entities/Player';
import { Buffalo } from '../entities/Buffalo';
import { Cow } from '../entities/Cow';
import { Calf } from '../entities/Calf';
import { Stork } from '../entities/Stork';
import { FluteKite } from '../entities/FluteKite';
import { VegetableGirl } from '../entities/VegetableGirl';
import { FloraManager } from '../graphics/plants/FloraManager';
import { SaveManager } from './SaveManager';
import { InputController } from './InputController';
import { WorldRenderer } from '../graphics/WorldRenderer';
import { StudioRenderer } from '../graphics/StudioRenderer';

export class Engine {
  public canvas!: HTMLCanvasElement;
  public ctx!: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private dpr: number = 1;
  public width: number = window.innerWidth;
  public height: number = window.innerHeight;

  // Entities & Graphics Managers
  public sound = new SoundManager();
  public player = new Player(400, 480);
  public buffalo = new Buffalo(560, 480);
  public calf = new Calf(690, 480);
  public stork = new Stork(1250, 480);
  public fluteKite = new FluteKite();
  public cow = new Cow(960, 480);
  public vegetableGirl = new VegetableGirl(820, 480);
  public floraManager = new FloraManager();

  // Sub-modules
  public inputController = new InputController(this);
  public worldRenderer = new WorldRenderer(this);
  public studioRenderer = new StudioRenderer(this);

  // Game States
  public currentMode: 'map1' | 'studio' = 'map1';
  public groundY: number = 480;
  public animTimer: number = 0;
  public cameraX: number = 0;
  public mapWidth: number = 2400; // Chiều dài Map 1 Mở Rộng (2400px)
  public showMapRuler: boolean = true; // Bật/Tắt Lưới Thước Đo [G]
  public showAnimalLabels: boolean = false; // Bật/Tắt Phụ Đề Nhãn Tên Thú Nuôi [N] (Mặc định TẮT)
  public showCow: boolean = false; // Ẩn / Hiện Bò Nâu (Mặc định Ẩn)
  public showVegetableGirl: boolean = false; // Ẩn / Hiện Bé Miến Bán Rau (Mặc định Ẩn)

  public start(): void {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();

    this.inputController.bindEvents();

    // 1. Tải và phục hồi dữ liệu thế giới từ localStorage
    const saved = SaveManager.load();
    if (saved) {
      if (saved.bananas && Array.isArray(saved.bananas) && saved.bananas.length > 0) {
        this.floraManager.banana.instances = saved.bananas;
      }
      if (saved.player) {
        this.player.x = saved.player.x ?? 450;
        this.player.carriedBananas = saved.player.carriedBananas ?? [];
        this.player.coins = saved.player.coins ?? 250;
      }
      if (saved.riceCrop) {
        this.floraManager.riceCrop.harvestedGrains = saved.riceCrop.harvestedGrains ?? 0;
        if (saved.riceCrop.plants) {
          this.floraManager.riceCrop.loadSavedPlants(saved.riceCrop.plants);
        }
      }
      this.showToast('💾 Đã khôi phục vị trí cây trồng & thế giới từ lần chơi trước!');
    } else {
      this.player.x = 450;
      this.showToast('🌾 Không gian sạch sẵn sàng để xây dựng Cỏ & Cây!');
    }
    this.player.y = this.groundY;

    // Tự động lưu tức thì trước khi reload hoặc đóng tab
    window.addEventListener('beforeunload', () => this.saveCurrentStateImmediate());

    requestAnimationFrame((t) => this.loop(t));
  }

  public saveCurrentState(): void {
    SaveManager.debouncedSave(
      this.player.x,
      this.player.carriedBananas,
      this.player.coins,
      this.floraManager.banana.instances,
      this.floraManager.riceCrop.harvestedGrains,
      this.floraManager.riceCrop.plants
    );
  }

  public saveCurrentStateImmediate(): void {
    SaveManager.save(
      this.player.x,
      this.player.carriedBananas,
      this.player.coins,
      this.floraManager.banana.instances,
      this.floraManager.riceCrop.harvestedGrains,
      this.floraManager.riceCrop.plants
    );
  }

  public resetWorld(): void {
    SaveManager.clearSave();
    this.floraManager.banana.instances = [];
    this.floraManager.riceCrop.harvestedGrains = 0;
    this.floraManager.riceCrop.plants = [];
    this.player.carriedBananas = [];
    this.player.coins = 250;
    this.player.x = 450;
    this.cameraX = 0;
    this.saveCurrentStateImmediate();
    this.showToast('🔄 Đã đặt lại thế giới về trạng thái ban đầu sạch sẽ!');
    this.inputController.updateActionButtonsUI();
  }

  private resizeCanvas(): void {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
    const maxDpr = isMobile ? 1.75 : 2.0;
    this.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);

    this.groundY = Math.round(this.height * 0.85);
    if (this.player) {
      this.player.y = this.groundY;
    }
  }

  public showToast(msg: string): void {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 2400);
  }

  private loop(timestamp: number): void {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame((t) => this.loop(t));
  }

  private update(dt: number): void {
    this.animTimer += dt;

    if (this.currentMode === 'map1') {
      // 1. Cập nhật Player & Physics
      this.player.update(dt, this.inputController.input, this.groundY, this.sound);

      // Cập nhật Cây Chuối & Cây Trồng
      this.floraManager.update(dt);

      // Hoàn tất bứng cây chuối khi cuốc xong
      if (this.inputController.pendingDigBanana && this.player.actionTimer <= 0) {
        const removed = this.floraManager.removeBanana(this.inputController.pendingDigBanana.banana);
        if (removed) {
          this.player.carriedBananas.push(this.inputController.pendingDigBanana.banana);
          this.sound.play('coin');
          this.showToast(`🎋 Bứng cây chuối thành công! Cất vào túi (x${this.player.carriedBananas.length})`);
          this.saveCurrentState();
        }
        this.inputController.pendingDigBanana = null;
        this.inputController.updateActionButtonsUI();
      }

      // Cập nhật Chú Trâu Mẹ
      this.buffalo.update(dt, this.groundY);

      // Cập nhật Nghé Con (Lon ton theo mẹ)
      this.calf.update(dt, this.groundY, this.buffalo.x);

      // Cập nhật Con Cò Trắng (Đứng ngắm cảnh, cất cánh & sà xuống ruộng lúa)
      this.stork.update(dt, this.groundY, this.player.x);

      // Cập nhật Diều Sáo Dân Gian
      this.fluteKite.update(dt, this.player.x, this.player.y, this.player.vx, this.player.facing);

      // Cập nhật Chú Bò Nâu Làng Quê (Tạm ẩn theo yêu cầu)
      if (this.showCow) {
        this.cow.update(dt, this.groundY);
      }

      // Cập nhật Cô Bé Bán Rau (Bé Miến) (Tạm ẩn theo yêu cầu)
      if (this.showVegetableGirl) {
        this.vegetableGirl.update(dt, this.groundY, this.player.x);
      }

      // 2. Camera bám theo nhân vật mượt mà
      const targetCamX = this.player.x - this.width / 2;
      const minCamX = -400;
      const maxCamX = Math.max(0, this.mapWidth - this.width + 400);
      const clampedTarget = Math.max(minCamX, Math.min(maxCamX, targetCamX));
      this.cameraX += (clampedTarget - this.cameraX) * Math.min(1.0, dt * 8);

      // Cập nhật nhãn nút bấm
      this.inputController.updateActionButtonsUI();
    }
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.currentMode === 'map1') {
      this.renderMap1(ctx);
    } else {
      this.studioRenderer.render(ctx, this.width, this.height, this.animTimer);
    }
  }

  /**
   * MAP 1: CẢNH QUAN LÀNG QUÊ MỞ RỘNG (ĐỒNG CỎ -> RUỘNG LÚA NƯỚC)
   */
  private renderMap1(ctx: CanvasRenderingContext2D): void {
    const groundY = this.groundY;

    // 1. NỀN BẦU TRỜI & MÂY TRÔI PARALLAX
    this.worldRenderer.renderSky(ctx, this.width, groundY);
    this.worldRenderer.renderAtmosphericClouds(ctx, this.width, groundY, this.animTimer);

    // 2. DỊCH CHUYỂN CAMERA THEO THẾ GIỚI GAME (World Space)
    ctx.save();
    ctx.translate(-Math.round(this.cameraX), 0);

    // A. Cây Hậu Cảnh (Khóm Tre & Cây Chuối đứng sau)
    this.floraManager.renderBackgroundTrees(ctx, groundY, this.animTimer, this.player.x);

    // B. Mặt Đất Đồng Cỏ & Phù Sa
    this.floraManager.renderGround(ctx, this.width, this.height, groundY);

    // C. Cánh Đồng Lúa Nước Lớp Hậu Cảnh
    this.floraManager.renderRiceBackground(ctx, groundY, this.player.x, this.animTimer, this.cameraX, this.width);

    // D. Chú Trâu Mẹ
    this.buffalo.render(ctx, this.showAnimalLabels);

    // D2. Chú Nghé Con (Lon ton)
    this.calf.render(ctx, this.showAnimalLabels);

    // D3. Con Cò Trắng Đồng Quê
    this.stork.render(ctx, this.showAnimalLabels);

    // D4. Chú Bò Nâu Làng Quê (Đã ẩn)
    if (this.showCow) {
      this.cow.render(ctx, this.showAnimalLabels);
    }

    // E. Cô Bé Bán Rau (Bé Miến) (Đã ẩn)
    if (this.showVegetableGirl) {
      this.vegetableGirl.render(ctx, this.player.x);
    }

    // F. Nhân Vật Chính
    this.player.render(ctx);

    // Diều sáo & Dây diều nối tay người chơi
    this.fluteKite.render(ctx, this.player.x, this.player.y, this.player.facing);

    // G. Cây lúa Tiền Cảnh che ngang chân & Hoa cỏ dại
    this.floraManager.renderForegroundFlora(ctx, groundY, this.player.x, this.animTimer, this.cameraX, this.width);

    // H. Lưới Thước Đo & Đánh Số Phân Đoạn Bản Đồ
    this.worldRenderer.renderMapRuler(ctx, this.height, groundY, this.showMapRuler, this.mapWidth);

    ctx.restore();


    // 3. HUD Thông Số
    this.worldRenderer.renderHUD(
      ctx,
      this.width,
      this.height,
      this.player.x,
      this.player.coins,
      this.player.carriedBananas.length,
      this.floraManager.riceCrop.harvestedGrains,
      this.showMapRuler
    );
  }
}
