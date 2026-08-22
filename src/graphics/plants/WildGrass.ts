/**
 * WildGrass.ts
 * Module chuyên trách vẽ Thảm Cỏ Đa Tầng, Khóm Cỏ Tơ Mềm Mại & Hoa Đồng Nội Làng Quê Tuyệt Đẹp:
 * - 🌿 3 Lớp Cỏ Đan Xen Dày Dặn (Khóm cỏ cụm lá to, cỏ tơ kim đung đưa, cỏ non uốn theo bước chân)
 * - 🌾 Bông Cỏ May & Cỏ Đuôi Phụng Vàng Lắc Lư Theo Gió
 * - 🌼 Hoa Bồ Công Anh Trắng (Dandelions) với hạt tơ bay bồng bềnh
 * - 🌸 Hoa Đồng Nội Dày Dặn: Hoa Cúc Trắng, Hoa Mao Lương Vàng, Hoa Lưu Ly Xanh, Hoa Hồng Dại
 * - 🍀 Khóm Cỏ 3 Lá (Clovers) và Đốm Cỏ Tơ phủ trọn vẹn bề mặt đồi và bờ đường
 * - 🦋 Bướm Vàng & Bướm Trắng chập chờn bay lượn sinh động trên thảm hoa cỏ
 * - Đảm bảo 100% các giá trị tọa độ, chiều cao, bán kính luôn dương an toàn
 */

import { GroundPlatform } from './GroundPlatform';

export type FlowerType = 'daisy' | 'forgetmenot' | 'wildrose' | 'buttercup' | 'dandelion';

export interface DetailedFlower {
  x: number;
  type: FlowerType;
  stemH: number;
  scale: number;
  lean: number;
  swaySpeed: number;
  phase: number;
}

export interface Butterfly {
  x: number;
  baseX: number;
  baseYOffset: number;
  color: string;
  wingColor: string;
  size: number;
  speedX: number;
  speedY: number;
  flapSpeed: number;
  phase: number;
}

export class WildGrass {
  private flowers: DetailedFlower[] = [];
  private butterflies: Butterfly[] = [];

  constructor() {
    this.initFlowers();
    this.initButterflies();
  }

  private initButterflies(): void {
    this.butterflies = [
      { x: -180, baseX: -180, baseYOffset: -35, color: '#fef08a', wingColor: '#facc15', size: 6.5, speedX: 18, speedY: 12, flapSpeed: 14, phase: 0.2 },
      { x: 920,  baseX: 920,  baseYOffset: -40, color: '#fed7aa', wingColor: '#fb923c', size: 7.0, speedX: 16, speedY: 15, flapSpeed: 12, phase: 0.8 },
      { x: 1350, baseX: 1350, baseYOffset: -45, color: '#fbcfe8', wingColor: '#f472b6', size: 6.0, speedX: 20, speedY: 10, flapSpeed: 16, phase: 1.5 },
      { x: 1520, baseX: 1520, baseYOffset: -50, color: '#ffffff', wingColor: '#bae6fd', size: 6.8, speedX: 15, speedY: 14, flapSpeed: 13, phase: 2.2 },
      { x: 2680, baseX: 2680, baseYOffset: -38, color: '#fef08a', wingColor: '#eab308', size: 6.5, speedX: 18, speedY: 11, flapSpeed: 15, phase: 3.0 }
    ];
  }

