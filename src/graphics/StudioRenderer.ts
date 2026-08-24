/**
 * StudioRenderer.ts
 * Quản lý chế độ Studio đo đạc hoạt ảnh và xuất file ảnh PNG 2x HD:
 * - Tab 1: Bé Sinh (3 Trạng thái hoạt ảnh: Idle, Walk, Run x 6 Frame)
 * - Tab 2: Hoa Dại Đồng Quê (8 Loại hoa dại đồng cỏ nông thôn Việt Nam)
 * - Tab 3: Bé Kiên Thìn (8 Khung hình Chu kỳ Chạy Điền Kinh Run Cycle)
 * - Tab 4: Nhân Vật Chính (8 Trạng thái hoạt ảnh)
 * - Tab 5: Chú Trâu Làng Quê (5 Trạng thái hoạt ảnh)
 * - Tab 6: Bộ Dụng Cụ Nông Thôn & Giá Treo Tre (8 Món & 2 Mẫu Giá Treo)
 * - Bộ thước gióng ngang dọc kéo thả tự do
 * - Khung Free Transform 8 tay nắm (8-Handle Resize & Offset Box) cho từng Frame
 */

import { AssetLoader } from '../core/AssetLoader';
import { Player } from '../entities/Player';
import { Buffalo } from '../entities/Buffalo';

export interface FrameAdjustment {
  scaleX: number;   // 1.0 = 100% (Chiều rộng)
  scaleY: number;   // 1.0 = 100% (Chiều cao)
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

export type TransformHandleType = 
  | 'tl' | 'tc' | 'tr' 
  | 'ml' | 'mr' 
  | 'bl' | 'bc' | 'br' 
  | 'move';

export interface StudioClickTarget {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'tab' | 'buffalo' | 'player' | 'kien_thin' | 'tool' | 'download' | 'frame_select' | 'guide_handle' | 'adjust_btn';
  data: any;
}

export type StudioTab = 'be_sinh' | 'flowers' | 'kien_thin' | 'player' | 'buffalo' | 'tools';

export interface StudioHistoryState {
  frameAdjustments: Record<string, FrameAdjustment>;
  guideLines: GuideLine[];
  selectedState: 'idle' | 'walk' | 'run' | 'school';
  selectedFrameIdx: number;
}

export class StudioRenderer {
  public showStudioGuides: boolean = true;
  public currentTab: StudioTab = 'be_sinh';
  public studioClickTargets: StudioClickTarget[] = [];
  public kienThinFps: number = 11;
  public kienThinFacing: number = 1;
  public beSinhFacing: number = 1;
  public flowerDisplayMode: 'single' | 'full' = 'single';
  public animTimer: number = 0;

  // History Stack for Undo / Redo [Ctrl+Z]
  public history: StudioHistoryState[] = [];
  public redoStack: StudioHistoryState[] = [];
  private maxHistory: number = 50;

  // Standalone entities for rendering & snapshots
  public player: Player = new Player(0, 0);
  public buffalo: Buffalo = new Buffalo(0, 0);

  // Thước gióng kéo thả toàn màn hình (Mặc định căn chuẩn Frame 1)
  public guideLines: GuideLine[] = [
    { id: 'h_head', type: 'h', pos: 220, color: '#38bdf8', label: 'Đỉnh Đầu' },
    { id: 'h_waist', type: 'h', pos: 285, color: '#f59e0b', label: 'Thắt Lưng' },
    { id: 'h_ground', type: 'h', pos: 336, color: '#ef4444', label: 'Gốc Tiếp Đất' },
    { id: 'v_guide_1', type: 'v', pos: 312, color: '#c084fc', label: 'Thước Dọc 1' },
    { id: 'v_guide_2', type: 'v', pos: 362, color: '#c084fc', label: 'Thước Dọc 2' }
  ];

  // Drag & Transform state
  public draggingGuideId: string | null = null;
  public activeTransformHandle: TransformHandleType | null = null;
  public isDraggingFrame: boolean = false;
  public dragStartX: number = 0;
  public dragStartY: number = 0;
  public initialOffsetX: number = 0;
  public initialOffsetY: number = 0;
  public initialScaleX: number = 1.0;
  public initialScaleY: number = 1.0;

  // Calibration per-frame: key format "be_sinh_{state}_{frameIndex}"
  public selectedState: 'idle' | 'walk' | 'run' | 'school' = 'school';
  public selectedFrameIdx: number = 0;
  public frameAdjustments: Record<string, FrameAdjustment> = {};

  constructor(public onToast?: (msg: string) => void) {
    this.loadAdjustments();
  }

  public pushHistory(): void {
    const snapshot: StudioHistoryState = {
      frameAdjustments: JSON.parse(JSON.stringify(this.frameAdjustments)),
      guideLines: JSON.parse(JSON.stringify(this.guideLines)),
      selectedState: this.selectedState,
      selectedFrameIdx: this.selectedFrameIdx
    };
    this.history.push(snapshot);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.redoStack = [];
  }

  public undo(): boolean {
    if (this.history.length === 0) {
      this.showToast('ℹ️ Không có thao tác nào để hoàn tác!');
      return false;
    }
    const current: StudioHistoryState = {
      frameAdjustments: JSON.parse(JSON.stringify(this.frameAdjustments)),
      guideLines: JSON.parse(JSON.stringify(this.guideLines)),
      selectedState: this.selectedState,
      selectedFrameIdx: this.selectedFrameIdx
    };
    this.redoStack.push(current);

    const prev = this.history.pop()!;
    this.frameAdjustments = prev.frameAdjustments;
    this.guideLines = prev.guideLines;
    this.selectedState = prev.selectedState;
    this.selectedFrameIdx = prev.selectedFrameIdx;

    this.saveAdjustments();
    this.showToast('↩️ Đã hoàn tác (Ctrl+Z)!');
    return true;
  }

  public redo(): boolean {
    if (this.redoStack.length === 0) {
      this.showToast('ℹ️ Không có thao tác nào để làm lại!');
      return false;
    }
    const current: StudioHistoryState = {
      frameAdjustments: JSON.parse(JSON.stringify(this.frameAdjustments)),
      guideLines: JSON.parse(JSON.stringify(this.guideLines)),
      selectedState: this.selectedState,
      selectedFrameIdx: this.selectedFrameIdx
    };
    this.history.push(current);

    const next = this.redoStack.pop()!;
    this.frameAdjustments = next.frameAdjustments;
    this.guideLines = next.guideLines;
    this.selectedState = next.selectedState;
    this.selectedFrameIdx = next.selectedFrameIdx;

    this.saveAdjustments();
    this.showToast('↪️ Đã làm lại (Ctrl+Y)!');
    return true;
  }

