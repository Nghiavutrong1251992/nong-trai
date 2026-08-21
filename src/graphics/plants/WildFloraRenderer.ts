/**
 * WildFloraRenderer.ts
 * Vẽ CỎ TỰ NHIÊN & HOA DẠI ĐỒNG QUÊ (Kích thước nhỏ nhắn vừa vặn với thảm cỏ)
 */

export class WildFloraRenderer {
  public static renderGrass(ctx: CanvasRenderingContext2D, sway: number): void {
    ctx.save();

    // 4 ngọn cỏ non đan xen nhỏ nhắn xinh xắn
    const blades = [
      { x0: -3, cpx: -5 + sway * 0.5, cpy: -6, x1: -7 + sway * 0.7, y1: -11, col: '#22c55e' },
      { x0: -1, cpx: 0 + sway * 0.4, cpy: -7, x1: 1 + sway * 0.6, y1: -13, col: '#4ade80' },
      { x0: 1, cpx: 3 + sway * 0.5, cpy: -6, x1: 4 + sway * 0.7, y1: -11, col: '#16a34a' },
      { x0: 3, cpx: 6 + sway * 0.6, cpy: -5, x1: 8 + sway * 0.8, y1: -9, col: '#86efac' }
    ];

    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    for (const b of blades) {
      ctx.strokeStyle = b.col;
      ctx.beginPath();
      ctx.moveTo(b.x0, 0);
      ctx.quadraticCurveTo(b.cpx, b.cpy, b.x1, b.y1);
      ctx.stroke();
    }

    ctx.restore();
  }

  public static renderWildflower(ctx: CanvasRenderingContext2D, sway: number): void {
    ctx.save();
    ctx.rotate(sway * 0.08);

    // Cuống hoa nhỏ
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(0, -6);
    ctx.stroke();

    // Cánh hoa vàng
    ctx.fillStyle = '#fef08a';
    for (let i = 0; i < 5; i++) {
      const ang = (i * Math.PI * 2) / 5;
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * 3.0, -6 + Math.sin(ang) * 3.0, 2.0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nhụy hoa cam
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, -6, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
