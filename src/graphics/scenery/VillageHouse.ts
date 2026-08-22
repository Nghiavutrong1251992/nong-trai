/**
 * VillageHouse.ts
 * Module chuyên trách vẽ Khung Ngôi Nhà Mái Ngói Đỏ Cổ Truyền Làng Quê Việt Nam:
 * - 🏠 Khung Nhà Gỗ 3 Gian Chuẩn Kiến Trúc:
 *   - 🚪 Cửa chính gian giữa: 6 cánh to lớn (Bộ cửa bức bàn cổ truyền 6 cánh chạm pano)
 *   - 🚪 2 Cửa hông gian trái & gian phải: Mỗi bên 1 cửa 2 cánh
 *   - 🏛️ Hệ thống cột gỗ lim tròn kê chân tảng đá xanh đỡ hàng hiên
 *   - 🏮 Mái ngói mũi hài đỏ cam rêu phong, bờ nóc uốn cong đầu hồi
 *   - 🧱 Bậc thềm tam cấp và hàng hiên gỗ gạch đỏ
 * - Nét vẽ hoạt họa sắc nét viền đen cel-shading đồng bộ toàn game
 */

import { GroundPlatform } from '../plants/GroundPlatform';

export class VillageHouse {
  // Tọa độ trung tâm ngôi nhà tại Đoạn 13 (x: 2060m)
  public readonly houseX = 2060;
  public readonly houseW = 420;
  public readonly houseH = 240;

  public update(_dt: number, _groundY: number = 480): void {
    // Logic khung nhà tĩnh
  }

