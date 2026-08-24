/**
 * StudioRenderer.ts
 * Quản lý chế độ Studio đo đạc hoạt ảnh và xuất file ảnh PNG 2x HD:
 * - Tab 1: Bé Kiên Thìn (8 Khung hình Chu kỳ Chạy Điền Kinh Run Cycle)
 * - Tab 2: Hoa Dại Đồng Quê (8 Loại hoa dại đồng cỏ nông thôn Việt Nam)
 * - Tab 3: Nhân Vật Chính (8 Trạng thái hoạt ảnh)
 * - Tab 4: Chú Trâu Làng Quê (5 Trạng thái hoạt ảnh)
 * - Tab 5: Bộ Dụng Cụ Nông Thôn & Giá Treo Tre (8 Món & 2 Mẫu Giá Treo)
 * - Tương tác click chụp ảnh Snapshot xuất file PNG nền trong suốt sắc nét
 */

import { Engine } from '../core/Engine';
import { AssetLoader } from '../core/AssetLoader';

export interface FrameAdjustment {
  scale: number;    // 1.0 = 100%
  offsetX: number;  // px offset X
  offsetY: number;  // px offset Y
}

export interface GuideLine {
  id: string;
  type: 'h' | 'v';
  pos: number;
  color: string;
  label: string;
}

export interface StudioClickTarget {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'tab' | 'buffalo' | 'player' | 'kien_thin' | 'tool' | 'download' | 'frame_select' | 'guide_handle' | 'adjust_btn';
  data: any;
}

export type StudioTab = 'flowers' | 'be_sinh' | 'kien_thin' | 'player' | 'buffalo' | 'tools';

export class StudioRenderer {
  public showStudioGuides: boolean = true; // Mặc định BẬT cho Studio đầy đủ thông số
  public currentTab: StudioTab = 'be_sinh'; // Mặc định mở tab Bé Sinh để người dùng tinh chỉnh ngay
  public studioClickTargets: StudioClickTarget[] = [];
  public kienThinFps: number = 11;
  public kienThinFacing: number = 1;
  public beSinhFacing: number = 1;

  // Thước gióng kéo thả (Draggable Rulers)
  public guideLines: GuideLine[] = [
    { id: 'h_head', type: 'h', pos: 220, color: '#38bdf8', label: 'Đỉnh Đầu' },
    { id: 'h_waist', type: 'h', pos: 285, color: '#f59e0b', label: 'Thắt Lưng' },
    { id: 'h_ground', type: 'h', pos: 336, color: '#ef4444', label: 'Gốc Tiếp Đất' },
    { id: 'v_left', type: 'v', pos: 320, color: '#a855f7', label: 'Biên Trái' },
    { id: 'v_right', type: 'v', pos: 440, color: '#a855f7', label: 'Biên Phải' }
  ];

  // Drag state
  public draggingGuideId: string | null = null;
  public isDraggingFrame: boolean = false;
  public isResizingFrame: boolean = false;
  public dragStartX: number = 0;
  public dragStartY: number = 0;
  public initialOffsetX: number = 0;
  public initialOffsetY: number = 0;
  public initialScale: number = 1.0;

  // Calibration per-frame: key format "be_sinh_{state}_{frameIndex}"
  public selectedState: 'idle' | 'walk' | 'run' = 'walk';
  public selectedFrameIdx: number = 0;
  public frameAdjustments: Record<string, FrameAdjustment> = {};

  constructor(private engine: Engine) {
    this.loadAdjustments();
  }

  private getAdjKey(state: string, frameIdx: number): string {
    return `be_sinh_${state}_${frameIdx}`;
  }

  public getFrameAdj(state: string, frameIdx: number): FrameAdjustment {
    const key = this.getAdjKey(state, frameIdx);
    if (!this.frameAdjustments[key]) {
      this.frameAdjustments[key] = { scale: 1.0, offsetX: 0, offsetY: 0 };
    }
    return this.frameAdjustments[key];
  }

  public setFrameAdj(state: string, frameIdx: number, patch: Partial<FrameAdjustment>): void {
    const adj = this.getFrameAdj(state, frameIdx);
    Object.assign(adj, patch);
    this.saveAdjustments();
  }

  private saveAdjustments(): void {
    try {
      localStorage.setItem('studio_be_sinh_adjustments', JSON.stringify(this.frameAdjustments));
    } catch {}
  }

  private loadAdjustments(): void {
    try {
      const saved = localStorage.getItem('studio_be_sinh_adjustments');
      if (saved) {
        this.frameAdjustments = JSON.parse(saved);
      }
    } catch {}
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number, animTimer: number): void {
    // 1. Nền Studio màu xám nhẹ chống chói chuẩn Studio Đồ Họa
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    this.studioClickTargets = [];

    // 2. HEADER STUDIO & THANH CHUYỂN TAB
    this.renderHeaderAndTabs(ctx, width);

    // 3. NỘI DUNG TỪNG TAB
    if (this.currentTab === 'flowers') {
      this.renderFlowersTab(ctx, width, height, animTimer);
    } else if (this.currentTab === 'be_sinh') {
      this.renderBeSinhTab(ctx, width, height, animTimer);
    } else if (this.currentTab === 'kien_thin') {
      this.renderKienThinTab(ctx, width, height, animTimer);
    } else if (this.currentTab === 'player') {
      this.renderPlayerTab(ctx, width, height, animTimer);
    } else if (this.currentTab === 'buffalo') {
      this.renderBuffaloTab(ctx, width, height, animTimer);
    } else if (this.currentTab === 'tools') {
      this.renderToolsTab(ctx, width, height);
    }

    // 4. VẼ THƯỚC GIÓNG KÉO THẢ TOÀN MÀN HÌNH (RULER GUIDES)
    if (this.showStudioGuides && (this.currentTab === 'be_sinh' || this.currentTab === 'kien_thin' || this.currentTab === 'player')) {
      this.renderDraggableGuides(ctx, width, height);
    }
  }

