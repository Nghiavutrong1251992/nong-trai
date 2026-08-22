import { SoundManager } from './SoundManager';
import { Player } from '../entities/Player';
import { Buffalo } from '../entities/Buffalo';
import { VegetableGirl } from '../entities/VegetableGirl';
import { FloraManager } from '../graphics/plants/FloraManager';
import { BananaInstance } from '../graphics/plants/BananaTree';
import { SaveManager } from './SaveManager';

export class Engine {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private dpr: number = 1;
  private width: number = window.innerWidth;
  private height: number = window.innerHeight;

  private sound = new SoundManager();
  private player = new Player(400, 480);
  private buffalo = new Buffalo(560, 480);
  private vegetableGirl = new VegetableGirl(820, 480);
  public floraManager = new FloraManager();

  // Trạng thái đang cuốc bứng cây chuối (Chờ hết hành động cuốc mới xóa cây)
  private pendingDigBanana: { banana: BananaInstance; targetX: number } | null = null;
  private autoSaveTimer: number = 0;

  public currentMode: 'map1' | 'studio' = 'map1'; // Mặc định mở Map 1 Làng Quê
  private groundY: number = 480;
  private animTimer: number = 0;
  private cameraX: number = 0;
  public mapWidth: number = 2400; // Chiều dài Map 1 Mở Rộng gọn gàng (2400px)
  public showMapRuler: boolean = true; // Bật/Tắt Lưới Thước Đo Bản Đồ

  private input = {
    left: false,
    right: false,
    jump: false,
    hoe: false,
    fish: false
  };

  // Environment Baseline Colors & Settings
  private skyColorTop: string = '#7dd3fc';
  private skyColorBottom: string = '#e0f2fe';
  private groundColor: string = '#86efac';
  private dirtColor: string = '#573010';

  public start(): void {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();

    this.bindEvents();

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

  private showToast(msg: string): void {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 2400);
  }

