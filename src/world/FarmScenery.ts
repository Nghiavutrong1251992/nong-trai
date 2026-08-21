import { BananaRenderer } from '../graphics/plants/BananaRenderer';
import { LotusRenderer } from '../graphics/plants/LotusRenderer';

export class FarmScenery {
  // 1. NHÀ NGÓI 3 GIAN CHUẨN GÓC NHÌN 2.5D (Tilted 2.5D Traditional Farmhouse)
  public static renderHouse(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    const houseW = 168;
    const houseH = 68;

    // Bóng đổ ngôi nhà 2.5D
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.roundRect(8, 20, houseW, houseH + 20, 10);
    ctx.fill();

    // Mặt tường trước hiên nhà đứng (Front Facade)
    ctx.fillStyle = '#fde68a';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(0, 24, houseW, houseH, 4);
    ctx.fill();
    ctx.stroke();

    // 4 Cột gỗ lim đỡ hiên nhà đứng
    ctx.fillStyle = '#78350f';
    for (const cx of [14, 58, 110, 154]) {
      ctx.beginPath();
      ctx.roundRect(cx - 3.5, 24, 7, houseH, 2);
      ctx.fill();
      ctx.stroke();
    }

    // Cửa chính gỗ 2 cánh khép hờ
    ctx.fillStyle = '#451a03';
    ctx.fillRect(72, 38, 24, 54);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1;
    ctx.strokeRect(74, 40, 10, 50);
    ctx.strokeRect(84, 40, 10, 50);

    // Mái ngói đỏ nung dốc nghiêng 2.5D (Tilted Roof Pitch)
    const roofGrad = ctx.createLinearGradient(0, -18, 0, 28);
    roofGrad.addColorStop(0, '#ea580c');
    roofGrad.addColorStop(0.4, '#c2410c');
    roofGrad.addColorStop(0.8, '#9a3412');
    roofGrad.addColorStop(1, '#7c2d12');
    ctx.fillStyle = roofGrad;

    ctx.beginPath();
    ctx.moveTo(-10, -18);
    ctx.lineTo(houseW + 10, -18);
    ctx.lineTo(houseW + 6, 28);
    ctx.lineTo(-6, 28);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Các rãnh ngói đỏ nung
    ctx.strokeStyle = '#431407';
    ctx.lineWidth = 1.4;
    for (let rx = 4; rx < houseW; rx += 13) {
      ctx.beginPath();
      ctx.moveTo(rx, -18);
      ctx.lineTo(rx - 2, 28);
      ctx.stroke();
    }

    // Đỉnh nóc nhà
    ctx.fillStyle = '#431407';
    ctx.beginPath();
    ctx.roundRect(-12, -22, houseW + 24, 6, 2);
    ctx.fill();

    // 2 Đèn lồng đỏ treo 2 bên hiên
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(22, 36, 5.5, 0, Math.PI * 2);
    ctx.arc(146, 36, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(21, 41, 2, 4);
    ctx.fillRect(145, 41, 2, 4);

    ctx.restore();
  }

  // 2. CÂY CHUỐI VƯỜN NHÀ 2.5D (Banana Palm Tree)
  public static renderBananaTree(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    BananaRenderer.render(ctx, x, y);
  }

  // 3. GIẾNG NƯỚC ĐÁ CỔ 2.5D (Tilted 2.5D Ancient Stone Well)
  public static renderWell(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    // Thành đá đứng có chiều cao 2.5D (Well Cylindrical Body)
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-22, 0, 44, 18, [0, 0, 10, 10]);
    ctx.fill();
    ctx.stroke();

    // Miệng giếng đá hình elip 2.5D (Top Ellipse Rim)
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Lòng giếng nước trong xanh biếc (Water Surface Ellipse)
    const waterGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 15);
    waterGrad.addColorStop(0, '#38bdf8');
    waterGrad.addColorStop(0.7, '#0284c7');
    waterGrad.addColorStop(1, '#075985');
    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Gợn sóng nước
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(0, 0, 9 + Math.sin(Date.now() / 400) * 2, 4.5 + Math.sin(Date.now() / 400), 0, 0, Math.PI * 2);
    ctx.stroke();

