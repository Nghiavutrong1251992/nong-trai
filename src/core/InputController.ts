/**
 * InputController.ts
 * Quản lý toàn bộ hệ thống Input & Tương tác UI:
 * - Bàn phím máy tính (A/D/W/Space, 1/2/3, Q, E, G, M, H, N)
 * - Joystick cảm ứng ảo (Left Thumb) & Nút nhảy/thao tác (Right Thumb)
 * - PWA Install prompt flow & Menu cài đặt Mobile
 * - Tương tác công cụ nông trại (Cuốc bứng chuối, Trồng chuối, Cấy lúa, Gặt lúa, Tưới nước)
 * - Cập nhật nhãn nút tương tác theo ngữ cảnh thời gian thực
 */

import { Engine } from './Engine';
import { BananaInstance } from '../graphics/plants/BananaTree';

export interface InputState {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  jump: boolean;
  hoe: boolean;
  fish: boolean;
}

export class InputController {
  public input: InputState = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    hoe: false,
    fish: false
  };

  // Trạng thái đang cuốc bứng cây chuối (Chờ hết hành động cuốc mới xóa cây)
  public pendingDigBanana: { banana: BananaInstance; targetX: number } | null = null;

  constructor(private engine: Engine) {}

  public bindEvents(): void {
    // Studio Navigation Buttons
    const btnGotoStudio = document.getElementById('tab-studio') || document.getElementById('btn-goto-studio');
    const mBtnGotoStudio = document.getElementById('m-tab-studio');

    const gotoStudio = () => {
      window.location.href = '/studio.html';
    };

    btnGotoStudio?.addEventListener('click', gotoStudio);
    mBtnGotoStudio?.addEventListener('click', gotoStudio);

    // Mobile menu toggle
    const btnMobileMenu = document.getElementById('btn-mobile-menu');
    const mobileDropdown = document.getElementById('mobile-dropdown');
    if (btnMobileMenu && mobileDropdown) {
      btnMobileMenu.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = mobileDropdown.classList.toggle('active');
        btnMobileMenu.classList.toggle('active', isOpen);
      });
      document.addEventListener('click', (e) => {
        if (!mobileDropdown.contains(e.target as Node) && e.target !== btnMobileMenu) {
          mobileDropdown.classList.remove('active');
          btnMobileMenu.classList.remove('active');
        }
      });
    }

    // Map Mode Toggle Button
    document.getElementById('btn-toggle-map')?.addEventListener('click', () => {
      this.engine.toggleMapMode();
      const btn = document.getElementById('btn-toggle-map');
      if (btn) {
        if (this.engine.mapMode === 'map25d') {
          btn.textContent = '🌾 Bản Đồ Đồng Quê [Tab]';
          btn.style.color = '#fbbf24';
          btn.style.borderColor = '#fbbf24';
        } else {
          btn.textContent = '🏡 Bản Đồ 2.5D [Tab]';
          btn.style.color = '#10b981';
          btn.style.borderColor = '#10b981';
        }
      }
    });

    document.getElementById('btn-toggle-boundaries')?.addEventListener('click', () => {
      this.engine.toggleWalkableBoundaries();
    });

    // Reset World
    const handleReset = () => {
      if (confirm('🔄 Bạn có chắc chắn muốn Đặt Lại Bản Đồ về trạng thái ban đầu?')) {
        this.engine.resetWorld();
      }
    };
    document.getElementById('btn-reset-world')?.addEventListener('click', handleReset);
    document.getElementById('m-btn-reset')?.addEventListener('click', () => {
      mobileDropdown?.classList.remove('active');
      handleReset();
    });

    // Keyboard Controller
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') this.input.left = true;
      if (k === 'd' || k === 'arrowright') this.input.right = true;
      if (k === 'w' || k === 'arrowup') this.input.up = true;
      if (k === 's' || k === 'arrowdown') this.input.down = true;
      if (k === 'w' || k === 'arrowup' || k === ' ') this.input.jump = true;

      // Phím Tab: Chuyển đổi Map 1 (Side-scroll) ↔ Map 2 (2.5D Làng Quê)
      if (k === 'tab') {
        e.preventDefault();
        this.engine.toggleMapMode();
      }

      // Phím Q: Rút / Đổi / Cất dụng cụ
      if (k === 'q') {
        const res = this.engine.player.cycleTool();
        this.engine.showToast(res.label);
        this.updateActionButtonsUI();
      }

      // Phím E / Enter: Dùng dụng cụ
      if (k === 'e' || k === 'enter') {
        this.handleUseTool();
      }

      // Phím N: Bật / Tắt phụ đề nhãn tên thú nuôi
      if (k === 'n') {
        toggleAnimalLabels();
      }

      // Các phím số tắt 1, 2, 3 nhanh
      if (k === '1') {
        this.engine.player.selectTool('hoe');
        this.engine.showToast('⛏️ Đã trang bị: Cuốc Đất (Ấn E để cuốc)');
        this.updateActionButtonsUI();
      }
      if (k === '2') {
        this.engine.player.selectTool('water');
        this.engine.showToast('💧 Đã trang bị: Thùng Nước (Ấn E để tưới)');
        this.updateActionButtonsUI();
      }
      if (k === '3') {
        this.engine.player.selectTool('sickle');
        this.engine.showToast('🌾 Đã trang bị: Liềm Cắt Lúa (Ấn E để thu hoạch)');
        this.updateActionButtonsUI();
      }
      if (k === 'g') {
        this.engine.showMapRuler = !this.engine.showMapRuler;
        this.engine.showToast(this.engine.showMapRuler ? '📐 Đã BẬT lưới thước đo phân đoạn bản đồ' : '📐 Đã TẮT lưới thước đo');
        const btnGrid = document.getElementById('btn-toggle-grid');
        if (btnGrid) {
          btnGrid.classList.toggle('active', this.engine.showMapRuler);
          btnGrid.textContent = this.engine.showMapRuler ? '📐 Thước Đo: BẬT [G]' : '📐 Thước Đo: TẮT [G]';
        }
      }
      if (k === 'b') {
        this.engine.toggleWalkableBoundaries();
      }
      if (k === 't') {
        cycleTimeOfDay();
      }
      if (k === 'y') {
        cycleWeather();
      }
      if (k === 'f') {
        const pond = this.engine.floraManager.fishPond;
        pond.feedFish(this.engine.player.x, this.engine.groundY);
        this.engine.sound.play('water');
        this.engine.showToast('🐟 Đã rải thức ăn cho cá! Đàn cá đang ùa tới đớp mồi [F]');
      }
      if (k === 'm') {
        const isMuted = this.engine.sound.toggleMute();
        this.engine.showToast(isMuted ? '🔇 Đã tắt nhạc nền' : '🎵 Đã bật nhạc làng quê');
        const btnMute = document.getElementById('btn-toggle-music');
        if (btnMute) btnMute.textContent = isMuted ? '🔇 Bật Nhạc [M]' : '🎵 Nhạc Làng Quê [M]';
      }
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') this.input.left = false;
      if (k === 'd' || k === 'arrowright') this.input.right = false;
      if (k === 'w' || k === 'arrowup') {
        this.input.up = false;
        this.input.jump = false;
      }
      if (k === 's' || k === 'arrowdown') this.input.down = false;
      if (k === ' ') this.input.jump = false;
    });


    // Chuyển đổi Thời Tiết Trực Tiếp
    const updateWeatherUI = () => {
      const current = this.engine.worldRenderer.weatherManager.currentWeather;
      document.querySelectorAll('.env-btn[data-weather]').forEach(btn => {
        const w = (btn as HTMLElement).dataset.weather;
        btn.classList.toggle('active', w === current);
      });
    };

    document.querySelectorAll('.env-btn[data-weather]').forEach(btn => {
      btn.addEventListener('click', () => {
        const w = (btn as HTMLElement).dataset.weather as any;
        if (w) {
          this.engine.worldRenderer.weatherManager.setWeather(w);
          const nameMap: Record<string, string> = {
            clear: '☀️ Trời Nắng Đẹp',
            windy: '🍃 Gió Đồng Lộng',
            light_rain: '🌦️ Mưa Rào Nhỏ',
            storm: '⛈️ Mưa Giông Sấm Sét'
          };
          this.engine.showToast(nameMap[w] || w);
          updateWeatherUI();
        }
      });
    });

    // Chuyển đổi Mây Bầu Trời Trực Tiếp
    const updateCloudsUI = () => {
      const hasClouds = this.engine.worldRenderer.skyManager.hasClouds;
      document.querySelectorAll('.env-btn[data-clouds]').forEach(btn => {
        const c = (btn as HTMLElement).dataset.clouds === 'true';
        btn.classList.toggle('active', c === hasClouds);
      });
    };

    document.querySelectorAll('.env-btn[data-clouds]').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = (btn as HTMLElement).dataset.clouds === 'true';
        this.engine.worldRenderer.skyManager.hasClouds = c;
        this.engine.showToast(c ? '☁️ Bầu trời: Có Mây Bồng Bềnh' : '✨ Bầu trời: Không Một Gợn Mây (Quang Mây)');
        updateCloudsUI();
      });
    });

    // Chuyển đổi Thời Khắc Trực Tiếp
    const updateTimeUI = () => {
      const current = this.engine.worldRenderer.skyManager.currentPeriod;
      document.querySelectorAll('.env-btn[data-time]').forEach(btn => {
        const t = (btn as HTMLElement).dataset.time;
        btn.classList.toggle('active', t === current);
      });
    };

    document.querySelectorAll('.env-btn[data-time]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = (btn as HTMLElement).dataset.time as any;
        if (t) {
          this.engine.worldRenderer.skyManager.setTimePeriod(t);
          const nameMap: Record<string, string> = {
            dawn: '🌅 Bình Minh Sớm Mai',
            noon: '☀️ Ban Ngày Nắng Vàng',
            sunset: '🌇 Hoàng Hôn Rực Rỡ',
            night_moon: '🌙 Đêm Trăng Dịu Mát',
            night_dark: '🌌 Đêm Không Trăng (Ngân Hà Rực Rỡ)'
          };
          this.engine.showToast(nameMap[t] || t);
          updateTimeUI();
        }
      });
    });

    // Chuyển đổi Thời Tiết (Nắng / Gió / Mưa Rào / Mưa Giông) [Y]
    const cycleWeather = () => {
      const msg = this.engine.worldRenderer.weatherManager.cycleWeather();
      this.engine.showToast(msg);
      updateWeatherUI();
    };
    document.getElementById('btn-toggle-weather')?.addEventListener('click', cycleWeather);
    document.getElementById('m-btn-weather')?.addEventListener('click', cycleWeather);

    // Chuyển đổi Thời Gian [T]
    const cycleTimeOfDay = () => {
      const periods: Array<'dawn' | 'noon' | 'sunset' | 'night_moon' | 'night_dark'> = ['dawn', 'noon', 'sunset', 'night_moon', 'night_dark'];
      const curIdx = periods.indexOf(this.engine.worldRenderer.skyManager.currentPeriod);
      const nextP = periods[(curIdx + 1) % periods.length];
      this.engine.worldRenderer.skyManager.setTimePeriod(nextP);
      const nameMap: Record<string, string> = {
        dawn: '🌅 Bình Minh Sớm Mai',
        noon: '☀️ Ban Ngày Nắng Vàng',
        sunset: '🌇 Hoàng Hôn Rực Rỡ',
        night_moon: '🌙 Đêm Trăng Dịu Mát',
        night_dark: '🌌 Đêm Không Trăng (Ngân Hà Rực Rỡ)'
      };
      this.engine.showToast(nameMap[nextP]);
      updateTimeUI();
    };
    document.getElementById('btn-toggle-time')?.addEventListener('click', cycleTimeOfDay);
    document.getElementById('m-btn-time')?.addEventListener('click', cycleTimeOfDay);

    // Bật / Tắt Phụ Đề Nhãn Tên Thú Nuôi [N]
    const toggleAnimalLabels = () => {
      this.engine.showAnimalLabels = !this.engine.showAnimalLabels;
      this.engine.showToast(this.engine.showAnimalLabels ? '🏷️ Đã BẬT nhãn tên trên đầu thú nuôi' : '🏷️ Đã TẮT nhãn tên trên đầu thú nuôi');
      const btnLabels = document.getElementById('btn-toggle-labels');
      if (btnLabels) {
        btnLabels.classList.toggle('active', this.engine.showAnimalLabels);
        btnLabels.textContent = this.engine.showAnimalLabels ? '🏷️ Nhãn Thú: BẬT [N]' : '🏷️ Nhãn Thú: TẮT [N]';
      }
      const mBtnLabels = document.getElementById('m-btn-labels');
      if (mBtnLabels) {
        mBtnLabels.classList.toggle('active', this.engine.showAnimalLabels);
      }
    };
    document.getElementById('btn-toggle-labels')?.addEventListener('click', toggleAnimalLabels);
    document.getElementById('m-btn-labels')?.addEventListener('click', toggleAnimalLabels);

    // Bật / Tắt Thước Đo Bản Đồ [G]
    document.getElementById('btn-toggle-grid')?.addEventListener('click', () => {
      this.engine.showMapRuler = !this.engine.showMapRuler;
      this.engine.showToast(this.engine.showMapRuler ? '📐 Đã BẬT lưới thước đo phân đoạn bản đồ' : '📐 Đã TẮT lưới thước đo');
      const btnGrid = document.getElementById('btn-toggle-grid');
      if (btnGrid) {
        btnGrid.classList.toggle('active', this.engine.showMapRuler);
        btnGrid.textContent = this.engine.showMapRuler ? '📐 Thước Đo: BẬT [G]' : '📐 Thước Đo: TẮT [G]';
      }
    });

    // Bật / Tắt Nhạc Làng Quê
    document.getElementById('btn-toggle-music')?.addEventListener('click', () => {
      const isMuted = this.engine.sound.toggleMute();
      this.engine.showToast(isMuted ? '🔇 Đã tắt nhạc nền' : '🎵 Đã bật nhạc làng quê');
      const btnMute = document.getElementById('btn-toggle-music');
      if (btnMute) btnMute.textContent = isMuted ? '🔇 Bật Nhạc [M]' : '🎵 Nhạc Làng Quê [M]';
    });

    // Fullscreen Toggle
    const toggleFullscreen = () => {
      const doc = document as any;
      if (!doc.fullscreenElement && !doc.webkitFullscreenElement) {
        const docEl = document.documentElement as any;
        if (docEl.requestFullscreen) docEl.requestFullscreen();
        else if (docEl.webkitRequestFullscreen) docEl.webkitRequestFullscreen();
        this.engine.showToast('⛶ Đã mở chế độ Toàn Màn Hình');
      } else {
        if (doc.exitFullscreen) doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
        this.engine.showToast('⛶ Đã thoát chế độ Toàn Màn Hình');
      }
    };
    document.getElementById('btn-fullscreen')?.addEventListener('click', toggleFullscreen);

    // PWA Install System (Tự động dọn sạch Cache ServiceWorker trên Localhost để luôn nhận code mới nhất)
    if ('serviceWorker' in navigator) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          for (const reg of registrations) {
            reg.unregister();
          }
        }).catch(() => {});
        if ('caches' in window) {
          caches.keys().then(names => {
            for (const name of names) caches.delete(name);
          });
        }
      } else {
        navigator.serviceWorker.register('/sw.js').catch(() => {});
      }
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
            this.engine.showToast('🎉 Đang cài đặt game ra màn hình chính...');
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
          installText.innerHTML = `Để chơi **Toàn Màn Hình** trên iPhone / iPad:<br><br>
            1. Bấm nút <b>Chia sẻ (Share)</b> 📤 ở dưới trình duyệt Safari<br>
            2. Chọn <b>"Thêm vào Màn hình chính" (Add to Home Screen)</b> ➕<br>
            3. Mở game từ biểu tượng ngoài màn hình để có trải nghiệm mượt nhất!`;
        } else {
          installText.innerHTML = `Để cài đặt game **Toàn Màn Hình (Full Screen)**:<br><br>
            1. Bấm nút <b>Menu (⋮)</b> của trình duyệt Chrome / Cốc Cốc<br>
            2. Chọn <b>"Cài đặt ứng dụng" (Install App)</b> hoặc <b>"Thêm vào Màn hình chính"</b><br>
            3. Trò chơi sẽ chạy mượt mà như app gốc không có thanh địa chỉ!`;
        }
      }
    };

    btnInstallPwa?.addEventListener('click', openInstallGuide);
    mBtnInstall?.addEventListener('click', () => {
      mobileDropdown?.classList.remove('active');
      openInstallGuide();
    });
    btnCloseInstall?.addEventListener('click', () => {
      if (installModal) installModal.style.display = 'none';
    });
    btnTriggerInstall?.addEventListener('click', () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt = null;
      }
      if (installModal) installModal.style.display = 'none';
    });

    // Mobile Virtual Joystick (Left Thumb)
    const joyContainer = document.getElementById('joystick-container');
    const joyBase = document.getElementById('joystick-base');
    const joyKnob = document.getElementById('joystick-knob');

    if (joyContainer && joyBase && joyKnob) {
      let activePointerId: number | null = null;
      let baseCenterX = 0;
      let baseCenterY = 0;
      const maxRadius = 42;

      const resetKnob = () => {
        joyKnob.style.transform = 'translate(-50%, -50%)';
        joyKnob.classList.remove('active');
        this.input.left = false;
        this.input.right = false;
        this.input.up = false;
        this.input.down = false;
        activePointerId = null;
      };

      joyContainer.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        activePointerId = e.pointerId;
        const rect = joyBase.getBoundingClientRect();
        baseCenterX = rect.left + rect.width / 2;
        baseCenterY = rect.top + rect.height / 2;
        joyKnob.classList.add('active');

        const dx = e.clientX - baseCenterX;
        const dy = e.clientY - baseCenterY;
        handleJoyMove(dx, dy);
      });

      const handleJoyMove = (dx: number, dy: number) => {
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        const clampedDist = Math.min(dist, maxRadius);

        const knobX = Math.cos(angle) * clampedDist;
        const knobY = Math.sin(angle) * clampedDist;
        joyKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

        const deadzone = 10;
        if (Math.abs(dx) > deadzone) {
          if (dx < 0) {
            this.input.left = true;
            this.input.right = false;
          } else {
            this.input.left = false;
            this.input.right = true;
          }
        } else {
          this.input.left = false;
          this.input.right = false;
        }

        if (Math.abs(dy) > deadzone) {
          if (dy < 0) {
            this.input.up = true;
            this.input.down = false;
          } else {
            this.input.up = false;
            this.input.down = true;
          }
        } else {
          this.input.up = false;
          this.input.down = false;
        }
      };

      window.addEventListener('pointermove', (e) => {
        if (activePointerId === null || e.pointerId !== activePointerId) return;
        e.preventDefault();
        const dx = e.clientX - baseCenterX;
        const dy = e.clientY - baseCenterY;
        handleJoyMove(dx, dy);
      });

      window.addEventListener('pointerup', (e) => {
        if (activePointerId === e.pointerId) resetKnob();
      });
      window.addEventListener('pointercancel', (e) => {
        if (activePointerId === e.pointerId) resetKnob();
      });
    }

    // Touch Buttons (Right Thumb)
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

    const btnCycle = document.getElementById('btn-cycle-tool');
    btnCycle?.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      btnCycle.classList.add('pressed');
      const res = this.engine.player.cycleTool();
      this.engine.showToast(res.label);
      this.updateActionButtonsUI();
    });
    btnCycle?.addEventListener('pointerup', () => btnCycle.classList.remove('pressed'));
    btnCycle?.addEventListener('pointercancel', () => btnCycle.classList.remove('pressed'));

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

  public handleUseTool(): void {
    if (this.engine.player.actionTimer > 0) return;

    // 1. ƯU TIÊN 1: TƯƠNG TÁC BỨNG CÂY CHUỐI NẾU ĐỨNG GẦN GỐC CÂY
    const nearbyBanana = this.engine.floraManager.findNearbyBanana(this.engine.player.x, 75);
    if (nearbyBanana) {
      this.engine.player.selectTool('hoe');
      this.engine.player.useTool(this.engine.sound);
      this.engine.player.facing = this.engine.player.x > nearbyBanana.banana.x ? -1 : 1;
      this.pendingDigBanana = { banana: nearbyBanana.banana, targetX: this.engine.player.x };
      this.engine.showToast(`⛏️ Đang cuốc bứng cây chuối...`);
      this.updateActionButtonsUI();
      return;
    }

    // 2. ƯU TIÊN 2: TRỒNG CÂY CHUỐI NẾU ĐANG CẦM TRONG TÚI (VÀ KHÔNG Ở RUỘNG LÚA)
    const inPaddy = this.engine.player.x >= this.engine.floraManager.paddyStartX && this.engine.player.x <= this.engine.floraManager.paddyEndX;
    if (this.engine.player.carriedBananas.length > 0 && !inPaddy) {
      const tree = this.engine.player.carriedBananas.pop()!;
      tree.x = this.engine.player.x;
      this.engine.floraManager.banana.instances.push(tree);
      this.engine.player.selectTool('hoe');
      this.engine.player.useTool(this.engine.sound);
      this.engine.sound.play('coin');
      this.engine.showToast(`🎋 Đã trồng cây chuối thành công! (Còn lại trong túi: ${this.engine.player.carriedBananas.length} cây)`);
      this.updateActionButtonsUI();
      this.engine.saveCurrentState();
      return;
    }

    // 3. ƯU TIÊN 3: CẤY / GẶT LÚA NƯỚC NẾU ĐỨNG TRONG RUỘNG LÚA
    if (inPaddy) {
      // A. Thu hoạch nếu có lúa chín cạnh bên
      const harvestResult = this.engine.floraManager.harvestNearbyRice(this.engine.player.x);
      if (harvestResult.harvested) {
        this.engine.player.selectTool('sickle');
        this.engine.player.useTool(this.engine.sound);
        this.engine.player.coins += harvestResult.count * 10;
        this.engine.sound.play('coin');
        this.engine.showToast(`🌾 Gặt lúa bội thu! +${harvestResult.count * 10} Xu. Tổng thóc: ${this.engine.floraManager.riceCrop.harvestedGrains} hạt 🌾`);
        this.engine.saveCurrentState();
        return;
      }

      // B. Cấy mạ non nếu đất trống
      const planted = this.engine.floraManager.plantSeedling(this.engine.player.x, this.engine.groundY);
      if (planted) {
        this.engine.player.selectTool('hoe');
        this.engine.player.useTool(this.engine.sound);
        this.engine.sound.play('click');
        this.engine.showToast(`🌱 Đã cấy một khóm mạ non xanh tươi xuống ruộng!`);
        this.engine.saveCurrentState();
        return;
      }
    }

    // 4. Dùng công cụ tiêu chuẩn (Cuốc / Tưới / Liềm)
    const res = this.engine.player.useTool(this.engine.sound);
    if (this.engine.player.activeTool === 'water') {
      const watered = this.engine.floraManager.waterNearbyRice(this.engine.player.x);
      if (watered) {
        this.engine.showToast(`💧 Đã tưới nước! Lúa được chăm sóc lớn nhanh vượt trội 🌱`);
        this.engine.saveCurrentState();
        return;
      }
    }
    this.engine.showToast(res.msg);
  }

  public updateActionButtonsUI(): void {
    const btnCycle = document.getElementById('btn-cycle-tool');
    const btnUse = document.getElementById('btn-use-tool');
    if (!btnCycle || !btnUse) return;

    const nearbyBanana = this.engine.floraManager.findNearbyBanana(this.engine.player.x, 75);
    const bananaCount = this.engine.player.carriedBananas.length;
    const inPaddy = this.engine.player.x >= this.engine.floraManager.paddyStartX && this.engine.player.x <= this.engine.floraManager.paddyEndX;

    if (this.pendingDigBanana && this.engine.player.actionTimer > 0) {
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

    if (this.engine.player.activeTool === 'water') {
      btnCycle.innerHTML = '💧 Tưới Nước [Q]';
    } else if (this.engine.player.activeTool === 'hoe') {
      btnCycle.innerHTML = '⛏️ Cuốc Đất [Q]';
    } else if (this.engine.player.activeTool === 'sickle') {
      btnCycle.innerHTML = '🌾 Liềm Cắt [Q]';
    } else {
      btnCycle.innerHTML = '🔄 Đổi Dụng Cụ [Q]';
    }

    // Cập nhật nút Bật/Tắt Ranh Giới Vùng Đi
    const btnBoundaries = document.getElementById('btn-toggle-boundaries');
    if (btnBoundaries) {
      btnBoundaries.textContent = this.engine.showWalkableBoundaries ? '🛣️ Ranh Giới: BẬT [B]' : '🛣️ Ranh Giới: TẮT [B]';
      if (this.engine.showWalkableBoundaries) {
        btnBoundaries.classList.add('active');
        btnBoundaries.style.color = '#4ade80';
        btnBoundaries.style.borderColor = '#22c55e';
      } else {
        btnBoundaries.classList.remove('active');
        btnBoundaries.style.color = '#cbd5e1';
        btnBoundaries.style.borderColor = '#94a3b8';
      }
    }
  }
}