  public showToast(msg: string): void {
    if (this.onToast) {
      this.onToast(msg);
      return;
    }
    const t = document.getElementById('toast');
    if (t) {
      t.textContent = msg;
      t.style.opacity = '1';
      setTimeout(() => { t.style.opacity = '0'; }, 2400);
    }
  }

  private getAdjKey(state: string, frameIdx: number): string {
    return `be_sinh_${state}_${frameIdx}`;
  }

  public getFrameAdj(state: string, frameIdx: number): FrameAdjustment {
    const key = this.getAdjKey(state, frameIdx);
    if (!this.frameAdjustments[key]) {
      this.frameAdjustments[key] = { scaleX: 1.0, scaleY: 1.0, offsetX: 0, offsetY: 0 };
    }
    const a = this.frameAdjustments[key] as any;
    if (a.scale !== undefined && a.scaleX === undefined) {
      a.scaleX = a.scale;
      a.scaleY = a.scale;
      delete a.scale;
    }
    return this.frameAdjustments[key];
  }

  public setFrameAdj(state: string, frameIdx: number, patch: Partial<FrameAdjustment>): void {
    const adj = this.getFrameAdj(state, frameIdx);
    Object.assign(adj, patch);
    this.saveAdjustments();
  }

  public saveAdjustments(): void {
    try {
      localStorage.setItem('studio_be_sinh_adjustments', JSON.stringify(this.frameAdjustments));
      localStorage.setItem('studio_be_sinh_guides', JSON.stringify(this.guideLines));
    } catch {}
  }

  private loadAdjustments(): void {
    try {
      const saved = localStorage.getItem('studio_be_sinh_adjustments');
      if (saved) {
        this.frameAdjustments = JSON.parse(saved);
      }
      const savedGuides = localStorage.getItem('studio_be_sinh_guides');
      if (savedGuides) {
        this.guideLines = JSON.parse(savedGuides);
      }
    } catch {}
  }

