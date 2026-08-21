/**
 * LotusRenderer.ts
 * Vẽ HOA SEN & LÁ SEN AO LÀNG cực kỳ chi tiết:
 * - Lá sen tròn nổi trên mặt nước có cuống và gân lá tỏa tròn
 * - Hoa sen hồng nở nhiều lớp cánh hoa thanh khiết
 * - Nhụy sen vàng rực rỡ và gương sen
 */

export class LotusRenderer {
  public static render(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    ctx.save();
    ctx.translate(x, y);

    // 1. Lá sen tròn xanh ngọc nổi trên mặt nước
    const leafGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 15);
    leafGrad.addColorStop(0, '#22c55e');
    leafGrad.addColorStop(0.7, '#15803d');
    leafGrad.addColorStop(1, '#14532d');
    ctx.fillStyle = leafGrad;

    ctx.beginPath();
    ctx.ellipse(0, 0, 15, 11.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Các đường gân lá sen tỏa tròn từ tâm
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 0.8;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 14, Math.sin(a) * 10.5);
      ctx.stroke();
    }

    // 2. Hoa sen nở hồng nhiều lớp cánh
    // Lớp cánh ngoài
    ctx.fillStyle = '#f472b6';
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3;
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * 5, Math.sin(ang) * 5, 4.0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Lớp cánh trong hồng phấn
    ctx.fillStyle = '#fbcfe8';
    for (let i = 0; i < 6; i++) {
      const ang = (i * Math.PI) / 3 + Math.PI / 6;
      ctx.beginPath();
      ctx.arc(Math.cos(ang) * 3, Math.sin(ang) * 3, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Nhụy sen vàng rực rỡ & gương sen
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.arc(0, 0, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
