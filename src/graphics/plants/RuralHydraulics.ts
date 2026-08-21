/**
 * RuralHydraulics.ts
 * Module vẽ Chi Tiết Hệ Thống Thủy Lợi Bền Vững & Cảnh Quan Nông Thôn:
 * 1. Bộ rễ cây chuối cắm sâu vào lòng đất (Banana Tree Roots System)
 * 2. Kè đá cuội bậc thang uốn lượn xếp tầng tự nhiên (Terraced River Stone Shoring)
 * 3. Máng nước tre 2 tầng gác cọc gỗ chữ X với dòng nước mát chảy róc rách
 * 4. Cống gỗ bờ ruộng thủ công (Operable Wooden Sluice Gate)
 * 5. Cầu ván gỗ ngắm đồng (Rustic Wooden Boardwalk over Paddy)
 * 6. Bộ rễ lúa nước chìm trong địa tầng bùn phù sa
 */

export class RuralHydraulics {
  /**
   * 1. VẼ BỘ RỄ CÂY CHUỐI & ĐỊA TẦNG ĐẤT THỊT SÂU
   */
  public renderBananaRoots(ctx: CanvasRenderingContext2D, groundY: number): void {
    const rootBaseX = 1180; // Gốc cây chuối to trên gò cao
    const rootBaseY = groundY - 70;

    ctx.save();
    // Vẽ chùm rễ cây chuối cắm sâu vào địa tầng đất
    const rootPaths = [
      // Rễ cái chính vươn sâu
      { pts: [[0, 0], [-12, 18], [-28, 42], [-45, 68], [-58, 85]], w: 7.0, col: '#78350f' },
      { pts: [[0, 0], [10, 16], [22, 38], [35, 62], [48, 82]], w: 6.5, col: '#78350f' },
      { pts: [[0, 0], [-6, 22], [-14, 50], [-20, 80], [-25, 105]], w: 5.5, col: '#5c2b09' },
      { pts: [[0, 0], [4, 20], [12, 48], [16, 78], [20, 98]], w: 5.0, col: '#5c2b09' },
      // Rễ con lan tỏa hai bên
      { pts: [[-28, 42], [-42, 48], [-60, 56]], w: 3.5, col: '#854d0e' },
      { pts: [[-45, 68], [-65, 74], [-82, 80]], w: 2.8, col: '#a16207' },
      { pts: [[22, 38], [38, 45], [55, 52]], w: 3.2, col: '#854d0e' },
      { pts: [[35, 62], [52, 68], [68, 74]], w: 2.6, col: '#a16207' }
    ];

    rootPaths.forEach(r => {
      // Viền nét rễ cây phong cách 2D hoạt họa
      ctx.strokeStyle = '#291204';
      ctx.lineWidth = r.w + 2.0;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(rootBaseX + r.pts[0][0], rootBaseY + r.pts[0][1]);
      for (let i = 1; i < r.pts.length; i++) {
        ctx.lineTo(rootBaseX + r.pts[i][0], rootBaseY + r.pts[i][1]);
      }
      ctx.stroke();

      // Thân rễ gỗ màu nâu ấm
      ctx.strokeStyle = r.col;
      ctx.lineWidth = r.w;
      ctx.beginPath();
      ctx.moveTo(rootBaseX + r.pts[0][0], rootBaseY + r.pts[0][1]);
      for (let i = 1; i < r.pts.length; i++) {
        ctx.lineTo(rootBaseX + r.pts[i][0], rootBaseY + r.pts[i][1]);
      }
      ctx.stroke();

      // Vệt sáng trên sống rễ
      ctx.strokeStyle = 'rgba(254, 240, 138, 0.25)';
      ctx.lineWidth = Math.max(1.0, r.w * 0.3);
      ctx.beginPath();
      ctx.moveTo(rootBaseX + r.pts[0][0] - 1, rootBaseY + r.pts[0][1] - 1);
      for (let i = 1; i < r.pts.length; i++) {
        ctx.lineTo(rootBaseX + r.pts[i][0] - 1, rootBaseY + r.pts[i][1] - 1);
      }
      ctx.stroke();
    });

    ctx.restore();
  }