  /**
   * HEADER VÀ THANH ĐIỀU HƯỚNG TAB TRONG STUDIO
   */
  private renderHeaderAndTabs(ctx: CanvasRenderingContext2D, width: number): void {
    const tabs: Array<{ id: StudioTab; label: string; icon: string }> = [
      { id: 'be_sinh', label: 'Bé Sinh (3 Dáng 6 Frame)', icon: '👧' },
      { id: 'flowers', label: 'Hoa Dại Đồng Quê (8 Loại)', icon: '🌸' },
      { id: 'kien_thin', label: 'Bé Kiên Thìn (Chạy 8 Frame)', icon: '🏃' },
      { id: 'player', label: 'Nhân Vật Chính (8 Trạng Thái)', icon: '🧑' },
      { id: 'buffalo', label: 'Trâu Làng Quê (5 Dáng)', icon: '🐃' },
      { id: 'tools', label: 'Dụng Cụ & Giá Treo Tre', icon: '🎋' }
    ];

    const tabW = Math.min(185, (width - 40) / tabs.length - 8);
    const tabH = 34;
    const totalW = tabs.length * (tabW + 8) - 8;
    const startX = (width - totalW) / 2;
    const tabY = 60; // Nằm an toàn bên dưới top-bar của game

    tabs.forEach((t, i) => {
      const tx = startX + i * (tabW + 8);
      const isActive = this.currentTab === t.id;

      ctx.save();
      ctx.fillStyle = isActive ? '#0f172a' : '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(tx, tabY, tabW, tabH, 10);
      ctx.fill();

      if (isActive) {
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.fillStyle = isActive ? '#fef08a' : '#475569';
      ctx.font = 'bold 11.5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${t.icon} ${t.label}`, tx + tabW / 2, tabY + 21);
      ctx.restore();

      this.studioClickTargets.push({
        x: tx,
        y: tabY,
        w: tabW,
        h: tabH,
        type: 'tab',
        data: { tab: t.id }
      });
    });
  }

  public flowerDisplayMode: 'single' | 'full' = 'single';

  /**
   * TAB: HOA DẠI ĐỒNG QUÊ (8 LOẠI HOA NÔNG THÔN VIỆT NAM)
   */
  private renderFlowersTab(ctx: CanvasRenderingContext2D, width: number, height: number, animTimer: number): void {
    const isSingle = this.flowerDisplayMode === 'single';

    const flowerList: Array<{
      key: string;
      name: string;
      vietName: string;
      desc: string;
      src: string;
      fullSrc: string;
      tagColor: string;
    }> = [
      {
        key: 'hoa_xuyen_chi',
        name: 'Hoa Xuyến Chi (Cúc Áo)',
        vietName: 'Bidens pilosa',
        desc: 'Cánh trắng nhụy vàng mọc ven đê, bờ ruộng mát lành',
        src: isSingle ? '/assets/props/flowers/single_xuyen_chi.png' : '/assets/props/flowers/hoa_xuyen_chi.png',
        fullSrc: '/assets/props/flowers/hoa_xuyen_chi.png',
        tagColor: '#f59e0b'
      },
      {
        key: 'hoa_co_may',
        name: 'Hoa Cỏ May / Cỏ Mần Trầu',
        vietName: 'Chrysopogon aciculatus',
        desc: 'Bông cỏ tím phớt bám gấu quần tuổi thơ chăn trâu',
        src: isSingle ? '/assets/props/flowers/single_co_may.png' : '/assets/props/flowers/hoa_co_may.png',
        fullSrc: '/assets/props/flowers/hoa_co_may.png',
        tagColor: '#a855f7'
      },
      {
        key: 'hoa_muoi_gio',
        name: 'Hoa Mười Giờ Đồng Quê',
        vietName: 'Portulaca grandiflora',
        desc: 'Mọc sát đất nở rộ sắc hồng phấn & cam tươi thắm',
        src: isSingle ? '/assets/props/flowers/single_muoi_gio.png' : '/assets/props/flowers/hoa_muoi_gio.png',
        fullSrc: '/assets/props/flowers/hoa_muoi_gio.png',
        tagColor: '#ec4899'
      },
      {
        key: 'hoa_chua_me_dat',
        name: 'Hoa Chua Me Đất Vàng',
        vietName: 'Oxalis corniculata',
        desc: 'Hoa vàng tươi nhí nhánh, lá hình tim 3 cánh chua ngọt',
        src: isSingle ? '/assets/props/flowers/single_chua_me_dat.png' : '/assets/props/flowers/hoa_chua_me_dat.png',
        fullSrc: '/assets/props/flowers/hoa_chua_me_dat.png',
        tagColor: '#eab308'
      },
      {
        key: 'hoa_bim_bim',
        name: 'Hoa Bìm Bìm Tím Leo Rào',
        vietName: 'Ipomoea cairica',
        desc: 'Dây leo cọc tre nở hoa hình chuông tím dịu dàng',
        src: isSingle ? '/assets/props/flowers/single_bim_bim.png' : '/assets/props/flowers/hoa_bim_bim.png',
        fullSrc: '/assets/props/flowers/hoa_bim_bim.png',
        tagColor: '#8b5cf6'
      },
      {
        key: 'hoa_dam_but',
        name: 'Hoa Dâm Bụt Đỏ Thôn Quê',
        vietName: 'Hibiscus rosa-sinensis',
        desc: 'Sắc đỏ tươi nhụy dài thướt tha bên bờ rào ngõ xóm',
        src: isSingle ? '/assets/props/flowers/single_dam_but.png' : '/assets/props/flowers/hoa_dam_but.png',
        fullSrc: '/assets/props/flowers/hoa_dam_but.png',
        tagColor: '#ef4444'
      },
      {
        key: 'bui_cuc_dai',
        name: 'Bụi Cúc Dại Vàng Cam',
        vietName: 'Wild Daisy Shrub',
        desc: 'Bụi cúc vàng cam sum suê rực rỡ đón nắng sớm',
        src: isSingle ? '/assets/props/flowers/single_cuc_dai.png' : '/assets/props/flowers/bui_cuc_dai.png',
        fullSrc: '/assets/props/flowers/bui_cuc_dai.png',
        tagColor: '#f97316'
      },
      {
        key: 'tham_co_hoa_dai',
        name: 'Thảm Cỏ Hoa Dại Đa Sắc',
        vietName: 'Meadow Flora Patch',
        desc: 'Thảm cỏ tự nhiên điểm xuyết ngàn hoa li ti bờ mương',
        src: isSingle ? '/assets/props/flowers/single_tham_co.png' : '/assets/props/flowers/tham_co_hoa_dai.png',
        fullSrc: '/assets/props/flowers/tham_co_hoa_dai.png',
        tagColor: '#10b981'
      }
    ];

    // Header phân mục
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🌸 BỘ SƯU TẬP 8 LOẠI HOA DẠI ĐỒNG QUÊ VIỆT NAM (2D GAME ASSETS):', 40, 120);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 11.5px Outfit, sans-serif';
    ctx.fillText('Tất cả ảnh đã khử nền trong suốt 100%, giữ nguyên vẹn 100% cuống hoa & cánh hoa.', 40, 138);

    // Nút chuyển chế độ xem: Từng bụi / Cả dải
    const modeBtnW = 155;
    const modeBtnH = 28;
    const modeBtnX = width - 390;
    const modeBtnY = 114;

    ctx.save();
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.roundRect(modeBtnX, modeBtnY, modeBtnW, modeBtnH, 8);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isSingle ? '🌿 Chế Độ: Từng Bụi Lẻ' : '💐 Chế Độ: Cả Dải 5 Hoa', modeBtnX + modeBtnW / 2, modeBtnY + 18);
    ctx.restore();

    this.studioClickTargets.push({
      x: modeBtnX,
      y: modeBtnY,
      w: modeBtnW,
      h: modeBtnH,
      type: 'tool',
      data: { action: 'toggle_flower_mode' }
    });

    // Nút tải toàn bộ spritesheet
    const dlAllW = 180;
    const dlAllH = 28;
    const dlAllX = width - dlAllW - 40;
    const dlAllY = 114;

    ctx.save();
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(dlAllX, dlAllY, dlAllW, dlAllH, 8);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('⬇ Tải Toàn Bộ Master Sheet', dlAllX + dlAllW / 2, dlAllY + 18);
    ctx.restore();

    this.studioClickTargets.push({
      x: dlAllX,
      y: dlAllY,
      w: dlAllW,
      h: dlAllH,
      type: 'download',
      data: { url: '/assets/props/flowers/flowers_master_sheet.png', filename: 'flowers_master_sheet.png' }
    });

    // Lưới 8 Card (2 hàng x 4 cột)
    const cols = 4;
    const rows = 2;
    const gridStartX = 40;
    const gridStartY = 158;
    const availableW = width - 80;
    const cardGap = 16;
    const cardW = (availableW - (cols - 1) * cardGap) / cols;
    const cardH = (height - gridStartY - 24) / rows;

    flowerList.forEach((item, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = gridStartX + col * (cardW + cardGap);
      const cy = gridStartY + row * (cardH + cardGap);

      // 1. Card Outer Box
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(cx, cy, cardW, cardH, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // 2. Inner Preview Container
      const previewPad = 8;
      const previewX = cx + previewPad;
      const previewY = cy + previewPad;
      const previewW = cardW - previewPad * 2;
      const previewH = cardH - 80;

      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(previewX, previewY, previewW, previewH, 10);
      ctx.fill();

      // 3. Clip vùng preview để triệt tiêu hoàn toàn hiện tượng tràn mép
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(previewX, previewY, previewW, previewH, 10);
      ctx.clip();

      // Đường kẻ đất nhẹ tiếp xúc chân cành hoa
      const groundLineY = previewY + previewH - 10;
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(previewX + 8, groundLineY);
      ctx.lineTo(previewX + previewW - 8, groundLineY);
      ctx.stroke();

      // 4. Vẽ hình ảnh hoa dại chuẩn tỷ lệ (Fit 100% trong khung preview)
      const img = AssetLoader.getImage(item.src);
      if (img.complete && img.naturalWidth > 0) {
        const sway = Math.sin(animTimer * 2.5 + idx * 0.8) * 0.025; // Gió thổi nhẹ tự nhiên
        const maxDrawW = previewW - 20;
        const maxDrawH = previewH - 22;
        const scale = Math.min(maxDrawW / img.naturalWidth, maxDrawH / img.naturalHeight);
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;

        ctx.save();
        ctx.translate(previewX + previewW / 2, groundLineY);
        ctx.rotate(sway);

        // Bóng đổ nhẹ dưới gốc
        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.beginPath();
        ctx.ellipse(0, 0, drawW * 0.35, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(img, -drawW / 2, -drawH + 4, drawW, drawH);
        ctx.restore();
      }

      ctx.restore(); // Kết thúc clip preview box

      // 5. Tên & Mô Tả Hoa bên dưới
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11.5px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.name, cx + 12, cy + previewH + 24);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 9.5px Outfit, sans-serif';
      ctx.fillText(item.desc, cx + 12, cy + previewH + 39);

      // Nút Tải PNG
      const btnW = 84;
      const btnH = 22;
      const btnX = cx + cardW - btnW - 10;
      const btnY = cy + previewH + 46;

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9.5px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⬇ Tải PNG', btnX + btnW / 2, btnY + 15);
      ctx.restore();

      this.studioClickTargets.push({
        x: btnX,
        y: btnY,
        w: btnW,
        h: btnH,
        type: 'download',
        data: { url: item.fullSrc, filename: `${item.key}.png` }
      });
    });
  }

  /**
   * TAB: BÉ SINH (3 TRẠNG THÁI HOẠT ẢNH: IDLE, WALK, RUN - MỖI DÁNG 6 FRAME & CÔNG CỤ CÂN CHỈNH CO KÉO)
   */
  private renderBeSinhTab(ctx: CanvasRenderingContext2D, width: number, height: number, animTimer: number): void {
    const states: Array<{
      id: 'idle' | 'walk' | 'run';
      title: string;
      icon: string;
      sheetUrl: string;
      totalFrames: number;
      frameW: number;
      frameH: number;
      fps: number;
      cardColor: string;
    }> = [
      {
        id: 'idle',
        title: 'Đứng Yên (Idle 6 Frames)',
        icon: '👧',
        sheetUrl: '/assets/characters/be_sinh/be_sinh_idle_sheet.png',
        totalFrames: 6,
        frameW: 301,
        frameH: 713,
        fps: 6,
        cardColor: '#3b82f6'
      },
      {
        id: 'walk',
        title: 'Đi Bộ Lon Ton (Walk 6 Frames)',
        icon: '🚶‍♀️',
        sheetUrl: '/assets/characters/be_sinh/be_sinh_walk_sheet.png',
        totalFrames: 6,
        frameW: 298,
        frameH: 613,
        fps: 8,
        cardColor: '#10b981'
      },
      {
        id: 'run',
        title: 'Chạy Nhanh Tung Tăng (Run 6 Frames)',
        icon: '🏃‍♀️',
        sheetUrl: '/assets/characters/be_sinh/be_sinh_run_sheet.png',
        totalFrames: 6,
        frameW: 343,
        frameH: 475,
        fps: 10,
        cardColor: '#f59e0b'
      }
    ];

    // 1. THANH ĐIỀU KHIỂN CÂN CHỈNH TỪNG KHUNG HÌNH (CALIBRATION TOOLBAR)
    const curAdj = this.getFrameAdj(this.selectedState, this.selectedFrameIdx);
    const selectedStateObj = states.find(s => s.id === this.selectedState) || states[1];

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('👧 CÂN CHỈNH HOẠT ẢNH BÉ SINH (Bấm chọn frame để co kéo kích thước & dịch chuyển):', 40, 114);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px Outfit, sans-serif';
    ctx.fillText('Kéo thả các đường thước kẻ Xanh/Vàng/Đỏ/Tím để so tỷ lệ. Bấm giữ chuột vào ảnh để dịch chuyển hoặc kéo 4 góc để phóng to/thu nhỏ.', 40, 132);

    // Bảng công cụ điều khiển Frame đang chọn
    const toolBarX = width - 680;
    const toolBarY = 100;
    const toolBarW = 640;
    const toolBarH = 44;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(toolBarX, toolBarY, toolBarW, toolBarH, 10);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nhãn Frame đang chọn
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11.5px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🎯 ${selectedStateObj.title.split(' ')[0]} F${this.selectedFrameIdx + 1}:`, toolBarX + 12, toolBarY + 26);

    // Nút Co kéo Kích Thước: [-] 5% [+]
    const scaleLabel = `${Math.round(curAdj.scale * 100)}%`;
    const btnMinusX = toolBarX + 130;
    const btnPlusX = toolBarX + 200;
    const btnH = 26;

    // Nút Scale [-]
    this.drawSmallBtn(ctx, btnMinusX, toolBarY + 9, 28, btnH, '➖', '#0284c7');
    this.studioClickTargets.push({
      x: btnMinusX, y: toolBarY + 9, w: 28, h: btnH,
      type: 'adjust_btn',
      data: { action: 'scale', delta: -0.05 }
    });

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(scaleLabel, btnMinusX + 46, toolBarY + 26);

    // Nút Scale [+]
    this.drawSmallBtn(ctx, btnPlusX + 18, toolBarY + 9, 28, btnH, '➕', '#0284c7');
    this.studioClickTargets.push({
      x: btnPlusX + 18, y: toolBarY + 9, w: 28, h: btnH,
      type: 'adjust_btn',
      data: { action: 'scale', delta: 0.05 }
    });

    // Nút Dịch chuyển: [◀] [▲] [▼] [▶]
    const dPadX = toolBarX + 290;
    const dBtns = [
      { label: '◀', dx: -2, dy: 0, x: dPadX },
      { label: '▲', dx: 0, dy: -2, x: dPadX + 30 },
      { label: '▼', dx: 0, dy: 2, x: dPadX + 60 },
      { label: '▶', dx: 2, dy: 0, x: dPadX + 90 }
    ];

    dBtns.forEach(b => {
      this.drawSmallBtn(ctx, b.x, toolBarY + 9, 26, btnH, b.label, '#475569');
      this.studioClickTargets.push({
        x: b.x, y: toolBarY + 9, w: 26, h: btnH,
        type: 'adjust_btn',
        data: { action: 'move', dx: b.dx, dy: b.dy }
      });
    });

    // Nút Reset Frame
    const btnResetX = dPadX + 130;
    this.drawSmallBtn(ctx, btnResetX, toolBarY + 9, 82, btnH, '🔄 Đặt Lại', '#64748b');
    this.studioClickTargets.push({
      x: btnResetX, y: toolBarY + 9, w: 82, h: btnH,
      type: 'adjust_btn',
      data: { action: 'reset_frame' }
    });

    // Nút Lật Hướng
    const btnFlipX = btnResetX + 90;
    this.drawSmallBtn(ctx, btnFlipX, toolBarY + 9, 90, btnH, this.beSinhFacing > 0 ? '🔄 Quay: PHẢI' : '🔄 Quay: TRÁI', '#0f172a', '#fef08a');
    this.studioClickTargets.push({
      x: btnFlipX, y: toolBarY + 9, w: 90, h: btnH,
      type: 'tool',
      data: { action: 'flip_be_sinh' }
    });

    ctx.restore();

    // 2. 3 DẢI HÀNG NGANG (IDLE, WALK, RUN)
    const rowStartY = 154;
    const availableH = height - rowStartY - 18;
    const rowH = (availableH - 20) / 3;

    states.forEach((st, sIdx) => {
      const ry = rowStartY + sIdx * (rowH + 10);
      const sheet = AssetLoader.getImage(st.sheetUrl);

      // Khung Hàng
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(40, ry, width - 80, rowH, 12);
      ctx.fill();
      ctx.strokeStyle = (this.selectedState === st.id) ? 'rgba(245, 158, 11, 0.45)' : 'rgba(203, 213, 225, 0.8)';
      ctx.lineWidth = (this.selectedState === st.id) ? 2 : 1.2;
      ctx.stroke();

      // Cột Tiêu Đề bên trái
      const labelW = 175;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(48, ry + 6, labelW, rowH - 12, 8);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11.5px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${st.icon} ${st.title}`, 58, ry + 24);

      // Live Animation Preview
      const liveBoxX = 58;
      const liveBoxY = ry + 32;
      const liveBoxW = 155;
      const liveBoxH = rowH - 42;

      if (sheet.complete && sheet.naturalWidth > 0) {
        const curFrame = Math.floor(animTimer * st.fps) % st.totalFrames;
        const liveAdj = this.getFrameAdj(st.id, curFrame);
        const liveScale = Math.min((liveBoxH - 12) / st.frameH, (liveBoxW - 12) / st.frameW) * liveAdj.scale;
        const liveW = st.frameW * liveScale;
        const liveH = st.frameH * liveScale;

        ctx.save();
        ctx.translate(liveBoxX + liveBoxW / 2 + liveAdj.offsetX * 0.3, liveBoxY + liveBoxH - 6 + liveAdj.offsetY * 0.3);

        // Bóng đổ
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, 0, liveW * 0.35, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.beSinhFacing < 0) {
          ctx.scale(-1, 1);
        }

        ctx.drawImage(
          sheet,
          curFrame * st.frameW, 0, st.frameW, st.frameH,
          -liveW / 2, -liveH, liveW, liveH
        );
        ctx.restore();
      }

