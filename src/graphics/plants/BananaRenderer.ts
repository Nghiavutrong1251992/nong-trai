/**
 * BananaRenderer.ts
 * Vẽ CÂY CHUỐI VƯỜN NHÀ cực kỳ chi tiết:
 * - Thân chuối mập mạp có bẹ chuối xanh non
 * - 5 Tàu lá chuối to bản xanh mướt uốn lượn theo gió có gân sống lá
 * - Buồng chuối vàng mọc từ nách lá
 * - Bắp chuối đỏ tím ở ngọn buồng
 */

export class BananaRenderer {
  public static render(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    const time = Date.now() / 450;

    // 1. Gốc cây chuối
    ctx.fillStyle = '#4d7c0f';
    ctx.beginPath();
    ctx.ellipse(0, 8, 7, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. 5 Tàu lá chuối to bản xanh mướt uốn lượn theo gió
    const leaves = [
      { angle: -0.85, len: 34, w: 11 },
      { angle: -0.32, len: 40, w: 12 },
      { angle: 0.28, len: 42, w: 12 },
      { angle: 0.82, len: 36, w: 11 },
      { angle: 1.35, len: 30, w: 10 }
    ];

    for (let i = 0; i < leaves.length; i++) {
      const l = leaves[i];
      const sway = Math.sin(time + i * 0.8) * 0.08;

      ctx.save();
      ctx.rotate(l.angle + sway);

      // Tàu lá có dải màu bóng
      const leafGrad = ctx.createLinearGradient(0, 0, l.len, 0);
      leafGrad.addColorStop(0, '#65a30d');
      leafGrad.addColorStop(0.5, '#4ade80');
      leafGrad.addColorStop(1, '#16a34a');
      ctx.fillStyle = leafGrad;

      ctx.beginPath();
      ctx.ellipse(l.len / 2, 0, l.len / 2, l.w / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Sống gân lá chuối xanh non
      ctx.strokeStyle = '#bef264';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(l.len, 0);
      ctx.stroke();

      ctx.restore();
    }

    // 3. Buồng chuối vàng mọc từ nách lá
    ctx.fillStyle = '#facc15';
    for (let b = 0; b < 6; b++) {
      ctx.beginPath();
      ctx.ellipse(2 + (b % 3) * 3, 2 + Math.floor(b / 3) * 4, 3, 1.8, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Bắp chuối đỏ tím ở ngọn buồng
    ctx.fillStyle = '#831843';
    ctx.beginPath();
    ctx.ellipse(5, 12, 3.5, 6, 0.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
