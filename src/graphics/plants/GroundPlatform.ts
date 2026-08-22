/**
 * GroundPlatform.ts
 * Module vẽ Nền Đất Phù Sa & Thảm Cỏ Đa Tầng Làng Quê Đậm Chất Nghệ Thuật:
 * - 🌿 Thảm Cỏ Xanh Nhiệt Đới Đa Tầng: Viền cỏ vòm uốn lượn (scalloped turf), vạt nắng loang lổ
 * - 🍄 Nấm Dại Đồng Quê (Wild Mushrooms): Mọc tự nhiên ven bờ cỏ và sườn đồi
 * - 🪨 Địa Tầng Lòng Đất Giàu Chi Tiết: Rễ tre bện xoắn, đá cuội vân nứt, khoáng thạch lấp lánh
 * - ⛰️ Mô Đất / Đồi Cao: Phủ trọn vẹn thảm cỏ tơ xốp mỡ màng, an toàn 100% không lỗi bán kính âm
 */

export class GroundPlatform {
  private groundCanvas: HTMLCanvasElement | null = null;
  private cachedW: number = 0;
  private cachedH: number = 0;
  private cachedGroundY: number = 0;

  public static getGroundY(x: number, baseGroundY: number): number {
    if (x <= 1200) {
      // 1. Đồng bằng thấp & Vùng Ao Cá (x: -500m -> 1200m)
      return baseGroundY;
    } else if (x <= 1400) {
      // 2. Dốc lên mô đất / đồi cỏ xanh thoai thoải (1200 -> 1400m)
      const p = (x - 1200) / 200;
      const s = p * p * (3 - 2 * p);
      return baseGroundY - s * 65;
    } else if (x <= 1600) {
      // 3. Đỉnh mô đất / đồi cỏ xanh cao ráo (1400 -> 1600m)
      return baseGroundY - 65;
    } else if (x <= 1800) {
      // 4. Sườn dốc thoai thoải dẫn xuống ruộng lúa (1600 -> 1800m)
      const p = (x - 1600) / 200;
      const s = p * p * (3 - 2 * p);
      return (baseGroundY - 65) + s * 69;
    } else if (x <= 2600) {
      // 5. Thửa ruộng lúa nước 4 đoạn (1800 -> 2600m)
      return baseGroundY + 4;
    } else if (x <= 2680) {
      // 6. Bờ đê thoải lên cuối thửa ruộng (2600 -> 2680m)
      const p = (x - 2600) / 80;
      const s = p * p * (3 - 2 * p);
      return (baseGroundY + 4) - s * 4;
    } else {
      // 7. Bờ cỏ cuối cánh đồng (2680 -> 2800m)
      return baseGroundY;
    }
  }

