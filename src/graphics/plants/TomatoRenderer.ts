/**
 * TomatoRenderer.ts
 * Vẽ CÂY CÀ CHUA (Kích thước cân đối vừa vặn)
 */

export class TomatoRenderer {
  public static render(ctx: CanvasRenderingContext2D, growth: number, sway: number): void {
    ctx.save();

    // 1. Thân cây cà chua
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(sway * 0.15, -1);
    ctx.lineTo(-6 + sway * 0.3, -10);
    ctx.moveTo(sway * 0.15, -1);
    ctx.lineTo(6 + sway * 0.3, -9);
    ctx.stroke();

    // 2. Lá cà chua
    const renderTomatoLeaf = (lx: number, ly: number, angle: number) => {
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(angle);

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(0, 0, 5.0 * growth, 2.5 * growth, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#86efac';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(-4.5 * growth, 0); ctx.lineTo(4.5 * growth, 0);
      ctx.stroke();

      ctx.restore();
    };

    renderTomatoLeaf(-7 + sway * 0.25, -6, -0.5);
    renderTomatoLeaf(7 + sway * 0.25, -5, 0.5);
    renderTomatoLeaf(0 + sway * 0.25, -12, 0.1);

    // 3. Hoa cà chua
    if (growth > 0.35 && growth < 0.75) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(-3 + sway * 0.2, -9, 1.8, 0, Math.PI * 2);
      ctx.arc(3 + sway * 0.2, -8, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Quả cà chua đỏ mọng
    if (growth > 0.45) {
      const renderShinyTomato = (tx: number, ty: number, r: number) => {
        const tomGrad = ctx.createRadialGradient(tx - r * 0.35, ty - r * 0.35, 0.5, tx, ty, r);
        tomGrad.addColorStop(0, '#fca5a5');
        tomGrad.addColorStop(0.35, '#ef4444');
        tomGrad.addColorStop(0.8, '#dc2626');
        tomGrad.addColorStop(1, '#991b1b');
        ctx.fillStyle = tomGrad;

        ctx.beginPath();
        ctx.arc(tx, ty, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.ellipse(tx - r * 0.35, ty - r * 0.35, r * 0.3, r * 0.18, -0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#16a34a';
        for (let a = 0; a < Math.PI * 2; a += (Math.PI * 2) / 5) {
          ctx.beginPath();
          ctx.moveTo(tx, ty - r + 0.5);
          ctx.lineTo(tx + Math.cos(a) * 2.2, ty - r + 0.5 + Math.sin(a) * 2.2);
          ctx.stroke();
        }
      };

      renderShinyTomato(-4.5 + sway * 0.25, -2, 3.8 * growth);
      renderShinyTomato(4.5 + sway * 0.25, 0, 4.2 * growth);
      if (growth >= 0.85) {
        renderShinyTomato(0 + sway * 0.25, -6, 3.5 * growth);
      }
    }

    ctx.restore();
  }
}