      // Nút Tải Spritesheet / Xuất Spritesheet Đã Cân Chỉnh
      const dlBtnW = 135;
      const dlBtnH = 26;
      const dlBtnX = width - 40 - dlBtnW - 14;
      const dlBtnY = ry + (rowH - dlBtnH) / 2;

      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(dlBtnX, dlBtnY, dlBtnW, dlBtnH, 6);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`💾 Xuất Sheet Đã Chỉnh`, dlBtnX + dlBtnW / 2, dlBtnY + 17);
      ctx.restore();

      this.studioClickTargets.push({
        x: dlBtnX,
        y: dlBtnY,
        w: dlBtnW,
        h: dlBtnH,
        type: 'tool',
        data: { action: 'export_calibrated_sheet', state: st.id, sheetUrl: st.sheetUrl, totalFrames: st.totalFrames, frameW: st.frameW, frameH: st.frameH }
      });

      // 3. HIỂN THỊ 6 KHUNG HÌNH BÓC TÁCH KÈM BỘ CO KÉO TRỰC QUAN
      const framesStartX = 48 + labelW + 14;
      const framesAreaW = dlBtnX - framesStartX - 14;
      const frameSlotW = framesAreaW / st.totalFrames;

      for (let f = 0; f < st.totalFrames; f++) {
        const fx = framesStartX + f * frameSlotW;
        const fy = ry + 6;
        const fw = frameSlotW - 8;
        const fh = rowH - 12;

        const isSelected = (this.selectedState === st.id && this.selectedFrameIdx === f);
        const fAdj = this.getFrameAdj(st.id, f);

        ctx.save();
        ctx.fillStyle = isSelected ? '#fffbeb' : '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(fx, fy, fw, fh, 8);
        ctx.fill();

        // Viền khi chọn
        if (isSelected) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.2;
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // Đường mốc đất chuẩn
        const groundY = fy + fh - 16;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(fx + 6, groundY);
        ctx.lineTo(fx + fw - 6, groundY);
        ctx.stroke();
        ctx.setLineDash([]);

        if (sheet.complete && sheet.naturalWidth > 0) {
          const baseScale = Math.min((fh - 32) / st.frameH, (fw - 12) / st.frameW);
          const currentScale = baseScale * fAdj.scale;
          const fDrawW = st.frameW * currentScale;
          const fDrawH = st.frameH * currentScale;

          const centerX = fx + fw / 2 + fAdj.offsetX;
          const bottomY = groundY + fAdj.offsetY;

          ctx.save();
          ctx.translate(centerX, bottomY);

          // Bóng đổ nhỏ
          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.beginPath();
          ctx.ellipse(0, 0, fDrawW * 0.32, 3, 0, 0, Math.PI * 2);
          ctx.fill();

          if (this.beSinhFacing < 0) {
            ctx.scale(-1, 1);
          }

          ctx.drawImage(
            sheet,
            f * st.frameW, 0, st.frameW, st.frameH,
            -fDrawW / 2, -fDrawH, fDrawW, fDrawH
          );

          // Nếu đang chọn: Vẽ 4 góc tay nắm co kéo (Corner Resize Handles)
          if (isSelected) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(-fDrawW / 2, -fDrawH, fDrawW, fDrawH);

            // 4 Corner Handles
            ctx.fillStyle = '#f59e0b';
            const handleSize = 6;
            ctx.fillRect(-fDrawW / 2 - handleSize / 2, -fDrawH - handleSize / 2, handleSize, handleSize);
            ctx.fillRect(fDrawW / 2 - handleSize / 2, -fDrawH - handleSize / 2, handleSize, handleSize);
            ctx.fillRect(-fDrawW / 2 - handleSize / 2, -handleSize / 2, handleSize, handleSize);
            ctx.fillRect(fDrawW / 2 - handleSize / 2, -handleSize / 2, handleSize, handleSize);

            // Tâm điểm dịch chuyển (Center Crosshair)
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, -fDrawH / 2, 3.5, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }

        // Nhãn Frame & Thông số
        ctx.fillStyle = isSelected ? '#b45309' : '#64748b';
        ctx.font = isSelected ? 'bold 10px Outfit, sans-serif' : '500 9.5px Outfit, sans-serif';
        ctx.textAlign = 'center';
        const labelText = isSelected
          ? `F${f + 1} (${Math.round(fAdj.scale * 100)}%)`
          : `Frame ${f + 1}`;
        ctx.fillText(labelText, fx + fw / 2, fy + fh - 3);

        ctx.restore();

        // Click target để chọn frame
        this.studioClickTargets.push({
          x: fx,
          y: fy,
          w: fw,
          h: fh,
          type: 'frame_select',
          data: { state: st.id, frameIdx: f }
        });
      }
    });
  }

  /**
   * VẼ CÁC ĐƯỜNG THƯỚC GIÓNG KÉO THẢ (DRAGGABLE HORIZONTAL & VERTICAL RULERS)
   */
  private renderDraggableGuides(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.guideLines.forEach(g => {
      ctx.save();
      ctx.strokeStyle = g.color;
      ctx.lineWidth = (this.draggingGuideId === g.id) ? 2.5 : 1.5;
      ctx.setLineDash([6, 4]);

      if (g.type === 'h') {
        // Đường gióng ngang
        ctx.beginPath();
        ctx.moveTo(0, g.pos);
        ctx.lineTo(width, g.pos);
        ctx.stroke();

        // Thẻ Handle bên trái & phải
        const handleW = 105;
        const handleH = 20;

        ctx.setLineDash([]);
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.roundRect(8, g.pos - handleH / 2, handleW, handleH, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`↕ ${g.label}: ${Math.round(g.pos)}px`, 8 + handleW / 2, g.pos + 3.5);

        this.studioClickTargets.push({
          x: 0,
          y: g.pos - 8,
          w: width,
          h: 16,
          type: 'guide_handle',
          data: { guideId: g.id, type: 'h' }
        });
      } else {
        // Đường gióng dọc
        ctx.beginPath();
        ctx.moveTo(g.pos, 95);
        ctx.lineTo(g.pos, height);
        ctx.stroke();

        // Thẻ Handle ở đỉnh
        const handleW = 100;
        const handleH = 18;

        ctx.setLineDash([]);
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.roundRect(g.pos - handleW / 2, 95, handleW, handleH, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`↔ ${g.label}: ${Math.round(g.pos)}px`, g.pos, 107.5);

        this.studioClickTargets.push({
          x: g.pos - 8,
          y: 95,
          w: 16,
          h: height - 95,
          type: 'guide_handle',
          data: { guideId: g.id, type: 'v' }
        });
      }

      ctx.restore();
    });
  }

  private drawSmallBtn(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, text: string, bg: string, textCol: string = '#ffffff'): void {
    ctx.save();
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 6);
    ctx.fill();

    ctx.fillStyle = textCol;
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(text, x + w / 2, y + h / 2 + 3.5);
    ctx.restore();
  }

  /**
   * TAB: BÉ CON ÔNG KIÊN THÌN (RUN CYCLE 8 FRAMES & LIVE PREVIEW)
   */
  private renderKienThinTab(ctx: CanvasRenderingContext2D, width: number, height: number, animTimer: number): void {
    const kienThinSheet = AssetLoader.getImage('/assets/characters/kien_thin/kien_thin_run_sheet.png');
    const totalFrames = 8;
    const frameW = 280;
    const frameH = 360;

    const row1Y = 300;
    const pSpacing = Math.min(160, (width - 60) / 8);
    const pStartX = (width - pSpacing * 8) / 2 + pSpacing / 2;

    const poseNames = [
      { name: 'F1: Chạm Đất (Phải)', desc: 'Gót chân phải tiếp đất' },
      { name: 'F2: Nhún Thấp', desc: 'Trọng tâm hạ thấp nhất' },
      { name: 'F3: Đạp Tiến', desc: 'Chân phải duỗi phát lực' },
      { name: 'F4: Bay Cao (Airborne)', desc: 'Hai chân nhấc khỏi mặt đất' },
      { name: 'F5: Đổi Chân (Trái)', desc: 'Gót chân trái tiếp đất' },
      { name: 'F6: Nhún Trái', desc: 'Hấp thụ lực xung kích' },
      { name: 'F7: Đạp Trái', desc: 'Chân trái đạp đẩy người' },
      { name: 'F8: Bay Cao 2', desc: 'Đổi thế khép kín chu kỳ' },
    ];

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🏃 A. BÓC TÁCH 8 KHUNG HÌNH CHẠY ĐIỀN KINH (RUN CYCLE):', pStartX - 50, row1Y - 170);

    ctx.save();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(pStartX - 60, row1Y);
    ctx.lineTo(pStartX + 8 * pSpacing, row1Y);
    ctx.stroke();
    ctx.restore();

    if (kienThinSheet.complete && kienThinSheet.naturalWidth > 0) {
      const targetH = 145;
      const scale = targetH / frameH;
      const renderW = frameW * scale;

      for (let i = 0; i < totalFrames; i++) {
        const px = pStartX + i * pSpacing;
        const py = row1Y;

        ctx.save();
        ctx.translate(px, py);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(
          kienThinSheet,
          i * frameW, 0, frameW, frameH,
          -renderW / 2, -targetH + 10, renderW, targetH
        );
        ctx.restore();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 11px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(poseNames[i].name, px, py + 20);

        ctx.fillStyle = '#64748b';
        ctx.font = '500 9px Outfit, sans-serif';
        ctx.fillText(poseNames[i].desc, px, py + 34);

        const btnW = 86;
        const btnH = 22;
        const btnX = px - btnW / 2;
        const btnY = py + 42;

        ctx.save();
        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 6);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#0284c7';
        ctx.font = 'bold 9.5px Outfit, sans-serif';
        ctx.fillText(`⬇ Tải F${i + 1}`, px, btnY + 14);
        ctx.restore();

        this.studioClickTargets.push({
          x: btnX,
          y: btnY,
          w: btnW,
          h: btnH,
          type: 'download',
          data: { url: `/assets/characters/kien_thin/frame_${i}.png`, filename: `kien_thin_frame_${i}.png` }
        });
      }
    }

    // Live Runner
    const previewY = Math.min(height - 60, 580);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ B. HOẠT ẢNH CHẠY THỜI GIAN THỰC (LIVE MOTION PREVIEW):', pStartX - 50, previewY - 130);

    ctx.save();
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.roundRect(pStartX - 60, previewY - 110, width - (pStartX - 60) * 2, 160, 16);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(pStartX - 40, previewY + 15);
    ctx.lineTo(width - pStartX + 40, previewY + 15);
    ctx.stroke();
    ctx.restore();

    if (kienThinSheet.complete && kienThinSheet.naturalWidth > 0) {
      const curFrame = Math.floor(animTimer * this.kienThinFps) % totalFrames;
      const runnerX = width / 2;
      const runnerY = previewY + 15;
      const runnerH = 130;
      const rScale = runnerH / frameH;
      const runnerW = frameW * rScale;

      ctx.save();
      ctx.translate(runnerX, runnerY);

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 30, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      if (this.kienThinFacing < 0) {
        ctx.scale(-1, 1);
      }

      ctx.drawImage(
        kienThinSheet,
        curFrame * frameW, 0, frameW, frameH,
        -runnerW / 2, -runnerH + 10, runnerW, runnerH
      );
      ctx.restore();

      const flipBtnW = 120;
      const flipBtnH = 30;
      const flipBtnX = width / 2 - flipBtnW - 10;
      const flipBtnY = runnerY + 18;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.beginPath();
      ctx.roundRect(flipBtnX, flipBtnY, flipBtnW, flipBtnH, 8);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🔄 Đổi Hướng', flipBtnX + flipBtnW / 2, flipBtnY + 19);
      ctx.restore();

      this.studioClickTargets.push({
        x: flipBtnX,
        y: flipBtnY,
        w: flipBtnW,
        h: flipBtnH,
        type: 'kien_thin',
        data: { action: 'flip' }
      });

      const dlBtnW = 150;
      const dlBtnH = 30;
      const dlBtnX = width / 2 + 10;
      const dlBtnY = runnerY + 18;

      ctx.save();
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.roundRect(dlBtnX, dlBtnY, dlBtnW, dlBtnH, 8);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⬇ Tải Spritesheet', dlBtnX + dlBtnW / 2, dlBtnY + 19);
      ctx.restore();

      this.studioClickTargets.push({
        x: dlBtnX,
        y: dlBtnY,
        w: dlBtnW,
        h: dlBtnH,
        type: 'download',
        data: { url: '/assets/characters/kien_thin/kien_thin_run_sheet.png', filename: 'kien_thin_run_sheet.png' }
      });
    }
  }

  /**
   * TAB: NHÂN VẬT CHÍNH (PLAYER)
   */
  private renderPlayerTab(ctx: CanvasRenderingContext2D, width: number, height: number, animTimer: number): void {
    const row1Y = 320;
    const playerActions: Array<{ state: string; name: string; desc: string }> = [
      { state: 'idle', name: 'Đứng Yên', desc: 'Thở & chớp mắt nhẹ' },
      { state: 'walk', name: 'Bước Đi', desc: 'Sải chân nhịp nhàng' },
      { state: 'hoe', name: 'Cuốc Đất', desc: 'Vung cuốc xới đất' },
      { state: 'water', name: 'Tưới Nước', desc: 'Nghiêng thùng tưới' },
      { state: 'harvest', name: 'Cắt Lúa', desc: 'Vung liềm gặt' },
      { state: 'cam_cuoc', name: 'Vác Cuốc', desc: 'Cầm cuốc trên vai' },
      { state: 'cam_thung_nuoc', name: 'Xách Nước', desc: 'Xách thùng bên hông' },
      { state: 'cam_liem', name: 'Cầm Liềm', desc: 'Cầm liềm sẵn sàng' },
    ];

    const pSpacing = Math.min(170, (width - 80) / 8);
    const pStartX = (width - pSpacing * 8) / 2 + pSpacing / 2;

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🧑 BỘ HOẠT ẢNH NHÂN VẬT CHÍNH (8 Trạng thái):', pStartX - 60, row1Y - 145);

    playerActions.forEach((act, i) => {
      const px = pStartX + i * pSpacing;
      const py = row1Y;

      this.engine.player.renderAt(ctx, px, py, act.state, animTimer, 1);

      ctx.fillStyle = 'rgba(241, 245, 249, 0.95)';
      ctx.beginPath();
      ctx.roundRect(px - 58, py + 12, 116, 42, 8);
      ctx.fill();
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(act.name, px, py + 28);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 9.5px Outfit, sans-serif';
      ctx.fillText(act.desc, px, py + 44);
    });
  }

  /**
   * TAB: TRÂU ĐỒNG QUÊ (BUFFALO)
   */
  private renderBuffaloTab(ctx: CanvasRenderingContext2D, width: number, height: number, animTimer: number): void {
    const row2Y = 360;
    const buffaloActions = [
      { state: 'idle', name: '1. Đứng Yên (Dung Yen)', desc: 'Chớp mắt & vẩy đuôi', facing: -1 },
      { state: 'idle', name: '2. Đứng Yên Quay Mặt', desc: 'Đứng yên quay phải', facing: 1 },
      { state: 'graze', name: '3. Gặm Cỏ (Nhai Cỏ)', desc: 'Cúi đầu nhai cỏ non', facing: -1 },
      { state: 'walk', name: '4. Đi Dạo (Bước Trái)', desc: 'Bước đi thong dong', facing: -1 },
      { state: 'walk', name: '5. Đi Dạo (Bước Phải)', desc: 'Bước đi quay sang phải', facing: 1 }
    ];

    const bSpacing = Math.min(270, (width - 80) / 5);
    const bStartX = (width - bSpacing * 5) / 2 + bSpacing / 2;

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🐃 BỘ HOẠT ẢNH CHÚ TRÂU ĐỒNG QUÊ (5 Trạng thái):', bStartX - 100, row2Y - 140);

    buffaloActions.forEach((act, i) => {
      const bx = bStartX + i * bSpacing;
      const by = row2Y;

      this.engine.buffalo.renderAt(ctx, bx, by, act.state as any, animTimer, act.facing);

      const btnW = 126;
      const btnH = 28;
      const btnX = bx - btnW / 2;
      const btnY = by + 16;

      ctx.save();
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 14);
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📸 Chụp Ảnh Trâu', bx, btnY + 18);
      ctx.restore();

      this.studioClickTargets.push({
        x: btnX,
        y: btnY,
        w: btnW,
        h: btnH,
        type: 'buffalo',
        data: { state: act.state, facing: act.facing, name: act.name }
      });
    });
  }

  /**
   * TAB: DỤNG CỤ NÔNG THÔN & GIÁ TREO
   */
  private renderToolsTab(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const rackImg = AssetLoader.getImage('/assets/props/dung_cu/gia_treo_day_du_dung_cu.png');
    const wallRackImg = AssetLoader.getImage('/assets/props/dung_cu/sao_tre_treo_tuong_co_dung_cu.png');

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎋 BỘ GIÁ TREO TRE & 8 DỤNG CỤ TRUYỀN THỐNG:', width / 2, 90);

    const midX = width / 2;
    const rackY = 400;

    if (rackImg.complete && rackImg.naturalWidth > 0) {
      const rH = 260;
      const rScale = rH / rackImg.naturalHeight;
      const rW = rackImg.naturalWidth * rScale;

      ctx.drawImage(rackImg, midX - rW - 30, rackY - rH, rW, rH);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Giá Treo Khung Tre Đứng (Đầy Đủ Dụng Cụ)', midX - rW / 2 - 30, rackY + 20);
    }

    if (wallRackImg.complete && wallRackImg.naturalWidth > 0) {
      const wH = 120;
      const wScale = wH / wallRackImg.naturalHeight;
      const wW = wallRackImg.naturalWidth * wScale;

      ctx.drawImage(wallRackImg, midX + 30, rackY - 200, wW, wH);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Sào Tre Treo Tường Gắn Móc', midX + wW / 2 + 30, rackY - 60);
    }
  }

  public handleClick(clickX: number, clickY: number): void {
    for (const target of this.studioClickTargets) {
      if (clickX >= target.x && clickX <= target.x + target.w &&
          clickY >= target.y && clickY <= target.y + target.h) {
        if (target.type === 'tab') {
          this.currentTab = target.data.tab;
        } else if (target.type === 'frame_select') {
          this.selectedState = target.data.state;
          this.selectedFrameIdx = target.data.frameIdx;
          const adj = this.getFrameAdj(this.selectedState, this.selectedFrameIdx);
          this.engine.showToast(`🎯 Đang chọn: ${this.selectedState.toUpperCase()} - Frame ${this.selectedFrameIdx + 1} (Tỷ lệ: ${Math.round(adj.scale * 100)}%)`);
        } else if (target.type === 'adjust_btn') {
          const adj = this.getFrameAdj(this.selectedState, this.selectedFrameIdx);
          if (target.data.action === 'scale') {
            adj.scale = Math.max(0.4, Math.min(2.5, Math.round((adj.scale + target.data.delta) * 100) / 100));
            this.engine.showToast(`🔍 Tỷ lệ F${this.selectedFrameIdx + 1}: ${Math.round(adj.scale * 100)}%`);
          } else if (target.data.action === 'move') {
            adj.offsetX += target.data.dx;
            adj.offsetY += target.data.dy;
          } else if (target.data.action === 'reset_frame') {
            adj.scale = 1.0;
            adj.offsetX = 0;
            adj.offsetY = 0;
            this.engine.showToast(`🔄 Đã đặt lại Frame ${this.selectedFrameIdx + 1}`);
          }
          this.saveAdjustments();
        } else if (target.type === 'tool') {
          if (target.data.action === 'toggle_flower_mode') {
            this.flowerDisplayMode = this.flowerDisplayMode === 'single' ? 'full' : 'single';
            this.engine.showToast(this.flowerDisplayMode === 'single' ? '🌿 Đang xem: Từng Bụi Hoa Lẻ' : '💐 Đang xem: Cả Dải Hoa Đầy Đủ');
          } else if (target.data.action === 'flip_be_sinh') {
            this.beSinhFacing = -this.beSinhFacing;
          } else if (target.data.action === 'export_calibrated_sheet') {
            this.exportCalibratedSheet(target.data.state, target.data.sheetUrl, target.data.totalFrames, target.data.frameW, target.data.frameH);
          }
        } else if (target.type === 'kien_thin') {
          if (target.data.action === 'flip') {
            this.kienThinFacing = -this.kienThinFacing;
          }
        } else if (target.type === 'download') {
          const a = document.createElement('a');
          a.href = target.data.url;
          a.download = target.data.filename;
          a.click();
          this.engine.showToast(`⬇ Đang tải file: ${target.data.filename}`);
        } else if (target.type === 'buffalo') {
          this.captureBuffaloSnapshot(target.data.state, target.data.facing, target.data.name);
        } else if (target.type === 'player') {
          this.capturePlayerSnapshot(target.data.state, target.data.name);
        }
        break;
      }
    }
  }

  public handleMouseDown(mx: number, my: number): void {
    // 1. Kiểm tra bấm vào thước gióng ngang/dọc
    for (const g of this.guideLines) {
      if (g.type === 'h' && Math.abs(my - g.pos) <= 10) {
        this.draggingGuideId = g.id;
        this.dragStartY = my;
        return;
      }
      if (g.type === 'v' && Math.abs(mx - g.pos) <= 10) {
        this.draggingGuideId = g.id;
        this.dragStartX = mx;
        return;
      }
    }

    // 2. Kiểm tra bấm vào Frame đang chọn để kéo dịch chuyển hoặc co kéo kích thước
    for (const target of this.studioClickTargets) {
      if (target.type === 'frame_select' &&
          target.data.state === this.selectedState &&
          target.data.frameIdx === this.selectedFrameIdx &&
          mx >= target.x && mx <= target.x + target.w &&
          my >= target.y && my <= target.y + target.h) {
        
        const adj = this.getFrameAdj(this.selectedState, this.selectedFrameIdx);
        this.dragStartX = mx;
        this.dragStartY = my;
        this.initialOffsetX = adj.offsetX;
        this.initialOffsetY = adj.offsetY;
        this.initialScale = adj.scale;

        // Nếu bấm gần 4 góc (15px) ➔ Co kéo resize
        const isNearCorner = (
          (Math.abs(mx - target.x) < 22 || Math.abs(mx - (target.x + target.w)) < 22) &&
          (Math.abs(my - target.y) < 22 || Math.abs(my - (target.y + target.h)) < 22)
        );

        if (isNearCorner) {
          this.isResizingFrame = true;
        } else {
          this.isDraggingFrame = true;
        }
        return;
      }
    }
  }

  public handleMouseMove(mx: number, my: number, canvas: HTMLCanvasElement): void {
    // 1. Đang kéo thước gióng
    if (this.draggingGuideId) {
      const g = this.guideLines.find(line => line.id === this.draggingGuideId);
      if (g) {
        if (g.type === 'h') {
          g.pos = Math.max(80, Math.min(canvas.height - 20, my));
          canvas.style.cursor = 'ns-resize';
        } else {
          g.pos = Math.max(40, Math.min(canvas.width - 40, mx));
          canvas.style.cursor = 'ew-resize';
        }
      }
      return;
    }

    // 2. Đang kéo dịch chuyển Frame
    if (this.isDraggingFrame) {
      const adj = this.getFrameAdj(this.selectedState, this.selectedFrameIdx);
      adj.offsetX = this.initialOffsetX + Math.round(mx - this.dragStartX);
      adj.offsetY = this.initialOffsetY + Math.round(my - this.dragStartY);
      canvas.style.cursor = 'move';
      return;
    }

    // 3. Đang co kéo Resize Frame
    if (this.isResizingFrame) {
      const adj = this.getFrameAdj(this.selectedState, this.selectedFrameIdx);
      const dy = this.dragStartY - my;
      const dx = mx - this.dragStartX;
      const delta = (Math.abs(dy) > Math.abs(dx) ? dy : dx) * 0.01;
      adj.scale = Math.max(0.4, Math.min(2.5, Math.round((this.initialScale + delta) * 100) / 100));
      canvas.style.cursor = 'nwse-resize';
      return;
    }

    // 4. Hover trạng thái thông thường
    for (const g of this.guideLines) {
      if (g.type === 'h' && Math.abs(my - g.pos) <= 8) {
        canvas.style.cursor = 'ns-resize';
        return;
      }
      if (g.type === 'v' && Math.abs(mx - g.pos) <= 8 && my >= 95) {
        canvas.style.cursor = 'ew-resize';
        return;
      }
    }

    let isHover = false;
    for (const target of this.studioClickTargets) {
      if (mx >= target.x && mx <= target.x + target.w &&
          my >= target.y && my <= target.y + target.h) {
        isHover = true;
        break;
      }
    }
    canvas.style.cursor = isHover ? 'pointer' : 'default';
  }

  public handleMouseUp(): void {
    if (this.isDraggingFrame || this.isResizingFrame || this.draggingGuideId) {
      this.saveAdjustments();
    }
    this.draggingGuideId = null;
    this.isDraggingFrame = false;
    this.isResizingFrame = false;
  }

  public handleWheel(mx: number, my: number, deltaY: number): void {
    for (const target of this.studioClickTargets) {
      if (target.type === 'frame_select' &&
          mx >= target.x && mx <= target.x + target.w &&
          my >= target.y && my <= target.y + target.h) {
        this.selectedState = target.data.state;
        this.selectedFrameIdx = target.data.frameIdx;
        const adj = this.getFrameAdj(this.selectedState, this.selectedFrameIdx);
        const step = deltaY < 0 ? 0.02 : -0.02;
        adj.scale = Math.max(0.4, Math.min(2.5, Math.round((adj.scale + step) * 100) / 100));
        this.saveAdjustments();
        this.engine.showToast(`🔍 Zoom F${this.selectedFrameIdx + 1}: ${Math.round(adj.scale * 100)}%`);
        break;
      }
    }
  }

  public exportCalibratedSheet(
    state: 'idle' | 'walk' | 'run',
    sheetUrl: string,
    totalFrames: number,
    frameW: number,
    frameH: number
  ): void {
    const img = AssetLoader.getImage(sheetUrl);
    if (!img.complete || img.naturalWidth === 0) {
      this.engine.showToast('⚠️ Đang tải ảnh spritesheet, vui lòng thử lại...');
      return;
    }

    const outCanvas = document.createElement('canvas');
    outCanvas.width = frameW * totalFrames;
    outCanvas.height = frameH;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return;

    outCtx.clearRect(0, 0, outCanvas.width, outCanvas.height);

    for (let f = 0; f < totalFrames; f++) {
      const adj = this.getFrameAdj(state, f);
      const slotX = f * frameW;
      const centerX = slotX + frameW / 2 + adj.offsetX;
      const groundY = frameH - 12 + adj.offsetY;

      const drawW = frameW * adj.scale;
      const drawH = frameH * adj.scale;

      outCtx.save();
      outCtx.translate(centerX, groundY);
      outCtx.drawImage(
        img,
        f * frameW, 0, frameW, frameH,
        -drawW / 2, -drawH, drawW, drawH
      );
      outCtx.restore();
    }

    const filename = `be_sinh_${state}_calibrated_${Date.now()}.png`;
    const link = document.createElement('a');
    link.download = filename;
    link.href = outCanvas.toDataURL('image/png');
    link.click();
    this.engine.showToast(`💾 Đã xuất Spritesheet đã căn chỉnh: ${filename}`);
  }

  public captureBuffaloSnapshot(state: 'idle' | 'walk' | 'graze', facing: number, name: string): void {
    const offW = 560;
    const offH = 406;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = offW;
    offCanvas.height = offH;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    offCtx.clearRect(0, 0, offW, offH);
    this.engine.buffalo.renderAt(offCtx, offW / 2, offH * 0.94, state, this.engine.animTimer, facing, 200);

    const safeName = name.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_').toLowerCase();
    const filename = `trau_${safeName}_${Date.now()}.png`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = offCanvas.toDataURL('image/png');
    link.click();

    this.engine.showToast(`📸 Đã chụp & tải về ảnh trâu: ${filename}`);
  }

  public capturePlayerSnapshot(state: string, name: string): void {
    const offW = 380;
    const offH = 420;
    const offCanvas = document.createElement('canvas');
    offCanvas.width = offW;
    offCanvas.height = offH;
    const offCtx = offCanvas.getContext('2d');
    if (!offCtx) return;

    offCtx.clearRect(0, 0, offW, offH);
    this.engine.player.renderAt(offCtx, offW / 2, offH * 0.94, state, this.engine.animTimer, 1);

    const safeName = name.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_').toLowerCase();
    const filename = `nhanvat_${safeName}_${Date.now()}.png`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = offCanvas.toDataURL('image/png');
    link.click();

    this.engine.showToast(`📸 Đã chụp & tải về ảnh nhân vật: ${filename}`);
  }
}
