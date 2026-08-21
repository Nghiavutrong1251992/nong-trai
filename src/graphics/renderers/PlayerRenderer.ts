/**
 * PlayerRenderer.ts
 * HỆ THỐNG KHUNG XƯƠNG GIẢI PHẪU CHUẨN HOẠT HÌNH 2D (Standard 3.5-Head Character Rig)
 * 
 * TỈ LỆ GIẢI PHẪU CHUẨN (Tổng chiều cao: 105 đơn vị):
 * - ĐỈNH ĐẦU & MÁI TÓC (y = -105 đến -74): Chiếm 30% — Hộp sọ bo tròn 3D, lọn tóc tỉa xếp lớp, trán cao, cằm tròn thanh tú
 * - CỔ & KHUNG VAI XUÔI (y = -74 đến -64): Cổ thanh thoát nối với bờ vai rộng tự nhiên (x: -16 đến +14)
 * - THÂN NGỰC, EO & ÁO BÀ BA (y = -64 đến -36): Chiếm 27% — Thân áo có độ rủ mềm mại, nẹp xẻ tà, hàng cúc cài
 * - HAI CÁNH TAY & KHUỶU TAY: Khớp vai -> Bắp tay -> Khuỷu tay -> Cẳng tay xắn gấu -> Bàn tay buông ngang đùi
 * - HÔNG, ĐÙI, ĐẦU GỐI & CẲNG CHÂN (y = -36 đến 0): Chiếm 35% — Ống quần thụng, khớp gối có miếng vá, bắp chân, dép kẹp
 */

