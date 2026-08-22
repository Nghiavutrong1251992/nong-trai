/**
 * StudioRenderer.ts
 * Quản lý chế độ Studio đo đạc hoạt ảnh và xuất file ảnh PNG 2x HD:
 * - So sánh kích thước tỷ lệ giữa Nhân vật (Người chơi) và Thú nuôi (Trâu, Bò, Nghé)
 * - Đường kẻ chiều cao (Đỉnh nón, Sừng trâu, Mông/Lưng, Móng chân) [H]
 * - Tương tác click chụp ảnh Snapshot xuất file PNG nền trong suốt sắc nét
 */

import { Engine } from '../core/Engine';

export interface StudioClickTarget {
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'buffalo' | 'player';
  data: any;
}

export class StudioRenderer {
  public showStudioGuides: boolean = false; // Mặc định TẮT cho giao diện trong trẻo
  public studioClickTargets: StudioClickTarget[] = [];

  constructor(private engine: Engine) {}

  public render(ctx: CanvasRenderingContext2D, width: number, height: number, animTimer: number): void {
    // 1. Nền Studio màu trắng tinh khôi chuẩn Studio
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    this.studioClickTargets = [];

    // Header & Hướng dẫn (Chỉ hiện khi bật Guide [H])
    if (this.showStudioGuides) {
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎬 STUDIO HOẠT ẢNH & THƯỚC ĐO TỶ LỆ', width / 2, 42);

      ctx.fillStyle = '#64748b';
      ctx.font = '500 13px Outfit, sans-serif';
      ctx.fillText('Bấm nút "📸 Chụp Ảnh Trâu" bên dưới mỗi tư thế để tải về ảnh PNG 2x HD nền trong suốt (hoặc bấm [H] để ẩn/hiện đường kẻ)', width / 2, 65);
    }

    const row1Y = 270; // Hàng 1: 8 Tư thế Người chơi
    const row2Y = 600; // Hàng 2: 5 Tư thế Chú Trâu
    const groundLevelY = row2Y;

    // ------------------------------------------------------------
    // HÀNG 1: 8 HOẠT ẢNH NHÂN VẬT NGƯỜI CHƠI (PLAYER)
    // ------------------------------------------------------------
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

    if (this.showStudioGuides) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🧑 A. BỘ HOẠT ẢNH NHÂN VẬT CHÍNH (8 Trạng thái):', pStartX - 60, row1Y - 145);
    }

    playerActions.forEach((act, i) => {
      const px = pStartX + i * pSpacing;
      const py = row1Y;

      this.engine.player.renderAt(ctx, px, py, act.state, animTimer, 1);

      if (this.showStudioGuides) {
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
      }
    });

    // ------------------------------------------------------------
    // HÀNG 2: 5 HOẠT ẢNH CHÚ TRÂU ĐỒNG QUÊ (BUFFALO)
    // ------------------------------------------------------------
    const buffaloActions = [
      { state: 'idle', name: '1. Đứng Yên (Dung Yen)', desc: 'Chớp mắt, thở & ve vẩy đuôi nhẹ', facing: -1, color: '#38bdf8' },
      { state: 'idle', name: '2. Đứng Yên Quay Mặt', desc: 'Đứng yên tự nhiên quay sang phải', facing: 1, color: '#38bdf8' },
      { state: 'graze', name: '3. Gặm Cỏ (Nhai Cỏ)', desc: 'Cúi đầu thong thả nhai cỏ non', facing: -1, color: '#4ade80' },
      { state: 'walk', name: '4. Đi Dạo (Bước Trái)', desc: 'Bước đi uyển chuyển thong dong', facing: -1, color: '#facc15' },
      { state: 'walk', name: '5. Đi Dạo (Bước Phải)', desc: 'Bước đi quay sang hướng phải', facing: 1, color: '#facc15' }
    ];

    const bSpacing = Math.min(270, (width - 80) / 5);
    const bStartX = (width - bSpacing * 5) / 2 + bSpacing / 2;