  /**
   * Render Khung Ngôi Nhà Mái Ngói Đỏ
   */
  public render(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    _animTimer: number,
    cameraX: number = 0,
    viewportW: number = 1400
  ): void {
    const minViewX = cameraX - 300;
    const maxViewX = cameraX + viewportW + 300;

    // Viewport Culling
    if (this.houseX + this.houseW / 2 < minViewX || this.houseX - this.houseW / 2 > maxViewX) {
      return;
    }

    const currentGroundY = GroundPlatform.getGroundY(this.houseX, groundY);
    const hX = this.houseX;
    const hY = currentGroundY;

    ctx.save();

    // ============================================================
    // 1. NỀN MÓNG & BẬC THỀM TAM CẤP (FOUNDATION & STEPS)
    // ============================================================
    const baseW = 380;
    const baseLeft = hX - baseW / 2;
    const baseTop = hY - 6;

    // Nền gạch đá xanh / gạch nung dưới chân cột
    ctx.fillStyle = '#64748b';
    ctx.fillRect(baseLeft, baseTop, baseW, 6);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.6;
    ctx.strokeRect(baseLeft, baseTop, baseW, 6);

    // Bậc tam cấp trước cửa chính (3 bậc)
    const stepW = 150;
    const stepLeft = hX - stepW / 2;
    const stepColors = ['#9a3412', '#c2410c', '#ea580c'];
    for (let s = 0; s < 3; s++) {
      const sw = stepW - s * 14;
      const sx = hX - sw / 2;
      const sy = hY + s * 3;
      ctx.fillStyle = stepColors[s];
      ctx.fillRect(sx, sy, sw, 3);
      ctx.strokeStyle = '#431407';
      ctx.lineWidth = 1.0;
      ctx.strokeRect(sx, sy, sw, 3);
    }

    // ============================================================
    // 2. KHUNG THÂN NHÀ 3 GIAN TƯỜNG VÀNG NGHỆ (TIMBER & WALL FRAME)
    // ============================================================
    const wallW = 350;
    const wallH = 130;
    const wallLeft = hX - wallW / 2;
    const wallTop = hY - wallH;

    // Tường vôi vàng mộc mạc
    const wallGrad = ctx.createLinearGradient(0, wallTop, 0, hY);
    wallGrad.addColorStop(0.0, '#fef08a'); // Vàng rơm sáng
    wallGrad.addColorStop(0.3, '#fde047');
    wallGrad.addColorStop(1.0, '#ca8a04'); // Vàng nghệ ấm
    ctx.fillStyle = wallGrad;
    ctx.fillRect(wallLeft, wallTop, wallW, wallH);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(wallLeft, wallTop, wallW, wallH);

    // Dầm gỗ ngang trên đầu tường (Kẻ hiên / Xà ngang)
    ctx.fillStyle = '#451a03';
    ctx.fillRect(wallLeft, wallTop, wallW, 14);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(wallLeft, wallTop, wallW, 14);

    // ============================================================
    // 3. CỬA CHÍNH TO LỚN 6 CÁNH Ở GIAN GIỮA (MAIN 6-PANEL DOOR)
    // ============================================================
    const mainDoorW = 126;
    const mainDoorH = 92;
    const mainDoorX = hX - mainDoorW / 2;
    const mainDoorY = hY - mainDoorH;

    // Khung bao gỗ lim sẫm cửa chính
    ctx.fillStyle = '#290e05';
    ctx.fillRect(mainDoorX - 4, mainDoorY - 4, mainDoorW + 8, mainDoorH + 4);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.0;
    ctx.strokeRect(mainDoorX - 4, mainDoorY - 4, mainDoorW + 8, mainDoorH + 4);

    // 6 cánh cửa gỗ bức bàn
    const numPanels = 6;
    const panelW = (mainDoorW - 4) / numPanels;

    for (let p = 0; p < numPanels; p++) {
      const px = mainDoorX + 2 + p * panelW;

      // Cánh gỗ nâu bóng có đổ bóng 3D
      const woodGrad = ctx.createLinearGradient(px, 0, px + panelW, 0);
      woodGrad.addColorStop(0.0, '#9a3412');
      woodGrad.addColorStop(0.4, '#7c2d12');
      woodGrad.addColorStop(1.0, '#451a03');
      ctx.fillStyle = woodGrad;
      ctx.fillRect(px, mainDoorY, panelW, mainDoorH);

      // Pano chỉ gỗ trang trí trên từng cánh
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1.0;
      // Pano trên
      ctx.strokeRect(px + 2, mainDoorY + 6, panelW - 4, (mainDoorH - 22) * 0.45);
      // Pano dưới
      ctx.strokeRect(px + 2, mainDoorY + 12 + (mainDoorH - 22) * 0.45, panelW - 4, (mainDoorH - 22) * 0.55);

      // Núm tay nắm đồng tròn ở 2 cánh giữa (cánh 2 và cánh 3)
      if (p === 2 || p === 3) {
        const knobX = p === 2 ? px + panelW - 3 : px + 3;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(knobX, mainDoorY + mainDoorH * 0.52, 2.0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#854d0e';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      // Đường rãnh phân cách giữa các cánh
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(px, mainDoorY);
      ctx.lineTo(px, mainDoorY + mainDoorH);
      ctx.stroke();
    }

    // Viền khung cửa chính
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.2;
    ctx.strokeRect(mainDoorX, mainDoorY, mainDoorW, mainDoorH);

    // ============================================================
    // 4. HAI CỬA HÔNG 2 CÁNH Ở HAI GIAN BÊN (SIDE 2-PANEL DOORS)
    // ============================================================
    const sideDoorW = 54;
    const sideDoorH = 80;
    const sideDoorY = hY - sideDoorH;

    const leftDoorX = wallLeft + 22;
    const rightDoorX = wallLeft + wallW - sideDoorW - 22;

    [leftDoorX, rightDoorX].forEach(sdx => {
      // Khung bao gỗ
      ctx.fillStyle = '#290e05';
      ctx.fillRect(sdx - 3, sideDoorY - 3, sideDoorW + 6, sideDoorH + 3);
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.8;
      ctx.strokeRect(sdx - 3, sideDoorY - 3, sideDoorW + 6, sideDoorH + 3);

      // 2 cánh cửa gỗ hông
      const sPanelW = (sideDoorW - 2) / 2;
      for (let sp = 0; sp < 2; sp++) {
        const spx = sdx + 1 + sp * sPanelW;

        const sWoodGrad = ctx.createLinearGradient(spx, 0, spx + sPanelW, 0);
        sWoodGrad.addColorStop(0.0, '#9a3412');
        sWoodGrad.addColorStop(0.4, '#7c2d12');
        sWoodGrad.addColorStop(1.0, '#451a03');
        ctx.fillStyle = sWoodGrad;
        ctx.fillRect(spx, sideDoorY, sPanelW, sideDoorH);

        // Pano chỉ gỗ
        ctx.strokeStyle = '#c2410c';
        ctx.lineWidth = 0.9;
        ctx.strokeRect(spx + 3, sideDoorY + 5, sPanelW - 6, (sideDoorH - 18) * 0.45);
        ctx.strokeRect(spx + 3, sideDoorY + 10 + (sideDoorH - 18) * 0.45, sPanelW - 6, (sideDoorH - 18) * 0.55);

        // Núm tay nắm đồng
        const sKnobX = sp === 0 ? spx + sPanelW - 3 : spx + 3;
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(sKnobX, sideDoorY + sideDoorH * 0.52, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rãnh giữa 2 cánh
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(sdx + sideDoorW / 2, sideDoorY);
      ctx.lineTo(sdx + sideDoorW / 2, sideDoorY + sideDoorH);
      ctx.stroke();

      // Viền cửa hông
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.0;
      ctx.strokeRect(sdx, sideDoorY, sideDoorW, sideDoorH);
    });

    // ============================================================
    // 5. HỆ THỐNG CỘT GỖ LIM TRÒN ĐỠ MÁI HIÊN (TIMBER COLUMNS)
    // ============================================================
    const colPositions = [
      wallLeft + 8,
      leftDoorX + sideDoorW + 14,
      mainDoorX - 16,
      mainDoorX + mainDoorW + 16,
      rightDoorX - 14,
      wallLeft + wallW - 8
    ];

    colPositions.forEach(cx => {
      // Chân tảng đá xanh
      ctx.fillStyle = '#64748b';
      ctx.fillRect(cx - 6, hY - 8, 12, 8);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.4;
      ctx.strokeRect(cx - 6, hY - 8, 12, 8);

      // Thân cột gỗ lim tròn
      const colGrad = ctx.createLinearGradient(cx - 5, 0, cx + 5, 0);
      colGrad.addColorStop(0.0, '#78350f');
      colGrad.addColorStop(0.3, '#b45309');
      colGrad.addColorStop(1.0, '#451a03');
      ctx.fillStyle = colGrad;
      ctx.fillRect(cx - 5, wallTop + 6, 10, wallH - 14);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.6;
      ctx.strokeRect(cx - 5, wallTop + 6, 10, wallH - 14);
    });

    // ============================================================
    // 6. MÁI NGÓI ĐỎ MŨI HÀI CỔ TRUYỀN UỐN CONG (CURVED TILE ROOF)
    // ============================================================
    const roofW = 420;
    const roofLeft = hX - roofW / 2;
    const roofRight = hX + roofW / 2;
    const eaveY = wallTop + 16;       // Mép mái hiên xòe rộng
    const ridgeY = hY - 210;         // Đỉnh bờ nóc mái
    const ridgeW = 260;              // Chiều dài bờ nóc đỉnh mái
    const ridgeLeft = hX - ridgeW / 2;
    const ridgeRight = hX + ridgeW / 2;

    // A. MẶT PHẲNG MÁI NGÓI CHÍNH
    const roofGrad = ctx.createLinearGradient(0, ridgeY, 0, eaveY);
    roofGrad.addColorStop(0.0, '#f97316'); // Cam tươi trên đỉnh đón nắng
    roofGrad.addColorStop(0.2, '#ea580c'); // Đỏ ngói tươi
    roofGrad.addColorStop(0.7, '#c2410c'); // Đỏ gạch nung
    roofGrad.addColorStop(1.0, '#7c2d12'); // Đỏ sẫm mép hiên
    ctx.fillStyle = roofGrad;

    ctx.beginPath();
    // Bờ nóc trên đỉnh
    ctx.moveTo(ridgeLeft, ridgeY);
    ctx.lineTo(ridgeRight, ridgeY);
    // Mái phải uốn cong vát mũi hài
    ctx.quadraticCurveTo(hX + 185, (ridgeY + eaveY) / 2 + 10, roofRight, eaveY);
    // Mép hiên dưới uốn cong võng nhẹ
    ctx.quadraticCurveTo(hX, eaveY + 7, roofLeft, eaveY);
    // Mái trái uốn cong vát mũi hài
    ctx.quadraticCurveTo(hX - 185, (ridgeY + eaveY) / 2 + 10, ridgeLeft, ridgeY);
    ctx.closePath();
    ctx.fill();

    // B. VÂN HÀNG NGÓI LỢP SO LE TRUYỀN THỐNG
    ctx.strokeStyle = 'rgba(67, 20, 7, 0.45)';
    ctx.lineWidth = 1.4;
    for (let row = 1; row <= 8; row++) {
      const prog = row / 9;
      const curY = ridgeY + prog * (eaveY - ridgeY);
      const curW = ridgeW + prog * (roofW - ridgeW);
      ctx.beginPath();
      ctx.moveTo(hX - curW / 2, curY);
      ctx.quadraticCurveTo(hX, curY + 4 * prog, hX + curW / 2, curY);
      ctx.stroke();
    }

    // Các rãnh dọc thoát nước ngói
    ctx.strokeStyle = 'rgba(254, 215, 170, 0.25)';
    ctx.lineWidth = 1.0;
    for (let rx = -roofW / 2 + 15; rx <= roofW / 2 - 15; rx += 14) {
      const topX = hX + rx * (ridgeW / roofW);
      const botX = hX + rx;
      ctx.beginPath();
      ctx.moveTo(topX, ridgeY + 4);
      ctx.quadraticCurveTo((topX + botX) / 2, (ridgeY + eaveY) / 2, botX, eaveY);
      ctx.stroke();
    }

    // C. BỜ NÓC MÁI & KÌM NÓC ĐẦU HỒI
    ctx.fillStyle = '#7c2d12';
    ctx.beginPath();
    ctx.moveTo(ridgeLeft - 14, ridgeY - 3);
    // Kìm nóc trái uốn cong lên
    ctx.quadraticCurveTo(ridgeLeft - 26, ridgeY - 18, ridgeLeft - 10, ridgeY - 16);
    ctx.lineTo(ridgeRight + 10, ridgeY - 16);
    // Kìm nóc phải uốn cong lên
    ctx.quadraticCurveTo(ridgeRight + 26, ridgeY - 18, ridgeRight + 14, ridgeY - 3);
    ctx.lineTo(ridgeRight + 5, ridgeY + 6);
    ctx.lineTo(ridgeLeft - 5, ridgeY + 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Viền đen hoạt họa bao quanh toàn bộ mái ngói
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(ridgeLeft, ridgeY);
    ctx.lineTo(ridgeRight, ridgeY);
    ctx.quadraticCurveTo(hX + 185, (ridgeY + eaveY) / 2 + 10, roofRight, eaveY);
    ctx.quadraticCurveTo(hX, eaveY + 7, roofLeft, eaveY);
    ctx.quadraticCurveTo(hX - 185, (ridgeY + eaveY) / 2 + 10, ridgeLeft, ridgeY);
    ctx.stroke();

    // Đốm rêu xanh non phong trần trên mái ngói
    ctx.fillStyle = 'rgba(74, 222, 128, 0.45)';
    [
      { x: hX - 110, y: ridgeY + 40, r: 9 },
      { x: hX - 90,  y: ridgeY + 50, r: 7 },
      { x: hX + 90,  y: ridgeY + 55, r: 10 },
      { x: hX + 115, y: ridgeY + 45, r: 8 }
    ].forEach(m => {
      ctx.beginPath();
      ctx.ellipse(m.x, m.y, m.r * 1.5, m.r * 0.8, 0.2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }
}
