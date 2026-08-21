/**
 * ChickenRenderer.ts
 * Vẽ lại CHÚ GÀ VÀNG SÂN NHÀ (Side-View 2D) từ đầu
 */

export class ChickenRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    animTimer: number
  ): void {
    ctx.save();
    ctx.translate(x, y);
    if (facing < 0) ctx.scale(-1, 1);

    const step = Math.sin(animTimer * 12) * 3;

    // 1. Bóng đổ
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 10, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Chân gà
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-2, -6); ctx.lineTo(-2 + step, 0);
    ctx.moveTo(3, -6); ctx.lineTo(3 - step, 0);
    ctx.stroke();

    ctx.translate(0, -6);

    // 3. Thân gà vàng ươm
    ctx.fillStyle = '#fde047';
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(0, -4, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Đuôi gà vểnh
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(-7, -6); ctx.lineTo(-14, -13); ctx.lineTo(-7, -1);
    ctx.fill();

    // Cánh gà
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(-2, -4, 6.5, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Đầu gà
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(7, -10, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mào đỏ
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(7, -16.5, 2.8, 0, Math.PI * 2);
    ctx.arc(9.5, -15.5, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Mỏ cam
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(11, -10); ctx.lineTo(15.5, -9); ctx.lineTo(11, -7);
    ctx.fill();

    // Mắt
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(7, -11, 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(6.6, -11.5, 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
