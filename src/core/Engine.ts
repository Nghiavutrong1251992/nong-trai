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
import { Stork } from '../entities/Stork';
import { Hen } from '../entities/Hen';
import { Rooster } from '../entities/Rooster';
import { Pig } from '../entities/Pig';
import { BeSinh } from '../entities/BeSinh';
import { FloraManager } from '../graphics/plants/FloraManager';
import { SaveManager } from './SaveManager';
import { InputController } from './InputController';
import { WorldRenderer } from '../graphics/WorldRenderer';
import { VillageMap25D } from '../world/VillageMap25D';
import { VillageRenderer25D } from '../graphics/VillageRenderer25D';
import { MAP_25D, WALKABLE_POLYGON, getPerspectiveScale, AnimalObstacle } from '../world/VillageMapData';

import { AssetLoader } from './AssetLoader';

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
  public buffalo = new Buffalo(980, 480);
  public hen = new Hen(880, 480);
  public rooster = new Rooster(940, 480);
  public pig = new Pig(1020, 480);
  public stork = new Stork(3450, 484);
  public beSinh = new BeSinh(2450, 480);
  public floraManager = new FloraManager();

  // Sub-modules
  public inputController = new InputController(this);
  public worldRenderer = new WorldRenderer(this);

  // 2.5D Village Map System
  public villageMap = new VillageMap25D();
  public villageRenderer = new VillageRenderer25D(this.villageMap);

  // Game States
  public groundY: number = 480;
  public animTimer: number = 0;
  public cameraX: number = 0;
  public mapWidth: number = 4200; // Chiều dài Bản Đồ Mở Rộng 21 Phân Đoạn (4200m)

  /** Chế độ bản đồ: 'map1' = Side-scroll, 'map25d' = Làng Quê 2.5D */
  public mapMode: 'map1' | 'map25d' = 'map25d';

  /** Vị trí nhân vật trong 2.5D world space */
  public player25dX: number = MAP_25D.WORLD_W / 2;
  public player25dY: number = 500;

  /** Đã khởi tạo vị trí thú nuôi cho map 2.5D chưa */
  public _animals25dInit: boolean = false;

  public showMapRuler: boolean = true; // Bật/Tắt Lưới Thước Đo [G]
  public showAnimalLabels: boolean = false; // Bật/Tắt Phụ Đề Nhãn Tên Thú Nuôi [N] (Mặc định TẮT)
  public showWalkableBoundaries: boolean = false; // Bật/Tắt Họa Đồ Ranh Giới Vùng Đi & Khung Cản [B] (Mặc định TẮT)

  /**
   * Bật/Tắt hiển thị ranh giới đa giác vùng đi được và khung cản chân [Phím B]
   */
  public toggleWalkableBoundaries(): void {
    this.showWalkableBoundaries = !this.showWalkableBoundaries;
    this.showToast(
      this.showWalkableBoundaries
        ? '🛣️ Đã BẬT Ranh Giới Vùng Đi & Khung Cản [B]'
        : '✨ Đã TẮT Ranh Giới Vùng Đi & Khung Cản [B]'
    );
    this.inputController.updateActionButtonsUI();
  }


  public async start(): Promise<void> {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();

    this.inputController.bindEvents();

    // 1. TIỀN NẠP ASSET CỐT LÕI (CORE PRELOADING) & CẬP NHẬT GIAO DIỆN
    const preloaderEl = document.getElementById('game-preloader');
    const barEl = document.getElementById('preloader-progress-bar');
    const pctEl = document.getElementById('preloader-pct');
    const statusEl = document.getElementById('preloader-status-text');

    await AssetLoader.loadCoreAssets((pct, loaded, total) => {
      if (barEl) barEl.style.width = `${pct}%`;
      if (pctEl) pctEl.textContent = `${pct}%`;
      if (statusEl) statusEl.textContent = `Đang nạp: ${loaded}/${total} tài nguyên (${pct}%)...`;
    });

    // Mờ dần và đóng màn hình Loading mượt mà
    if (preloaderEl) {
      preloaderEl.classList.add('fade-out');
      setTimeout(() => {
        preloaderEl.style.display = 'none';
      }, 500);
    }

    // Kết nối âm thanh thời tiết và sấm sét
    this.worldRenderer.weatherManager.onWeatherChange = (weather) => {
      this.sound.setWeatherAmbient(weather);
      document.querySelectorAll('.env-btn[data-weather]').forEach(btn => {
        const w = (btn as HTMLElement).dataset.weather;
        btn.classList.toggle('active', w === weather);
      });
    };
    this.worldRenderer.weatherManager.onThunder = () => {
      this.sound.playThunder();
    };


    // 2. Tải và phục hồi dữ liệu thế giới từ localStorage
    const saved = SaveManager.load();
    if (saved) {
      if (saved.bananas && Array.isArray(saved.bananas) && saved.bananas.length > 0) {
        this.floraManager.banana.instances = saved.bananas;
      }
      if (saved.player) {
        let px = saved.player.x ?? 450;
        if (isNaN(px) || px < -350 || px > 4150) px = 450;
        this.player.x = px;
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
    // Khóa camera ngay lập tức vào vị trí nhân vật
    this.cameraX = Math.max(-400, Math.min(this.mapWidth - this.width + 400, this.player.x - this.width / 2));


    // Tự động lưu tức thì trước khi reload hoặc đóng tab
    window.addEventListener('beforeunload', () => this.saveCurrentStateImmediate());

    // 3. Khởi chạy Game Loop - Đảm bảo Frame 0 có đủ 100% hình ảnh
    requestAnimationFrame((t) => this.loop(t));

    // 4. Kích hoạt tải ngầm Tầng 2 (Lazy Assets)
    AssetLoader.loadLazyAssets();
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

    // 1. Cập nhật Bầu Trời & Hiệu ứng thời tiết (cả 2 mode đều dùng)
    this.worldRenderer.update(dt);

    // 2. Nếu đang ở chế độ 2.5D → chạy logic 2.5D riêng
    if (this.mapMode === 'map25d') {
      this.update25D(dt);
      this.inputController.updateActionButtonsUI();
      return;
    }

    // === MAP 1: Side-scroll logic (giữ nguyên) ===

    // Cập nhật Player & Physics
    this.player.update(dt, this.inputController.input, this.groundY, this.sound);

    // Cập nhật Cây Chuối & Cây Trồng & Ao Cá & Giá Treo Nông Cụ
    this.floraManager.update(dt, this.groundY, this.player.x, this.player.vx);

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

    // Cập nhật Con Cò Trắng (Đứng ngắm cảnh, cất cánh & sà xuống ruộng lúa)
    this.stork.update(dt, this.groundY, this.player.x);

    // Cập nhật Gà Mái Loại 2 (Đi dạo & Mổ thóc)
    this.hen.update(dt, this.groundY, this.player.x);

    // Cập nhật Gà Trống (Đứng yên vỗ cánh, Mổ thóc, Đi dạo)
    this.rooster.update(dt, this.groundY, this.player.x);

    // Cập nhật Chú Heo Hồng (Ăn, Đi dạo, Đứng lắc tai)
    this.pig.update(dt, this.groundY);

    // Cập nhật Bé Sinh (Đứng yên, Đi bộ, Chạy nhảy)
    this.beSinh.update(dt, this.groundY, this.player.x);

    // 2. Camera bám theo nhân vật mượt mà (Mở rộng từ -1200m bên trái ao cá)
    const targetCamX = this.player.x - this.width / 2;
    const minCamX = -1200;
    const maxCamX = Math.max(0, this.mapWidth - this.width + 400);
    const clampedTarget = Math.max(minCamX, Math.min(maxCamX, targetCamX));
    this.cameraX += (clampedTarget - this.cameraX) * Math.min(1.0, dt * 8);

    // Cập nhật nhãn nút bấm
    this.inputController.updateActionButtonsUI();
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.mapMode === 'map25d') {
      this.renderMap25D(ctx);
    } else {
      this.renderMap1(ctx);
    }
  }

  /**
   * Chuyển đổi giữa Map 1 (Side-scroll) và Map 2 (2.5D Làng Quê)
   */
  public toggleMapMode(): void {
    if (this.mapMode === 'map1') {
      this.mapMode = 'map25d';
      // Chuyển vị trí nhân vật sang 2.5D
      this.player25dX = MAP_25D.WORLD_W / 2;
      this.player25dY = 500;
      this.showToast('🏡 Chuyển sang Bản Đồ  2.5D Làng Quê! [Tab] để quay lại');
    } else {
      this.mapMode = 'map1';
      this.showToast('🌾 Quay lại Bản Đồ Đồng Quê! [Tab] để chuyển 2.5D');
    }
  }

  /**
   * MAP 1: CẢNH QUAN LÀNG QUÊ MỞ RỘNG (ĐỒNG CỎ -> RUỘNG LÚA NƯỚC)
   */
  private renderMap1(ctx: CanvasRenderingContext2D): void {
    const groundY = this.groundY;

    // 1. NỀN BẦU TRỜI (Gradient + Mặt Trời/Trăng + Mây + Sấm Sét)
    this.worldRenderer.renderSky(ctx, this.width, groundY);


    // 2. DỊCH CHUYỂN CAMERA THEO THẾ GIỚI GAME (World Space)
    ctx.save();
    ctx.translate(-Math.round(this.cameraX), 0);

    // 1. Cảnh Quan Hậu Cảnh (Ngôi Nhà Tranh, Rặng Tre Làng, Vườn Chuối) - Vẽ ở lớp sau
    this.floraManager.renderBackgroundTrees(ctx, groundY, this.animTimer, this.player.x, this.cameraX, this.width);

    // 2. Lớp Mặt Đất Đồng Cỏ & Đồi Đất & Hồ Cá - Vẽ đè lên trên để Đất che chân tre & sườn đồi
    this.floraManager.renderGround(ctx, this.width, this.height, groundY, this.animTimer, this.player.x);



    // C. Cánh Đồng Lúa Nước Lớp Hậu Cảnh
    this.floraManager.renderRiceBackground(ctx, groundY, this.player.x, this.animTimer, this.cameraX, this.width);

    // D. Chú Trâu Mẹ
    this.buffalo.render(ctx, this.showAnimalLabels);

    // D2. Con Cò Trắng Đồng Quê
    this.stork.render(ctx, this.showAnimalLabels);

    // D4. Gà Mái Loại 2
    this.hen.render(ctx, this.showAnimalLabels);

    // D5. Gà Trống Dân Gian
    this.rooster.render(ctx, this.showAnimalLabels);

    // D6. Chú Heo Hồng Làng Quê
    this.pig.render(ctx, this.showAnimalLabels);

    // D7. Bé Sinh Làng Quê
    this.beSinh.render(ctx, this.showAnimalLabels);

    // F. Nhân Vật Chính
    this.player.render(ctx);

    // G. Cây lúa Tiền Cảnh che ngang chân & Hoa cỏ dại
    this.floraManager.renderForegroundFlora(ctx, groundY, this.player.x, this.animTimer, this.cameraX, this.width);

    // H. Lưới Thước Đo & Đánh Số Phân Đoạn Bản Đồ
    this.worldRenderer.renderMapRuler(ctx, this.height, groundY, this.showMapRuler, this.mapWidth);

    ctx.restore();

    // 2.5 HIỆU ỨNG THỜI TIẾT TIỀN CẢNH (MƯA RƠI, GIÓ THỔI, LÁ BAY)
    this.worldRenderer.renderWeatherForeground(ctx, this.width, groundY);

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

  /**
   * Lấy danh sách chướng ngại vật Foot Colliders thời gian thực của các nhân vật & thú nuôi
   */
  public getDynamicAnimalObstacles(): AnimalObstacle[] {
    return [
      { id: 'con_trau', x: this.buffalo.x, y: this.buffalo.y, w: 80, h: 22 },
      { id: 'con_heo', x: this.pig.x, y: this.pig.y, w: 48, h: 18 },
      { id: 'ga_trong', x: this.rooster.x, y: this.rooster.y, w: 26, h: 12 },
      { id: 'ga_mai', x: this.hen.x, y: this.hen.y, w: 24, h: 12 },
      { id: 'con_co', x: this.stork.x, y: this.stork.y, w: 24, h: 12 },
      { id: 'be_sinh', x: this.beSinh.x, y: this.beSinh.y, w: 26, h: 14 },
    ];
  }

  /**
   * MAP 2: BẢN ĐỒ LÀNG QUÊ 2.5D (Góc nhìn 2.5D, Y-sorting & Perspective scaling)
   */
  private renderMap25D(ctx: CanvasRenderingContext2D): void {
    // 1. NỀN BẦU TRỜI (Layer 1: Background)
    const skyH = this.height * 0.35;
    this.worldRenderer.renderSky(ctx, this.width, skyH);

    // Tính perspective scale của Nhân vật theo vị trí bàn chân
    const playerScale = getPerspectiveScale(this.player25dY);
    const dynamicObstacles = this.getDynamicAnimalObstacles();

    // Mảng các con vật & nhân vật với feetY & perspective scale riêng từng con
    const animalRenderers = [
      {
        feetY: this.buffalo.y,
        render: (c: CanvasRenderingContext2D) => {
          const s = getPerspectiveScale(this.buffalo.y);
          c.save();
          c.translate(this.buffalo.x, this.buffalo.y);
          c.scale(s, s);
          c.translate(-this.buffalo.x, -this.buffalo.y);
          this.buffalo.render(c, this.showAnimalLabels);
          c.restore();
        },
      },
      {
        feetY: this.pig.y,
        render: (c: CanvasRenderingContext2D) => {
          const s = getPerspectiveScale(this.pig.y);
          c.save();
          c.translate(this.pig.x, this.pig.y);
          c.scale(s, s);
          c.translate(-this.pig.x, -this.pig.y);
          this.pig.render(c, this.showAnimalLabels);
          c.restore();
        },
      },
      {
        feetY: this.hen.y,
        render: (c: CanvasRenderingContext2D) => {
          const s = getPerspectiveScale(this.hen.y);
          c.save();
          c.translate(this.hen.x, this.hen.y);
          c.scale(s, s);
          c.translate(-this.hen.x, -this.hen.y);
          this.hen.render(c, this.showAnimalLabels);
          c.restore();
        },
      },
      {
        feetY: this.rooster.y,
        render: (c: CanvasRenderingContext2D) => {
          const s = getPerspectiveScale(this.rooster.y);
          c.save();
          c.translate(this.rooster.x, this.rooster.y);
          c.scale(s, s);
          c.translate(-this.rooster.x, -this.rooster.y);
          this.rooster.render(c, this.showAnimalLabels);
          c.restore();
        },
      },
      {
        feetY: this.stork.y,
        render: (c: CanvasRenderingContext2D) => {
          const s = getPerspectiveScale(this.stork.y);
          c.save();
          c.translate(this.stork.x, this.stork.y);
          c.scale(s, s);
          c.translate(-this.stork.x, -this.stork.y);
          this.stork.render(c, this.showAnimalLabels);
          c.restore();
        },
      },
      {
        feetY: this.beSinh.y,
        render: (c: CanvasRenderingContext2D) => {
          const s = getPerspectiveScale(this.beSinh.y);
          c.save();
          c.translate(this.beSinh.x, this.beSinh.y);
          c.scale(s, s);
          c.translate(-this.beSinh.x, -this.beSinh.y);
          this.beSinh.render(c, this.showAnimalLabels);
          c.restore();
        },
      },
    ];

    // 2. RENDER CẢNH LÀNG QUÊ 2.5D THỰC THI 7 LỚP HÌNH ẢNH
    this.villageRenderer.render(
      ctx,
      this.width,
      this.height,
      this.player25dY,
      // Callback vẽ Nhân vật với scale bàn chân
      () => {
        this.player.renderAt(
          ctx,
          this.player25dX,
          this.player25dY,
          this.player.state,
          this.player.animTimer,
          this.player.facing,
          playerScale
        );
      },
      animalRenderers,
      dynamicObstacles,
      this.showWalkableBoundaries
    );

    // 3. HUD Thông Số (vẫn dùng lại)
    this.worldRenderer.renderHUD(
      ctx,
      this.width,
      this.height,
      this.player25dX,
      this.player.coins,
      this.player.carriedBananas.length,
      this.floraManager.riceCrop.harvestedGrains,
      false // Không hiện thước đo trong map 2.5D
    );

    // 4. Chỉ dẫn map mode
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.beginPath();
    ctx.roundRect(this.width / 2 - 120, this.height - 36, 240, 28, 8);
    ctx.fill();
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏡 Bản Đồ 2.5D Làng Quê · [Tab] Quay lại · [WASD] Di chuyển', this.width / 2, this.height - 18);
    ctx.restore();
  }

  /**
   * Cập nhật nhân vật trong chế độ 2.5D (di chuyển 4 hướng)
   */
  private update25D(dt: number): void {
    const input = this.inputController.input;
    const speed = this.player.speed;
    let vx = 0;
    let vy = 0;

    if (input.left) { vx = -speed; this.player.facing = -1; }
    if (input.right) { vx = speed; this.player.facing = 1; }
    if (input.up) { vy = -speed * 0.7; }    // Đi lên chậm hơn (xa camera)
    if (input.down) { vy = speed * 0.7; }   // Đi xuống nhanh hơn (gần camera)

    // Tính vị trí mới
    const newX = this.player25dX + vx * dt;
    const newY = this.player25dY + vy * dt;

    // Kiểm tra collision với Đa giác + Chướng ngại vật tĩnh + Chướng ngại vật động tất cả con vật
    const dynamicObstacles = this.getDynamicAnimalObstacles();

    // 1. Di chuyển X (Kèm thuật toán trượt theo bờ dốc tam giác / nghiêng - Wall Sliding)
    if (this.villageMap.canWalkTo(newX, this.player25dY, 24, dynamicObstacles)) {
      this.player25dX = newX;
    } else if (vx !== 0) {
      // Khi gặp cạnh đa giác uốn dốc, thử trượt nhẹ Y để nhân vật tự động trượt mượt tiếp tục di chuyển
      for (let slideY = 1; slideY <= 12; slideY++) {
        if (this.villageMap.canWalkTo(newX, this.player25dY - slideY, 24, dynamicObstacles)) {
          this.player25dX = newX;
          this.player25dY -= Math.min(slideY, 2);
          break;
        }
        if (this.villageMap.canWalkTo(newX, this.player25dY + slideY, 24, dynamicObstacles)) {
          this.player25dX = newX;
          this.player25dY += Math.min(slideY, 2);
          break;
        }
      }
    }

    // 2. Di chuyển Y (Kèm trượt ngang X)
    if (this.villageMap.canWalkTo(this.player25dX, newY, 24, dynamicObstacles)) {
      this.player25dY = newY;
    } else if (vy !== 0) {
      for (let slideX = 1; slideX <= 12; slideX++) {
        if (this.villageMap.canWalkTo(this.player25dX - slideX, newY, 24, dynamicObstacles)) {
          this.player25dY = newY;
          this.player25dX -= Math.min(slideX, 2);
          break;
        }
        if (this.villageMap.canWalkTo(this.player25dX + slideX, newY, 24, dynamicObstacles)) {
          this.player25dY = newY;
          this.player25dX += Math.min(slideX, 2);
          break;
        }
      }
    }

    // Cập nhật state nhân vật
    if (Math.abs(vx) > 0 || Math.abs(vy) > 0) {
      this.player.state = 'walk';
      this.player.vx = vx;
    } else {
      if (this.player.actionTimer <= 0) {
        if (this.player.activeTool === 'hoe') {
          this.player.state = 'cam_cuoc';
        } else if (this.player.activeTool === 'water') {
          this.player.state = 'cam_thung_nuoc';
        } else if (this.player.activeTool === 'sickle') {
          this.player.state = 'cam_liem';
        } else {
          this.player.state = 'idle';
        }
      }
      this.player.vx = 0;
    }

    this.player.animTimer += dt;
    if (this.player.actionTimer > 0) this.player.actionTimer -= dt;

    // Khởi tạo vị trí bàn chân cho nhân vật & thú nuôi trên sân làng 2.5D
    if (!this._animals25dInit) {
      this.buffalo.x = 500;        this.buffalo.y = 520;
      this.pig.x = 870;            this.pig.y = 550;        // Heo Hồng
      this.hen.x = 1300;           this.hen.y = 480;        // Gà Mái
      this.rooster.x = 1400;       this.rooster.y = 500;    // Gà Trống Dân Gian
      this.stork.x = 2100;        this.stork.y = 470;      // Cò Trắng
      this.beSinh.x = 2450;        this.beSinh.y = 530;      // Bé Sinh
      this._animals25dInit = true;
    }

    // Cập nhật animation cho các nhân vật & thú nuôi
    this.buffalo.update(dt, this.buffalo.y);
    this.pig.update(dt, this.pig.y);
    this.hen.update(dt, this.hen.y, this.player25dX);
    this.rooster.update(dt, this.rooster.y, this.player25dX);
    this.stork.update(dt, this.stork.y, this.player25dX);
    this.beSinh.update(dt, this.beSinh.y, this.player25dX);

    // Cập nhật camera 2.5D
    this.villageMap.updateCamera(this.width, this.height, this.player25dX, this.player25dY);

    // Cập nhật village renderer animation
    this.villageRenderer.update(dt);
  }
}