  public initFlowers(_startX?: number, _endX?: number): void {
    this.flowers = [];

    // Bố trí hoa dày dặn, phong phú khắp đồng cỏ và sườn đồi
    const flowerSpawns: Array<{ x: number; type: FlowerType; stemH: number; scale: number; lean: number }> = [
      // 1. Đồng cỏ mở rộng bên trái (Đoạn 0A, 0B: x: -450m -> 0m)
      { x: -420, type: 'daisy',       stemH: 22, scale: 1.05, lean: 0.04 },
      { x: -380, type: 'dandelion',   stemH: 24, scale: 1.10, lean: -0.05 },
      { x: -330, type: 'buttercup',   stemH: 20, scale: 0.95, lean: 0.05 },
      { x: -280, type: 'wildrose',    stemH: 24, scale: 1.10, lean: -0.04 },
      { x: -230, type: 'forgetmenot', stemH: 18, scale: 0.90, lean: -0.06 },
      { x: -180, type: 'dandelion',   stemH: 25, scale: 1.15, lean: 0.04 },
      { x: -130, type: 'daisy',       stemH: 21, scale: 1.00, lean: 0.05 },
      { x: -80,  type: 'buttercup',   stemH: 20, scale: 0.95, lean: -0.04 },
      { x: -35,  type: 'wildrose',    stemH: 23, scale: 1.05, lean: 0.06 },
      { x: -10,  type: 'forgetmenot', stemH: 19, scale: 0.92, lean: -0.05 },

      // 2. Hai bên bờ đá kè hồ cá (Đoạn 0B và sau Đoạn 4)
      { x: 18,   type: 'forgetmenot', stemH: 17, scale: 0.88, lean: 0.05 },
      { x: 785,  type: 'daisy',       stemH: 21, scale: 1.00, lean: -0.04 },
      { x: 815,  type: 'dandelion',   stemH: 23, scale: 1.05, lean: 0.06 },

      // 3. Vùng Lũy Tre & Vườn Chuối (Đoạn 5, 6: 820m -> 1200m)
      { x: 845,  type: 'wildrose',    stemH: 23, scale: 1.10, lean: 0.04 },
      { x: 885,  type: 'dandelion',   stemH: 24, scale: 1.08, lean: -0.03 },
      { x: 925,  type: 'daisy',       stemH: 20, scale: 0.95, lean: -0.05 },
      { x: 965,  type: 'forgetmenot', stemH: 18, scale: 0.90, lean: 0.06 },
      { x: 1010, type: 'buttercup',   stemH: 22, scale: 1.05, lean: -0.04 },
      { x: 1055, type: 'wildrose',    stemH: 24, scale: 1.10, lean: 0.05 },
      { x: 1095, type: 'dandelion',   stemH: 25, scale: 1.12, lean: 0.04 },
      { x: 1135, type: 'daisy',       stemH: 21, scale: 1.00, lean: -0.03 },
      { x: 1175, type: 'forgetmenot', stemH: 19, scale: 0.92, lean: 0.06 },

      // 4. Sườn dốc leo lên Mô Đất / Đồi Cỏ Xanh (Đoạn 7: 1200m -> 1400m)
      { x: 1225, type: 'forgetmenot', stemH: 18, scale: 0.95, lean: 0.10 },
      { x: 1255, type: 'dandelion',   stemH: 23, scale: 1.05, lean: 0.12 },
      { x: 1290, type: 'daisy',       stemH: 21, scale: 1.00, lean: 0.12 },
      { x: 1325, type: 'buttercup',   stemH: 19, scale: 0.95, lean: 0.14 },
      { x: 1360, type: 'wildrose',    stemH: 23, scale: 1.05, lean: 0.10 },
      { x: 1390, type: 'dandelion',   stemH: 24, scale: 1.10, lean: 0.06 },

      // 5. Đỉnh Mô Đất / Đồi Cỏ Xanh Cao Ráo (Đoạn 8: 1400m -> 1600m)
      { x: 1420, type: 'daisy',       stemH: 22, scale: 1.05, lean: -0.02 },
      { x: 1455, type: 'buttercup',   stemH: 20, scale: 0.98, lean: 0.04 },
      { x: 1490, type: 'dandelion',   stemH: 26, scale: 1.15, lean: -0.03 },
      { x: 1530, type: 'wildrose',    stemH: 24, scale: 1.12, lean: 0.03 },
      { x: 1565, type: 'forgetmenot', stemH: 19, scale: 0.95, lean: -0.04 },
      { x: 1595, type: 'daisy',       stemH: 22, scale: 1.05, lean: 0.02 },

      // 6. Sườn dốc thoai thoải xuống ruộng lúa (Đoạn 8-9: 1600m -> 1800m)
      { x: 1630, type: 'buttercup',   stemH: 20, scale: 0.95, lean: -0.08 },
      { x: 1670, type: 'dandelion',   stemH: 23, scale: 1.05, lean: -0.10 },
      { x: 1710, type: 'daisy',       stemH: 21, scale: 1.00, lean: -0.12 },
      { x: 1750, type: 'wildrose',    stemH: 23, scale: 1.05, lean: -0.10 },

      // 7. Bờ đê cuối cánh đồng lúa (Đoạn 14: 2600m -> 2800m)
      { x: 2620, type: 'buttercup',   stemH: 21, scale: 1.00, lean: 0.05 },
      { x: 2660, type: 'dandelion',   stemH: 24, scale: 1.10, lean: -0.04 },
      { x: 2710, type: 'daisy',       stemH: 22, scale: 1.05, lean: -0.04 },
      { x: 2755, type: 'wildrose',    stemH: 23, scale: 1.08, lean: 0.04 }
    ];

    flowerSpawns.forEach((f, idx) => {
      this.flowers.push({
        x: f.x,
        type: f.type,
        stemH: f.stemH,
        scale: f.scale,
        lean: f.lean,
        swaySpeed: 1.6 + (idx % 4) * 0.2,
        phase: (idx * 0.75) % (Math.PI * 2)
      });
    });
  }

