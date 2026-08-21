/**
 * SceneryRenderer.ts
 * Vẽ bối cảnh Làng Quê Việt Nam góc nhìn ngang 2D Side-View (Ninja School HD Style):
 * - Nhà ngói ba gian truyền thống
 * - Cây đa cổ thụ rủ rễ
 * - Bụi tre ngà làng quê
 * - Cầu tre bắc qua suối
 * - Đồi ruộng bậc thang và mây trời
 */

export class SceneryRenderer {
  // 1. NHÀ NGÓI 3 GIAN (Side-View House)
  public static renderHouse(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    const houseW = 180;
    const houseH = 90;

    // Bóng đổ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.roundRect(-4, 0, houseW + 8, 12, 6);
    ctx.fill();

    // Thân nhà tường gạch trát vôi vàng
    ctx.fillStyle = '#fde68a';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.roundRect(0, -houseH, houseW, houseH, [2, 2, 0, 0]);
    ctx.fill();
    ctx.stroke();

    // 4 Cột gỗ lim đỡ hiên
    ctx.fillStyle = '#78350f';
    for (const cx of [16, 62, 118, 164]) {
      ctx.beginPath();
      ctx.roundRect(cx - 4, -houseH, 8, houseH, 2);
      ctx.fill();
      ctx.stroke();
    }

    // Cửa chính gỗ 2 cánh
    ctx.fillStyle = '#451a03';
    ctx.fillRect(72, -62, 36, 62);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(75, -58, 14, 54);
    ctx.strokeRect(91, -58, 14, 54);

    // 2 Cửa sổ chấn song gỗ
    ctx.fillStyle = '#451a03';
    ctx.fillRect(28, -54, 24, 28);
    ctx.fillRect(128, -54, 24, 28);

    // Mái ngói đỏ nung 3 gian uốn cong đầu đao
    const roofGrad = ctx.createLinearGradient(0, -houseH - 34, 0, -houseH);
    roofGrad.addColorStop(0, '#ea580c');
    roofGrad.addColorStop(0.4, '#c2410c');
    roofGrad.addColorStop(0.8, '#9a3412');
    roofGrad.addColorStop(1, '#7c2d12');
    ctx.fillStyle = roofGrad;

    ctx.beginPath();
    ctx.moveTo(-16, -houseH + 6);
    ctx.quadraticCurveTo(houseW / 2, -houseH - 38, houseW + 16, -houseH + 6);
    ctx.lineTo(houseW + 8, -houseH);
    ctx.lineTo(-8, -houseH);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rãnh ngói mũi hài
    ctx.strokeStyle = '#431407';
    ctx.lineWidth = 1.4;
    for (let rx = 4; rx < houseW; rx += 14) {
      ctx.beginPath();
      ctx.moveTo(rx, -houseH - 22);
      ctx.lineTo(rx - 2, -houseH + 4);
      ctx.stroke();
    }

    // 2 Đèn lồng đỏ
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(26, -houseH + 16, 6, 0, Math.PI * 2);
    ctx.arc(154, -houseH + 16, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 2. CÂY ĐA CỔ THỤ (Ancient Banyan Tree)
  public static renderBanyanTree(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    // Thân cây đa to lớn
    const trunkGrad = ctx.createLinearGradient(-24, 0, 24, 0);
    trunkGrad.addColorStop(0, '#78350f');
    trunkGrad.addColorStop(0.5, '#92400e');
    trunkGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = trunkGrad;

    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.quadraticCurveTo(-18, -60, -38, -120);
    ctx.lineTo(38, -120);
    ctx.quadraticCurveTo(18, -60, 28, 0);
    ctx.closePath();
    ctx.fill();

    // Rễ phụ rủ xuống
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    for (let rx of [-22, -10, 8, 20]) {
      ctx.beginPath();
      ctx.moveTo(rx * 1.5, -90);
      ctx.quadraticCurveTo(rx * 0.8, -40, rx, 0);
      ctx.stroke();
    }

    // Tán lá đa xanh biếc nhiều tầng
    const leaves = [
      { x: 0, y: -140, r: 52, col: '#15803d' },
      { x: -45, y: -125, r: 42, col: '#16a34a' },
      { x: 45, y: -125, r: 42, col: '#16a34a' },
      { x: -20, y: -160, r: 44, col: '#22c55e' },
      { x: 25, y: -155, r: 44, col: '#22c55e' }
    ];

    for (const leaf of leaves) {
      ctx.fillStyle = leaf.col;
      ctx.beginPath();
      ctx.arc(leaf.x, leaf.y, leaf.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  // 3. LŨY TRE LÀNG (Bamboo Grove)
  public static renderBambooGrove(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    const time = Date.now() / 400;

    for (let i = 0; i < 4; i++) {
      const bx = i * 14;
      const sway = Math.sin(time + i * 0.7) * 4;

      // Thân tre
      ctx.strokeStyle = '#65a30d';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.quadraticCurveTo(bx + sway * 0.5, -50, bx + sway, -110);
      ctx.stroke();

      // Đốt tre
      ctx.strokeStyle = '#365314';
      ctx.lineWidth = 1.6;
      for (let dy = -15; dy > -100; dy -= 18) {
        ctx.beginPath();
        ctx.moveTo(bx - 3 + sway * (Math.abs(dy) / 110), dy);
        ctx.lineTo(bx + 3 + sway * (Math.abs(dy) / 110), dy);
        ctx.stroke();
      }

      // Nhánh lá tre
      ctx.fillStyle = '#4ade80';
      const tipX = bx + sway;
      for (let la = -0.6; la <= 0.6; la += 0.4) {
        ctx.save();
        ctx.translate(tipX, -100);
        ctx.rotate(la);
        ctx.beginPath();
        ctx.ellipse(12, 0, 12, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // 4. CẦU TRE QUA SUỐI (Bamboo Bridge)
  public static renderBridge(ctx: CanvasRenderingContext2D, x: number, y: number, w = 120): void {
    ctx.save();
    ctx.translate(x, y);

    // Cọc cầu cắm lòng suối
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(20, 0); ctx.lineTo(25, 28);
    ctx.moveTo(w - 20, 0); ctx.lineTo(w - 25, 28);
    ctx.stroke();

    // Sàn cầu tre uốn cong
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(w / 2, -8, w, 0);
    ctx.stroke();

    // Tay vịn cầu tre
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.quadraticCurveTo(w / 2, -26, w, -18);
    ctx.stroke();

    // Cọc chống tay vịn
    ctx.lineWidth = 2;
    for (let px = 15; px < w; px += 25) {
      ctx.beginPath();
      ctx.moveTo(px, 0); ctx.lineTo(px, -20);
      ctx.stroke();
    }

    ctx.restore();
  }
}
