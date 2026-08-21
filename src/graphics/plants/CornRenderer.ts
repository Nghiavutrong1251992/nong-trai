/**
 * CornRenderer.ts
 * Vẽ CÂY BẮP NGÔ (Kích thước cân đối vừa vặn)
 */

export class CornRenderer {
  public static render(ctx: CanvasRenderingContext2D, growth: number, sway: number): void {
    ctx.save();

    const stalkH = 10 + growth * 20;

    // 1. Thân cây ngô
    const stalkGrad = ctx.createLinearGradient(0, 6, sway * 0.5, 6 - stalkH);
    stalkGrad.addColorStop(0, '#14532d');
    stalkGrad.addColorStop(0.5, '#15803d');
    stalkGrad.addColorStop(1, '#22c55e');
    ctx.strokeStyle = stalkGrad;
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.quadraticCurveTo(sway * 0.25, 6 - stalkH * 0.5, sway * 0.5, 6 - stalkH);
    ctx.stroke();

    // Các đốt thân ngô
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.1;
    for (let dy = 2; dy > -stalkH + 6; dy -= 6) {
      ctx.beginPath();
      ctx.moveTo(-2 + sway * 0.15, dy);
      ctx.lineTo(2 + sway * 0.15, dy);
      ctx.stroke();
    }

    // 2. Tàu lá ngô
    const renderCornLeaf = (lx: number, ly: number, angle: number, w: number) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(angle);

      const leafGrad = ctx.createLinearGradient(0, -2, w, 2);
      leafGrad.addColorStop(0, '#15803d');
      leafGrad.addColorStop(0.5, '#22c55e');
      leafGrad.addColorStop(1, '#4ade80');
      ctx.fillStyle = leafGrad;

      ctx.beginPath();
      ctx.ellipse(w / 2, 0, w / 2, 3.0 * growth, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#bbf7d0';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(w, 0);
      ctx.stroke();

      ctx.restore();
    };

    renderCornLeaf(-2 + sway * 0.2, 0, -0.4, 11 * growth);
    renderCornLeaf(2 + sway * 0.2, -4, 0.4, 12 * growth);
    renderCornLeaf(-1 + sway * 0.3, -10, -0.6, 10 * growth);

    // 3. Bắp ngô vàng óng
    if (growth > 0.55) {
      const cobX = 4 + sway * 0.3;
      const cobY = -4;

      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.ellipse(cobX - 1, cobY + 2, 3.5, 7, 0.35, 0, Math.PI * 2);
      ctx.fill();

      const cobGrad = ctx.createLinearGradient(cobX, cobY - 5, cobX + 5, cobY + 5);
      cobGrad.addColorStop(0, '#fef08a');
      cobGrad.addColorStop(0.5, '#facc15');
      cobGrad.addColorStop(1, '#eab308');
      ctx.fillStyle = cobGrad;

      ctx.beginPath();
      ctx.roundRect(cobX, cobY - 6, 6, 10.5, [2.5, 2.5, 1.5, 1.5]);
      ctx.fill();

      // Hạt ngô
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 0.7;
      for (let kx = cobX + 1.8; kx <= cobX + 5; kx += 1.8) {
        ctx.beginPath();
        ctx.moveTo(kx, cobY - 5); ctx.lineTo(kx, cobY + 3);
        ctx.stroke();
      }

      // Râu ngô
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(cobX + 2.5, cobY - 6); ctx.lineTo(cobX + 4, cobY - 11);
      ctx.moveTo(cobX + 3.5, cobY - 6); ctx.lineTo(cobX + 2, cobY - 10);
      ctx.stroke();
    }

    ctx.restore();
  }
}