  /**
   * Render khóm cỏ tơ mềm mại & hoa đồng nội trên đỉnh và sườn dốc
   */
  public render(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    playerX: number,
    animTimer: number,
    startX: number = -450,
    endX: number = 2800,
    pondStartX: number = 30,
    pondEndX: number = 770,
    paddyStartX: number = 1800,
    paddyEndX: number = 2600
  ): void {
    ctx.save();

    // ------------------------------------------------------------
    // 1. LỚP CỎ HẬU CẢNH XANH RÊU ĐẬM (DEEP GRASS LAYER)
    // ------------------------------------------------------------
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let x = startX + 4; x < endX; x += 10) {
      if ((x >= pondStartX + 20 && x <= pondEndX - 20) || (x >= paddyStartX + 10 && x <= paddyEndX - 10)) {
        continue;
      }
      const rootY = GroundPlatform.getGroundY(x, groundY) + 2;
      const bladeH = 16 + (Math.abs(x * 13) % 8);
      const sway = Math.sin(animTimer * 1.8 + x * 0.12) * 3.0;

      ctx.moveTo(x, rootY);
      ctx.quadraticCurveTo(x - 4 + sway * 0.4, rootY - bladeH * 0.6, x - 6 + sway, rootY - bladeH * 0.95);
      ctx.moveTo(x, rootY);
      ctx.quadraticCurveTo(x + 4 + sway * 0.4, rootY - bladeH * 0.6, x + 6 + sway, rootY - bladeH * 0.95);
    }
    ctx.stroke();