  public render(ctx: CanvasRenderingContext2D, width: number, height: number, animTimer: number): void {
    this.animTimer = animTimer;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    this.studioClickTargets = [];

    this.renderHeaderAndTabs(ctx, width);

    if (this.currentTab === 'be_sinh') {
      this.renderBeSinhTab(ctx, width, height, animTimer);
    } else if (this.currentTab === 'flowers') {
      this.renderFlowersTab(ctx, width, height, animTimer);
    } else if (this.currentTab === 'kien_thin') {
      this.renderKienThinTab(ctx, width, height, animTimer);
    } else if (this.currentTab === 'player') {
      this.renderPlayerTab(ctx, width, height, animTimer);
    } else if (this.currentTab === 'buffalo') {
      this.renderBuffaloTab(ctx, width, height, animTimer);
    } else if (this.currentTab === 'tools') {
      this.renderToolsTab(ctx, width, height);
    }

    if (this.showStudioGuides) {
      this.renderDraggableGuides(ctx, width, height);
    }
  }

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
    const tabY = 60;

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
        x: tx, y: tabY, w: tabW, h: tabH, type: 'tab', data: { tab: t.id }
      });
    });
  }

  private renderFlowersTab(ctx: CanvasRenderingContext2D, width: number, height: number, animTimer: number): void {
    const flowerList: Array<{ key: string; name: string; desc: string; singleSrc: string; fullSrc: string }> = [
      { key: 'hoa_xuyen_chi', name: '1. Hoa Xuyến Chi (Cúc Áo)', desc: 'Cánh trắng nhụy vàng mọc ven đê', singleSrc: '/assets/props/flowers/single_xuyen_chi.png', fullSrc: '/assets/props/flowers/hoa_xuyen_chi.png' },
      { key: 'hoa_co_may', name: '2. Hoa Cỏ May', desc: 'Bông nhọn tím găm gấu quần', singleSrc: '/assets/props/flowers/single_co_may.png', fullSrc: '/assets/props/flowers/hoa_co_may.png' },
      { key: 'hoa_chua_me_dat', name: '3. Hoa Chua Me Đất', desc: 'Hoa vàng lá 3 tim mọc sát đất', singleSrc: '/assets/props/flowers/single_chua_me_dat.png', fullSrc: '/assets/props/flowers/hoa_chua_me_dat.png' },
      { key: 'hoa_muoi_gio', name: '4. Hoa Mười Giờ', desc: 'Cánh hồng rực rỡ bên hiên', singleSrc: '/assets/props/flowers/single_muoi_gio.png', fullSrc: '/assets/props/flowers/hoa_muoi_gio.png' },
      { key: 'hoa_dam_but', name: '5. Hoa Dâm Bụt', desc: 'Đỏ thắm nhụy dài hàng rào quê', singleSrc: '/assets/props/flowers/single_dam_but.png', fullSrc: '/assets/props/flowers/hoa_dam_but.png' },
      { key: 'hoa_bim_bim', name: '6. Hoa Bìm Bìm Tím', desc: 'Leo bờ giậu nở hoa chuông', singleSrc: '/assets/props/flowers/single_bim_bim.png', fullSrc: '/assets/props/flowers/hoa_bim_bim.png' },
      { key: 'bui_cuc_dai', name: '7. Bụi Cúc Dại Vàng', desc: 'Bụi cúc sum suê rực rỡ', singleSrc: '/assets/props/flowers/single_cuc_dai.png', fullSrc: '/assets/props/flowers/bui_cuc_dai.png' },
      { key: 'tham_co_hoa_dai', name: '8. Thảm Cỏ Hoa Tự Nhiên', desc: 'Thảm cỏ hoa đa sắc đung đưa', singleSrc: '/assets/props/flowers/single_tham_co.png', fullSrc: '/assets/props/flowers/tham_co_hoa_dai.png' },
    ];

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🌸 BỘ SƯU TẬP 8 LOẠI HOA DẠI ĐỒNG NỘI VIỆT NAM (ĐỒ HỌA MÀU NƯỚC SẮC NÉT):', 40, 118);

    const toggleBtnW = 190;
    const toggleBtnH = 28;
    const toggleBtnX = width - toggleBtnW - 40;
    const toggleBtnY = 104;

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.roundRect(toggleBtnX, toggleBtnY, toggleBtnW, toggleBtnH, 8);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.flowerDisplayMode === 'single' ? '🌿 Xem: TỪNG BỤI LẺ' : '💐 Xem: CẢ DẢI ĐẦY ĐỦ', toggleBtnX + toggleBtnW / 2, toggleBtnY + 18);
    ctx.restore();

    this.studioClickTargets.push({
      x: toggleBtnX, y: toggleBtnY, w: toggleBtnW, h: toggleBtnH, type: 'tool', data: { action: 'toggle_flower_mode' }
    });

    const cols = 4;
    const rows = 2;
    const paddingX = 40;
    const startY = 145;
    const gap = 16;
    const cardW = (width - paddingX * 2 - gap * (cols - 1)) / cols;
    const cardH = (height - startY - 24 - gap * (rows - 1)) / rows;

    flowerList.forEach((item, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const cx = paddingX + c * (cardW + gap);
      const cy = startY + r * (cardH + gap);

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(cx, cy, cardW, cardH, 12);
      ctx.fill();
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      const previewH = cardH - 68;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(cx + 8, cy + 8, cardW - 16, previewH, 8);
      ctx.fill();

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(cx + 8, cy + 8, cardW - 16, previewH, 8);
      ctx.clip();

      const src = this.flowerDisplayMode === 'single' ? item.singleSrc : item.fullSrc;
      const img = AssetLoader.getImage(src);

      if (img.complete && img.naturalWidth > 0) {
        const sway = Math.sin(animTimer * 2.5 + idx) * 0.04;
        const baseScale = Math.min((cardW - 32) / img.naturalWidth, (previewH - 24) / img.naturalHeight);
        const scale = this.flowerDisplayMode === 'single' ? baseScale * 0.95 : baseScale;
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;

        ctx.save();
        ctx.translate(cx + cardW / 2, cy + previewH - 4);
        ctx.rotate(sway);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.beginPath();
        ctx.ellipse(0, 0, drawW * 0.35, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.drawImage(img, -drawW / 2, -drawH + 4, drawW, drawH);
        ctx.restore();
      }
      ctx.restore();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11.5px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.name, cx + 12, cy + previewH + 24);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 9.5px Outfit, sans-serif';
      ctx.fillText(item.desc, cx + 12, cy + previewH + 39);

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
        x: btnX, y: btnY, w: btnW, h: btnH, type: 'download', data: { url: item.fullSrc, filename: `${item.key}.png` }
      });
    });
  }

  private renderBeSinhTab(ctx: CanvasRenderingContext2D, width: number, height: number, animTimer: number): void {
    const states: Array<{
      id: 'idle' | 'walk' | 'school' | 'run';
      title: string;
      icon: string;
      sheetUrl: string;
      totalFrames: number;
      frameW: number;
      frameH: number;
      fps: number;
      cardColor: string;
    }> = [
      { id: 'idle', title: 'Đứng Yên (Idle 6 Frames)', icon: '👧', sheetUrl: '/assets/characters/be_sinh/be_sinh_idle_sheet.png', totalFrames: 6, frameW: 301, frameH: 713, fps: 6, cardColor: '#3b82f6' },
      { id: 'walk', title: 'Đi Bộ Lon Ton (Walk 6 Frames)', icon: '🚶‍♀️', sheetUrl: '/assets/characters/be_sinh/be_sinh_walk_sheet.png', totalFrames: 6, frameW: 298, frameH: 613, fps: 8, cardColor: '#10b981' },
      { id: 'school', title: 'Bé Đi Học (School 6 Frames)', icon: '🎒', sheetUrl: '/assets/characters/be_sinh/be_sinh_school_sheet.png', totalFrames: 6, frameW: 320, frameH: 620, fps: 8, cardColor: '#8b5cf6' },
      { id: 'run', title: 'Chạy Nhanh Tung Tăng (Run 6 Frames)', icon: '🏃‍♀️', sheetUrl: '/assets/characters/be_sinh/be_sinh_run_sheet.png', totalFrames: 6, frameW: 343, frameH: 475, fps: 10, cardColor: '#f59e0b' }
    ];

    const curAdj = this.getFrameAdj(this.selectedState, this.selectedFrameIdx);
    const selectedStateObj = states.find(s => s.id === this.selectedState) || states[2];

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('👧 CÂN CHỈNH KÍCH THƯỚC BÉ SINH (Kéo 8 tay nắm quanh ảnh hoặc thanh công cụ để chỉnh Rộng/Cao):', 40, 114);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 11px Outfit, sans-serif';
    ctx.fillText('Thước ngang/dọc kéo tự do khắp màn hình để so sánh. Bấm giữ chuột vào 8 chấm tay nắm quanh nhân vật để kéo dãn to/nhỏ.', 40, 132);

    const toolBarW = 950;
    const toolBarX = width - toolBarW - 40;
    const toolBarY = 98;
    const toolBarH = 46;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(toolBarX, toolBarY, toolBarW, toolBarH, 10);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🎯 ${selectedStateObj.title.split(' ')[0]} F${this.selectedFrameIdx + 1}:`, toolBarX + 10, toolBarY + 28);

    const scaleXLabel = `↔ ${Math.round(curAdj.scaleX * 100)}%`;
    const btnWMinusX = toolBarX + 115;
    const btnWPlusX = toolBarX + 175;
    const btnH = 26;

    this.drawSmallBtn(ctx, btnWMinusX, toolBarY + 10, 24, btnH, '➖', '#0284c7');
    this.studioClickTargets.push({
      x: btnWMinusX, y: toolBarY + 10, w: 24, h: btnH, type: 'adjust_btn', data: { action: 'scale_x', delta: -0.05 }
    });

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(scaleXLabel, btnWMinusX + 38, toolBarY + 27);

    this.drawSmallBtn(ctx, btnWPlusX, toolBarY + 10, 24, btnH, '➕', '#0284c7');
    this.studioClickTargets.push({
      x: btnWPlusX, y: toolBarY + 10, w: 24, h: btnH, type: 'adjust_btn', data: { action: 'scale_x', delta: 0.05 }
    });

    const scaleYLabel = `↕ ${Math.round(curAdj.scaleY * 100)}%`;
    const btnHMinusX = toolBarX + 208;
    const btnHPlusX = toolBarX + 268;

    this.drawSmallBtn(ctx, btnHMinusX, toolBarY + 10, 24, btnH, '➖', '#10b981');
    this.studioClickTargets.push({
      x: btnHMinusX, y: toolBarY + 10, w: 24, h: btnH, type: 'adjust_btn', data: { action: 'scale_y', delta: -0.05 }
    });

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(scaleYLabel, btnHMinusX + 38, toolBarY + 27);

    this.drawSmallBtn(ctx, btnHPlusX, toolBarY + 10, 24, btnH, '➕', '#10b981');
    this.studioClickTargets.push({
      x: btnHPlusX, y: toolBarY + 10, w: 24, h: btnH, type: 'adjust_btn', data: { action: 'scale_y', delta: 0.05 }
    });

    const dPadX = toolBarX + 300;
    const dBtns = [
      { label: '◀', dx: -2, dy: 0, x: dPadX },
      { label: '▲', dx: 0, dy: -2, x: dPadX + 26 },
      { label: '▼', dx: 0, dy: 2, x: dPadX + 52 },
      { label: '▶', dx: 2, dy: 0, x: dPadX + 78 }
    ];

    dBtns.forEach(b => {
      this.drawSmallBtn(ctx, b.x, toolBarY + 10, 24, btnH, b.label, '#475569');
      this.studioClickTargets.push({
        x: b.x, y: toolBarY + 10, w: 24, h: btnH, type: 'adjust_btn', data: { action: 'move', dx: b.dx, dy: b.dy }
      });
    });

    const btnCenterX = dPadX + 110;
    this.drawSmallBtn(ctx, btnCenterX, toolBarY + 10, 74, btnH, '🎯 Về Giữa', '#0284c7');
    this.studioClickTargets.push({
      x: btnCenterX, y: toolBarY + 10, w: 74, h: btnH, type: 'adjust_btn', data: { action: 'center_frame' }
    });

    const btnApplyAllX = btnCenterX + 80;
    this.drawSmallBtn(ctx, btnApplyAllX, toolBarY + 10, 96, btnH, '✨ Cho Cả 6 Frame', '#10b981');
    this.studioClickTargets.push({
      x: btnApplyAllX, y: toolBarY + 10, w: 96, h: btnH, type: 'adjust_btn', data: { action: 'apply_to_all' }
    });

    const btnAddRulerX = btnApplyAllX + 102;
    this.drawSmallBtn(ctx, btnAddRulerX, toolBarY + 10, 78, btnH, '➕ Thước Dọc', '#9333ea');
    this.studioClickTargets.push({
      x: btnAddRulerX, y: toolBarY + 10, w: 78, h: btnH, type: 'adjust_btn', data: { action: 'add_v_ruler' }
    });

    const btnUndoX = btnAddRulerX + 84;
    this.drawSmallBtn(ctx, btnUndoX, toolBarY + 10, 68, btnH, '↩️ Undo', '#4f46e5');
    this.studioClickTargets.push({
      x: btnUndoX, y: toolBarY + 10, w: 68, h: btnH, type: 'adjust_btn', data: { action: 'undo' }
    });

    const btnRedoX = btnUndoX + 74;
    this.drawSmallBtn(ctx, btnRedoX, toolBarY + 10, 68, btnH, '↪️ Redo', '#4f46e5');
    this.studioClickTargets.push({
      x: btnRedoX, y: toolBarY + 10, w: 68, h: btnH, type: 'adjust_btn', data: { action: 'redo' }
    });

    const btnResetX = btnRedoX + 74;
    this.drawSmallBtn(ctx, btnResetX, toolBarY + 10, 68, btnH, '🔄 Đặt Lại', '#64748b');
    this.studioClickTargets.push({
      x: btnResetX, y: toolBarY + 10, w: 68, h: btnH, type: 'adjust_btn', data: { action: 'reset_frame' }
    });

    const btnFlipX = btnResetX + 74;
    this.drawSmallBtn(ctx, btnFlipX, toolBarY + 10, 74, btnH, this.beSinhFacing > 0 ? '🔄 Quay: R' : '🔄 Quay: L', '#0f172a', '#fef08a');
    this.studioClickTargets.push({
      x: btnFlipX, y: toolBarY + 10, w: 74, h: btnH, type: 'tool', data: { action: 'flip_be_sinh' }
    });

    ctx.restore();

    const rowStartY = 154;
    const availableH = height - rowStartY - 18;
    const rowH = Math.max(120, (availableH - (states.length - 1) * 8) / states.length);

    states.forEach((st, sIdx) => {
      const ry = rowStartY + sIdx * (rowH + 8);
      const sheet = AssetLoader.getImage(st.sheetUrl);

      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(40, ry, width - 80, rowH, 12);
      ctx.fill();
      ctx.strokeStyle = (this.selectedState === st.id) ? 'rgba(245, 158, 11, 0.45)' : 'rgba(203, 213, 225, 0.8)';
      ctx.lineWidth = (this.selectedState === st.id) ? 2 : 1.2;
      ctx.stroke();

      const labelW = 175;
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.roundRect(48, ry + 6, labelW, rowH - 12, 8);
      ctx.fill();

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 11.5px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${st.icon} ${st.title}`, 58, ry + 24);

      const liveBoxX = 58;
      const liveBoxY = ry + 32;
      const liveBoxW = 155;
      const liveBoxH = rowH - 42;

      if (sheet.complete && sheet.naturalWidth > 0) {
        const curFrame = Math.floor(animTimer * st.fps) % st.totalFrames;
        const liveAdj = this.getFrameAdj(st.id, curFrame);
        const baseScale = Math.min((liveBoxH - 12) / st.frameH, (liveBoxW - 12) / st.frameW);
        const liveW = st.frameW * baseScale * liveAdj.scaleX;
        const liveH = st.frameH * baseScale * liveAdj.scaleY;

        ctx.save();
        ctx.translate(liveBoxX + liveBoxW / 2 + liveAdj.offsetX * 0.3, liveBoxY + liveBoxH - 6 + liveAdj.offsetY * 0.3);

        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(0, 0, liveW * 0.35, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        if (this.beSinhFacing < 0) ctx.scale(-1, 1);
        ctx.drawImage(sheet, curFrame * st.frameW, 0, st.frameW, st.frameH, -liveW / 2, -liveH, liveW, liveH);
        ctx.restore();
      }

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
        x: dlBtnX, y: dlBtnY, w: dlBtnW, h: dlBtnH, type: 'tool', data: { action: 'export_calibrated_sheet', state: st.id, sheetUrl: st.sheetUrl, totalFrames: st.totalFrames, frameW: st.frameW, frameH: st.frameH }
      });

      const framesStartX = 48 + labelW + 14;
      const framesAreaW = dlBtnX - framesStartX - 14;
      const frameSlotW = framesAreaW / st.totalFrames;

      for (let f = 0; f < st.totalFrames; f++) {
        const fx = framesStartX + f * frameSlotW;
        const fy = ry + 6;
        const fw = frameSlotW - 8;
        const fh = rowH - 12;
        const slotCenterX = fx + fw / 2;
        const isSelected = (this.selectedState === st.id && this.selectedFrameIdx === f);
        const fAdj = this.getFrameAdj(st.id, f);

        ctx.save();
        ctx.fillStyle = isSelected ? '#fffbeb' : '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(fx, fy, fw, fh, 8);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2.2;
          ctx.stroke();
        } else {
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

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
          const fDrawW = st.frameW * baseScale * fAdj.scaleX;
          const fDrawH = st.frameH * baseScale * fAdj.scaleY;
          const centerX = slotCenterX + fAdj.offsetX;
          const bottomY = groundY + fAdj.offsetY;

          ctx.save();
          ctx.translate(centerX, bottomY);

          ctx.fillStyle = 'rgba(0,0,0,0.1)';
          ctx.beginPath();
          ctx.ellipse(0, 0, fDrawW * 0.32, 3, 0, 0, Math.PI * 2);
          ctx.fill();

          if (this.beSinhFacing < 0) ctx.scale(-1, 1);
          ctx.drawImage(sheet, f * st.frameW, 0, st.frameW, st.frameH, -fDrawW / 2, -fDrawH, fDrawW, fDrawH);

          if (isSelected) {
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 1.6;
            ctx.strokeRect(-fDrawW / 2, -fDrawH, fDrawW, fDrawH);

            const handleSize = 8;
            const hHalf = handleSize / 2;
            const leftX = -fDrawW / 2;
            const rightX = fDrawW / 2;
            const topY = -fDrawH;
            const midY = -fDrawH / 2;
            const botY = 0;

            const handles = [
              { x: leftX, y: topY, color: '#f59e0b' },
              { x: 0, y: topY, color: '#10b981' },
              { x: rightX, y: topY, color: '#f59e0b' },
              { x: leftX, y: midY, color: '#0284c7' },
              { x: rightX, y: midY, color: '#0284c7' },
              { x: leftX, y: botY, color: '#f59e0b' },
              { x: 0, y: botY, color: '#ef4444' },
              { x: rightX, y: botY, color: '#f59e0b' }
            ];

            handles.forEach(h => {
              ctx.fillStyle = h.color;
              ctx.fillRect(h.x - hHalf, h.y - hHalf, handleSize, handleSize);
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1;
              ctx.strokeRect(h.x - hHalf, h.y - hHalf, handleSize, handleSize);
            });

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, midY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.stroke();
          }

          ctx.restore();
        }

        ctx.fillStyle = isSelected ? '#b45309' : '#64748b';
        ctx.font = isSelected ? 'bold 10px Outfit, sans-serif' : '500 9.5px Outfit, sans-serif';
        ctx.textAlign = 'center';
        const labelText = isSelected
          ? `F${f + 1} (${Math.round(fAdj.scaleX * 100)}% x ${Math.round(fAdj.scaleY * 100)}%)`
          : `Frame ${f + 1}`;
        ctx.fillText(labelText, slotCenterX, fy + fh - 3);

        ctx.restore();

        this.studioClickTargets.push({
          x: fx, y: fy, w: fw, h: fh, type: 'frame_select', data: { state: st.id, frameIdx: f, centerX: slotCenterX, groundY }
        });
      }
    });
  }

  private renderDraggableGuides(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    this.guideLines.forEach(g => {
      ctx.save();
      ctx.strokeStyle = g.color;
      ctx.lineWidth = (this.draggingGuideId === g.id) ? 2.5 : 1.5;
      ctx.setLineDash([6, 4]);

      if (g.type === 'h') {
        ctx.beginPath();
        ctx.moveTo(0, g.pos);
        ctx.lineTo(width, g.pos);
        ctx.stroke();

        const handleW = 110;
        ctx.setLineDash([]);
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.roundRect(8, g.pos - 10, handleW, 20, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`↕ ${g.label}: ${Math.round(g.pos)}px`, 8 + handleW / 2, g.pos + 3.5);

        this.studioClickTargets.push({
          x: 0, y: g.pos - 8, w: width, h: 16, type: 'guide_handle', data: { guideId: g.id, type: 'h' }
        });
      } else {
        // Vertical guide line
        // 1. CHIẾU THƯỚC DỌC SANG TẤT CẢ CÁC FRAME KHÁC ĐỂ TIỆN SO SÁNH
        if (this.currentTab === 'be_sinh') {
          const labelW = 175;
          const dlBtnW = 135;
          const framesStartX = 48 + labelW + 14;
          const dlBtnX = width - 40 - dlBtnW - 14;
          const framesAreaW = dlBtnX - framesStartX - 14;
          const totalFrames = 6;
          const frameSlotW = framesAreaW / totalFrames;

          let baseSlot = Math.floor((g.pos - framesStartX) / frameSlotW);
          if (baseSlot < 0) baseSlot = 0;
          if (baseSlot >= totalFrames) baseSlot = totalFrames - 1;

          const baseSlotCenterX = framesStartX + baseSlot * frameSlotW + (frameSlotW - 8) / 2;
          const offsetFromSlotCenter = g.pos - baseSlotCenterX;

          for (let f = 0; f < totalFrames; f++) {
            if (f === baseSlot) continue;
            const slotCenterX = framesStartX + f * frameSlotW + (frameSlotW - 8) / 2;
            const targetX = slotCenterX + offsetFromSlotCenter;

            if (targetX >= framesStartX && targetX <= dlBtnX) {
              ctx.save();
              ctx.strokeStyle = g.color;
              ctx.lineWidth = 1.3;
              ctx.setLineDash([4, 4]);
              ctx.globalAlpha = 0.68;
              ctx.beginPath();
              ctx.moveTo(targetX, 150);
              ctx.lineTo(targetX, height - 20);
              ctx.stroke();

              // Điểm chấm đỉnh Frame
              ctx.fillStyle = g.color;
              ctx.beginPath();
              ctx.arc(targetX, 154, 3, 0, Math.PI * 2);
              ctx.fill();

              // Cho phép bấm/kéo thước từ bất kỳ Frame nào
              this.studioClickTargets.push({
                x: targetX - 8, y: 150, w: 16, h: height - 170, type: 'guide_handle', data: { guideId: g.id, type: 'v', isReplicated: true, targetX }
              });
              ctx.restore();
            }
          }
        } else if (this.currentTab === 'kien_thin') {
          const totalFrames = 8;
          const pSpacing = Math.min(160, (width - 60) / 8);
          const pStartX = (width - pSpacing * 8) / 2 + pSpacing / 2;

          let baseSlot = Math.round((g.pos - pStartX) / pSpacing);
          if (baseSlot < 0) baseSlot = 0;
          if (baseSlot >= totalFrames) baseSlot = totalFrames - 1;

          const baseSlotCenterX = pStartX + baseSlot * pSpacing;
          const offsetFromSlotCenter = g.pos - baseSlotCenterX;

          for (let f = 0; f < totalFrames; f++) {
            if (f === baseSlot) continue;
            const targetX = pStartX + f * pSpacing + offsetFromSlotCenter;
            ctx.save();
            ctx.strokeStyle = g.color;
            ctx.lineWidth = 1.3;
            ctx.setLineDash([4, 4]);
            ctx.globalAlpha = 0.68;
            ctx.beginPath();
            ctx.moveTo(targetX, 140);
            ctx.lineTo(targetX, height - 20);
            ctx.stroke();

            ctx.fillStyle = g.color;
            ctx.beginPath();
            ctx.arc(targetX, 144, 3, 0, Math.PI * 2);
            ctx.fill();

            this.studioClickTargets.push({
              x: targetX - 8, y: 140, w: 16, h: height - 160, type: 'guide_handle', data: { guideId: g.id, type: 'v', isReplicated: true, targetX }
            });
            ctx.restore();
          }
        }

        // Vẽ đường thước dọc chính có tay nắm
        ctx.beginPath();
        ctx.moveTo(g.pos, 95);
        ctx.lineTo(g.pos, height);
        ctx.stroke();

        const handleW = 105;
        ctx.setLineDash([]);
        ctx.fillStyle = g.color;
        ctx.beginPath();
        ctx.roundRect(g.pos - handleW / 2, 95, handleW, 20, 4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`↔ ${g.label}: ${Math.round(g.pos)}px`, g.pos, 108.5);

        this.studioClickTargets.push({
          x: g.pos - 8, y: 95, w: 16, h: height - 95, type: 'guide_handle', data: { guideId: g.id, type: 'v' }
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

      for (let f = 0; f < totalFrames; f++) {
        const px = pStartX + f * pSpacing;

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        ctx.beginPath();
        ctx.ellipse(px, row1Y, 28, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.translate(px, row1Y);
        if (this.kienThinFacing < 0) {
          ctx.scale(-1, 1);
        }

        ctx.drawImage(
          kienThinSheet,
          f * frameW, 0, frameW, frameH,
          -renderW / 2, -targetH, renderW, targetH
        );
        ctx.restore();

        const boxW = Math.min(140, pSpacing - 10);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(px - boxW / 2, row1Y + 12, boxW, 44, 8);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 10.5px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(poseNames[f].name, px, row1Y + 28);

        ctx.fillStyle = '#64748b';
        ctx.font = '500 9px Outfit, sans-serif';
        ctx.fillText(poseNames[f].desc, px, row1Y + 44);
      }
    }

    const liveY = 400;
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('⚡ B. XEM TRỰC TIẾP HOẠT ẢNH CHẠY LIÊN TỤC (LIVE PREVIEW):', width / 2 - 240, liveY);

    const runnerX = width / 2;
    const runnerY = liveY + 140;

    if (kienThinSheet.complete && kienThinSheet.naturalWidth > 0) {
      const currentFrame = Math.floor(animTimer * this.kienThinFps) % totalFrames;
      const targetH = 170;
      const scale = targetH / frameH;
      const renderW = frameW * scale;

      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(runnerX, runnerY, 34, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.translate(runnerX, runnerY);
      if (this.kienThinFacing < 0) {
        ctx.scale(-1, 1);
      }

      ctx.drawImage(
        kienThinSheet,
        currentFrame * frameW, 0, frameW, frameH,
        -renderW / 2, -targetH, renderW, targetH
      );
      ctx.restore();

      const btnW = 120;
      const btnH = 32;
      const btnX = width / 2 - btnW - 10;
      const btnY = runnerY + 18;

      ctx.save();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(btnX, btnY, btnW, btnH, 8);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.kienThinFacing > 0 ? '🔄 Quay: PHẢI' : '🔄 Quay: TRÁI', btnX + btnW / 2, btnY + 20);
      ctx.restore();

      this.studioClickTargets.push({
        x: btnX, y: btnY, w: btnW, h: btnH, type: 'kien_thin', data: { action: 'flip' }
      });

      const dlBtnW = 135;
      const dlBtnH = 32;
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
        x: dlBtnX, y: dlBtnY, w: dlBtnW, h: dlBtnH, type: 'download', data: { url: '/assets/characters/kien_thin/kien_thin_run_sheet.png', filename: 'kien_thin_run_sheet.png' }
      });
    }
  }

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

      this.player.renderAt(ctx, px, py, act.state, animTimer, 1);

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

      this.buffalo.renderAt(ctx, bx, by, act.state as any, animTimer, act.facing);

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
        x: btnX, y: btnY, w: btnW, h: btnH, type: 'buffalo', data: { state: act.state, facing: act.facing, name: act.name }
      });
    });
  }

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
          this.showToast(`🎯 Chọn F${this.selectedFrameIdx + 1} (↔ ${Math.round(adj.scaleX * 100)}%, ↕ ${Math.round(adj.scaleY * 100)}%)`);
        } else if (target.type === 'adjust_btn') {
          if (target.data.action === 'undo') {
            this.undo();
            return;
          } else if (target.data.action === 'redo') {
            this.redo();
            return;
          }

          this.pushHistory();
          const adj = this.getFrameAdj(this.selectedState, this.selectedFrameIdx);
          if (target.data.action === 'scale_x') {
            adj.scaleX = Math.max(0.3, Math.min(3.0, Math.round((adj.scaleX + target.data.delta) * 100) / 100));
            this.showToast(`↔ Rộng F${this.selectedFrameIdx + 1}: ${Math.round(adj.scaleX * 100)}%`);
          } else if (target.data.action === 'scale_y') {
            adj.scaleY = Math.max(0.3, Math.min(3.0, Math.round((adj.scaleY + target.data.delta) * 100) / 100));
            this.showToast(`↕ Cao F${this.selectedFrameIdx + 1}: ${Math.round(adj.scaleY * 100)}%`);
          } else if (target.data.action === 'move') {
            adj.offsetX += target.data.dx;
            adj.offsetY += target.data.dy;
          } else if (target.data.action === 'center_frame') {
            adj.offsetX = 0;
            adj.offsetY = 0;
            this.showToast(`🎯 Đã căn Frame ${this.selectedFrameIdx + 1} về chính giữa & chạm đất!`);
          } else if (target.data.action === 'apply_to_all') {
            for (let f = 0; f < 6; f++) {
              const targetAdj = this.getFrameAdj(this.selectedState, f);
              targetAdj.scaleX = adj.scaleX;
              targetAdj.scaleY = adj.scaleY;
              targetAdj.offsetX = adj.offsetX;
              targetAdj.offsetY = adj.offsetY;
            }
            this.showToast(`✨ Đã đồng bộ kích thước F${this.selectedFrameIdx + 1} cho toàn bộ 6 Frame!`);
          } else if (target.data.action === 'add_v_ruler') {
            this.guideLines.push({ id: `v_${Date.now()}`, type: 'v', pos: clickX, color: '#c084fc', label: `Thước Dọc ${this.guideLines.length - 2}` });
            this.showToast('➕ Đã thêm thước dọc mới! Kéo để gióng.');
          } else if (target.data.action === 'reset_frame') {
            adj.scaleX = 1.0;
            adj.scaleY = 1.0;
            adj.offsetX = 0;
            adj.offsetY = 0;
            this.showToast(`🔄 Đã đặt lại Frame ${this.selectedFrameIdx + 1}`);
          }
          this.saveAdjustments();
        } else if (target.type === 'tool') {
          if (target.data.action === 'toggle_flower_mode') {
            this.flowerDisplayMode = this.flowerDisplayMode === 'single' ? 'full' : 'single';
            this.showToast(this.flowerDisplayMode === 'single' ? '🌿 Xem: Từng Bụi Lẻ' : '💐 Xem: Cả Dải');
          } else if (target.data.action === 'flip_be_sinh') {
            this.pushHistory();
            this.beSinhFacing = -this.beSinhFacing;
          } else if (target.data.action === 'export_calibrated_sheet') {
            this.exportCalibratedSheet(target.data.state, target.data.sheetUrl, target.data.totalFrames, target.data.frameW, target.data.frameH);
          }
        } else if (target.type === 'kien_thin') {
          if (target.data.action === 'flip') {
            this.pushHistory();
            this.kienThinFacing = -this.kienThinFacing;
          }
        } else if (target.type === 'download') {
          const a = document.createElement('a');
          a.href = target.data.url;
          a.download = target.data.filename;
          a.click();
          this.showToast(`⬇ Đang tải file: ${target.data.filename}`);
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
    // 1. Kiểm tra kéo thước ngang
    for (const g of this.guideLines) {
      if (g.type === 'h' && Math.abs(my - g.pos) <= 10) {
        this.pushHistory();
        this.draggingGuideId = g.id;
        this.dragStartY = my;
        return;
      }
      if (g.type === 'v') {
        if (Math.abs(mx - g.pos) <= 10) {
          this.pushHistory();
          this.draggingGuideId = g.id;
          this.dragStartX = mx;
          return;
        }

        // Cho phép kéo thước từ bất kỳ Frame nào
        if (this.currentTab === 'be_sinh') {
          const labelW = 175;
          const dlBtnW = 135;
          const framesStartX = 48 + labelW + 14;
          const dlBtnX = window.innerWidth - 40 - dlBtnW - 14;
          const framesAreaW = dlBtnX - framesStartX - 14;
          const totalFrames = 6;
          const frameSlotW = framesAreaW / totalFrames;

          let baseSlot = Math.floor((g.pos - framesStartX) / frameSlotW);
          if (baseSlot < 0) baseSlot = 0;
          if (baseSlot >= totalFrames) baseSlot = totalFrames - 1;

          const baseSlotCenterX = framesStartX + baseSlot * frameSlotW + (frameSlotW - 8) / 2;
          const offset = g.pos - baseSlotCenterX;

          for (let f = 0; f < totalFrames; f++) {
            const slotCenterX = framesStartX + f * frameSlotW + (frameSlotW - 8) / 2;
            const targetX = slotCenterX + offset;
            if (Math.abs(mx - targetX) <= 10 && my >= 140) {
              this.pushHistory();
              g.pos = targetX;
              this.draggingGuideId = g.id;
              this.dragStartX = mx;
              return;
            }
          }
        }
      }
    }

    // 2. Kiểm tra kéo tay nắm / di chuyển Frame
    for (const target of this.studioClickTargets) {
      if (target.type === 'frame_select' &&
          target.data.state === this.selectedState &&
          target.data.frameIdx === this.selectedFrameIdx &&
          mx >= target.x && mx <= target.x + target.w &&
          my >= target.y && my <= target.y + target.h) {
        
        this.pushHistory();
        const adj = this.getFrameAdj(this.selectedState, this.selectedFrameIdx);
        this.dragStartX = mx;
        this.dragStartY = my;
        this.initialOffsetX = adj.offsetX;
        this.initialOffsetY = adj.offsetY;
        this.initialScaleX = adj.scaleX;
        this.initialScaleY = adj.scaleY;

        const slotCenterX = target.data.centerX;
        const groundY = target.data.groundY;
        const baseScale = 0.22;
        const charW = 300 * baseScale * adj.scaleX;
        const charH = 650 * baseScale * adj.scaleY;

        const charLeft = slotCenterX + adj.offsetX - charW / 2;
        const charRight = slotCenterX + adj.offsetX + charW / 2;
        const charTop = groundY + adj.offsetY - charH;
        const charBottom = groundY + adj.offsetY;
        const charMidY = charTop + charH / 2;

        const hitR = 12;

        if (Math.abs(mx - charLeft) <= hitR && Math.abs(my - charTop) <= hitR) this.activeTransformHandle = 'tl';
        else if (Math.abs(mx - charRight) <= hitR && Math.abs(my - charTop) <= hitR) this.activeTransformHandle = 'tr';
        else if (Math.abs(mx - charLeft) <= hitR && Math.abs(my - charBottom) <= hitR) this.activeTransformHandle = 'bl';
        else if (Math.abs(mx - charRight) <= hitR && Math.abs(my - charBottom) <= hitR) this.activeTransformHandle = 'br';
        else if (Math.abs(mx - slotCenterX - adj.offsetX) <= hitR && Math.abs(my - charTop) <= hitR) this.activeTransformHandle = 'tc';
        else if (Math.abs(mx - slotCenterX - adj.offsetX) <= hitR && Math.abs(my - charBottom) <= hitR) this.activeTransformHandle = 'bc';
        else if (Math.abs(mx - charLeft) <= hitR && Math.abs(my - charMidY) <= hitR) this.activeTransformHandle = 'ml';
        else if (Math.abs(mx - charRight) <= hitR && Math.abs(my - charMidY) <= hitR) this.activeTransformHandle = 'mr';
        else this.activeTransformHandle = 'move';
        return;
      }
    }
  }

  public handleMouseMove(mx: number, my: number, canvas: HTMLCanvasElement): void {
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

    if (this.activeTransformHandle) {
      const adj = this.getFrameAdj(this.selectedState, this.selectedFrameIdx);
      const dx = mx - this.dragStartX;
      const dy = my - this.dragStartY;

      if (this.activeTransformHandle === 'move') {
        adj.offsetX = this.initialOffsetX + Math.round(dx);
        adj.offsetY = this.initialOffsetY + Math.round(dy);
        canvas.style.cursor = 'move';
      } else if (this.activeTransformHandle === 'tc') {
        const scaleDelta = -dy * 0.015;
        adj.scaleY = Math.max(0.3, Math.min(3.0, Math.round((this.initialScaleY + scaleDelta) * 100) / 100));
        canvas.style.cursor = 'ns-resize';
      } else if (this.activeTransformHandle === 'bc') {
        adj.offsetY = this.initialOffsetY + Math.round(dy);
        canvas.style.cursor = 'ns-resize';
      } else if (this.activeTransformHandle === 'ml') {
        const scaleDelta = -dx * 0.02;
        adj.scaleX = Math.max(0.3, Math.min(3.0, Math.round((this.initialScaleX + scaleDelta) * 100) / 100));
        canvas.style.cursor = 'ew-resize';
      } else if (this.activeTransformHandle === 'mr') {
        const scaleDelta = dx * 0.02;
        adj.scaleX = Math.max(0.3, Math.min(3.0, Math.round((this.initialScaleX + scaleDelta) * 100) / 100));
        canvas.style.cursor = 'ew-resize';
      } else if (this.activeTransformHandle === 'tl' || this.activeTransformHandle === 'tr') {
        const sX = (this.activeTransformHandle === 'tr' ? dx : -dx) * 0.015;
        const sY = -dy * 0.015;
        adj.scaleX = Math.max(0.3, Math.min(3.0, Math.round((this.initialScaleX + sX) * 100) / 100));
        adj.scaleY = Math.max(0.3, Math.min(3.0, Math.round((this.initialScaleY + sY) * 100) / 100));
        canvas.style.cursor = (this.activeTransformHandle === 'tl') ? 'nwse-resize' : 'nesw-resize';
      } else if (this.activeTransformHandle === 'bl' || this.activeTransformHandle === 'br') {
        const sX = (this.activeTransformHandle === 'br' ? dx : -dx) * 0.015;
        adj.scaleX = Math.max(0.3, Math.min(3.0, Math.round((this.initialScaleX + sX) * 100) / 100));
        adj.offsetY = this.initialOffsetY + Math.round(dy);
        canvas.style.cursor = (this.activeTransformHandle === 'bl') ? 'nesw-resize' : 'nwse-resize';
      }
      return;
    }

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
    if (this.activeTransformHandle || this.draggingGuideId) {
      this.saveAdjustments();
    }
    this.draggingGuideId = null;
    this.activeTransformHandle = null;
    this.isDraggingFrame = false;
  }

  public handleWheel(mx: number, my: number, deltaY: number): void {
    for (const target of this.studioClickTargets) {
      if (target.type === 'frame_select' &&
          mx >= target.x && mx <= target.x + target.w &&
          my >= target.y && my <= target.y + target.h) {
        this.pushHistory();
        this.selectedState = target.data.state;
        this.selectedFrameIdx = target.data.frameIdx;
        const adj = this.getFrameAdj(this.selectedState, this.selectedFrameIdx);
        const step = deltaY < 0 ? 0.03 : -0.03;
        adj.scaleX = Math.max(0.3, Math.min(3.0, Math.round((adj.scaleX + step) * 100) / 100));
        adj.scaleY = Math.max(0.3, Math.min(3.0, Math.round((adj.scaleY + step) * 100) / 100));
        this.saveAdjustments();
        this.showToast(`🔍 Zoom F${this.selectedFrameIdx + 1}: ${Math.round(adj.scaleX * 100)}% x ${Math.round(adj.scaleY * 100)}%`);
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
      this.showToast('⚠️ Đang tải ảnh spritesheet, vui lòng thử lại...');
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

      const drawW = frameW * adj.scaleX;
      const drawH = frameH * adj.scaleY;

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
    this.showToast(`💾 Đã xuất Spritesheet đã căn chỉnh: ${filename}`);
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
    this.buffalo.renderAt(offCtx, offW / 2, offH * 0.94, state, this.animTimer, facing, 200);

    const safeName = name.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_').toLowerCase();
    const filename = `trau_${safeName}_${Date.now()}.png`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = offCanvas.toDataURL('image/png');
    link.click();

    this.showToast(`📸 Đã chụp & tải về ảnh trâu: ${filename}`);
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
    this.player.renderAt(offCtx, offW / 2, offH * 0.94, state, this.animTimer, 1);

    const safeName = name.replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1E00-\u1EFF]/g, '_').toLowerCase();
    const filename = `nhanvat_${safeName}_${Date.now()}.png`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = offCanvas.toDataURL('image/png');
    link.click();

    this.showToast(`📸 Đã chụp & tải về ảnh nhân vật: ${filename}`);
  }
}