  private bindEvents(): void {
    // Mode Switcher Tabs
    const tabMap1 = document.getElementById('tab-map1');
    const tabStudio = document.getElementById('tab-studio');

    tabMap1?.addEventListener('click', () => {
      this.currentMode = 'map1';
      tabMap1.classList.add('active');
      tabStudio?.classList.remove('active');
      this.showToast('🌾 Đã chuyển sang Map 1: Đường Làng Quê 2D');
    });

    tabStudio?.addEventListener('click', () => {
      this.currentMode = 'studio';
      tabStudio.classList.add('active');
      tabMap1?.classList.remove('active');
      this.showToast('🎬 Đã chuyển sang Studio So Sánh Hoạt Ảnh');
    });

    // Nút Đặt Lại Thế Giới (Reset Game Save)
    document.getElementById('btn-reset-world')?.addEventListener('click', () => {
      if (confirm('Bạn có muốn xóa dữ liệu đã lưu và đặt lại vị trí cây chuối, ruộng lúa về mặc định ban đầu không?')) {
        SaveManager.clearSave();
        location.reload();
      }
    });

    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') this.input.left = true;
      if (k === 'd' || k === 'arrowright') this.input.right = true;
      if (k === 'w' || k === 'arrowup' || k === ' ') this.input.jump = true;

      // Phím Q: Rút / Đổi / Cất dụng cụ
      if (k === 'q') {
        const res = this.player.cycleTool();
        this.showToast(res.label);
        this.updateActionButtonsUI();
      }

      // Phím E / Enter: Dùng dụng cụ
      if (k === 'e' || k === 'enter') {
        this.handleUseTool();
      }

      // Các phím số tắt 1, 2, 3 nhanh
      if (k === '1') {
        this.player.selectTool('hoe');
        this.showToast('⛏️ Đã trang bị: Cuốc Đất (Ấn E để cuốc)');
        this.updateActionButtonsUI();
      }
      if (k === '2') {
        this.player.selectTool('water');
        this.showToast('💧 Đã trang bị: Thùng Nước (Ấn E để tưới)');
        this.updateActionButtonsUI();
      }
      if (k === '3') {
        this.player.selectTool('sickle');
        this.showToast('🌾 Đã trang bị: Liềm Cắt Lúa (Ấn E để thu hoạch)');
        this.updateActionButtonsUI();
      }
      if (k === 'g') {
        this.showMapRuler = !this.showMapRuler;
        this.showToast(this.showMapRuler ? '📐 Đã BẬT lưới thước đo phân đoạn bản đồ' : '📐 Đã TẮT lưới thước đo');
        const btnGrid = document.getElementById('btn-toggle-grid');
        if (btnGrid) {
          btnGrid.classList.toggle('active', this.showMapRuler);
          btnGrid.textContent = this.showMapRuler ? '📐 Thước Đo: BẬT [G]' : '📐 Thước Đo: TẮT [G]';
        }
      }
      if (k === 'm') {
        const isMuted = this.sound.toggleMute();
        this.showToast(isMuted ? '🔇 Đã tắt nhạc nền' : '🎵 Đã bật nhạc làng quê');
        const btnMute = document.getElementById('btn-toggle-music');
        if (btnMute) btnMute.textContent = isMuted ? '🔇 Bật Nhạc [M]' : '🎵 Nhạc Làng Quê [M]';
      }
    });

    // Bật / Tắt Thước Đo Bản Đồ [G]
    document.getElementById('btn-toggle-grid')?.addEventListener('click', () => {
      this.showMapRuler = !this.showMapRuler;
      this.showToast(this.showMapRuler ? '📐 Đã BẬT lưới thước đo phân đoạn bản đồ' : '📐 Đã TẮT lưới thước đo');
      const btnGrid = document.getElementById('btn-toggle-grid');
      if (btnGrid) {
        btnGrid.classList.toggle('active', this.showMapRuler);
        btnGrid.textContent = this.showMapRuler ? '📐 Thước Đo: BẬT [G]' : '📐 Thước Đo: TẮT [G]';
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') this.input.left = false;
      if (k === 'd' || k === 'arrowright') this.input.right = false;
      if (k === 'w' || k === 'arrowup' || k === ' ') this.input.jump = false;
    });

    // Bật / Tắt Nhạc Làng Quê
    document.getElementById('btn-toggle-music')?.addEventListener('click', () => {
      const isMuted = this.sound.toggleMute();
      this.showToast(isMuted ? '🔇 Đã tắt nhạc nền' : '🎵 Đã bật nhạc làng quê');
      const btnMute = document.getElementById('btn-toggle-music');
      if (btnMute) btnMute.textContent = isMuted ? '🔇 Bật Nhạc [M]' : '🎵 Nhạc Làng Quê [M]';
    });

    // Bật / Tắt Toàn Màn Hình (Fullscreen)
    const toggleFullscreen = () => {
      const doc = document as any;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        const docEl = document.documentElement as any;
        if (docEl.requestFullscreen) docEl.requestFullscreen();
        else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
        this.showToast('⛶ Đã mở chế độ Toàn Màn Hình');
      } else {
        if (doc.exitFullscreen) doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
        this.showToast('⛶ Đã thoát chế độ Toàn Màn Hình');
      }
    };
    document.getElementById('btn-fullscreen')?.addEventListener('click', toggleFullscreen);

    // ============================================================
    // PWA PROGRESSIVE WEB APP INSTALL SYSTEM
    // ============================================================
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    let deferredPrompt: any = null;
    const btnInstallPwa = document.getElementById('btn-install-pwa');
    const mBtnInstall = document.getElementById('m-btn-install');
    const installModal = document.getElementById('install-modal');
    const installText = document.getElementById('install-guide-text');
    const btnTriggerInstall = document.getElementById('btn-trigger-pwa-install');
    const btnCloseInstall = document.getElementById('btn-close-install');

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    if (isStandalone) {
      if (btnInstallPwa) btnInstallPwa.style.display = 'none';
      if (mBtnInstall) mBtnInstall.style.display = 'none';
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      if (btnInstallPwa) btnInstallPwa.style.display = 'flex';
      if (mBtnInstall) mBtnInstall.style.display = 'flex';
    });

    const openInstallGuide = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
          if (choiceResult.outcome === 'accepted') {
            this.showToast('🎉 Đang cài đặt game ra màn hình chính...');
            if (btnInstallPwa) btnInstallPwa.style.display = 'none';
            if (mBtnInstall) mBtnInstall.style.display = 'none';
          }
          deferredPrompt = null;
        });
        return;
      }

      if (installModal && installText) {
        installModal.style.display = 'block';
        if (isIos) {
          installText.innerHTML = `
            <div style="margin-bottom: 8px; color: #fde047; font-weight: 700;">Hướng dẫn cài đặt trên iPhone / iPad:</div>
            1. Bấm vào nút <b>Chia sẻ (Share) 📤</b> ở thanh công cụ dưới đáy Safari.<br>
            2. Cuộn xuống và chọn <b>"Thêm vào Màn hình chính" (Add to Home Screen) ➕</b>.<br>
            3. Mở game từ icon mới ngoài màn hình 👉 <b>Luôn Full Màn Hình 100%</b>!
          `;
          if (btnTriggerInstall) btnTriggerInstall.style.display = 'none';
        } else {
          installText.innerHTML = `
            Bấm vào nút <b>"Cài Đặt Ngay"</b> hoặc mở Menu trình duyệt (dấu 3 chấm) 👉 chọn <b>"Cài đặt ứng dụng"</b> hoặc <b>"Thêm vào màn hình chính"</b> để chơi game toàn màn hình không có thanh địa chỉ!
          `;
          if (btnTriggerInstall) {
            btnTriggerInstall.style.display = 'block';
            btnTriggerInstall.onclick = () => {
              installModal.style.display = 'none';
              if (deferredPrompt) deferredPrompt.prompt();
              else toggleFullscreen();
            };
          }
        }
      }
    };

    btnInstallPwa?.addEventListener('click', openInstallGuide);
    mBtnInstall?.addEventListener('click', openInstallGuide);
    btnCloseInstall?.addEventListener('click', () => {
      if (installModal) installModal.style.display = 'none';
    });

    // Mobile Menu Dropdown Toggle
    const mobileDropdown = document.getElementById('mobile-dropdown');
    document.getElementById('btn-mobile-menu')?.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileDropdown?.classList.toggle('open');
    });
    window.addEventListener('click', () => {
      mobileDropdown?.classList.remove('open');
    });

    // Mobile Menu Items
    document.getElementById('m-btn-grid')?.addEventListener('click', () => {
      this.showMapRuler = !this.showMapRuler;
      this.showToast(this.showMapRuler ? '📐 Đã BẬT thước đo bản đồ' : '📐 Đã TẮT thước đo');
      document.getElementById('m-btn-grid')?.classList.toggle('active', this.showMapRuler);
    });

    document.getElementById('m-btn-music')?.addEventListener('click', () => {
      const isMuted = this.sound.toggleMute();
      this.showToast(isMuted ? '🔇 Đã tắt nhạc' : '🎵 Đã bật nhạc làng quê');
    });

    document.getElementById('m-tab-studio')?.addEventListener('click', () => {
      this.currentMode = this.currentMode === 'studio' ? 'map1' : 'studio';
      this.showToast(this.currentMode === 'studio' ? '🎬 Đã mở Studio Đo Hoạt Ảnh' : '🌾 Đã trở lại Làng Quê 2D');
    });

    document.getElementById('m-btn-reset')?.addEventListener('click', () => {
      if (confirm('Bạn có muốn xóa dữ liệu đã lưu và đặt lại vị trí cây chuối, ruộng lúa về mặc định ban đầu không?')) {
        SaveManager.clearSave();
        location.reload();
      }
    });

    // Tắt bảng thông báo xoay màn hình khi người dùng chọn tiếp tục
    document.getElementById('btn-dismiss-orient')?.addEventListener('click', () => {
      document.getElementById('orientation-overlay')?.classList.remove('active');
    });

    // ============================================================
    // VIRTUAL THUMB JOYSTICK (KÉO TRƯỢT SANG TRÁI / PHẢI)
    // ============================================================
    const joyBase = document.getElementById('joystick-base');
    const joyKnob = document.getElementById('joystick-knob');

    if (joyBase && joyKnob) {
      let activePointerId: number | null = null;
      let startX = 0;
      const maxDrag = 28; // Giới hạn biên độ kéo núm tròn px

      const updateKnob = (clientX: number) => {
        let dx = clientX - startX;
        dx = Math.max(-maxDrag, Math.min(maxDrag, dx));
        joyKnob.style.transform = `translate(${dx}px, -50%)`;
        joyKnob.style.transition = 'none';

        const threshold = 6;
        if (dx < -threshold) {
          this.input.left = true;
          this.input.right = false;
        } else if (dx > threshold) {
          this.input.right = true;
          this.input.left = false;
        } else {
          this.input.left = false;
          this.input.right = false;
        }
      };

      const resetKnob = () => {
        activePointerId = null;
        joyKnob.style.transition = 'transform 0.18s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        joyKnob.style.transform = `translate(0px, -50%)`;
        this.input.left = false;
        this.input.right = false;
        joyBase.classList.remove('active');
      };

      joyBase.addEventListener('pointerdown', (e: PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        activePointerId = e.pointerId;
        joyBase.setPointerCapture(e.pointerId);
        joyBase.classList.add('active');
        const rect = joyBase.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        updateKnob(e.clientX);
      });

      joyBase.addEventListener('pointermove', (e: PointerEvent) => {
        if (activePointerId !== e.pointerId) return;
        e.preventDefault();
        updateKnob(e.clientX);
      });

      joyBase.addEventListener('pointerup', (e: PointerEvent) => {
        if (activePointerId === e.pointerId) resetKnob();
      });
      joyBase.addEventListener('pointercancel', (e: PointerEvent) => {
        if (activePointerId === e.pointerId) resetKnob();
      });
    }

    // Nút Nhảy ⬆ (Right Thumb)
    const btnJump = document.getElementById('btn-jump');
    if (btnJump) {
      btnJump.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        btnJump.classList.add('pressed');
        this.input.jump = true;
      });
      const releaseJump = (e: Event) => {
        e.preventDefault();
        btnJump.classList.remove('pressed');
        this.input.jump = false;
      };
      btnJump.addEventListener('pointerup', releaseJump);
      btnJump.addEventListener('pointercancel', releaseJump);
      btnJump.addEventListener('pointerleave', releaseJump);
    }

    // Nút Q: Rút / Đổi / Cất dụng cụ
    const btnCycle = document.getElementById('btn-cycle-tool');
    btnCycle?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btnCycle.classList.add('pressed');
      const res = this.player.cycleTool();
      this.showToast(res.label);
      this.updateActionButtonsUI();
    });
    btnCycle?.addEventListener('pointerup', () => btnCycle.classList.remove('pressed'));
    btnCycle?.addEventListener('pointercancel', () => btnCycle.classList.remove('pressed'));

    // Nút E: Tiến hành dùng dụng cụ / Bứng / Trồng chuối / Cấy / Gặt
    const btnUse = document.getElementById('btn-use-tool');
    btnUse?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btnUse.classList.add('pressed');
      this.handleUseTool();
    });
    btnUse?.addEventListener('pointerup', () => btnUse.classList.remove('pressed'));
    btnUse?.addEventListener('pointercancel', () => btnUse.classList.remove('pressed'));

    this.updateActionButtonsUI();
  }

  private handleUseTool(): void {
    if (this.player.actionTimer > 0) return;

    // 1. ƯU TIÊN 1: TƯƠNG TÁC BỨNG CÂY CHUỐI NẾU ĐỨNG GẦN GỐC CÂY
    const nearbyBanana = this.floraManager.findNearbyBanana(this.player.x, 75);
    if (nearbyBanana) {
      nearbyBanana.banana.isBeingDug = true;
      this.pendingDigBanana = { banana: nearbyBanana.banana, targetX: this.player.x };
      this.player.state = 'hoe';
      this.player.actionTimer = 2.4; // Thời gian thực hiện trọn vẹn động tác cuốc đất
      this.player.animTimer = 0;
      this.sound.playWhack();
      this.showToast('⛏️ Đang cuốc bứng cây chuối... Hãy đợi hoàn tất động tác!');
      this.updateActionButtonsUI();
      return;
    }

    // 2. ƯU TIÊN 2: TRỒNG CÂY CHUỐI NẾU ĐANG MANG CÂY TRONG TÚI (VÀ KHÔNG Ở GIỮA RUỘNG LÚA SÂU)
    const inDeepPaddy = this.player.x >= this.floraManager.paddyStartX + 30 && this.player.x <= this.floraManager.paddyEndX - 30;
    if (this.player.carriedBananas.length > 0 && !inDeepPaddy) {
      const tree = this.player.carriedBananas.pop()!;
      this.floraManager.plantBanana(this.player.x, tree);
      this.player.state = 'hoe';
      this.player.actionTimer = 1.8;
      this.player.animTimer = 0;
      this.sound.playWhack();
      this.showToast(`🌱 Đã trồng cây chuối xuống đất thành công tại vị trí ${Math.round(this.player.x)}m!`);
      this.updateActionButtonsUI();
      this.saveCurrentState();
      return;
    }

    // 3. ƯU TIÊN 3: Tương tác trực tiếp trên thửa ruộng lúa nước (x: 1400px -> 2200px)
    if (this.player.x >= 1400 && this.player.x <= 2200) {
      // Ưu tiên 3a: Gặt lúa chín
      const harvestResult = this.floraManager.harvestNearbyRice(this.player.x);
      if (harvestResult.harvested) {
        this.sound.play('harvest');
        this.showToast(`🌾 Gặt thành công ${harvestResult.count} khóm lúa chín vàng! (+${harvestResult.count * 10} Thóc)`);
        this.saveCurrentState();
        return;
      }

      // Ưu tiên 3b: Cấy mạ non vào vị trí đất trống
      const planted = this.floraManager.plantSeedling(this.player.x, this.groundY);
      if (planted) {
        this.sound.play('click');
        this.showToast(`🌱 Đã cấy một khóm mạ non xanh tươi xuống ruộng!`);
        this.saveCurrentState();
        return;
      }
    }

    // 4. Dùng công cụ tiêu chuẩn (Cuốc / Tưới / Liềm)
    const res = this.player.useTool(this.sound);
    if (this.player.activeTool === 'water') {
      const watered = this.floraManager.waterNearbyRice(this.player.x);
      if (watered) {
        this.showToast(`💧 Đã tưới nước! Lúa được chăm sóc lớn nhanh vượt trội 🌱`);
        this.saveCurrentState();
        return;
      }
    }
    this.showToast(res.msg);
  }

  private updateActionButtonsUI(): void {
    const btnCycle = document.getElementById('btn-cycle-tool');
    const btnUse = document.getElementById('btn-use-tool');
    if (!btnCycle || !btnUse) return;

    const nearbyBanana = this.floraManager.findNearbyBanana(this.player.x, 75);
    const bananaCount = this.player.carriedBananas.length;
    const inPaddy = this.player.x >= this.floraManager.paddyStartX && this.player.x <= this.floraManager.paddyEndX;

    if (this.pendingDigBanana && this.player.actionTimer > 0) {
      btnUse.innerHTML = '⛏️ Đang Cuốc Bứng...';
      btnUse.style.background = 'rgba(239, 68, 68, 0.9)';
      btnUse.style.borderColor = '#f87171';
    } else if (nearbyBanana) {
      btnUse.innerHTML = '🎋 Bứng Cây Chuối [E]';
      btnUse.style.background = 'rgba(234, 179, 8, 0.9)';
      btnUse.style.borderColor = '#facc15';
    } else if (bananaCount > 0 && !inPaddy) {
      btnUse.innerHTML = `🌱 Trồng Chuối [E] (x${bananaCount})`;
      btnUse.style.background = 'rgba(16, 185, 129, 0.9)';
      btnUse.style.borderColor = '#34d399';
    } else if (inPaddy) {
      btnUse.innerHTML = '🌾 Cấy / Gặt Lúa [E]';
      btnUse.style.background = 'rgba(22, 163, 74, 0.85)';
      btnUse.style.borderColor = '#4ade80';
    } else {
      btnUse.innerHTML = '⛏️ Cuốc / Thao Tác [E]';
      btnUse.style.background = 'rgba(15, 23, 42, 0.85)';
      btnUse.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    }

    if (this.player.activeTool === 'water') {
      btnCycle.innerHTML = '💧 Tưới Nước [Q]';
    } else if (this.player.activeTool === 'hoe') {
      btnCycle.innerHTML = '⛏️ Cuốc Đất [Q]';
    } else if (this.player.activeTool === 'sickle') {
      btnCycle.innerHTML = '🌾 Liềm Cắt [Q]';
    } else {
      btnCycle.innerHTML = '🔄 Đổi Dụng Cụ [Q]';
    }
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
      this.mapWidth = this.floraManager.mapWidth;

      // 1. Cập nhật Player di chuyển & giảm actionTimer
      this.player.update(dt, this.input, this.groundY, this.sound);

      // Xử lý hoàn tất hành động cuốc đào: khi actionTimer <= 0 thì cây chuối mới biến mất
      if (this.pendingDigBanana) {
        if (this.player.actionTimer <= 0) {
          const tree = this.pendingDigBanana.banana;
          this.floraManager.removeBanana(tree); // Cây chuối biến mất sau khi hoàn tất hành động cuốc
          this.player.carriedBananas.push(tree);
          this.pendingDigBanana = null;
          this.sound.play('coin');
          this.showToast(`🎋 Đã hoàn thành cuốc bứng cây chuối vào túi! (Hiện có ${this.player.carriedBananas.length} cây). Hãy chọn đất mới và ấn [E] để trồng.`);
          this.updateActionButtonsUI();
          this.saveCurrentState();
        }
      }

      // Tự động lưu định kỳ mỗi 4 giây
      this.autoSaveTimer += dt;
      if (this.autoSaveTimer >= 4.0) {
        this.autoSaveTimer = 0;
        this.saveCurrentState();
      }

      // VÒNG LẶP BẢN ĐỒ TUẦN HOÀN (Seamless World Wrap):
      // Đi hết Đoạn 0A (X < -400m) -> Vòng sang cuối Đoạn 12 (X = 2380m)
      if (this.player.x < -400) {
        this.player.x = 2380;
        this.cameraX = 2380 - this.width / 2;
        this.showToast('🌀 Vòng lặp: Đã chuyển sang Đoạn 12 (Bờ đê cuối làng)');
      }
      // Đi hết Đoạn 12 (X > 2400m) -> Vòng sang đầu Đoạn 0A (X = -380m)
      else if (this.player.x > 2400) {
        this.player.x = -380;
        this.cameraX = -380 - this.width / 2;
        this.showToast('🌀 Vòng lặp: Đã chuyển sang Đoạn 0A (Đồng cỏ xa)');
      }

      // Cập nhật sinh trưởng của cây lúa & hiệu ứng hạt
      this.floraManager.update(dt);

      // Cập nhật Chú Trâu Làng Quê đi dạo
      this.buffalo.update(dt, this.groundY);

      // Cập nhật Cô Bé Bán Rau (Bé Miến)
      this.vegetableGirl.update(dt, this.groundY, this.player.x);

      // 2. Camera bám theo nhân vật mượt mà
      const targetCamX = this.player.x - this.width / 2;
      const minCamX = -400;
      const maxCamX = Math.max(0, this.mapWidth - this.width + 400);
      const clampedTarget = Math.max(minCamX, Math.min(maxCamX, targetCamX));
      this.cameraX += (clampedTarget - this.cameraX) * Math.min(1.0, dt * 8);

      // Cập nhật nhãn & trạng thái nút bấm tương tác theo ngữ cảnh thời gian thực
      this.updateActionButtonsUI();
    }
  }

  private render(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.currentMode === 'map1') {
      this.renderMap1(ctx);
    } else {
      this.renderStudio(ctx);
    }
  }

  // ============================================================
  // MAP 1: CẢNH QUAN MỞ RỘNG 4000PX (ĐỒNG CỎ -> RUỘNG LÚA NƯỚC)
  // ============================================================
  private renderMap1(ctx: CanvasRenderingContext2D): void {
    const groundY = this.groundY;

    // ------------------------------------------------------------
    // 1. NỀN BẦU TRỜI & MÂY TRÔI PARALLAX
    // ------------------------------------------------------------
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#60a5fa');
    skyGrad.addColorStop(0.5, '#93c5fd');
    skyGrad.addColorStop(0.85, '#dbeafe');
    skyGrad.addColorStop(1, '#fef9c3');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, groundY);

    this.renderAtmosphericClouds(ctx, groundY);

    // ------------------------------------------------------------
    // 2. DỊCH CHUYỂN CAMERA THEO THẾ GIỚI GAME (World Space)
    // ------------------------------------------------------------
    ctx.save();
    ctx.translate(-Math.round(this.cameraX), 0);

    // A. Lớp Cây Hậu Cảnh (Khóm Tre & Cây Chuối đứng sau - hiển thị tooltip bứng cây khi lại gần)
    this.floraManager.renderBackgroundTrees(ctx, groundY, this.animTimer, this.player.x);

    // B. Mặt Đất Đồng Cỏ & Đáy Đất Phù Sa
    this.floraManager.renderGround(ctx, this.width, this.height, groundY);

    // C. Cánh Đồng Lúa Nước Lớp Hậu Cảnh (Mặt nước xanh biếc + Lớp lúa đứng sau người chơi)
    this.floraManager.renderRiceBackground(ctx, groundY, this.player.x, this.animTimer, this.cameraX, this.width);

    // D. Chú Trâu Làng Quê (Đi dạo trên đồng cỏ)
    this.buffalo.render(ctx);

    // E. Cô Bé Bán Rau (Bé Miến)
    this.vegetableGirl.render(ctx, this.player.x);

    // F. Nhân Vật Chính (Đang bước đi / lội ruộng nước)
    this.player.render(ctx);

    // G. Lớp Tiền Cảnh (Cây lúa tiền cảnh CHE NGANG CHÂN & THÂN NGƯỜI CHƠI + Hoa cỏ dại)
    this.floraManager.renderForegroundFlora(ctx, groundY, this.player.x, this.animTimer, this.cameraX, this.width);

    // H. Lưới Thước Đo & Đánh Số Phân Đoạn Bản Đồ (Map Ruler Grid Overlay)
    this.renderMapRuler(ctx, groundY);

    ctx.restore();

    // ------------------------------------------------------------
    // 3. HUD THÔNG TIN CỐ ĐỊNH TRÊN MÀN HÌNH (Screen Space)
    // ------------------------------------------------------------
    ctx.save();
    const isMobile = this.width < 900 || this.height < 560;
    const hudW = isMobile ? Math.min(225, this.width - 90) : 320;
    const hudH = isMobile ? 38 : 56;
    const hudX = isMobile ? 10 : 20;
    const hudY = isMobile ? 10 : 68;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, isMobile ? 10 : 12);
    ctx.fill();
    ctx.strokeStyle = this.showMapRuler ? '#38bdf8' : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    let currentSecLabel = 'Đoạn 1';
    if (this.player.x < -200) currentSecLabel = 'Đoạn 0A';
    else if (this.player.x < 0) currentSecLabel = 'Đoạn 0B';
    else {
      const sId = Math.min(12, Math.floor(this.player.x / 200) + 1);
      currentSecLabel = `Đoạn ${sId}`;
    }

    const inPaddy = this.player.x >= this.floraManager.paddyStartX && this.player.x <= this.floraManager.paddyEndX;

    ctx.fillStyle = inPaddy ? '#38bdf8' : '#fde047';
    ctx.font = isMobile ? 'bold 10px Outfit, sans-serif' : 'bold 13px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`📍 [ ${currentSecLabel.toUpperCase()} ] · X: ${Math.round(this.player.x)}m / ${this.mapWidth}m`, hudX + 10, hudY + (isMobile ? 14 : 20));

    const bananaCount = this.player.carriedBananas.length;
    const bananaText = bananaCount > 0 ? ` · 🎋 ${bananaCount}` : '';

    ctx.fillStyle = '#94a3b8';
    ctx.font = isMobile ? '600 9.5px Outfit, sans-serif' : '600 11px Outfit, sans-serif';
    ctx.fillText(`🌾 Thóc: ${this.floraManager.riceCrop.harvestedGrains}${bananaText} · [E] Thao tác`, hudX + 10, hudY + (isMobile ? 28 : 40));
    ctx.restore();
  }

  /**
   * Vẽ Lưới Thước Đo Phân Chia Toàn Bộ Bản Đồ Thành 12 Đoạn Bằng Nhau
   */
  private renderMapRuler(ctx: CanvasRenderingContext2D, groundY: number): void {
    if (!this.showMapRuler) return;

    ctx.save();

    // Danh sách toàn bộ các phân đoạn (Bao gồm cả Cánh Đồng Cỏ Mở Rộng Bên Trái)
    const sections: Array<{ id: string | number; start: number; end: number; label: string; icon: string; col: string }> = [
      // 2 Phân đoạn mở rộng bên trái (x: -400m -> 0m)
      { id: '0A', start: -400, end: -200, label: 'Đồng Cỏ Xa (Trái)', icon: '🌿', col: '#06b6d4' },
      { id: '0B', start: -200, end: 0,    label: 'Cánh Cỏ Hoa (Trái)', icon: '🌸', col: '#a855f7' },

      // 12 Phân đoạn chính của bản đồ (x: 0m -> 2400m)
      { id: 1,  start: 0,    end: 200,  label: 'Đầu Làng',          icon: '🏡', col: '#38bdf8' },
      { id: 2,  start: 200,  end: 400,  label: 'Lũy Tre Xanh',      icon: '🎋', col: '#4ade80' },
      { id: 3,  start: 400,  end: 600,  label: 'Bãi Trâu & Cỏ',     icon: '🐃', col: '#a3e635' },
      { id: 4,  start: 600,  end: 800,  label: 'Đồng Cỏ Hoa',       icon: '🌸', col: '#f472b6' },
      { id: 5,  start: 800,  end: 1000, label: 'Dốc Lên Ụ Đất',     icon: '⛰️', col: '#fbbf24' },
      { id: 6,  start: 1000, end: 1200, label: 'Đỉnh Đồi & Bé Miến',icon: '👧', col: '#f87171' },
      { id: 7,  start: 1200, end: 1400, label: 'Dốc Xuống Ruộng',    icon: '🍌', col: '#fb923c' },
      { id: 8,  start: 1400, end: 1600, label: 'Ruộng Mạ Non (14px)',icon: '🌱', col: '#22c55e' },
      { id: 9,  start: 1600, end: 1800, label: 'Lúa Đẻ Nhánh (22px)',icon: '🌿', col: '#06b6d4' },
      { id: 10, start: 1800, end: 2000, label: 'Lúa Làm Đòng (34px)',icon: '🌾', col: '#eab308' },
      { id: 11, start: 2000, end: 2200, label: 'Lúa Chín Vàng (56px)',icon: '🌾', col: '#f59e0b' },
      { id: 12, start: 2200, end: 2400, label: 'Bờ Đê Cuối Làng',   icon: '🌳', col: '#38bdf8' }
    ];

    sections.forEach(sec => {
      const midX = (sec.start + sec.end) / 2;
      const width = sec.end - sec.start;

      // 1. Đường dóng phân chia ranh giới đoạn (Vạch đứt màu)
      ctx.strokeStyle = sec.col;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(sec.start, 0);
      ctx.lineTo(sec.start, this.height);
      ctx.stroke();

      // 2. Thẻ Tiêu Đề Đoạn ở trên cao (Top Section Badge)
      const isMobile = this.width < 900 || this.height < 560;
      const badgeY = isMobile ? 48 : 75;
      const badgeW = isMobile ? 120 : 150;
      const badgeH = isMobile ? 38 : 48;

      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.beginPath();
      ctx.roundRect(midX - badgeW / 2, badgeY, badgeW, badgeH, 8);
      ctx.fill();
      ctx.strokeStyle = sec.col;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text tiêu đề đoạn
      ctx.fillStyle = '#ffffff';
      ctx.font = isMobile ? 'bold 10px Outfit, sans-serif' : 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Đoạn ${sec.id}: ${sec.icon} ${sec.label}`, midX, badgeY + (isMobile ? 15 : 19));

      ctx.fillStyle = sec.col;
      ctx.font = isMobile ? 'bold 9px Outfit, sans-serif' : 'bold 11px Outfit, sans-serif';
      ctx.fillText(`${sec.start}m ➔ ${sec.end}m (${width}m)`, midX, badgeY + (isMobile ? 29 : 37));

      // 3. Vạch thước đo tọa độ dọc mặt đất
      const gy = groundY;
      ctx.fillStyle = sec.col;
      ctx.beginPath();
      ctx.roundRect(midX - 44, gy + 18, 88, 22, 6);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`[ ĐOẠN ${sec.id} ]`, midX, gy + 33);
    });

    // Đường ranh giới bắt đầu (x = -400m) & kết thúc (x = 2400m)
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(-400, 0);
    ctx.lineTo(-400, this.height);
    ctx.moveTo(this.mapWidth, 0);
    ctx.lineTo(this.mapWidth, this.height);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Vẽ các đám mây mềm mại trôi nhẹ ở hậu cảnh
   */
  private renderAtmosphericClouds(ctx: CanvasRenderingContext2D, groundY: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    
    const clouds = [
      { xOffset: 80, y: groundY * 0.22, scale: 1.2, speed: 12 },
      { xOffset: 450, y: groundY * 0.38, scale: 0.85, speed: 8 },
      { xOffset: 880, y: groundY * 0.18, scale: 1.4, speed: 15 },
      { xOffset: 1300, y: groundY * 0.32, scale: 0.95, speed: 10 }
    ];

    clouds.forEach(c => {
      const cx = ((c.xOffset + this.animTimer * c.speed) % (this.width + 300)) - 150;
      const cy = c.y;
      
      ctx.beginPath();
      ctx.arc(cx, cy, 28 * c.scale, 0, Math.PI * 2);
      ctx.arc(cx + 25 * c.scale, cy - 10 * c.scale, 35 * c.scale, 0, Math.PI * 2);
      ctx.arc(cx + 60 * c.scale, cy - 5 * c.scale, 28 * c.scale, 0, Math.PI * 2);
      ctx.arc(cx + 85 * c.scale, cy, 20 * c.scale, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  // ============================================================
  // STUDIO SO SÁNH HOẠT ẢNH (GIỮ NGUYÊN BÀN CÂN ĐO ĐẠC)
  // ============================================================
  private renderStudio(ctx: CanvasRenderingContext2D): void {
    // 1. NỀN TRẮNG TINH KHIẾT
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, this.width, this.height);

    // 2. SHOWCASE TOÀN BỘ 8 HOẠT ẢNH CÙNG 1 LÚC ĐỂ ĐO KÍCH THƯỚC
    const showcaseStates = [
      { id: 'idle', name: '1. Đứng Tay Không', frames: 24 },
      { id: 'walk', name: '2. Bước Đi', frames: 10 },
      { id: 'cam_cuoc', name: '3. Cầm Cuốc', frames: 12 },
      { id: 'hoe', name: '4. Cuốc Đất', frames: 68 },
      { id: 'cam_thung_nuoc', name: '5. Cầm Thùng', frames: 8 },
      { id: 'water', name: '6. Tưới Nước', frames: 63 },
      { id: 'cam_liem', name: '7. Cầm Liềm', frames: 12 },
      { id: 'harvest', name: '8. Thu Hoạch', frames: 38 }
    ];

    const count = showcaseStates.length;
    const padding = 60;
    const availableWidth = this.width - padding * 2;
    const stepX = availableWidth / (count - 1);
    const groundY = this.height * 0.72;

    ctx.save();

    // A. Đường Đỉnh Nón Lá (Top Hat Line - 95px)
    const hatTopY = groundY - 95;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.65)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(padding - 30, hatTopY);
    ctx.lineTo(this.width - padding + 30, hatTopY);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 10px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📏 ĐỈNH NÓN LÁ CHUẨN (Top Head Line)', padding - 25, hatTopY - 5);

    // B. Đường Ngang Mắt / Cằm (Face Center Line)
    const faceY = groundY - 65;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(padding - 30, faceY);
    ctx.lineTo(this.width - padding + 30, faceY);
    ctx.stroke();

    // C. Đường Tiếp Đất (Ground Anchor Line)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 5]);
    ctx.beginPath();
    ctx.moveTo(padding - 30, groundY + 2);
    ctx.lineTo(this.width - padding + 30, groundY + 2);
    ctx.stroke();

    ctx.fillStyle = '#059669';
    ctx.font = 'bold 10px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('👣 ĐẾ CHÂN TIẾP ĐẤT (Ground Baseline)', padding - 25, groundY + 14);

    ctx.restore();

    // VẼ TỪNG NHÂN VẬT VÀ NHÃN ĐO KÍCH CỠ
    showcaseStates.forEach((item, idx) => {
      const posX = padding + idx * stepX;
      this.player.renderAt(ctx, posX, groundY, item.id, this.animTimer, 1);

      ctx.save();
      const boxW = 105;
      const boxH = 40;
      const boxX = posX - boxW / 2;
      const boxY = groundY + 18;

      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 8);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 9.5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, posX, boxY + 15);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 8.5px Outfit, sans-serif';
      ctx.fillText(`🎬 ${item.frames} frames`, posX, boxY + 30);

      ctx.restore();
    });

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('📐 BẢNG SO SÁNH & ĐO ĐẠC KÍCH THƯỚC TOÀN BỘ HOẠT ẢNH', this.width / 2, 55);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px Outfit, sans-serif';
    ctx.fillText('Tất cả 8 hoạt ảnh đang chạy đồng thời · So sánh trực quan Đỉnh Nón Lá và Bàn Chân Tiếp Đất', this.width / 2, 75);
    ctx.restore();
  }
}
