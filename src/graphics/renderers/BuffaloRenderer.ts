/**
 * BuffaloRenderer.ts
 * TRÂU NƯỚC CHUYỂN ĐỘNG 4 CHÂN BƯỚC ĐI RÕ RỆT (True 4-Leg Walking Animation)
 * - 4 Chân guốc guồng bước so le chân thực (Chân trước trái & Chân sau phải bước tới, 2 chân kia đẩy lùi)
 * - Khớp gối co duỗi và móng guốc chẻ chạm đất
 * - Đầu chúc xuống nhai cỏ và ngẩng lên
 * - Đuôi dài ngoe nguẩy túm lông đen nhánh
 */

export class BuffaloRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    animTimer: number,
    scale: number = 0.65
  ): void {
    ctx.save();
    ctx.translate(x, y);
    if (facing < 0) ctx.scale(-1, 1);
    ctx.scale(scale, scale);

    // Bước chân guồng mạnh mẽ (Leg stride angle)
    const stride = Math.sin(animTimer * 6) * 18; // Góc vung chân 18 độ rõ rệt
    const bodyBob = Math.abs(Math.sin(animTimer * 6)) * 3.5;
    const headChew = Math.sin(animTimer * 4) * 0.08;
    const tailWag = Math.sin(animTimer * 5) * 12;

    // 1. Bóng đổ dưới chân
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 56, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, -bodyBob);

    // ============================================================
    // 2. BỐN CHÂN GUỐC BƯỚC ĐI SO LE (4 Animated Stepping Legs)
    // ============================================================
    const drawSteppingLeg = (lx: number, legSwing: number, isBack: boolean) => {
      ctx.save();
      ctx.translate(lx, -34);
      ctx.rotate((legSwing * Math.PI) / 180);

      // Đùi & Bắp chân trâu
      ctx.fillStyle = isBack ? '#1c1917' : '#292524';
      ctx.strokeStyle = '#0c0a09';
      ctx.lineWidth = 2.6;

      ctx.beginPath();
      ctx.moveTo(-8, 0);
      ctx.lineTo(-6, 20);
      ctx.lineTo(-7, 34);
      ctx.lineTo(7, 34);
      ctx.lineTo(6, 20);
      ctx.lineTo(8, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Khớp gối
      ctx.fillStyle = isBack ? '#292524' : '#44403c';
      ctx.beginPath();
      ctx.arc(0, 16, 4.4, 0, Math.PI * 2);
      ctx.fill();

      // Móng guốc chẻ màu đen bóng
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.roundRect(-8, 30, 16, 8.5, 3);
      ctx.fill();
      ctx.stroke();

      // Khe móng chẻ
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, 30); ctx.lineTo(0, 38.5);
      ctx.stroke();

      ctx.restore();
    };

    // Tầng sau: Chân sau trái (+stride) & Chân trước trái (-stride)
    drawSteppingLeg(-34, stride, true);
    drawSteppingLeg(16, -stride, true);

    // ============================================================
    // 3. THÂN TRÂU NƯỚC CÓ U VAI CAO (Body & Shoulder Hump)
    // ============================================================
    const bodyGrad = ctx.createLinearGradient(-50, -74, 50, -20);
    bodyGrad.addColorStop(0, '#52525b');
    bodyGrad.addColorStop(0.35, '#3f3f46');
    bodyGrad.addColorStop(0.75, '#27272a');
    bodyGrad.addColorStop(1, '#18181b');
    ctx.fillStyle = bodyGrad;
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 3.2;

    ctx.beginPath();
    ctx.moveTo(-46, -42);
    ctx.quadraticCurveTo(-34, -66, -12, -66);
    ctx.quadraticCurveTo(8, -80, 26, -62); // U vai nhô cao
    ctx.quadraticCurveTo(46, -46, 46, -26);
    ctx.lineTo(-38, -26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Vệt cơ bắp trên vai
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(18, -62);
    ctx.quadraticCurveTo(34, -50, 34, -30);
    ctx.stroke();

    // Tầng trước: Chân sau phải (-stride) & Chân trước phải (+stride)
    drawSteppingLeg(-20, -stride, false);
    drawSteppingLeg(32, stride, false);

    // ============================================================
    // 4. ĐẦU & CẶP SỪNG KHỔNG LỒ (Animated Head with Chewing)
    // ============================================================
    ctx.save();
    ctx.translate(44, -50);
    ctx.rotate(headChew); // Đầu cử động nhai cỏ

    const headGrad = ctx.createRadialGradient(4, -4, 4, 4, -4, 24);
    headGrad.addColorStop(0, '#52525b');
    headGrad.addColorStop(0.7, '#3f3f46');
    headGrad.addColorStop(1, '#18181b');
    ctx.fillStyle = headGrad;
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 3.0;

    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 16.5, 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Mõm trâu to bè
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.ellipse(15, 5, 12, 9.5, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 2 Lỗ mũi
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.ellipse(15, 5, 2.5, 3.5, 0.2, 0, Math.PI * 2);
    ctx.ellipse(22, 5, 2.5, 3.5, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Khuyên mũi bạc
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(19, 12, 5.5, 0.2, Math.PI * 0.9);
    ctx.stroke();

    // Mắt trâu đen láy
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.ellipse(2, -7, 5.0, 6.2, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Đốm sáng mắt
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0.5, -9, 2.0, 0, Math.PI * 2);
    ctx.arc(3.5, -5, 1.0, 0, Math.PI * 2);
    ctx.fill();

    // Tai vểnh chúc xuống
    ctx.fillStyle = '#27272a';
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.ellipse(-12, 2, 10, 5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cặp sừng mun đen khổng lồ
    ctx.strokeStyle = '#09090b';
    ctx.lineWidth = 11.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-2, -12);
    ctx.quadraticCurveTo(-20, -50, -54, -38);
    ctx.stroke();

    ctx.strokeStyle = '#52525b';
    ctx.lineWidth = 4.2;
    ctx.beginPath();
    ctx.moveTo(-4, -14);
    ctx.quadraticCurveTo(-21, -47, -50, -36);
    ctx.stroke();

    ctx.restore(); // Restore head

    // ============================================================
    // 5. ĐUÔI DÀI NGOE NGUẨY (Animated Wagging Tail)
    // ============================================================
    ctx.strokeStyle = '#18181b';
    ctx.lineWidth = 4.6;
    ctx.beginPath();
    ctx.moveTo(-46, -42);
    ctx.quadraticCurveTo(-62, -26 + tailWag, -54, -6 + tailWag * 1.3);
    ctx.stroke();

    // Túm lông đuôi
    ctx.fillStyle = '#09090b';
    ctx.beginPath();
    ctx.ellipse(-54, -6 + tailWag * 1.3, 6.8, 12.5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // Restore root
  }
}
