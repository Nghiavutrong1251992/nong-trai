/**
 * DuckRenderer.ts
 * Vẽ lại CHÚ VỊT TRẮNG AO LÀNG (Side-View 2D) từ đầu
 */

export class DuckRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    animTimer: number,
    inWater = false
  ): void {
    ctx.save();
    ctx.translate(x, y);
    if (facing < 0) ctx.scale(-1, 1);

    const waddle = Math.sin(animTimer * 10) * 2.0;

    // 1. Bóng đổ hoặc sóng nước
    if (inWater) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 17, 5.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 13, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2 Chân vịt cam lon ton
      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      ctx.moveTo(-3, -6); ctx.lineTo(-3 + waddle, 0);
      ctx.moveTo(3, -6); ctx.lineTo(3 - waddle, 0);
      ctx.stroke();
    }

    ctx.translate(0, -6 + (inWater ? Math.sin(animTimer * 4) * 1.5 : 0));

    // 2. Thân vịt trắng muốt
    const duckGrad = ctx.createLinearGradient(-12, -10, 12, 6);
    duckGrad.addColorStop(0, '#ffffff');
    duckGrad.addColorStop(1, '#e2e8f0');
    ctx.fillStyle = duckGrad;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.ellipse(0, -4, 12.5, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Đuôi vịt vểnh lên
    ctx.beginPath();
    ctx.moveTo(-10, -6); ctx.lineTo(-18, -12); ctx.lineTo(-10, -1);
    ctx.fill();

    // Cánh vịt khép
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.ellipse(-2, -5, 8, 4.8, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Đầu vịt
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(9, -12, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mỏ vịt cam dẹt
    ctx.fillStyle = '#fb923c';
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.roundRect(13, -11.5, 8.5, 4.2, 2);
    ctx.fill();
    ctx.stroke();

    // Mắt vịt to đen láy
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(8.5, -13.5, 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(8, -14.2, 0.75, 0, Math.PI * 2);
    ctx.fill();

    // Má hồng
    ctx.fillStyle = 'rgba(244, 63, 94, 0.5)';
    ctx.beginPath();
    ctx.arc(8, -10.5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