    if (this.showStudioGuides) {
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 15px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('🐃 B. BỘ HOẠT ẢNH CHÚ TRÂU ĐỒNG QUÊ (5 Trạng thái):', bStartX - 100, row2Y - 140);
    }

    buffaloActions.forEach((act, i) => {
      const bx = bStartX + i * bSpacing;
      const by = row2Y;

      this.engine.buffalo.renderAt(ctx, bx, by, act.state as any, animTimer, act.facing);

      // Nút Chụp Ảnh
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
      this.studioClickTargets.push({
        x: bx - 75,
        y: by - 110,
        w: 150,
        h: 110,
        type: 'buffalo',
        data: { state: act.state, facing: act.facing, name: act.name }
      });

      if (this.showStudioGuides) {
        ctx.fillStyle = 'rgba(241, 245, 249, 0.95)';
        ctx.beginPath();
        ctx.roundRect(bx - 95, btnY + btnH + 8, 190, 48, 8);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 12.5px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(act.name, bx, btnY + btnH + 26);

        ctx.fillStyle = '#64748b';
        ctx.font = '500 10px Outfit, sans-serif';
        ctx.fillText(act.desc, bx, btnY + btnH + 44);
      }
    });

    // ------------------------------------------------------------
    // ĐƯỜNG KẺ THƯỚC ĐO CHIỀU CAO (Chỉ hiện khi bật [H])
    // ------------------------------------------------------------
    if (this.showStudioGuides) {
      ctx.save();
      ctx.setLineDash([4, 4]);

      // 1. Đế chân tiếp đất
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(30, groundLevelY);
      ctx.lineTo(width - 30, groundLevelY);
      ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('🔴 Mặt Đất / Chân Tiếp Đất (0px)', width - 35, groundLevelY - 4);

      // 2. Lưng / Mông Trâu (~75px)
      const buffaloSpineY = groundLevelY - 75;
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bStartX - 110, buffaloSpineY);
      ctx.lineTo(width - 30, buffaloSpineY);
      ctx.stroke();

      ctx.fillStyle = '#3b82f6';
      ctx.fillText('🔷 Lưng Trâu (75px)', width - 35, buffaloSpineY - 4);

      // 3. Đỉnh Sừng Trâu (~98px)
      const buffaloHornY = groundLevelY - 98;
      ctx.strokeStyle = '#8b5cf6';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bStartX - 110, buffaloHornY);
      ctx.lineTo(width - 30, buffaloHornY);
      ctx.stroke();

      ctx.fillStyle = '#8b5cf6';
      ctx.fillText('🟣 Đỉnh Sừng Trâu (~100px)', width - 35, buffaloHornY - 4);

      // 4. Đỉnh Nón Nhân Vật (~135px)
      const playerHeadY = row1Y - 135;
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pStartX - 60, playerHeadY);
      ctx.lineTo(width - 30, playerHeadY);
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.fillText('🟢 Đỉnh Nón Lá Nhân Vật (135px)', width - 35, playerHeadY - 4);

      ctx.restore();
    }
  }

  public handleClick(clickX: number, clickY: number): void {
    for (const target of this.studioClickTargets) {
      if (clickX >= target.x && clickX <= target.x + target.w &&
          clickY >= target.y && clickY <= target.y + target.h) {
        if (target.type === 'buffalo') {
          this.captureBuffaloSnapshot(target.data.state, target.data.facing, target.data.name);
        } else if (target.type === 'player') {
          this.capturePlayerSnapshot(target.data.state, target.data.name);
        }
        break;
      }
    }
  }

  public handleMouseMove(mx: number, my: number, canvas: HTMLCanvasElement): void {
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

  /**
   * Chụp ảnh PNG 2x HD trong suốt của Chú Trâu
   */
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

  /**
   * Chụp ảnh PNG 2x HD trong suốt của Nhân Vật
   */
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
