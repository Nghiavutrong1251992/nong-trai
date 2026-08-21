/**
 * WatermelonRenderer.ts
 * Vẽ DÂY DƯA HẤU (Kích thước cân đối vừa vặn)
 */

export class WatermelonRenderer {
  public static render(ctx: CanvasRenderingContext2D, growth: number, _sway: number): void {
    ctx.save();

    // 1. Dây leo
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-12, 6);
    ctx.quadraticCurveTo(-4, -1, 0, 3);
    ctx.quadraticCurveTo(6, 7, 12, 0);
    ctx.stroke();

    // 2. Tua cuốn
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(-8, -2, 2.2, 0, Math.PI * 1.6);
    ctx.arc(9, 7, 2.0, 0, Math.PI * 1.5);
    ctx.stroke();

    // 3. Lá dưa
    const renderMelonLeaf = (lx: number, ly: number, size: number) => {
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(lx - 2.5, ly, size, 0, Math.PI * 2);
      ctx.arc(lx + 2.5, ly, size, 0, Math.PI * 2);
      ctx.arc(lx, ly - 3, size, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(lx, ly + 1.5); ctx.lineTo(lx, ly - 3);
      ctx.stroke();
    };

    renderMelonLeaf(-9, 3, 3.0 * growth);
    renderMelonLeaf(8, -1, 3.2 * growth);

    // 4. Hoa dưa vàng
    if (growth > 0.3 && growth < 0.7) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(-3, 0, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. QUẢ DƯA HẤU
    if (growth > 0.4) {
      const melonR = 4.5 + growth * 6.8; // Bán kính quả vừa vặn (~11px, đường kính ~22px)
      const mx = 2;
      const my = 2;

      const melonGrad = ctx.createRadialGradient(mx - melonR * 0.3, my - melonR * 0.3, 1, mx, my, melonR);
      melonGrad.addColorStop(0, '#86efac');
      melonGrad.addColorStop(0.35, '#22c55e');
      melonGrad.addColorStop(0.75, '#15803d');
      melonGrad.addColorStop(1, '#14532d');
      ctx.fillStyle = melonGrad;

      ctx.beginPath();
      ctx.arc(mx, my, melonR, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#052e16';
      ctx.lineWidth = 1.3;
      for (let a = -0.5; a <= 0.5; a += 0.35) {
        ctx.beginPath();
        ctx.arc(mx, my, melonR * 0.88, a - 0.5, a + 0.5);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.beginPath();
      ctx.ellipse(mx - melonR * 0.35, my - melonR * 0.35, melonR * 0.25, melonR * 0.15, -0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(mx, my - melonR);
      ctx.quadraticCurveTo(mx + 3, my - melonR - 2.5, mx + 1.5, my - melonR - 4.5);
      ctx.stroke();
    }

    ctx.restore();
  }
}
