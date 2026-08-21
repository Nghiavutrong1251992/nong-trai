import { SoundManager } from './SoundManager';
import { Player } from '../entities/Player';

export class Engine {
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  private lastTime: number = 0;
  private dpr: number = 1;
  private width: number = window.innerWidth;
  private height: number = window.innerHeight;

  private sound = new SoundManager();
  private player = new Player(400, 480);

  public currentMode: 'map1' | 'studio' = 'map1'; // Mặc định mở Map 1 Làng Quê
  private groundY: number = 480;
  private animTimer: number = 0;
  private cameraX: number = 0;
  private mapWidth: number = 3600; // Chiều dài Map 1 (3600px)

  private input = {
    left: false,
    right: false,
    jump: false,
    hoe: false,
    fish: false
  };

  // Environment Images (Ghibli / Ninja School Style 2D Hand-drawn Assets)
  private imgBgSky = new Image();
  private imgGroundTile = new Image();
  private imgGate = new Image();
  private imgCottage = new Image();
  private imgBamboo = new Image();

  public start(): void {
    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    // Tải trước các asset hình ảnh cảnh nền làng quê
    this.imgBgSky.src = '/assets/environment/map1/bg_sky.jpg';
    this.imgGroundTile.src = '/assets/environment/map1/ground_tile.png';
    this.imgGate.src = '/assets/environment/map1/gate.png';
    this.imgCottage.src = '/assets/environment/map1/cottage_haystack.png';
    this.imgBamboo.src = '/assets/environment/map1/bamboo_trees.png';

    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();

    this.bindEvents();
    this.player.x = 450;
    this.player.y = this.groundY;

    this.showToast('🌾 Chào mừng đến với Map 1: Đường Đất Làng Quê 2D!');

    requestAnimationFrame((t) => this.loop(t));
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
        const res = this.player.useTool(this.sound);
        this.showToast(res.msg);
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
    });

    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') this.input.left = false;
      if (k === 'd' || k === 'arrowright') this.input.right = false;
      if (k === 'w' || k === 'arrowup' || k === ' ') this.input.jump = false;
    });

    // Mobile / Screen Touch Buttons
    document.getElementById('btn-left')?.addEventListener('touchstart', (e) => { e.preventDefault(); this.input.left = true; });
    document.getElementById('btn-left')?.addEventListener('touchend', (e) => { e.preventDefault(); this.input.left = false; });
    document.getElementById('btn-right')?.addEventListener('touchstart', (e) => { e.preventDefault(); this.input.right = true; });
    document.getElementById('btn-right')?.addEventListener('touchend', (e) => { e.preventDefault(); this.input.right = false; });
    document.getElementById('btn-jump')?.addEventListener('touchstart', (e) => { e.preventDefault(); this.input.jump = true; });
    document.getElementById('btn-jump')?.addEventListener('touchend', (e) => { e.preventDefault(); this.input.jump = false; });

    // Nút Q: Rút / Đổi / Cất dụng cụ
    document.getElementById('btn-cycle-tool')?.addEventListener('click', () => {
      const res = this.player.cycleTool();
      this.showToast(res.label);
      this.updateActionButtonsUI();
    });

    // Nút E: Tiến hành dùng dụng cụ
    document.getElementById('btn-use-tool')?.addEventListener('click', () => {
      const res = this.player.useTool(this.sound);
      this.showToast(res.msg);
    });

    this.updateActionButtonsUI();
  }

  private updateActionButtonsUI(): void {
    const btnCycle = document.getElementById('btn-cycle-tool');
    const btnUse = document.getElementById('btn-use-tool');
    if (!btnCycle || !btnUse) return;

    const tool = this.player.activeTool;
    if (tool === 'hoe') {
      btnCycle.innerHTML = '⛏️ Cuốc Đất [Q]';
      btnUse.innerHTML = '⚡ Cuốc Đất [E]';
      btnUse.style.background = 'rgba(217, 119, 6, 0.85)';
      btnUse.style.borderColor = '#fbbf24';
    } else if (tool === 'water') {
      btnCycle.innerHTML = '💧 Thùng Nước [Q]';
      btnUse.innerHTML = '⚡ Tưới Nước [E]';
      btnUse.style.background = 'rgba(37, 99, 235, 0.85)';
      btnUse.style.borderColor = '#60a5fa';
    } else if (tool === 'sickle') {
      btnCycle.innerHTML = '🌾 Cầm Liềm [Q]';
      btnUse.innerHTML = '⚡ Cắt Lúa [E]';
      btnUse.style.background = 'rgba(22, 163, 74, 0.85)';
      btnUse.style.borderColor = '#4ade80';
    } else {
      btnCycle.innerHTML = '🌿 Rút Dụng Cụ [Q]';
      btnUse.innerHTML = '⚡ Dùng Dụng Cụ [E]';
      btnUse.style.background = 'rgba(225, 29, 72, 0.85)';
      btnUse.style.borderColor = '#fda4af';
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
      // Cập nhật Player di chuyển trong 1 khung hình màn hình
      this.player.update(dt, this.input, this.groundY, this.sound);
      this.player.x = Math.max(40, Math.min(this.width - 40, this.player.x));
      this.cameraX = 0;
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
  // MAP 1: ĐƯỜNG ĐẤT LÀNG QUÊ 2D TRỌN VẸN TRONG 1 KHUNG ẢNH
  // ============================================================
  private renderMap1(ctx: CanvasRenderingContext2D): void {
    const groundY = this.groundY;

    // ------------------------------------------------------------
    // 1. TRỌN VẸN 1 BỨC TRANH PHONG CẢNH LÀNG QUÊ (Full Single Frame)
    // ------------------------------------------------------------
    if (this.imgBgSky.complete && this.imgBgSky.naturalWidth > 0) {
      // Vẽ trọn vẹn 1 khung ảnh vừa khít toàn màn hình
      ctx.drawImage(this.imgBgSky, 0, 0, this.width, this.height);
    } else {
      const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.65, '#bae6fd');
      skyGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    // ------------------------------------------------------------
    // 2. LỚP MẶT ĐẤT TIẾP ĐẤT GỌN GÀNG (1 Khung hình)
    // ------------------------------------------------------------
    // Nền Đất Thịt Loam dưới đáy màn hình
    const dirtGrad = ctx.createLinearGradient(0, groundY, 0, this.height);
    dirtGrad.addColorStop(0, '#78350f');
    dirtGrad.addColorStop(0.3, '#5c2d10');
    dirtGrad.addColorStop(1, '#3b1904');
    ctx.fillStyle = dirtGrad;
    ctx.fillRect(0, groundY + 12, this.width, this.height - groundY);

    // Tile Mặt Cỏ & Sỏi Đất Tách Nền Vẽ Tay
    if (this.imgGroundTile.complete && this.imgGroundTile.naturalWidth > 0) {
      const tileH = 95;
      const tileW = (this.imgGroundTile.naturalWidth / this.imgGroundTile.naturalHeight) * tileH;

      for (let tx = 0; tx < this.width + tileW; tx += tileW - 6) {
        ctx.drawImage(this.imgGroundTile, tx, groundY - 20, tileW, tileH);
      }
    }

    // ------------------------------------------------------------
    // 3. CÁC THỬA RUỘNG TƯƠNG TÁC TRONG 1 KHUNG MÀN HÌNH
    // ------------------------------------------------------------
    const p1X = this.width * 0.25;
    const p2X = this.width * 0.50;
    const p3X = this.width * 0.75;

    // Thửa 1: Đất cày xới màu nâu
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.roundRect(p1X - 60, groundY - 6, 120, 14, 6);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⛏️ Luống Cày', p1X, groundY + 26);

    // Thửa 2: Mầm lúa non đã tưới nước
    ctx.fillStyle = '#1e3a8a';
    ctx.beginPath();
    ctx.roundRect(p2X - 60, groundY - 6, 120, 14, 6);
    ctx.fill();
    ctx.fillStyle = '#86efac';
    for (let px = p2X - 50; px < p2X + 50; px += 14) {
      ctx.fillRect(px, groundY - 16, 3, 12);
    }
    ctx.fillStyle = '#fef08a';
    ctx.fillText('💧 Luống Tưới', p2X, groundY + 26);

    // Thửa 3: Ruộng lúa chín vàng trĩu hạt
    ctx.fillStyle = '#854d0e';
    ctx.beginPath();
    ctx.roundRect(p3X - 60, groundY - 6, 120, 14, 6);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    for (let px = p3X - 50; px < p3X + 50; px += 12) {
      ctx.beginPath();
      ctx.arc(px, groundY - 18, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(px - 1.5, groundY - 15, 3, 11);
    }
    ctx.fillStyle = '#fef08a';
    ctx.fillText('🌾 Ruộng Lúa Chín', p3X, groundY + 26);

    // ------------------------------------------------------------
    // 4. VẼ NHÂN VẬT DUY NHẤT (PLAYER 110px)
    // ------------------------------------------------------------
    this.player.render(ctx);

    // NameTag trên đầu nhân vật Player
    ctx.save();
    const tagX = this.player.x;
    const tagY = this.player.y - 105;
    
    // Khung NameTag
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(tagX - 50, tagY - 10, 100, 18, 9);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Chữ tên
    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 9.5px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌱 Bé Nông Dân [Lv.1]', tagX, tagY + 2.5);
    ctx.restore();

    // ------------------------------------------------------------
    // 5. HIỆU ỨNG LÁ TRE RƠI (Ambient Particles FX)
    // ------------------------------------------------------------
    ctx.save();
    const leafCount = 8;
    for (let i = 0; i < leafCount; i++) {
      const t = this.animTimer * 0.8 + i * 1.5;
      const lx = ((i * 180 + t * 45) % (this.width + 100)) - 50;
      const ly = (Math.sin(t + i) * 30 + (t * 25) % (groundY - 60)) + 60;
      const rot = Math.sin(t * 1.5) * 0.6;

      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(rot);
      ctx.fillStyle = i % 2 === 0 ? '#4ade80' : '#facc15';
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();

    // ------------------------------------------------------------
    // 6. HUD THÔNG TIN MAP 1
    // ------------------------------------------------------------
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.beginPath();
    ctx.roundRect(20, 70, 220, 40, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('📍 Map 1: Đồng Quê Làng Đông', 32, 86);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 9.5px Outfit, sans-serif';
    ctx.fillText(`Tọa độ: X=${Math.round(this.player.x)}m`, 32, 100);
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