    // ------------------------------------------------------------
    // 2. LỚP CỎ TRUNG CẢNH TƯƠI MÁT (MID GRASS LAYER)
    // ------------------------------------------------------------
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x = startX; x < endX; x += 8) {
      if ((x >= pondStartX + 20 && x <= pondEndX - 20) || (x >= paddyStartX + 10 && x <= paddyEndX - 10)) {
        continue;
      }

      const rootY = GroundPlatform.getGroundY(x, groundY) + 2;
      const dist = Math.abs(x - playerX);
      const bladeH = 14 + (Math.abs(x * 7) % 7);
      let sway = Math.sin(animTimer * 2.2 + x * 0.18) * 3.5;

      if (dist < 32) {
        sway += (x > playerX ? 1 : -1) * (1 - dist / 32) * 10;
      }

      ctx.moveTo(x, rootY);
      ctx.quadraticCurveTo(x - 3 + sway * 0.4, rootY - bladeH * 0.6, x - 5 + sway, rootY - bladeH * 0.85);

      ctx.moveTo(x, rootY);
      ctx.quadraticCurveTo(x + sway * 0.5, rootY - bladeH * 0.7, x + sway, rootY - bladeH);

      ctx.moveTo(x, rootY);
      ctx.quadraticCurveTo(x + 3 + sway * 0.4, rootY - bladeH * 0.6, x + 5 + sway, rootY - bladeH * 0.85);
    }
    ctx.stroke();

    // ------------------------------------------------------------
    // 3. LỚP CỎ NON TIỀN CẢNH XANH SÁNG (BRIGHT GREEN BLADES)
    // ------------------------------------------------------------
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    for (let x = startX + 5; x < endX; x += 11) {
      if ((x >= pondStartX + 20 && x <= pondEndX - 20) || (x >= paddyStartX + 10 && x <= paddyEndX - 10)) {
        continue;
      }

      const rootY = GroundPlatform.getGroundY(x, groundY) + 2;
      const dist = Math.abs(x - playerX);
      const bladeH = 12 + (Math.abs(x * 5) % 6);
      let sway = Math.sin(animTimer * 2.5 + x * 0.22) * 3.8;

      if (dist < 30) {
        sway += (x > playerX ? 1 : -1) * (1 - dist / 30) * 9;
      }

      ctx.moveTo(x, rootY);
      ctx.quadraticCurveTo(x + sway * 0.5, rootY - bladeH * 0.6, x + sway, rootY - bladeH);
    }
    ctx.stroke();

    // ------------------------------------------------------------
    // 4. BÔNG CỎ MAY & CỎ ĐUÔI PHỤNG VÀNG LẮC LƯ THEO GIÓ (FEATHER GRASS)
    // ------------------------------------------------------------
    for (let x = startX + 35; x < endX; x += 65) {
      if ((x >= pondStartX + 20 && x <= pondEndX - 20) || (x >= paddyStartX + 10 && x <= paddyEndX - 10)) {
        continue;
      }
      const rootY = GroundPlatform.getGroundY(x, groundY) + 2;
      const h = 26 + (Math.abs(x * 5) % 10);
      const sway = Math.sin(animTimer * 2.0 + x * 0.15) * 5.0;

      // Thân cọng cỏ may mảnh
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(x, rootY);
      ctx.quadraticCurveTo(x + sway * 0.4, rootY - h * 0.6, x + sway, rootY - h);
      ctx.stroke();

      // Bông cỏ may vàng rơm xòe hạt
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(x + sway, rootY - h - 3, 2.5, 5.5, sway * 0.1, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(x + sway, rootY - h - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // ------------------------------------------------------------
    // 5. CÁC KHÓM CỎ 3 LÁ VÀ THẢM CỎ XANH PHỦ TRỌN VẸN MẶT ĐỒI VÀ ĐỒNG CỎ
    // ------------------------------------------------------------
    for (let x = startX + 12; x < endX; x += 22) {
      if ((x >= pondStartX + 15 && x <= pondEndX - 15) || (x >= paddyStartX + 10 && x <= paddyEndX - 10)) {
        continue;
      }
      const topY = GroundPlatform.getGroundY(x, groundY);
      const r = 2.8 + (Math.abs(x * 3) % 1.5);

      // Cỏ 3 lá trên bề mặt
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(x - 2.2, topY - 2.0, Math.max(1, r), 0, Math.PI * 2);
      ctx.arc(x + 2.2, topY - 2.0, Math.max(1, r), 0, Math.PI * 2);
      ctx.arc(x, topY - 5.0, Math.max(1, r), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(x - 2.2, topY - 2.0, Math.max(0.5, r * 0.55), 0, Math.PI * 2);
      ctx.arc(x + 2.2, topY - 2.0, Math.max(0.5, r * 0.55), 0, Math.PI * 2);
      ctx.arc(x, topY - 5.0, Math.max(0.5, r * 0.55), 0, Math.PI * 2);
      ctx.fill();

      // Cỏ 3 lá và đốm cỏ non phủ sâu xuống dưới trên thân đồi (Mound body: 1200m -> 1800m)
      const moundHeight = groundY - topY;
      if (moundHeight > 8) {
        const layers = [12, 24, 38, 52];
        layers.forEach(off => {
          if (off < moundHeight - 4) {
            const bodyY = topY + off + (Math.abs(x) % 5);
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.arc(x - 1.8, bodyY - 1.8, Math.max(0.8, r * 0.85), 0, Math.PI * 2);
            ctx.arc(x + 1.8, bodyY - 1.8, Math.max(0.8, r * 0.85), 0, Math.PI * 2);
            ctx.arc(x, bodyY - 4.2, Math.max(0.8, r * 0.85), 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(x - 1.8, bodyY - 1.8, Math.max(0.4, r * 0.45), 0, Math.PI * 2);
            ctx.arc(x + 1.8, bodyY - 1.8, Math.max(0.4, r * 0.45), 0, Math.PI * 2);
            ctx.arc(x, bodyY - 4.2, Math.max(0.4, r * 0.45), 0, Math.PI * 2);
            ctx.fill();
          }
        });
      }
    }

    // ------------------------------------------------------------
    // 6. VẼ TỪNG BÔNG HOA ĐỒNG NỘI TỰ NHIÊN (DAISY, DANDELION, BUTTERCUP, WILDROSE, FORGETMENOT)
    // ------------------------------------------------------------
    this.flowers.forEach(fl => {
      if (fl.x < startX - 30 || fl.x > endX + 30) return;

      const surfaceY = GroundPlatform.getGroundY(fl.x, groundY);
      const rootY = surfaceY + 2;

      const sway = Math.sin(animTimer * fl.swaySpeed + fl.phase) * (4.0 * fl.scale);
      const flowerHeadX = fl.x + fl.lean * fl.stemH + sway;
      const flowerHeadY = rootY - fl.stemH;

      // A. Cuống hoa xanh mướt
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 1.6 * fl.scale;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(fl.x, rootY);
      ctx.quadraticCurveTo(fl.x + fl.lean * fl.stemH * 0.4 + sway * 0.4, rootY - fl.stemH * 0.55, flowerHeadX, flowerHeadY);
      ctx.stroke();

      // B. Hai lá nhỏ ở thân cuống
      ctx.fillStyle = '#65a30d';
      const leaf1X = fl.x + (flowerHeadX - fl.x) * 0.45;
      const leaf1Y = rootY - fl.stemH * 0.45;
      ctx.beginPath();
      ctx.ellipse(leaf1X - 3.5 * fl.scale, leaf1Y, Math.max(0.5, 4.5 * fl.scale), Math.max(0.5, 2.0 * fl.scale), -0.4, 0, Math.PI * 2);
      ctx.fill();

      // C. Đầu bông hoa
      ctx.save();
      ctx.translate(flowerHeadX, flowerHeadY);
      ctx.scale(fl.scale, fl.scale);

      if (fl.type === 'dandelion') {
        // Hoa Bồ Công Anh Trắng Xòe Hạt Tơ Bồng Bềnh
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.7;
        for (let i = 0; i < 12; i++) {
          const ang = (i * Math.PI * 2) / 12;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(ang) * 8.5, Math.sin(ang) * 8.5);
          ctx.stroke();
        }

        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (fl.type === 'daisy') {
        // Hoa Cúc Đồng Nội
        ctx.fillStyle = '#ffffff';
        const petalCount = 8;
        for (let i = 0; i < petalCount; i++) {
          const ang = (i * Math.PI * 2) / petalCount;
          ctx.beginPath();
          ctx.ellipse(Math.cos(ang) * 4.5, Math.sin(ang) * 4.5, 3.8, 1.8, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
        ctx.fill();
      } else if (fl.type === 'buttercup') {
        // Hoa Mao Lương Vàng Rực
        ctx.fillStyle = '#fde047';
        for (let i = 0; i < 5; i++) {
          const ang = (i * Math.PI * 2) / 5;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * 3.8, Math.sin(ang) * 3.8, 3.4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
        ctx.fill();
      } else if (fl.type === 'forgetmenot') {
        // Hoa Lưu Ly Xanh Biếc
        ctx.fillStyle = '#60a5fa';
        for (let i = 0; i < 5; i++) {
          const ang = (i * Math.PI * 2) / 5;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * 3.2, Math.sin(ang) * 3.2, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Hoa Hồng Dại Phấn Hồng
        ctx.fillStyle = '#f472b6';
        for (let i = 0; i < 6; i++) {
          const ang = (i * Math.PI * 2) / 6;
          ctx.beginPath();
          ctx.ellipse(Math.cos(ang) * 4.2, Math.sin(ang) * 4.2, 4.0, 2.8, ang, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // ------------------------------------------------------------
    // 7. BƯỚM VÀNG & BƯỚM TRẮNG CHẬP CHỜN TRÊN THẢM HOA CỎ
    // ------------------------------------------------------------
    this.butterflies.forEach(bt => {
      const flyX = bt.baseX + Math.sin(animTimer * 1.5 + bt.phase) * 35;
      const groundAtX = GroundPlatform.getGroundY(flyX, groundY);
      const flyY = groundAtX + bt.baseYOffset + Math.sin(animTimer * 3.0 + bt.phase) * 12;
      const wingFlap = Math.max(0.05, Math.abs(Math.sin(animTimer * bt.flapSpeed + bt.phase)));

      ctx.save();
      ctx.translate(flyX, flyY);

      ctx.fillStyle = bt.wingColor;
      ctx.beginPath();
      ctx.ellipse(-bt.size * wingFlap * 0.7, -bt.size * 0.3, Math.max(0.5, bt.size * wingFlap), Math.max(0.5, bt.size * 0.65), -0.3, 0, Math.PI * 2);
      ctx.ellipse(bt.size * wingFlap * 0.7, -bt.size * 0.3, Math.max(0.5, bt.size * wingFlap), Math.max(0.5, bt.size * 0.65), 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = bt.color;
      ctx.beginPath();
      ctx.arc(-bt.size * wingFlap * 0.6, -bt.size * 0.3, Math.max(0.3, bt.size * wingFlap * 0.45), 0, Math.PI * 2);
      ctx.arc(bt.size * wingFlap * 0.6, -bt.size * 0.3, Math.max(0.3, bt.size * wingFlap * 0.45), 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });

    ctx.restore();
  }
}
