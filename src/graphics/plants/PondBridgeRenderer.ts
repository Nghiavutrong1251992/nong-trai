/**
 * PondBridgeRenderer.ts
 * Chuyên trách vẽ CẦU AO TRE LÀNG & BẬC THANG BẾN NƯỚC MỘC MẠC:
 * - 🎋 Cọc tre cắm sâu đáy nước, mấu đốt tre và vân tre tự nhiên
 * - 🎋 Mặt ván cầu ao ghép từ các thân tre già vàng óng
 * - 🪢 Dây thừng bện chão mộc mạc quấn quanh các mối nối tre
 * - 🥥 Gáo dừa múc nước để bên mép cầu ao
 */

export class PondBridgeRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    pierX: number,
    groundY: number,
    pierW: number = 65,
    depth: number = 55
  ): void {
    ctx.save();

    // 1. CỌC TRE CHỐNG CẦU AO CẮM SÂU ĐÁY NƯỚC
    const postX1 = pierX + 12;
    const postX2 = pierX + pierW - 12;

    const renderBambooPost = (x: number) => {
      // Bóng cọc tre
      ctx.fillStyle = 'rgba(2, 44, 34, 0.5)';
      ctx.fillRect(x - 3, groundY - 2, 6, depth - 4);

      // Thân cọc tre vàng nâu
      const postGrad = ctx.createLinearGradient(x - 3, 0, x + 3, 0);
      postGrad.addColorStop(0, '#a16207');
      postGrad.addColorStop(0.4, '#eab308');
      postGrad.addColorStop(1, '#78350f');
      ctx.fillStyle = postGrad;
      ctx.fillRect(x - 2.5, groundY - 2, 5, depth - 4);

      // Các đốt tre
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.4;
      for (let y = groundY + 8; y < groundY + depth - 8; y += 14) {
        ctx.beginPath();
        ctx.moveTo(x - 3.5, y);
        ctx.lineTo(x + 3.5, y);
        ctx.stroke();
      }

      // Rêu xanh bám chân cọc tre dưới nước
      ctx.fillStyle = 'rgba(21, 128, 61, 0.7)';
      ctx.fillRect(x - 3, groundY + depth - 16, 6, 12);
    };

    renderBambooPost(postX1);
    renderBambooPost(postX2);

    // 2. MẶT VÁN CẦU AO BẰNG THÂN TRE GHÉP
    const bambooCount = 5;
    const bambooH = 7;
    const stepW = pierW / bambooCount;

    for (let i = 0; i < bambooCount; i++) {
      const bx = pierX + i * stepW;
      const bGrad = ctx.createLinearGradient(bx, groundY - 5, bx + stepW, groundY + 2);
      bGrad.addColorStop(0, '#ca8a04');
      bGrad.addColorStop(0.3, '#fde047');
      bGrad.addColorStop(0.8, '#eab308');
      bGrad.addColorStop(1, '#854d0e');
      ctx.fillStyle = bGrad;

      ctx.beginPath();
      ctx.roundRect(bx + 0.5, groundY - 4.5, stepW - 1.0, bambooH, 2.5);
      ctx.fill();

      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Đốt mắt tre trên mặt ván
      ctx.fillStyle = '#78350f';
      ctx.fillRect(bx + stepW * 0.45, groundY - 4, 1.5, bambooH);
    }

    // 3. DÂY THỪNG BỆN CHÃO BUỘC TRE (ROPE KNOTS)
    const renderRopeKnot = (x: number) => {
      ctx.save();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(x - 4, groundY - 3);
      ctx.lineTo(x + 4, groundY + 3);
      ctx.moveTo(x + 4, groundY - 3);
      ctx.lineTo(x - 4, groundY + 3);
      ctx.stroke();

      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.0;
      ctx.stroke();
      ctx.restore();
    };

    renderRopeKnot(postX1);
    renderRopeKnot(postX2);

    // 4. GÁO DỪA MÚC NƯỚC BÊN MÉP CẦU AO (COCONUT SHELL LADLE)
    const ladleX = pierX + pierW - 8;
    const ladleY = groundY - 6;

    // Cán gáo tre nhỏ
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ladleX, ladleY);
    ctx.lineTo(ladleX - 16, ladleY - 4);
    ctx.stroke();

    // Gáo dừa nâu bóng
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(ladleX, ladleY, 4.2, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.ellipse(ladleX, ladleY, 4.2, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}
