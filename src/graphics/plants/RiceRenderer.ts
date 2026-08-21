/**
 * RiceRenderer.ts
 * Vẽ CÂY LÚA NƯỚC VIỆT NAM (Kích thước cân đối vừa vặn với luống đất)
 */

export class RiceRenderer {
  public static render(ctx: CanvasRenderingContext2D, growth: number, sway: number): void {
    ctx.save();

    const isRipe = growth >= 0.85;
    const stemH = 8 + growth * 18; // Kích thước vừa vặn trong ô đất

    // 1. Gốc lúa & rễ bám bùn
    ctx.fillStyle = isRipe ? '#78350f' : '#14532d';
    ctx.beginPath();
    ctx.ellipse(0, 4, 3.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Các dảnh lúa xòe quạt
    const stalks = [-4.5, 0, 4.5];
    for (let sIdx = 0; sIdx < stalks.length; sIdx++) {
      const stX = stalks[sIdx];
      const stalkSway = sway * (0.8 + sIdx * 0.15);

      // Thân dảnh lúa
      const stemGrad = ctx.createLinearGradient(0, 4, stX + stalkSway, 4 - stemH);
      stemGrad.addColorStop(0, isRipe ? '#b45309' : '#15803d');
      stemGrad.addColorStop(0.5, isRipe ? '#d97706' : '#22c55e');
      stemGrad.addColorStop(1, isRipe ? '#eab308' : '#4ade80');
      ctx.strokeStyle = stemGrad;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(stX * 0.4, 4);
      ctx.quadraticCurveTo(stX + stalkSway * 0.4, 4 - stemH * 0.5, stX + stalkSway, 4 - stemH);
      ctx.stroke();

      // Lá lúa
      const renderRiceLeaf = (lx: number, ly: number, angle: number, len: number) => {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(angle);

        ctx.fillStyle = isRipe ? '#eab308' : '#22c55e';
        ctx.beginPath();
        ctx.ellipse(len / 2, 0, len / 2, 1.6 * growth, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isRipe ? '#fef08a' : '#86efac';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.lineTo(len, 0);
        ctx.stroke();

        ctx.restore();
      };

      renderRiceLeaf(stX * 0.5, 1, -0.4 + sIdx * 0.1, 6.5 * growth);
      renderRiceLeaf(stX * 0.5, -3, 0.4 + sIdx * 0.1, 6.5 * growth);

      // 3. BÔNG LÚA TRĨU HẠT
      if (growth > 0.5) {
        const tipX = stX + stalkSway;
        const tipY = 4 - stemH;

        ctx.strokeStyle = isRipe ? '#ca8a04' : '#15803d';
        ctx.lineWidth = 1.0;
        ctx.beginPath();
        ctx.moveTo(tipX, tipY);
        ctx.quadraticCurveTo(tipX + 6, tipY + 4, tipX + 4, tipY + 11);
        ctx.stroke();

        const grainColor = isRipe ? '#facc15' : '#a3e635';
        ctx.fillStyle = grainColor;
        ctx.strokeStyle = isRipe ? '#a16207' : '#166534';
        ctx.lineWidth = 0.6;

        for (let i = 0; i < 5; i++) {
          const gy = tipY + 2 + i * 1.8;
          const gx = tipX + (i % 2 === 0 ? 2.5 : 5.5);
          ctx.beginPath();
          ctx.ellipse(gx, gy, 2.2, 1.2, (i % 2 === 0 ? -0.4 : 0.4), 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          if (isRipe && i % 2 === 0) {
            ctx.strokeStyle = '#a16207';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(gx + 1.5, gy);
            ctx.lineTo(gx + 3.5, gy - 1.2);
            ctx.stroke();
          }
        }
      }
    }

    ctx.restore();
  }
}
