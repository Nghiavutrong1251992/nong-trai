/**
 * LotusRenderer.ts
 * Module chuyên trách vẽ HOA SEN & ĐẦM SEN ĐỒNG QUÊ cực kỳ chi tiết:
 * - 🪷 Hoa Sen Hồng Nở Rộ: Nhiều lớp cánh hoa chuyển sắc, gương sen vàng, nhụy sen
 * - 🪷 Nụ Sen E Ấp: Búp sen hồng vươn cao đón nắng
 * - 🍃 Lá Sen Tròn Khổng Lồ: Gân lá xanh non tỏa tròn 360°, vết khuyết lá chữ V, cuống lá
 * - 💧 Giọt Sương / Giọt Nước Đọng: Óng ánh lăn tăn trên phiến lá sen không thấm nước
 * - 🌱 Lá Sen Non Cuộn Tròn: Mới nhú bập bềnh trên mặt nước
 */

export class LotusRenderer {
  /**
   * Vẽ một cụm Đầm Sen hoàn chỉnh (Gồm lá sen, giọt nước và hoa sen nở hoặc nụ sen)
   */
  public static render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    variant: 'bloom' | 'bud' | 'leaf_only' = 'bloom',
    animTimer: number = 0
  ): void {
    ctx.save();
    ctx.translate(x, y);

    // 1. LÁ SEN TRÒN LỚN NỔI BẬP BỀNH TRÊN MẶT NƯỚC
    this.renderLotusLeaf(ctx, 0, 0, 1.0, animTimer);

    // 2. LÁ SEN NHỎ / LÁ SEN NON KẾ BÊN
    ctx.save();
    ctx.translate(18, -6);
    this.renderLotusLeaf(ctx, 0, 0, 0.65, animTimer + 1.0);
    ctx.restore();

    // 3. HOA SEN NỞ HOẶC NỤ SEN VƯƠN CAO
    if (variant === 'bloom') {
      this.renderLotusFlower(ctx, -2, -8, animTimer);
    } else if (variant === 'bud') {
      this.renderLotusBud(ctx, 4, -14, animTimer);
    }

    ctx.restore();
  }

  /**
   * Vẽ Lá Sen Tròn Khổng Lồ có gân tỏa tròn và Giọt Nước đọng
   */
  public static renderLotusLeaf(
    ctx: CanvasRenderingContext2D,
    lx: number,
    ly: number,
    scale: number = 1.0,
    animTimer: number = 0
  ): void {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.scale(scale, scale);

    const rx = 24;
    const ry = 16;

    // Bóng đáy của lá sen trên mặt nước
    ctx.fillStyle = 'rgba(4, 47, 46, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 3, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Phiến lá sen xanh biếc dạng Radial Gradient
    const leafGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, rx);
    leafGrad.addColorStop(0, '#4ade80'); // Tâm rốn lá sáng màu
    leafGrad.addColorStop(0.35, '#22c55e'); // Xanh tươi mát
    leafGrad.addColorStop(0.80, '#15803d'); // Xanh lục đậm
    leafGrad.addColorStop(1, '#14532d');    // Rìa mép lá sẫm
    ctx.fillStyle = leafGrad;

    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vết khuyết chữ V đặc trưng của lá sen
    ctx.save();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.3)'; // Nhìn thấy nước ở khe khuyết
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(rx * 0.8, -ry * 0.7);
    ctx.lineTo(rx * 0.95, -ry * 0.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Các đường gân lá sen mảnh mai tỏa tròn 360°
    ctx.strokeStyle = '#86efac';
    ctx.lineWidth = 0.75;
    const ribCount = 10;
    for (let i = 0; i < ribCount; i++) {
      const ang = (i * (Math.PI * 2 / ribCount)) + 0.15;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const ex = Math.cos(ang) * (rx - 1.5);
      const ey = Math.sin(ang) * (ry - 1.5);
      ctx.quadraticCurveTo(ex * 0.5 + Math.sin(ang) * 2, ey * 0.5, ex, ey);
      ctx.stroke();
    }

    // Tâm rốn lá sen
    ctx.fillStyle = '#bbf7d0';
    ctx.beginPath();
    ctx.arc(0, 0, 2.0, 0, Math.PI * 2);
    ctx.fill();

    // GIỌT NƯỚC / GIỌT SƯƠNG ÓNG ÁNH ĐỌNG TRÊN LÁ SEN
    const dropWiggleX = Math.sin(animTimer * 1.5) * 1.5;
    const dropWiggleY = Math.cos(animTimer * 1.5) * 0.8;
    const dropX = -6 + dropWiggleX;
    const dropY = -3 + dropWiggleY;

    // Bóng giọt nước
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.arc(dropX + 0.8, dropY + 0.8, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Thân giọt nước trong suốt
    const dropGrad = ctx.createRadialGradient(dropX - 0.6, dropY - 0.6, 0.5, dropX, dropY, 2.8);
    dropGrad.addColorStop(0, '#ffffff');
    dropGrad.addColorStop(0.6, 'rgba(224, 242, 254, 0.85)');
    dropGrad.addColorStop(1, 'rgba(186, 230, 253, 0.4)');
    ctx.fillStyle = dropGrad;
    ctx.beginPath();
    ctx.arc(dropX, dropY, 2.6, 0, Math.PI * 2);
    ctx.fill();

    // Điểm chói sáng (Specular highlight)
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(dropX - 0.8, dropY - 0.8, 0.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  /**
   * Vẽ Bông Hoa Sen Hồng Nở Rộ Tuyệt Đẹp
   */
  public static renderLotusFlower(
    ctx: CanvasRenderingContext2D,
    fx: number,
    fy: number,
    animTimer: number = 0
  ): void {
    ctx.save();
    ctx.translate(fx, fy);

    // Cuống hoa sen vươn từ nước
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.quadraticCurveTo(-2, 5, 0, 0);
    ctx.stroke();

    // Gai li ti trên cuống sen
    ctx.fillStyle = '#14532d';
    ctx.fillRect(-2.5, 4, 1.2, 1.2);
    ctx.fillRect(1.5, 7, 1.2, 1.2);

    // LỚP CÁNH HOA SEN BÊN NGOÀI (HỒNG ĐẬM SEN)
    const outerPetals = 7;
    for (let i = 0; i < outerPetals; i++) {
      const ang = (i * (Math.PI * 2 / outerPetals)) - Math.PI / 2;
      const petalGrad = ctx.createLinearGradient(0, 0, Math.cos(ang) * 12, Math.sin(ang) * 12);
      petalGrad.addColorStop(0, '#fdf2f8');
      petalGrad.addColorStop(0.4, '#f472b6');
      petalGrad.addColorStop(1, '#db2777');
      ctx.fillStyle = petalGrad;

      ctx.save();
      ctx.translate(Math.cos(ang) * 5, Math.sin(ang) * 4);
      ctx.rotate(ang + Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, -4, 4.5, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // LỚP CÁNH HOA SEN BÊN TRONG (HỒNG PHẤN DỊU DÀNG)
    const innerPetals = 6;
    for (let i = 0; i < innerPetals; i++) {
      const ang = (i * (Math.PI * 2 / innerPetals)) - Math.PI / 2 + Math.PI / 6;
      const petalGrad = ctx.createLinearGradient(0, 0, Math.cos(ang) * 8, Math.sin(ang) * 8);
      petalGrad.addColorStop(0, '#ffffff');
      petalGrad.addColorStop(0.5, '#fbcfe8');
      petalGrad.addColorStop(1, '#ec4899');
      ctx.fillStyle = petalGrad;

      ctx.save();
      ctx.translate(Math.cos(ang) * 3, Math.sin(ang) * 2.5);
      ctx.rotate(ang + Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, -3, 3.2, 5.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // GƯƠNG SEN VÀNG VÀ NHỤY SEN VÀNG RỰC RỠ
    // Gương sen tròn
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Mắt hạt sen trên gương sen
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.arc(-1.2, -1, 0.7, 0, Math.PI * 2);
    ctx.arc(1.2, -1, 0.7, 0, Math.PI * 2);
    ctx.arc(0, 1.2, 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Nhụy sen vàng tua tủa quanh gương sen
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.0;
    for (let i = 0; i < 12; i++) {
      const a = i * (Math.PI * 2 / 12);
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 3.5, Math.sin(a) * 3.5);
      ctx.lineTo(Math.cos(a) * 5.2, Math.sin(a) * 5.2);
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Vẽ Nụ Sen E Ấp Vươn Lên Mặt Nước
   */
  public static renderLotusBud(
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    animTimer: number = 0
  ): void {
    ctx.save();
    ctx.translate(bx, by);

    // Cuống nụ sen
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 15);
    ctx.quadraticCurveTo(2, 8, 0, 0);
    ctx.stroke();

    // Búp nụ sen thon nhọn e ấp
    const budGrad = ctx.createLinearGradient(0, 0, 0, -14);
    budGrad.addColorStop(0, '#22c55e');  // Gốc búp xanh
    budGrad.addColorStop(0.4, '#fbcfe8'); // Giữa búp hồng phấn
    budGrad.addColorStop(1, '#db2777');   // Đỉnh búp hồng cánh sen
    ctx.fillStyle = budGrad;

    ctx.beginPath();
    ctx.moveTo(-4, 0);
    ctx.quadraticCurveTo(-5, -6, 0, -14); // Đỉnh nhọn
    ctx.quadraticCurveTo(5, -6, 4, 0);
    ctx.closePath();
    ctx.fill();

    // Nếp gấp cánh búp
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.quadraticCurveTo(1.5, -6, 0, 0);
    ctx.stroke();

    ctx.restore();
  }
}