export class PlayerRenderer {
  public static render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number, // 1: phải, -1: trái
    state: 'idle' | 'walk' | 'jump' | 'hoe' | 'fish',
    animTimer: number,
    scale: number = 2.4
  ): void {
    ctx.save();
    ctx.translate(x, y);
    if (facing < 0) ctx.scale(-1, 1);
    ctx.scale(scale, scale);

    const isMoving = state === 'walk';
    const isJumping = state === 'jump';

    // 1. Nhịp chuyển động tự nhiên (Anatomical Walk Cycle)
    const walkSpeed = 7.5;
    const legPhase = isMoving ? animTimer * walkSpeed : 0;
    // Chân trước sải về phía trước (-angle), chân sau đẩy về phía sau (+angle)
    const legLeftAngle = isMoving ? -Math.sin(legPhase) * 25 : 0;
    const legRightAngle = isMoving ? Math.sin(legPhase) * 25 : 0;
    const bodyBob = isMoving ? Math.abs(Math.sin(legPhase)) * 3.8 : (isJumping ? -14 : Math.sin(animTimer * 2.2) * 1.2);
    const bodyTilt = isMoving ? -Math.sin(legPhase) * 0.04 : 0; // Nghiêng người nhẹ theo hướng bước
    // Tay vung ngược pha với chân (Tay trước vung cùng nhịp chân sau)
    const armLeftAngle = isMoving ? Math.sin(legPhase) * 28 : 0;
    const armRightAngle = isMoving ? -Math.sin(legPhase) * 28 : 0;
    const headTilt = isMoving ? -Math.sin(legPhase) * 0.03 : Math.sin(animTimer * 2.2) * 0.015;

    // 2. BÓNG ĐỔ DƯỚI ĐẤT CO GIÃN THEO TRỌNG TÂM
    ctx.fillStyle = 'rgba(28, 25, 23, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 1.0, isJumping ? 14 : 26, isJumping ? 4.0 : 6.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.translate(0, -bodyBob);
    ctx.rotate(bodyTilt);

    // ============================================================
    // 3. TAY PHẢI SAU LƯNG (Back Arm)
    // ============================================================
    this.drawArm(ctx, isJumping ? 20 : armRightAngle, true);

    // ============================================================
    // 4. CHÂN PHẢI SAU (Back Leg)
    // ============================================================
    this.drawLeg(ctx, isJumping ? 22 : legRightAngle, true, animTimer);

    // ============================================================
    // 5. THÂN NGƯỜI & ÁO BÀ BA ĐỎ (Torso & Bà Ba Tunic)
    // ============================================================
    this.drawTorso(ctx, animTimer);

    // ============================================================
    // 6. CHÂN TRÁI TRƯỚC (Front Leg - Có miếng vá gối)
    // ============================================================
    this.drawLeg(ctx, isJumping ? -25 : legLeftAngle, false, animTimer);

    // ============================================================
    // 7. TAY TRÁI TRƯỚC (Front Arm)
    // ============================================================
    this.drawArm(ctx, isJumping ? -35 : armLeftAngle, false);

    // ============================================================
    // 8. ĐẦU, MẶT & MÁI TÓC GIẢI PHẪU CHUẨN (Head & Face Anatomy)
    // ============================================================
    this.drawHead(ctx, headTilt, animTimer);

    ctx.restore();
  }

  /**
   * VẼ ĐẦU, MẶT & MÁI TÓC (Chuẩn giải phẫu Chibi nghệ thuật)
   */
  private static drawHead(
    ctx: CanvasRenderingContext2D,
    tilt: number,
    animTimer: number
  ): void {
    ctx.save();
    // Khớp cổ tại (0, -68)
    ctx.translate(0, -68);
    ctx.rotate(tilt);

    // 1. CỔ THON TỰ NHIÊN
    ctx.fillStyle = '#fce1d2';
    ctx.strokeStyle = '#221614';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.moveTo(-4.5, 0);
    ctx.lineTo(-4.0, 7);
    ctx.lineTo(4.0, 7);
    ctx.lineTo(4.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. KHỐI TÓC GÁY & VÒM SỌ SAU (Back Head & Hair Silhouette)
    ctx.fillStyle = '#1c1d22';
    ctx.strokeStyle = '#111215';
    ctx.lineWidth = 2.4;

    ctx.beginPath();
    ctx.moveTo(-16, -6);
    ctx.quadraticCurveTo(-22, -18, -14, -28);
    ctx.quadraticCurveTo(-8, -37, 2, -36);
    ctx.quadraticCurveTo(14, -36, 18, -26);
    ctx.quadraticCurveTo(22, -16, 17, -5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Các lọn tóc tỉa tự nhiên phía sau gáy và đỉnh đầu
    ctx.beginPath();
    ctx.moveTo(-12, -29); ctx.lineTo(-17, -35); ctx.lineTo(-8, -33);
    ctx.moveTo(-4, -36); ctx.lineTo(-1, -42); ctx.lineTo(4, -36);
    ctx.moveTo(8, -35); ctx.lineTo(14, -40); ctx.lineTo(13, -32);
    ctx.moveTo(17, -27); ctx.lineTo(23, -29); ctx.lineTo(18, -22);
    ctx.stroke();

    // 3. KHỐI KHUÔN MẶT CHIBI TRÒN TRỊA, CẰM THANH TÚ (Face)
    const faceGrad = ctx.createRadialGradient(2, -12, 3, 2, -12, 22);
    faceGrad.addColorStop(0, '#ffffff');
    faceGrad.addColorStop(0.7, '#fef2eb');
    faceGrad.addColorStop(1, '#fce1d2');
    ctx.fillStyle = faceGrad;
    ctx.strokeStyle = '#221614';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-15, -16);
    ctx.quadraticCurveTo(-18, -4, -10, 4);
    ctx.quadraticCurveTo(0, 8, 10, 4);
    ctx.quadraticCurveTo(17, -4, 15, -16);
    ctx.quadraticCurveTo(0, -22, -15, -16);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 4. HAI TAI TRÒN TRỊA HAI BÊN
    ctx.fillStyle = '#fce1d2';
    ctx.strokeStyle = '#221614';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(16, -6, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f8a58a';
    ctx.beginPath();
    ctx.arc(16, -6, 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fce1d2';
    ctx.strokeStyle = '#221614';
    ctx.beginPath();
    ctx.arc(-15, -6, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 5. MÁI TÓC TRƯỚC TRÁN TỈA LỌN TỰ NHIÊN (Bangs - Không che mắt)
    ctx.fillStyle = '#1c1d22';
    ctx.strokeStyle = '#111215';
    ctx.lineWidth = 2.2;

    ctx.beginPath();
    ctx.moveTo(-16, -15);
    ctx.quadraticCurveTo(-12, -9, -9, -15);
    ctx.quadraticCurveTo(-6, -8, -3, -16);
    ctx.quadraticCurveTo(0, -7, 3, -16);
    ctx.quadraticCurveTo(6, -9, 9, -15);
    ctx.quadraticCurveTo(12, -8, 15, -15);
    ctx.lineTo(16, -26);
    ctx.lineTo(-16, -26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 6. ĐÔI MẮT HẠT NHÃN ĐEN LÁY, LÔNG MÀY, MŨI & NỤ CƯỜI
    // Mắt trái to tròn
    ctx.fillStyle = '#18191c';
    ctx.beginPath();
    ctx.ellipse(-4.8, -7.5, 3.4, 4.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-6.0, -9.0, 1.4, 0, Math.PI * 2);
    ctx.fill();

    // Mắt phải to tròn
    ctx.fillStyle = '#18191c';
    ctx.beginPath();
    ctx.ellipse(8.5, -7.5, 3.6, 4.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(7.2, -9.0, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Chân mày cong thanh mảnh
    ctx.strokeStyle = '#1c1d22';
    ctx.lineWidth = 1.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(-4.8, -13.0, 3.6, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(8.5, -13.0, 3.8, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();

    // Mũi chấm nhỏ xinh
    ctx.fillStyle = '#7c3f1d';
    ctx.beginPath();
    ctx.arc(1.8, -5.0, 1.1, 0, Math.PI * 2);
    ctx.fill();

    // Nụ cười mỉm nhỏ tươi tắn
    ctx.strokeStyle = '#221614';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(1.8, -1.8, 4.0, 0.15, Math.PI * 0.75);
    ctx.stroke();

    // Đôi gò má hồng có nét gạch phác thảo
    ctx.fillStyle = 'rgba(244, 114, 100, 0.42)';
    ctx.beginPath();
    ctx.ellipse(-8.5, -2.8, 4.6, 2.8, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(11.5, -2.8, 4.6, 2.8, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Nét gạch chéo phác thảo
    ctx.strokeStyle = 'rgba(180, 50, 40, 0.55)';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.moveTo(-10.5, -1.5); ctx.lineTo(-7.0, -4.0);
    ctx.moveTo(-9.2, -0.8); ctx.lineTo(-5.7, -3.3);
    ctx.moveTo(9.5, -1.5); ctx.lineTo(13.0, -4.0);
    ctx.moveTo(10.7, -0.8); ctx.lineTo(14.2, -3.3);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * VẼ THÂN NGƯỜI & ÁO BÀ BA ĐỎ (Torso, Shoulders & Waist)
   */
  private static drawTorso(ctx: CanvasRenderingContext2D, animTimer: number): void {
    ctx.save();
    // Gốc ngực tại (0, -64)
    ctx.translate(0, -64);

    // 1. THÂN ÁO BÀ BA ĐỎ GẠCH (Có vai rộng tự nhiên x: -15 đến +14)
    const shirtGrad = ctx.createLinearGradient(-15, 0, 15, 28);
    shirtGrad.addColorStop(0, '#e85848');
    shirtGrad.addColorStop(0.4, '#d83e2e');
    shirtGrad.addColorStop(1, '#b82e20');
    ctx.fillStyle = shirtGrad;
    ctx.strokeStyle = '#221614';
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-7, 2);      // Chân cổ trái
    ctx.lineTo(-16, 6);     // Đầu vai trái
    ctx.quadraticCurveTo(-18, 16, -14, 27); // Sườn áo trái
    ctx.lineTo(-10, 29);    // Vạt áo trái
    ctx.quadraticCurveTo(0, 31, 10, 29);    // Gấu áo uốn cong
    ctx.lineTo(14, 27);     // Vạt áo phải
    ctx.quadraticCurveTo(18, 16, 15, 6);    // Sườn áo phải
    ctx.lineTo(7, 2);       // Đầu vai phải
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. NẾP NHĂN VẢI MỀM MẠI
    ctx.strokeStyle = '#8c1f14';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-11, 12); ctx.quadraticCurveTo(-2, 17, 8, 10);
    ctx.moveTo(-12, 20); ctx.quadraticCurveTo(-1, 24, 10, 18);
    ctx.stroke();

    // 3. CỔ ÁO XẺ CHỮ V & NẸP ÁO
    ctx.fillStyle = '#fce1d2';
    ctx.strokeStyle = '#221614';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-4.5, 2);
    ctx.lineTo(0, 7.5);
    ctx.lineTo(4.5, 2);
    ctx.stroke();

    // Hàng cúc bọc vải cài áo
    ctx.fillStyle = '#221614';
    ctx.beginPath();
    ctx.arc(0, 11, 1.8, 0, Math.PI * 2);
    ctx.arc(0, 19, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 4. DẢI RÚT THẮT NƠ TRƯỚC CẠP QUẦN
    ctx.strokeStyle = '#b82e20';
    ctx.fillStyle = '#d83e2e';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.arc(5, 29, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(4, 30); ctx.quadraticCurveTo(2, 36, 3, 40);
    ctx.moveTo(6, 30); ctx.quadraticCurveTo(9, 36, 7, 41);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * VẼ CÁNH TAY & BÀN TAY (Arms, Sleeves & Hands)
   */
  private static drawArm(
    ctx: CanvasRenderingContext2D,
    swingDeg: number,
    isBackArm: boolean
  ): void {
    ctx.save();
    // Gốc khớp vai: (-14, -58) cho vai sau, (13, -58) cho vai trước
    ctx.translate(isBackArm ? -14 : 13, -58);
    ctx.rotate((swingDeg * Math.PI) / 180);

    const shirtColor = isBackArm ? '#b82e20' : '#d83e2e';
    const cuffColor = isBackArm ? '#991b1b' : '#b82e20';

    // 1. Ống tay áo đỏ rủ tự nhiên
    ctx.fillStyle = shirtColor;
    ctx.strokeStyle = '#221614';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(-4.5, 0);
    ctx.quadraticCurveTo(-6.5, 10, -5.5, 18);
    ctx.lineTo(5.5, 18);
    ctx.quadraticCurveTo(6.5, 10, 4.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 2. Gấu tay áo xắn dày dặn
    ctx.fillStyle = cuffColor;
    ctx.beginPath();
    ctx.roundRect(-6.5, 16, 13, 5.5, 2.2);
    ctx.fill();
    ctx.stroke();

    // 3. Cẳng tay & Bàn tay Chibi bụ bẫm (Dài chạm ngang đùi)
    ctx.fillStyle = isBackArm ? '#f0cbb5' : '#fce1d2';
    ctx.strokeStyle = '#7c3f1d';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(-3.0, 21.5);
    ctx.lineTo(-3.5, 25);
    ctx.lineTo(3.5, 25);
    ctx.lineTo(3.0, 21.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bàn tay & ngón tay cái
    ctx.beginPath();
    ctx.arc(0, 27.5, 4.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(isBackArm ? 3.2 : -3.2, 26, 2.0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  /**
   * VẼ KHỚP CHÂN (Thighs, Knees, Pants, Patch & Sandals)
   */
  private static drawLeg(
    ctx: CanvasRenderingContext2D,
    angleDeg: number,
    isBackLeg: boolean,
    animTimer: number
  ): void {
    ctx.save();
    // Gốc khớp hông: (-5, -36) cho chân sau, (5, -36) cho chân trước
    ctx.translate(isBackLeg ? -5.5 : 5.5, -36);
    ctx.rotate((angleDeg * Math.PI) / 180);

    const pantColor = isBackLeg ? '#1e2024' : '#2b2e34';
    ctx.fillStyle = pantColor;
    ctx.strokeStyle = '#151719';
    ctx.lineWidth = 2.2;
    ctx.lineJoin = 'round';

    // 1. ỐNG QUẦN THỤNG CHÀM ĐEN
    ctx.beginPath();
    ctx.moveTo(-6.5, 0);
    ctx.quadraticCurveTo(-8.5, 11, -7.5, 21);
    ctx.lineTo(7.5, 21);
    ctx.quadraticCurveTo(8.5, 11, 6.5, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Nếp nhăn ống quần
    ctx.strokeStyle = isBackLeg ? '#121316' : '#1a1c20';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-4.0, 7); ctx.quadraticCurveTo(-1, 11, 4.0, 9);
    ctx.moveTo(-5.0, 15); ctx.quadraticCurveTo(0, 17, 5.0, 13);
    ctx.stroke();

    // 2. MIẾNG VÁ ĐẦU GỐI (Chỉ có ở chân trước)
    if (!isBackLeg) {
      ctx.fillStyle = '#4a515e';
      ctx.strokeStyle = '#151719';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.roundRect(-4.5, 9, 9, 8, 1.5);
      ctx.fill();
      ctx.stroke();

      // Chỉ khâu trắng nổi
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.1;
      ctx.setLineDash([2, 1.8]);
      ctx.beginPath();
      ctx.rect(-3.5, 10, 7, 6);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 3. GẤU QUẦN XẮN DÀY
    ctx.fillStyle = isBackLeg ? '#2b2e34' : '#3d424b';
    ctx.strokeStyle = '#151719';
    ctx.lineWidth = 2.0;
    ctx.beginPath();
    ctx.roundRect(-8.5, 18.5, 17, 6.5, 2.2);
    ctx.fill();
    ctx.stroke();

    // 4. BẮP CHÂN & CỔ CHÂN TRẦN
    ctx.fillStyle = isBackLeg ? '#f0cbb5' : '#fce1d2';
    ctx.strokeStyle = '#7c3f1d';
    ctx.lineWidth = 1.8;

    ctx.beginPath();
    ctx.moveTo(-4.0, 25);
    ctx.lineTo(-4.5, 31);
    ctx.lineTo(4.5, 31);
    ctx.lineTo(4.0, 25);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bàn chân
    ctx.beginPath();
    ctx.moveTo(-5.0, 30);
    ctx.quadraticCurveTo(-6.0, 34, 0, 34.5);
    ctx.quadraticCurveTo(7.5, 34.5, 8.5, 32);
    ctx.quadraticCurveTo(7.5, 29.5, 3.0, 29.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. ĐÉP KẸP TRUYỀN THỐNG
    ctx.fillStyle = '#2c221e';
    ctx.strokeStyle = '#15100e';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-6.0, 33.5, 15.5, 3.8, [1.5, 1.5, 2, 2]);
    ctx.fill();
    ctx.stroke();

    // Quai kẹp chữ V
    ctx.strokeStyle = '#15100e';
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-3.0, 32.5);
    ctx.lineTo(3.2, 34.0);
    ctx.lineTo(7.5, 32.8);
    ctx.stroke();

    ctx.restore();
  }
}