    // Cột gỗ múc nước đứng
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(-18, 4); ctx.lineTo(-18, -14);
    ctx.moveTo(18, 4); ctx.lineTo(18, -14);
    ctx.moveTo(-18, -14); ctx.lineTo(18, -14);
    ctx.stroke();

    // Ròng rọc & gàu nước
    ctx.fillStyle = '#a16207';
    ctx.beginPath();
    ctx.arc(0, -10, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 4. AO SEN NUÔI VỊT 2.5D (Tilted 2.5D Lotus Pond)
  public static renderPond(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.save();
    ctx.translate(x, y);

    const time = Date.now() / 400;

    // Bờ đất ao sen elip dẹp góc 2.5D
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w / 2 + 10, h / 2.8 + 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đá cuội viền quanh bờ ao
    ctx.fillStyle = '#64748b';
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 10) {
      const rx = w / 2 + Math.cos(a) * (w / 2 + 6);
      const ry = h / 2 + Math.sin(a) * (h / 2.8 + 5);
      ctx.beginPath();
      ctx.ellipse(rx, ry, 6, 4, a, 0, Math.PI * 2);
      ctx.fill();
    }

    // Mặt nước ao sen 2.5D trong vắt
    const waterGrad = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.9)');
    waterGrad.addColorStop(0.6, 'rgba(2, 132, 199, 0.95)');
    waterGrad.addColorStop(1, 'rgba(7, 89, 133, 0.98)');
    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cá vàng bơi lội 2.5D
    const fishX = w / 2 + Math.cos(time * 0.6) * (w * 0.25);
    const fishY = h / 2 + Math.sin(time * 0.6) * (h * 0.18);
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(fishX, fishY, 5, 2.5, time * 0.6 + Math.PI / 2, 0, Math.PI * 2);
    ctx.fill();

    // Gợn sóng nước lăn tăn
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w / 2 - 20 + Math.sin(time) * 5, h / 3.2 + Math.cos(time) * 3, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Cầu tre bắc ra mép ao 2.5D
    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(10, h / 2 - 6, 44, 14, 2);
    ctx.fill();
    ctx.stroke();

    for (let bx = 16; bx <= 48; bx += 8) {
      ctx.beginPath();
      ctx.moveTo(bx, h / 2 - 6); ctx.lineTo(bx, h / 2 + 8);
      ctx.stroke();
    }

    // Hoa sen & lá sen 2.5D
    LotusRenderer.render(ctx, w * 0.35, h * 0.38);
    LotusRenderer.render(ctx, w * 0.78, h * 0.45);
    LotusRenderer.render(ctx, w * 0.55, h * 0.62);

    ctx.restore();
  }

  // 5. CHUỒNG TRÂU GỖ 2.5D (Tilted 2.5D Barn)
  public static renderBarn(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.save();
    ctx.translate(x, y);

    // Nền đất chuồng rải rơm vàng 2.5D
    ctx.fillStyle = '#5c330a';
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 8);
    ctx.fill();

    // Rơm vàng rải rác
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.8;
    for (let rx = 12; rx < w - 12; rx += 18) {
      ctx.beginPath();
      ctx.moveTo(rx, 10); ctx.lineTo(rx + 8, 14);
      ctx.moveTo(rx + 4, h - 16); ctx.lineTo(rx + 12, h - 10);
      ctx.stroke();
    }

    // Máng cỏ gỗ cho trâu ăn phía trước
    ctx.fillStyle = '#78350f';
    ctx.fillRect(16, 12, 52, 18);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(18, 14, 48, 14);

    // Hàng rào cọc gỗ đứng 2.5D bao quanh
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, 8);
    ctx.stroke();

    // Các cọc gỗ cắm thẳng đứng
    ctx.fillStyle = '#78350f';
    for (let px = 0; px <= w; px += 28) {
      ctx.beginPath();
      ctx.roundRect(px - 3, -6, 6, 12, 1.5);
      ctx.roundRect(px - 3, h - 6, 6, 12, 1.5);
      ctx.fill();
    }

    ctx.restore();
  }
}