  /**
   * 2. VẼ KÈ ĐÁ CUỘI BẬC THANG UỐN LƯỢN XẾP TẦNG (River Stone Terrace Shoring)
   */
  public renderStoneEmbankment(ctx: CanvasRenderingContext2D, groundY: number): void {
    ctx.save();

    // Các viên đá cuội xếp tầng theo hình bậc thang cung tròn
    const stoneLayers = [
      // Tầng trên (Gần gốc chuối)
      { x: 1220, y: groundY - 60, rx: 14, ry: 9,  col: '#78716c' },
      { x: 1245, y: groundY - 55, rx: 16, ry: 10, col: '#57534e' },
      { x: 1272, y: groundY - 48, rx: 15, ry: 9,  col: '#a8a29e' },
      // Tầng giữa (Bao quanh hồ lắng)
      { x: 1235, y: groundY - 46, rx: 18, ry: 11, col: '#57534e' },
      { x: 1262, y: groundY - 38, rx: 20, ry: 12, col: '#78716c' },
      { x: 1290, y: groundY - 32, rx: 17, ry: 10, col: '#a8a29e' },
      { x: 1318, y: groundY - 26, rx: 19, ry: 11, col: '#57534e' },
      // Tầng dưới (Tiếp xúc sườn cỏ)
      { x: 1250, y: groundY - 30, rx: 16, ry: 10, col: '#a8a29e' },
      { x: 1278, y: groundY - 22, rx: 22, ry: 13, col: '#78716c' },
      { x: 1310, y: groundY - 14, rx: 19, ry: 11, col: '#57534e' },
      { x: 1342, y: groundY - 6,  rx: 21, ry: 12, col: '#78716c' },
      { x: 1374, y: groundY + 2,  rx: 18, ry: 10, col: '#a8a29e' }
    ];

    stoneLayers.forEach(st => {
      // 1. Viền nét đen hoạt họa
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.ellipse(st.x + 1, st.y + 2, st.rx + 1.5, st.ry + 1.5, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // 2. Thân đá cuội
      ctx.fillStyle = st.col;
      ctx.beginPath();
      ctx.ellipse(st.x, st.y, st.rx, st.ry, 0.1, 0, Math.PI * 2);
      ctx.fill();

      // 3. Đốm rêu xanh tự nhiên bám trên đá
      ctx.fillStyle = '#4d7c0f';
      ctx.beginPath();
      ctx.ellipse(st.x - st.rx * 0.3, st.y + st.ry * 0.2, st.rx * 0.4, st.ry * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();

      // 4. Vệt sáng phản chiếu
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(st.x - st.rx * 0.3, st.y - st.ry * 0.3, st.rx * 0.45, st.ry * 0.3, 0.1, 0, Math.PI * 2);
      ctx.fill();
    });

    // Hoa dại mọc kẽ đá kè
    const rockFlowers = [
      { x: 1255, y: groundY - 42, col: '#f43f5e' },
      { x: 1300, y: groundY - 20, col: '#fbbf24' },
      { x: 1335, y: groundY - 10, col: '#38bdf8' }
    ];
    rockFlowers.forEach(f => {
      ctx.fillStyle = f.col;
      for (let p = 0; p < 5; p++) {
        const ang = (p * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(f.x + Math.cos(ang) * 3, f.y + Math.sin(ang) * 3, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(f.x, f.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * 3. VẼ HỆ THỐNG MÁNG NƯỚC TRE 2 TẦNG & DÒNG NƯỚC CHẢY RÓC RÁCH
   */
  public renderBambooFlumes(ctx: CanvasRenderingContext2D, groundY: number, animTimer: number): void {
    ctx.save();

    // ============================================================
    // TẦNG 1: Máng tre trên (Gò cao -> Kè đá giữa)
    // ============================================================
    const f1StartX = 1195;
    const f1StartY = groundY - 62;
    const f1EndX = 1295;
    const f1EndY = groundY - 38;

    // Cọc chống chữ X máng trên
    this.drawXSupport(ctx, f1StartX + 18, f1StartY + 8, 28);

    // Máng tre 1
    this.drawBambooTrough(ctx, f1StartX, f1StartY, f1EndX, f1EndY);

    // Dòng nước chảy trong máng 1
    this.drawWaterStream(ctx, f1StartX + 8, f1StartY - 2, f1EndX, f1EndY - 2, animTimer);

    // Dòng nước đổ từ máng 1 xuống máng 2
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(f1EndX, f1EndY);
    ctx.quadraticCurveTo(f1EndX + 6, f1EndY + 10, f1EndX + 8, f1EndY + 18);
    ctx.stroke();

    // ============================================================
    // TẦNG 2: Máng tre dưới (Kè đá giữa -> Hồ lắng bờ ruộng)
    // ============================================================
    const f2StartX = f1EndX + 2;
    const f2StartY = f1EndY + 16;
    const f2EndX = 1380;
    const f2EndY = groundY - 6;

    // Cọc chống chữ X máng dưới
    this.drawXSupport(ctx, f2StartX + 25, f2StartY + 8, 22);

    // Máng tre 2
    this.drawBambooTrough(ctx, f2StartX, f2StartY, f2EndX, f2EndY);

    // Dòng nước chảy trong máng 2
    this.drawWaterStream(ctx, f2StartX + 6, f2StartY - 2, f2EndX, f2EndY - 2, animTimer);

    // Dòng nước đổ xuống hồ lắng bờ ruộng
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(f2EndX, f2EndY);
    ctx.quadraticCurveTo(f2EndX + 8, f2EndY + 8, f2EndX + 12, f2EndY + 16);
    ctx.stroke();

    // Hồ lắng nước nhỏ & bọt nước xao động ở chân máng
    const poolX = f2EndX + 14;
    const poolY = f2EndY + 16;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.75)';
    ctx.beginPath();
    ctx.ellipse(poolX, poolY, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bọt nước sủi bọt trắng xóa
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let sp = 0; sp < 5; sp++) {
      const sx = poolX + Math.sin(animTimer * 14 + sp) * 8;
      const sy = poolY - 1 + Math.cos(animTimer * 12 + sp) * 2.5;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawBambooTrough(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number
  ): void {
    // 1. Viền ngoài
    ctx.strokeStyle = '#1e3a0f';
    ctx.lineWidth = 7.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 2. Thân thân tre vàng xanh
    ctx.strokeStyle = '#65a30d';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // 3. Lòng máng tre tươi sáng
    ctx.strokeStyle = '#bef264';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.moveTo(x1, y1 - 1);
    ctx.lineTo(x2, y2 - 1);
    ctx.stroke();

    // 4. Các mắt/đốt tre tự nhiên
    const len = Math.hypot(x2 - x1, y2 - y1);
    const nodeCount = Math.floor(len / 28);
    for (let n = 1; n <= nodeCount; n++) {
      const t = n / (nodeCount + 1);
      const nx = x1 + (x2 - x1) * t;
      const ny = y1 + (y2 - y1) * t;

      ctx.strokeStyle = '#365314';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(nx - 2, ny - 3);
      ctx.lineTo(nx + 2, ny + 3);
      ctx.stroke();
    }
  }

  private drawXSupport(ctx: CanvasRenderingContext2D, x: number, y: number, h: number): void {
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(x - 7, y + h);
    ctx.lineTo(x + 7, y - 6);
    ctx.moveTo(x + 7, y + h);
    ctx.lineTo(x - 7, y - 6);
    ctx.stroke();

    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(x - 7, y + h);
    ctx.lineTo(x + 7, y - 6);
    ctx.moveTo(x + 7, y + h);
    ctx.lineTo(x - 7, y - 6);
    ctx.stroke();

    // Dây buộc cọc
    ctx.fillStyle = '#fde047';
    ctx.fillRect(x - 3, y + h * 0.35, 6, 3);
  }

  private drawWaterStream(
    ctx: CanvasRenderingContext2D,
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    animTimer: number
  ): void {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    // Vệt sáng nước lấp lánh chảy
    const flowT = (animTimer * 3.5) % 1.0;
    const fx1 = x1 + (x2 - x1) * flowT;
    const fy1 = y1 + (y2 - y1) * flowT;
    const fx2 = x1 + (x2 - x1) * Math.min(1.0, flowT + 0.25);
    const fy2 = y1 + (y2 - y1) * Math.min(1.0, flowT + 0.25);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(fx1, fy1);
    ctx.lineTo(fx2, fy2);
    ctx.stroke();
  }

  /**
   * 4. VẼ CỐNG BỜ RUỘNG BẰNG GỖ THỦ CÔNG (Sluice Gate)
   */
  public renderSluiceGate(ctx: CanvasRenderingContext2D, groundY: number): void {
    const gx = 1440;
    const gy = groundY + 8;

    ctx.save();
    // 2 Cọc trụ cống đứng
    ctx.fillStyle = '#451a03';
    ctx.fillRect(gx - 8, gy - 26, 7, 34);
    ctx.fillRect(gx + 3, gy - 24, 7, 32);

    ctx.fillStyle = '#78350f';
    ctx.fillRect(gx - 7, gy - 25, 5, 32);
    ctx.fillRect(gx + 4, gy - 23, 5, 30);

    // Tấm ván chắn nước cống
    ctx.fillStyle = '#b45309';
    ctx.fillRect(gx - 10, gy - 16, 22, 8);
    ctx.fillStyle = '#d97706';
    ctx.fillRect(gx - 9,  gy - 15, 20, 6);

    // Chốt gỗ nâng hạ
    ctx.fillStyle = '#fde047';
    ctx.fillRect(gx - 2, gy - 28, 4, 12);
    ctx.restore();
  }

  /**
   * 5. VẼ CẦU VÁN GỖ NGẮM ĐỒNG BẮC NGANG MẶT NƯỚC
   */
  public renderFootbridge(ctx: CanvasRenderingContext2D, groundY: number): void {
    const bridgeStartX = 1460;
    const bridgeEndX = 1590;
    const bridgeY = groundY - 5;

    ctx.save();
    // Cọc chân cầu cắm sâu vào lòng bùn
    const stilts = [bridgeStartX + 12, bridgeStartX + 65, bridgeEndX - 12];
    stilts.forEach(sx => {
      // Viền
      ctx.fillStyle = '#291204';
      ctx.fillRect(sx - 1, bridgeY, 7, 18);
      // Gỗ
      ctx.fillStyle = '#5c2b09';
      ctx.fillRect(sx, bridgeY, 5, 17);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(sx + 1, bridgeY, 3, 16);
    });

    // Bản ván cầu gỗ
    ctx.fillStyle = '#291204';
    ctx.fillRect(bridgeStartX - 2, bridgeY - 4, (bridgeEndX - bridgeStartX) + 4, 7);

    ctx.fillStyle = '#92400e';
    ctx.fillRect(bridgeStartX, bridgeY - 3, bridgeEndX - bridgeStartX, 5);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(bridgeStartX, bridgeY - 4, bridgeEndX - bridgeStartX, 2);

    // Các đường khía ghép ván & đinh tán gỗ
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.2;
    for (let bx = bridgeStartX + 14; bx < bridgeEndX; bx += 18) {
      ctx.beginPath();
      ctx.moveTo(bx, bridgeY - 4);
      ctx.lineTo(bx, bridgeY + 2);
      ctx.stroke();

      // Đinh tán gỗ
      ctx.fillStyle = '#291204';
      ctx.fillRect(bx - 3, bridgeY - 2, 2, 2);
      ctx.fillRect(bx + 2, bridgeY - 2, 2, 2);
    }

    ctx.restore();
  }

  /**
   * 6. VẼ BỘ RỄ LÚA NƯỚC DƯỚI ĐỊA TẦNG BÙN
   */
  public renderRiceRoots(ctx: CanvasRenderingContext2D, groundY: number, startX: number, endX: number): void {
    const mudY = groundY + 12;
    ctx.save();

    for (let rx = startX; rx < endX; rx += 26) {
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(rx, mudY);
      ctx.quadraticCurveTo(rx - 4, mudY + 8, rx - 8, mudY + 14);
      ctx.moveTo(rx, mudY);
      ctx.quadraticCurveTo(rx + 4, mudY + 8, rx + 8, mudY + 14);
      ctx.moveTo(rx, mudY);
      ctx.lineTo(rx, mudY + 16);
      ctx.stroke();
    }

    ctx.restore();
  }
}
