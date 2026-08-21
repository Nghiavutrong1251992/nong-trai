/**
 * WildGrass.ts
 * Module chuyên trách vẽ Khóm Cỏ Tơ Mềm Mại & Hoa Đồng Nội Làng Quê Tuyệt Đẹp
 * Phủ đều đặn 100% từ đỉnh đồi, thân đồi cho tới sát chân đồi / ranh giới tầng đất (Đoạn 5, 6, 7)
 */

import { GroundPlatform } from './GroundPlatform';

export type FlowerType = 'daisy' | 'forgetmenot' | 'wildrose' | 'buttercup';

export interface DetailedFlower {
  x: number;
  yOffset: number; // Độ sâu mọc trên thân ụ đất (0 = đỉnh dốc, > 0 = thân dốc)
  type: FlowerType;
  stemH: number;
  scale: number;
  lean: number;
  swaySpeed: number;
  phase: number;
}

export class WildGrass {
  private flowers: DetailedFlower[] = [];

  constructor() {
    this.initFlowers();
  }

  public initFlowers(_startX?: number, _endX?: number): void {
    this.flowers = [];

    // Bố trí hoa duyên dáng khắp ĐỒNG CỎ BÊN TRÁI, đỉnh đồi, THÂN ĐỒI và SÁT CHÂN ĐỒI ĐẤT
    const flowerSpawns: Array<{ x: number; yOffset?: number; type: FlowerType; stemH: number; scale: number; lean: number }> = [
      // Cụm 0: Đồng cỏ mở rộng bên trái (x: -450m -> 0m)
      { x: -360, type: 'buttercup',   stemH: 21, scale: 1.0,  lean: 0.05 },
      { x: -280, type: 'forgetmenot', stemH: 18, scale: 0.95, lean: -0.06 },
      { x: -190, type: 'wildrose',    stemH: 22, scale: 1.05, lean: 0.04 },
      { x: -90,  type: 'daisy',       stemH: 20, scale: 1.0,  lean: -0.05 },
      { x: -25,  type: 'buttercup',   stemH: 19, scale: 0.92, lean: 0.06 },

      // Cụm 1: Chân khóm tre làng (Đoạn 1 - 2)
      { x: 75,  type: 'daisy',        stemH: 20, scale: 0.95, lean: 0.04 },
      { x: 175, type: 'daisy',        stemH: 22, scale: 1.05, lean: -0.05 },
      { x: 215, type: 'forgetmenot',  stemH: 18, scale: 0.95, lean: 0.08 },
      { x: 355, type: 'buttercup',    stemH: 20, scale: 1.0,  lean: -0.06 },

      // Cụm 2: Dưới gốc chuối & bãi trâu gặm cỏ (Đoạn 3 - 4)
      { x: 495, type: 'wildrose',     stemH: 23, scale: 1.1,  lean: 0.04 },
      { x: 535, type: 'daisy',        stemH: 19, scale: 0.9,  lean: -0.07 },
      { x: 620, type: 'forgetmenot',  stemH: 21, scale: 1.0,  lean: 0.05 },
      { x: 740, type: 'buttercup',    stemH: 24, scale: 1.05, lean: -0.04 },

      // Cụm 3: Dốc leo lên ụ đất - Đỉnh dốc, Thân dốc & Chân dốc (Đoạn 5: 800m -> 1000m)
      { x: 825, yOffset: 0,  type: 'daisy',        stemH: 22, scale: 1.0,  lean: 0.12 },
      { x: 865, yOffset: 16, type: 'forgetmenot',  stemH: 16, scale: 0.85, lean: 0.10 },
      { x: 890, yOffset: 0,  type: 'wildrose',     stemH: 19, scale: 0.95, lean: 0.14 },
      { x: 920, yOffset: 34, type: 'buttercup',    stemH: 16, scale: 0.88, lean: 0.08 }, // Thân dốc thấp
      { x: 955, yOffset: 46, type: 'daisy',        stemH: 17, scale: 0.90, lean: 0.06 }, // Chân dốc
      { x: 975, yOffset: 0,  type: 'wildrose',     stemH: 22, scale: 1.05, lean: 0.08 },

      // Cụm 4: Đỉnh ụ đất, Thân ụ đất & Chân ụ đất cao (Đoạn 6: 1000m -> 1200m)
      { x: 1025, yOffset: 0,  type: 'daisy',       stemH: 21, scale: 1.05, lean: -0.04 },
      { x: 1045, yOffset: 22, type: 'wildrose',    stemH: 18, scale: 0.88, lean: 0.02 },
      { x: 1065, yOffset: 52, type: 'forgetmenot', stemH: 16, scale: 0.85, lean: -0.05 }, // Chân đồi sát đất
      { x: 1090, yOffset: 36, type: 'buttercup',   stemH: 17, scale: 0.90, lean: 0.04 },
      { x: 1115, yOffset: 0,  type: 'wildrose',    stemH: 23, scale: 1.1,  lean: -0.03 },
      { x: 1135, yOffset: 54, type: 'daisy',       stemH: 16, scale: 0.85, lean: 0.03 },  // Chân đồi sát đất
      { x: 1155, yOffset: 20, type: 'daisy',       stemH: 17, scale: 0.90, lean: 0.04 },
      { x: 1175, yOffset: 0,  type: 'buttercup',   stemH: 20, scale: 1.0,  lean: 0.06 },
      { x: 1195, yOffset: 48, type: 'forgetmenot', stemH: 16, scale: 0.85, lean: -0.05 }, // Chân đồi sát đất

      // Cụm 5: Dốc thoai thoải từ ụ đất xuống ruộng lúa (Đoạn 7: 1200m -> 1400m)
      { x: 1235, yOffset: 0,  type: 'forgetmenot', stemH: 20, scale: 1.0,  lean: -0.10 },
      { x: 1255, yOffset: 22, type: 'buttercup',   stemH: 17, scale: 0.88, lean: -0.08 },
      { x: 1275, yOffset: 42, type: 'daisy',       stemH: 16, scale: 0.85, lean: -0.06 }, // Chân dốc
      { x: 1295, yOffset: 0,  type: 'wildrose',    stemH: 22, scale: 1.05, lean: -0.12 },
      { x: 1335, yOffset: 16, type: 'daisy',       stemH: 18, scale: 0.90, lean: -0.06 },
      { x: 1375, yOffset: 0,  type: 'buttercup',   stemH: 23, scale: 1.05, lean: -0.06 },

      // Cụm 6: Bờ đê cuối cánh đồng (Đoạn 12: 2200m -> 2400m)
      { x: 2255, yOffset: 0, type: 'buttercup',   stemH: 21, scale: 1.0,  lean: 0.05 },
      { x: 2305, yOffset: 0, type: 'wildrose',    stemH: 22, scale: 1.0,  lean: -0.04 },
      { x: 2355, yOffset: 0, type: 'daisy',       stemH: 23, scale: 1.05, lean: 0.06 }
    ];

    flowerSpawns.forEach((f, idx) => {
      this.flowers.push({
        x: f.x,
        yOffset: f.yOffset || 0,
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
   * Render khóm cỏ tơ mềm mại & hoa đồng nội trên đỉnh, thân và chân đồi
   */
  public render(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    playerX: number,
    animTimer: number,
    startX: number = 20,
    endX: number = 2400
  ): void {
    ctx.save();

    // ------------------------------------------------------------
    // 1. CÁC KHÓM CỎ TƠ MỀM MẠI TRÊN ĐỈNH, THÂN VÀ CHÂN Ụ ĐẤT
    // ------------------------------------------------------------
    ctx.strokeStyle = '#65a30d';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();

    // A. Khóm cỏ trên đường viền đỉnh đất
    for (let x = startX; x < endX; x += 16) {
      if (x >= 1400 && x <= 2200) continue;

      const rootY = GroundPlatform.getGroundY(x, groundY) + 2;
      const dist = Math.abs(x - playerX);
      const bladeH = 13 + ((x * 11) % 6);
      let sway = Math.sin(animTimer * 2.0 + x * 0.15) * 3.5;

      if (dist < 32) {
        sway += (x > playerX ? 1 : -1) * (1 - dist / 32) * 9;
      }

      ctx.moveTo(x, rootY);
      ctx.quadraticCurveTo(x - 3 + sway * 0.4, rootY - bladeH * 0.6, x - 5 + sway, rootY - bladeH * 0.85);

      ctx.moveTo(x, rootY);
      ctx.quadraticCurveTo(x + sway * 0.5, rootY - bladeH * 0.7, x + sway, rootY - bladeH);

      ctx.moveTo(x, rootY);
      ctx.quadraticCurveTo(x + 3 + sway * 0.4, rootY - bladeH * 0.6, x + 5 + sway, rootY - bladeH * 0.85);
    }

    // B. CÁC KHÓM CỎ TƠ MỌC KHẮP THÂN VÀ CHÂN Ụ ĐẤT (Đoạn 5, 6, 7: x: 800m -> 1390m)
    // 5 tầng cỏ rải đều từ đỉnh xuống tận chân đồi sát lớp đất thịt
    // CHỈ đung đưa theo gió tự nhiên, KHÔNG bị ảnh hưởng bởi bước chân trên đỉnh đồi
    const moundOffsets = [12, 24, 36, 48, 58];
    for (let x = 805; x <= 1390; x += 18) {
      const topY = GroundPlatform.getGroundY(x, groundY);
      const baseY = groundY;
      const moundHeight = baseY - topY;

      if (moundHeight > 8) {
        moundOffsets.forEach((off, oIdx) => {
          if (off < moundHeight - 2) {
            const bodyY = topY + off + (x % 5);
            const bladeH = 9 + ((x * 7 + oIdx) % 5);
            // Gió thổi nhẹ tự nhiên trên thân đồi
            const sway = Math.sin(animTimer * 1.8 + (x + off) * 0.2) * 2.0;

            ctx.moveTo(x, bodyY);
            ctx.quadraticCurveTo(x - 2 + sway * 0.4, bodyY - bladeH * 0.6, x - 3 + sway, bodyY - bladeH * 0.8);

            ctx.moveTo(x, bodyY);
            ctx.quadraticCurveTo(x + sway * 0.5, bodyY - bladeH * 0.7, x + sway, bodyY - bladeH);

            ctx.moveTo(x, bodyY);
            ctx.quadraticCurveTo(x + 2 + sway * 0.4, bodyY - bladeH * 0.6, x + 3 + sway, bodyY - bladeH * 0.8);
          }
        });
      }
    }
    ctx.stroke();

    // Lớp cỏ non xanh sáng điểm xuyết phủ khắp đồi (Chỉ lớp mặt cỏ trên cùng mới uốn theo bước chân)
    ctx.strokeStyle = '#84cc16';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    for (let x = startX + 8; x < endX; x += 24) {
      if (x >= 1400 && x <= 2200) continue;

      const rootY = GroundPlatform.getGroundY(x, groundY) + 2;
      const dist = Math.abs(x - playerX);
      const bladeH = 10 + ((x * 7) % 5);
      let sway = Math.sin(animTimer * 2.3 + x * 0.2) * 3.0;

      // Lớp mặt cỏ trên cùng phản ứng với bước chân
      if (dist < 30) {
        sway += (x > playerX ? 1 : -1) * (1 - dist / 30) * 8;
      }

      ctx.moveTo(x, rootY);
      ctx.quadraticCurveTo(x + sway * 0.5, rootY - bladeH * 0.6, x + sway, rootY - bladeH);
    }

    // Điểm cỏ non ở các tầng sâu trên thân đồi (Chỉ đung đưa theo gió tự nhiên)
    for (let x = 815; x <= 1380; x += 26) {
      const topY = GroundPlatform.getGroundY(x, groundY);
      const moundHeight = groundY - topY;
      if (moundHeight > 15) {
        const off1 = 18 + (x % 6);
        const off2 = 42 + (x % 6);
        if (off1 < moundHeight - 2) {
          const bodyY1 = topY + off1;
          const sway = Math.sin(animTimer * 2.0 + x * 0.2) * 1.8;
          ctx.moveTo(x, bodyY1);
          ctx.quadraticCurveTo(x + sway * 0.5, bodyY1 - 8 * 0.6, x + sway, bodyY1 - 8);
        }
        if (off2 < moundHeight - 2) {
          const bodyY2 = topY + off2;
          const sway = Math.sin(animTimer * 2.1 + (x + 30) * 0.2) * 1.8;
          ctx.moveTo(x + 5, bodyY2);
          ctx.quadraticCurveTo(x + 5 + sway * 0.5, bodyY2 - 8 * 0.6, x + 5 + sway, bodyY2 - 8);
        }
      }
    }
    ctx.stroke();

    // ------------------------------------------------------------
    // 2. CÁC KHÓM CỎ BA LÁ RẢI ĐỀU KHẮP THÂN & CHÂN Ụ ĐẤT (Clover Patches)
    // ------------------------------------------------------------
    ctx.fillStyle = '#65a30d';
    const cloverLocs = [
      { x: 835, yOff: 10 }, { x: 865, yOff: 20 }, { x: 915, yOff: 36 }, { x: 955, yOff: 50 },
      { x: 1015, yOff: 22 }, { x: 1045, yOff: 44 }, { x: 1075, yOff: 56 }, { x: 1105, yOff: 18 },
      { x: 1125, yOff: 38 }, { x: 1145, yOff: 58 }, { x: 1175, yOff: 24 }, { x: 1195, yOff: 48 },
      { x: 1225, yOff: 12 }, { x: 1255, yOff: 32 }, { x: 1285, yOff: 46 }, { x: 1325, yOff: 18 }
    ];
    cloverLocs.forEach(c => {
      const topY = GroundPlatform.getGroundY(c.x, groundY);
      const cy = topY + c.yOff;
      ctx.beginPath();
      ctx.arc(c.x - 2.5, cy - 2, 2.2, 0, Math.PI * 2);
      ctx.arc(c.x + 2.5, cy - 2, 2.2, 0, Math.PI * 2);
      ctx.arc(c.x, cy + 2.2, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(c.x, cy);
      ctx.lineTo(c.x + 1.5, cy + 4.5);
      ctx.stroke();
    });

    // ------------------------------------------------------------
    // 3. VẼ HOA ĐỒNG NỘI TRÊN ĐỈNH, THÂN VÀ CHÂN Ụ ĐẤT
    // ------------------------------------------------------------
    this.flowers.forEach(f => {
      if (f.x < startX || f.x > endX) return;
      const surfaceY = GroundPlatform.getGroundY(f.x, groundY);
      const rootY = surfaceY + f.yOffset + 2;

      const dist = Math.abs(f.x - playerX);
      let sway = Math.sin(animTimer * f.swaySpeed + f.phase) * 3.5;

      // CHỈ HOA Ở LỚP TRÊN CÙNG (f.yOffset === 0) NƠI BÀN CHÂN CHẠM VÀO MỚI BỊ TÁC ĐỘNG BỞI NGƯỜI
      if (f.yOffset === 0 && dist < 32) {
        sway += (f.x > playerX ? 1 : -1) * (1 - dist / 32) * 11;
      }

      const flowerHeadX = f.x + sway;
      const flowerHeadY = rootY - f.stemH;

      // A. Cuống hoa xanh mềm mại có độ cong tự nhiên
      ctx.strokeStyle = '#4d7c0f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(f.x, rootY);
      ctx.quadraticCurveTo(f.x + sway * 0.4 + f.lean * 12, rootY - f.stemH * 0.5, flowerHeadX, flowerHeadY);
      ctx.stroke();

      // B. 2 lá non nhỏ mọc bên thân cuống hoa
      const leafMidY = rootY - f.stemH * 0.45;
      const leafMidX = f.x + sway * 0.4;
      ctx.fillStyle = '#65a30d';
      ctx.beginPath();
      ctx.ellipse(leafMidX - 4, leafMidY, 4.5, 1.8, -0.4, 0, Math.PI * 2);
      ctx.ellipse(leafMidX + 4, leafMidY - 2, 4.5, 1.8, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Đài hoa xanh nhỏ dưới cuống bông
      ctx.fillStyle = '#3f6212';
      ctx.beginPath();
      ctx.arc(flowerHeadX, flowerHeadY + 2, 2.2, 0, Math.PI);
      ctx.fill();

      // C. VẼ TỪNG LOẠI HOA CHI TIẾT
      ctx.save();
      ctx.translate(flowerHeadX, flowerHeadY);
      ctx.scale(f.scale, f.scale);

      if (f.type === 'daisy') {
        // --- 1. HOA CÚC HỌA MI TRẮNG (8 cánh thuôn mềm mại) ---
        const petalCount = 8;
        ctx.fillStyle = 'rgba(226, 232, 240, 0.95)';
        for (let p = 0; p < petalCount; p++) {
          const ang = (p * Math.PI * 2) / petalCount + f.phase * 0.1;
          ctx.beginPath();
          ctx.ellipse(Math.cos(ang) * 5.2, Math.sin(ang) * 5.2, 4.2, 1.6, ang, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#ffffff';
        for (let p = 0; p < petalCount; p++) {
          const ang = (p * Math.PI * 2) / petalCount + f.phase * 0.1;
          ctx.beginPath();
          ctx.ellipse(Math.cos(ang) * 4.6, Math.sin(ang) * 4.6, 3.8, 1.4, ang, 0, Math.PI * 2);
          ctx.fill();
        }

        // Nhụy hoa vàng cam nổi hạt 3D
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-0.7, -0.7, 1.2, 0, Math.PI * 2);
        ctx.fill();

      } else if (f.type === 'forgetmenot') {
        // --- 2. HOA LƯU LY XANH BIẾC (5 cánh bo tròn mịn) ---
        const petalCount = 5;
        ctx.fillStyle = '#38bdf8';
        for (let p = 0; p < petalCount; p++) {
          const ang = (p * Math.PI * 2) / petalCount + f.phase * 0.1;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * 4.4, Math.sin(ang) * 4.4, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Vòng quầng trắng ở tâm
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.arc(0, 0, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // Nhụy hoa vàng rực rỡ
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, 1.3, 0, Math.PI * 2);
        ctx.fill();

      } else if (f.type === 'wildrose') {
        // --- 3. HOA HỒNG DẠI TÍM HỒNG (5 cánh hình tim) ---
        const petalCount = 5;
        ctx.fillStyle = '#f472b6';
        for (let p = 0; p < petalCount; p++) {
          const ang = (p * Math.PI * 2) / petalCount + f.phase * 0.1;
          ctx.beginPath();
          ctx.ellipse(Math.cos(ang) * 4.6, Math.sin(ang) * 4.6, 3.6, 2.4, ang, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#fbcfe8';
        for (let p = 0; p < petalCount; p++) {
          const ang = (p * Math.PI * 2) / petalCount + f.phase * 0.1;
          ctx.beginPath();
          ctx.ellipse(Math.cos(ang) * 3.6, Math.sin(ang) * 3.6, 2.6, 1.6, ang, 0, Math.PI * 2);
          ctx.fill();
        }

        // Nhụy hoa phấn vàng nhạt
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
        ctx.fill();

      } else if (f.type === 'buttercup') {
        // --- 4. HOA MAO LƯƠNG VÀNG ÓNG (Buttercup) ---
        const petalCount = 5;
        ctx.fillStyle = '#eab308';
        for (let p = 0; p < petalCount; p++) {
          const ang = (p * Math.PI * 2) / petalCount + f.phase * 0.1;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * 4.5, Math.sin(ang) * 4.5, 3.0, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.fillStyle = '#fde047';
        for (let p = 0; p < petalCount; p++) {
          const ang = (p * Math.PI * 2) / petalCount + f.phase * 0.1;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * 3.4, Math.sin(ang) * 3.4, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Nhụy hoa cam
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Nụ hoa nhỏ e ấp bên cạnh
        ctx.fillStyle = '#65a30d';
        ctx.beginPath();
        ctx.arc(6.5, 4.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(6.5, 3.2, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    ctx.restore();
  }
}
