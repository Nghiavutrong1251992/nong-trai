/**
 * FishRenderer.ts
 * Chuyên trách vẽ ĐỒ HỌA TỪNG CON CÁ ĐỒNG QUÊ cực kỳ tỉ mỉ, mềm mại và sống động:
 * - 🎏 Cá Chép Vàng Óng Ánh (Golden Carp): Thân thon thả, râu mép, vây lụa thướt tha, vảy cá lấp lánh
 * - 🎏 Cá Koi Kohaku (Red & White): Thân trắng ngọc điểm đốm cam đỏ son rực rỡ
 * - 🐟 Cá Rô Đồng (Wild Perch): Thân dẹp ánh bạc xanh rêu, vây gai lưng sắc sảo
 * - 🐠 Cá Cờ / Cá Betta Đồng (Paradise Betta): Đuôi lụa ngũ sắc xòe quạt kiêu sa
 */

export interface FishRenderData {
  x: number;
  y: number;
  size: number;
  type: 'carp_gold' | 'carp_red' | 'carp_black' | 'paradise';
  color: string;
  tailColor: string;
  finColor: string;
  swimPhase: number;
  facing: number; // 1: sang phải, -1: sang trái
}

export class FishRenderer {
  /**
   * Vẽ một chú cá chi tiết tinh xảo
   */
  public static renderFish(ctx: CanvasRenderingContext2D, fish: FishRenderData, animTimer: number): void {
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.scale(fish.facing, 1);

    const s = fish.size;
    const wag = Math.sin(fish.swimPhase) * 0.35;
    const finWag = Math.sin(fish.swimPhase * 1.5) * 0.2;

    // 1. BÓNG ĐỔ CỦA CÁ DƯỚI LÒNG NƯỚC SÂU
    ctx.save();
    ctx.fillStyle = 'rgba(2, 24, 39, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 10, s * 0.9, s * 0.35, wag * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. VÂY BỤNG VÀ VÂY NGỰC (PECTORAL & PELVIC FINS)
    // Vây ngực bên dưới (nhìn xuyên qua nước)
    ctx.save();
    ctx.fillStyle = fish.finColor;
    ctx.globalAlpha = 0.75;
    ctx.beginPath();
    ctx.moveTo(s * 0.2, s * 0.2);
    ctx.quadraticCurveTo(s * 0.05 + finWag * 6, s * 0.75, -s * 0.15, s * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 3. ĐUÔI CÁ LỤA THƯỚT THA UỐN LƯỢN (CAUDAL FIN)
    ctx.save();
    const tailGrad = ctx.createLinearGradient(-s * 0.7, 0, -s * 1.8, 0);
    tailGrad.addColorStop(0, fish.tailColor);
    tailGrad.addColorStop(0.7, fish.finColor);
    tailGrad.addColorStop(1, 'rgba(255, 255, 255, 0.6)');
    ctx.fillStyle = tailGrad;

    const tailTipY1 = -s * 0.7 + wag * 14;
    const tailTipY2 = s * 0.7 + wag * 14;
    const tailMidY = wag * 10;

    // Dải đuôi trên
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, -s * 0.15);
    ctx.quadraticCurveTo(-s * 1.2, -s * 0.5 + wag * 8, -s * 1.7, tailTipY1);
    ctx.quadraticCurveTo(-s * 1.3, tailMidY, -s * 0.8, 0);
    ctx.closePath();
    ctx.fill();

    // Dải đuôi dưới
    ctx.beginPath();
    ctx.moveTo(-s * 0.8, 0);
    ctx.quadraticCurveTo(-s * 1.3, tailMidY, -s * 1.7, tailTipY2);
    ctx.quadraticCurveTo(-s * 1.2, s * 0.5 + wag * 8, -s * 0.7, s * 0.15);
    ctx.closePath();
    ctx.fill();

    // Tia vây đuôi trong suốt
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(-s * 0.7, 0);
    ctx.lineTo(-s * 1.6, tailTipY1 + 2);
    ctx.moveTo(-s * 0.7, 0);
    ctx.lineTo(-s * 1.6, tailTipY2 - 2);
    ctx.stroke();
    ctx.restore();

    // 4. THÂN CÁ CHÍNH VỚI GRADIENT ÁNH KIM (BODY)
    const bodyGrad = ctx.createLinearGradient(0, -s * 0.5, 0, s * 0.5);
    bodyGrad.addColorStop(0, fish.color);
    bodyGrad.addColorStop(0.55, fish.tailColor);
    bodyGrad.addColorStop(1, fish.finColor);
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.moveTo(s * 0.85, 0); // Mõm cá
    ctx.quadraticCurveTo(s * 0.4, -s * 0.48, -s * 0.1, -s * 0.42); // Lưng
    ctx.quadraticCurveTo(-s * 0.5, -s * 0.35, -s * 0.75, 0);       // Cuống đuôi
    ctx.quadraticCurveTo(-s * 0.5, s * 0.35, -s * 0.1, s * 0.42);   // Bụng
    ctx.quadraticCurveTo(s * 0.4, s * 0.45, s * 0.85, 0);          // Cằm
    ctx.closePath();
    ctx.fill();

    // 5. CÁC ĐỐM HOA VĂN ĐẶC TRƯNG (KOI PATTERN / SPOTS)
    if (fish.type === 'carp_red' || fish.type === 'carp_gold') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.ellipse(s * 0.25, -s * 0.1, s * 0.25, s * 0.14, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(-s * 0.2, s * 0.05, s * 0.22, s * 0.15, -0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (fish.type === 'paradise') {
      // Sọc ngũ sắc của cá cờ
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.2;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(i * s * 0.15, -s * 0.3);
        ctx.lineTo(i * s * 0.15 - 2, s * 0.3);
        ctx.stroke();
      }
    }

    // 6. VẢY CÁ ÁNH KIM (SCALES REFLECTION)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 0.8;
    for (let x = -s * 0.4; x <= s * 0.4; x += s * 0.22) {
      ctx.beginPath();
      ctx.arc(x, -s * 0.05, s * 0.12, 0.2, Math.PI * 0.9);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + s * 0.1, s * 0.1, s * 0.12, 0.2, Math.PI * 0.9);
      ctx.stroke();
    }

    // 7. VÂY LƯNG CAO VÚT (DORSAL FIN)
    ctx.save();
    ctx.fillStyle = fish.finColor;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(s * 0.3, -s * 0.42);
    ctx.quadraticCurveTo(0, -s * 0.85 - wag * 4, -s * 0.4, -s * 0.35);
    ctx.quadraticCurveTo(-s * 0.1, -s * 0.42, s * 0.3, -s * 0.42);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 8. NẮP MANG VÀ MẮT CÁ LONG LANH (GILLS & EYE)
    // Nắp mang
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.arc(s * 0.45, 0, s * 0.28, -Math.PI * 0.45, Math.PI * 0.45);
    ctx.stroke();

    // Mắt cá
    const eyeX = s * 0.65;
    const eyeY = -s * 0.12;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(eyeX + 0.5, eyeY, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Điểm sáng mắt
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX + 0.8, eyeY - 0.5, 0.6, 0, Math.PI * 2);
    ctx.fill();

    // 9. ĐÔI RÂU CÁ CHÉP ĐỒNG QUÊ (BARBELS)
    if (fish.type === 'carp_gold' || fish.type === 'carp_red') {
      ctx.strokeStyle = fish.finColor;
      ctx.lineWidth = 1.0;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 0.82, s * 0.05);
      ctx.quadraticCurveTo(s * 0.95, s * 0.25 + finWag * 4, s * 1.1, s * 0.35);
      ctx.stroke();
    }

    ctx.restore();
  }
}