  public render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    groundY: number
  ): void {
    this.updateBuffer(width, height, groundY);
    if (this.groundCanvas) {
      ctx.drawImage(this.groundCanvas, -500, 0);
    }
  }

  private updateBuffer(width: number, height: number, groundY: number): void {
    if (
      this.groundCanvas &&
      this.cachedW === width &&
      this.cachedH === height &&
      this.cachedGroundY === groundY
    ) {
      return;
    }

    this.cachedW = width;
    this.cachedH = height;
    this.cachedGroundY = groundY;

    const minX = -500;
    const maxX = 2800;
    const bufferW = maxX - minX;
    const bufferH = height;

    if (!this.groundCanvas) {
      this.groundCanvas = document.createElement('canvas');
    }
    this.groundCanvas.width = bufferW;
    this.groundCanvas.height = bufferH;

    const bCtx = this.groundCanvas.getContext('2d');
    if (!bCtx) return;

    bCtx.save();
    bCtx.translate(-minX, 0);

    // ============================================================
    // 1. TẦNG ĐẤT NỀN NÂU PHÙ SA ĐA LỚP (RICH EARTH & SOIL STRATA)
    // ============================================================
    const fullGroundGrad = bCtx.createLinearGradient(0, groundY - 70, 0, height);
    fullGroundGrad.addColorStop(0, '#2d1a08'); // Tầng đất mùn giàu dinh dưỡng
    fullGroundGrad.addColorStop(0.25, '#1e1105'); // Tầng đất sét nâu đỏ
    fullGroundGrad.addColorStop(0.60, '#140b03'); // Tầng đất sâu
    fullGroundGrad.addColorStop(1.00, '#0a0501'); // Đáy đất thẳm
    bCtx.fillStyle = fullGroundGrad;

    bCtx.beginPath();
    bCtx.moveTo(minX, height);
    bCtx.lineTo(minX, GroundPlatform.getGroundY(minX, groundY));

    for (let x = minX; x <= maxX; x += 6) {
      bCtx.lineTo(x, GroundPlatform.getGroundY(x, groundY));
    }

    bCtx.lineTo(maxX, height);
    bCtx.closePath();
    bCtx.fill();

    // ============================================================
    // 2. CHI TIẾT ĐỊA CHẤT TRONG LÒNG ĐẤT (ROOTS, PEBBLES, STRATA)
    // ============================================================
    // A. Các dải địa tầng phù sa uốn lượn
    const strataConfigs = [
      { yOffset: 35, width: 4.0, color: 'rgba(85, 45, 14, 0.45)', wave: 0.015, amp: 6 },
      { yOffset: 65, width: 6.0, color: 'rgba(60, 30, 8, 0.55)', wave: 0.010, amp: 8 },
      { yOffset: 105, width: 8.0, color: 'rgba(40, 20, 5, 0.65)', wave: 0.008, amp: 10 }
    ];

    strataConfigs.forEach(st => {
      bCtx.strokeStyle = st.color;
      bCtx.lineWidth = st.width;
      bCtx.beginPath();
      for (let x = minX; x <= maxX; x += 20) {
        const y = GroundPlatform.getGroundY(x, groundY) + st.yOffset + Math.sin(x * st.wave) * st.amp;
        if (x === minX) bCtx.moveTo(x, y);
        else bCtx.lineTo(x, y);
      }
      bCtx.stroke();
    });

    // B. Rễ cây cổ thụ & rễ tre bện xoắn đâm sâu vào lòng đất
    bCtx.strokeStyle = '#78350f';
    bCtx.lineWidth = 2.0;
    bCtx.lineCap = 'round';
    for (let x = minX + 40; x <= maxX - 40; x += 75) {
      const startY = GroundPlatform.getGroundY(x, groundY) + 16;
      const rDir = (Math.abs(x) % 2 === 0 ? 1 : -1);
      bCtx.beginPath();
      bCtx.moveTo(x, startY);
      bCtx.quadraticCurveTo(x + rDir * 12, startY + 18, x + rDir * 6, startY + 38);
      bCtx.quadraticCurveTo(x + rDir * 18, startY + 52, x + rDir * 10, startY + 68);
      bCtx.stroke();

      // Nhánh rễ con
      bCtx.lineWidth = 1.0;
      bCtx.beginPath();
      bCtx.moveTo(x + rDir * 8, startY + 28);
      bCtx.lineTo(x - rDir * 10, startY + 42);
      bCtx.stroke();
      bCtx.lineWidth = 2.0;
    }

    // C. Các viên sỏi đá cuội chìm có vân nứt (Đảm bảo bán kính luôn dương)
    const pebbleColors = ['#78716c', '#57534e', '#a8a29e', '#44403c', '#d6d3d1'];
    for (let x = minX + 25; x <= maxX - 25; x += 38) {
      const pY = GroundPlatform.getGroundY(x, groundY) + 24 + (Math.abs(x * 13) % 65);
      const pr = 3.5 + (Math.abs(x * 7) % 5);
      const col = pebbleColors[Math.abs(x) % pebbleColors.length];

      // Thân đá
      bCtx.fillStyle = col;
      bCtx.beginPath();
      bCtx.ellipse(x, pY, Math.max(1, pr * 1.3), Math.max(1, pr * 0.85), (Math.abs(x) % 5) * 0.2, 0, Math.PI * 2);
      bCtx.fill();

      // Điểm sáng trên đá
      bCtx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      bCtx.beginPath();
      bCtx.arc(x - pr * 0.3, pY - pr * 0.25, Math.max(0.5, pr * 0.35), 0, Math.PI * 2);
      bCtx.fill();
    }

    // ============================================================
    // 3. TẦNG THẢM CỎ XANH MƯỢT NỔI KHỐI (MULTI-LAYER SOD & SCALLOPED TURF)
    // ============================================================
    // Lớp 1: Khối cỏ sâu dày 35px
    const deepSodGrad = bCtx.createLinearGradient(0, groundY - 70, 0, groundY + 45);
    deepSodGrad.addColorStop(0, '#22c55e');
    deepSodGrad.addColorStop(0.35, '#16a34a');
    deepSodGrad.addColorStop(0.75, '#15803d');
    deepSodGrad.addColorStop(1.0, '#14532d');
    bCtx.fillStyle = deepSodGrad;

    bCtx.beginPath();
    bCtx.moveTo(minX, GroundPlatform.getGroundY(minX, groundY));
    for (let x = minX; x <= maxX; x += 6) {
      bCtx.lineTo(x, GroundPlatform.getGroundY(x, groundY));
    }
    for (let x = maxX; x >= minX; x -= 6) {
      bCtx.lineTo(x, GroundPlatform.getGroundY(x, groundY) + 32);
    }
    bCtx.closePath();
    bCtx.fill();

    // Lớp 2: Viền răng cưa rễ cỏ ăn sâu vào đất (Root teeth fringe)
    bCtx.fillStyle = '#14532d';
    bCtx.beginPath();
    for (let x = minX; x <= maxX; x += 10) {
      const topY = GroundPlatform.getGroundY(x, groundY) + 30;
      const tipY = topY + 8 + (Math.abs(x * 7) % 8);
      bCtx.moveTo(x - 5, topY);
      bCtx.lineTo(x, tipY);
      bCtx.lineTo(x + 5, topY);
    }
    bCtx.closePath();
    bCtx.fill();

    // Lớp 3: Thảm cỏ xanh mơn mởn trên bề mặt dày 14px (Bright Surface Sod)
    const topSodGrad = bCtx.createLinearGradient(0, groundY - 70, 0, groundY + 20);
    topSodGrad.addColorStop(0, '#86efac');
    topSodGrad.addColorStop(0.30, '#4ade80');
    topSodGrad.addColorStop(0.75, '#22c55e');
    topSodGrad.addColorStop(1.0, '#16a34a');
    bCtx.fillStyle = topSodGrad;

    bCtx.beginPath();
    bCtx.moveTo(minX, GroundPlatform.getGroundY(minX, groundY));
    for (let x = minX; x <= maxX; x += 6) {
      bCtx.lineTo(x, GroundPlatform.getGroundY(x, groundY));
    }
    for (let x = maxX; x >= minX; x -= 6) {
      bCtx.lineTo(x, GroundPlatform.getGroundY(x, groundY) + 14);
    }
    bCtx.closePath();
    bCtx.fill();

    // ============================================================
    // 4. VIỀN VÒM CỎ NỔI KHỐI 3D (SCALLOPED TURF BLOCKS)
    // ============================================================
    bCtx.fillStyle = '#4ade80';
    for (let x = minX + 5; x <= maxX - 5; x += 15) {
      const y = GroundPlatform.getGroundY(x, groundY) + 1;
      const radius = 6.5 + (Math.abs(x * 3) % 4);
      bCtx.beginPath();
      bCtx.arc(x, y + 1.5, Math.max(1, radius), Math.PI * 0.9, Math.PI * 2.1);
      bCtx.fill();
    }

    // Các vạt nắng loang lổ sáng màu trên thảm cỏ (Dappled Sunlight Patches)
    bCtx.fillStyle = 'rgba(254, 240, 138, 0.38)';
    for (let x = minX + 20; x <= maxX - 20; x += 42) {
      const y = GroundPlatform.getGroundY(x, groundY) + 4;
      bCtx.beginPath();
      bCtx.ellipse(x, y, 14, 4.5, 0.1, 0, Math.PI * 2);
      bCtx.fill();
    }

    // ============================================================
    // 5. CÂY NẤM DẠI ĐỒNG QUÊ (WILD MUSHROOMS)
    // ============================================================
    const mushroomLocations = [
      { x: -350, type: 'red',   scale: 1.0 },
      { x: -210, type: 'brown', scale: 0.85 },
      { x: -70,  type: 'red',   scale: 1.1 },
      { x: 860,  type: 'brown', scale: 1.15 },
      { x: 980,  type: 'red',   scale: 0.9 },
      { x: 1120, type: 'brown', scale: 1.05 },
      { x: 1340, type: 'red',   scale: 1.2 },
      { x: 1460, type: 'brown', scale: 1.0 },
      { x: 1580, type: 'red',   scale: 1.1 },
      { x: 2650, type: 'brown', scale: 1.05 }
    ];

    mushroomLocations.forEach(m => {
      const my = GroundPlatform.getGroundY(m.x, groundY);
      const s = m.scale;

      // Thân nấm trắng ngà
      bCtx.fillStyle = '#fef3c7';
      bCtx.fillRect(m.x - 2 * s, my - 9 * s, Math.max(1, 4 * s), Math.max(1, 10 * s));

      // Mũ nấm
      if (m.type === 'red') {
        bCtx.fillStyle = '#ef4444';
        bCtx.beginPath();
        bCtx.arc(m.x, my - 9 * s, Math.max(1, 7 * s), Math.PI, Math.PI * 2);
        bCtx.fill();

        bCtx.fillStyle = '#ffffff';
        bCtx.beginPath();
        bCtx.arc(m.x - 3 * s, my - 12 * s, Math.max(0.5, 1.2 * s), 0, Math.PI * 2);
        bCtx.arc(m.x + 2 * s, my - 13 * s, Math.max(0.5, 1.4 * s), 0, Math.PI * 2);
        bCtx.arc(m.x + 3.5 * s, my - 10 * s, Math.max(0.5, 1.0 * s), 0, Math.PI * 2);
        bCtx.fill();
      } else {
        bCtx.fillStyle = '#92400e';
        bCtx.beginPath();
        bCtx.ellipse(m.x, my - 8.5 * s, Math.max(1, 6.5 * s), Math.max(1, 4.5 * s), 0, Math.PI, Math.PI * 2);
        bCtx.fill();

        bCtx.fillStyle = '#d97706';
        bCtx.beginPath();
        bCtx.arc(m.x, my - 10 * s, Math.max(0.5, 2 * s), 0, Math.PI * 2);
        bCtx.fill();
      }
    });

    bCtx.restore();
  }
}
