/**
 * WorldRenderer.ts
 * Quản lý vẽ các lớp đồ họa thế giới và HUD giao diện trò chơi:
 * - Nền trời Gradient động theo thời gian
 * - Mây trôi Parallax mềm mại
 * - Lưới thước đo phân đoạn bản đồ 2400m
 * - HUD hiển thị thông số (Tiền xu, Túi chuối, Thóc lúa, Phân đoạn bản đồ)
 */

import { Engine } from '../core/Engine';

export class WorldRenderer {
  constructor(private engine: Engine) {}

  /**
   * Vẽ nền bầu trời Gradient
   */
  public renderSky(ctx: CanvasRenderingContext2D, width: number, groundY: number): void {
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);
    skyGrad.addColorStop(0, '#60a5fa');
    skyGrad.addColorStop(0.5, '#93c5fd');
    skyGrad.addColorStop(0.85, '#dbeafe');
    skyGrad.addColorStop(1, '#fef9c3');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, groundY);
  }

  /**
   * Vẽ các đám mây mềm mại trôi nhẹ ở hậu cảnh
   */
  public renderAtmosphericClouds(ctx: CanvasRenderingContext2D, width: number, groundY: number, animTimer: number): void {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    
    const clouds = [
      { xOffset: 80, y: groundY * 0.22, scale: 1.2, speed: 12 },
      { xOffset: 450, y: groundY * 0.38, scale: 0.85, speed: 8 },
      { xOffset: 880, y: groundY * 0.18, scale: 1.4, speed: 15 },
      { xOffset: 1300, y: groundY * 0.32, scale: 0.95, speed: 10 }
    ];

    clouds.forEach(c => {
      const cx = ((c.xOffset + animTimer * c.speed) % (width + 300)) - 150;
      const cy = c.y;
      
      ctx.beginPath();
      ctx.arc(cx, cy, 28 * c.scale, 0, Math.PI * 2);
      ctx.arc(cx + 25 * c.scale, cy - 10 * c.scale, 35 * c.scale, 0, Math.PI * 2);
      ctx.arc(cx + 60 * c.scale, cy - 5 * c.scale, 28 * c.scale, 0, Math.PI * 2);
      ctx.arc(cx + 85 * c.scale, cy, 20 * c.scale, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  /**
   * Vẽ Lưới Thước Đo & Đánh Số Phân Đoạn Bản Đồ (Map Ruler Grid Overlay)
   */
  public renderMapRuler(ctx: CanvasRenderingContext2D, height: number, groundY: number, showMapRuler: boolean, mapWidth: number): void {
    if (!showMapRuler) return;

    ctx.save();
    const sectionWidth = 200; // Mỗi phân đoạn dài 200px
    const startX = -400;
    const endX = mapWidth;
    const totalSections = Math.round((endX - startX) / sectionWidth);

    ctx.font = 'bold 11px Outfit, sans-serif';
    ctx.textAlign = 'center';

    for (let i = 0; i <= totalSections; i++) {
      const x = startX + i * sectionWidth;
      const isMajor = i % 2 === 0;

      // Vạch phân chia đứng
      ctx.strokeStyle = isMajor ? 'rgba(56, 189, 248, 0.45)' : 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = isMajor ? 1.5 : 1;
      ctx.setLineDash(isMajor ? [6, 4] : [3, 3]);

      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Bảng nhãn hiển thị thông số phân đoạn
      if (i < totalSections) {
        const secCenterX = x + sectionWidth / 2;
        const secNumber = i + 1;

        let secName = `Đoạn ${secNumber}`;
        if (x < -200) secName = 'Đoạn 0A (Đồng cỏ xa)';
        else if (x < 0) secName = 'Đoạn 0B (Đồng cỏ)';
        else if (x >= 400 && x < 1200) secName = `Đoạn ${secNumber} (Bờ Tre & Cỏ)`;
        else if (x >= 1200 && x < 2000) secName = `Đoạn ${secNumber} (Ruộng Lúa)`;
        else if (x >= 2000) secName = `Đoạn ${secNumber} (Bờ Đê Cuối)`;

        // Badge trên không gian bầu trời
        ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
        ctx.beginPath();
        ctx.roundRect(secCenterX - 55, 22, 110, 22, 6);
        ctx.fill();
        ctx.strokeStyle = isMajor ? '#38bdf8' : 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isMajor ? '#38bdf8' : '#f8fafc';
        ctx.fillText(`${x}m ➔ ${x + sectionWidth}m`, secCenterX, 37);

        // Tên khu vực dưới đáy
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.beginPath();
        ctx.roundRect(secCenterX - 65, groundY - 24, 130, 20, 4);
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.fillText(secName, secCenterX, groundY - 10);
      }
    }

    // Ranh giới bắt đầu & kết thúc
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.moveTo(-400, 0);
    ctx.lineTo(-400, height);
    ctx.moveTo(mapWidth, 0);
    ctx.lineTo(mapWidth, height);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Vẽ HUD Thông tin chỉ số người chơi trên màn hình
   */
  public renderHUD(ctx: CanvasRenderingContext2D, width: number, height: number, playerX: number, coins: number, carriedBananas: number, riceGrains: number, showMapRuler: boolean): void {
    ctx.save();
    const isMobile = width < 900 || height < 560;
    const hudW = isMobile ? Math.min(225, width - 90) : 320;
    const hudH = isMobile ? 38 : 56;
    const hudX = isMobile ? 10 : 20;
    const hudY = isMobile ? 10 : 68;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, isMobile ? 10 : 12);
    ctx.fill();
    ctx.strokeStyle = showMapRuler ? '#38bdf8' : 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    let currentSecLabel = 'Đoạn 1';
    if (playerX < -200) currentSecLabel = 'Đoạn 0A';
    else if (playerX < 0) currentSecLabel = 'Đoạn 0B';
    else {
      const sNum = Math.floor(playerX / 200) + 1;
      currentSecLabel = `Đoạn ${sNum}`;
    }

    if (isMobile) {
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`🪙 ${coins}  🌾 ${riceGrains}  🎋 ${carriedBananas}  📍 ${currentSecLabel}`, hudX + 10, hudY + 23);
    } else {
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 13px Outfit, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`🪙 Tiền Xu: ${coins} Xu`, hudX + 14, hudY + 24);

      ctx.fillStyle = '#4ade80';
      ctx.fillText(`🎋 Túi Chuối: ${carriedBananas} cây`, hudX + 155, hudY + 24);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 11px Outfit, sans-serif';
      ctx.fillText(`🌾 Kho Thóc: ${riceGrains} hạt`, hudX + 14, hudY + 45);

      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`📍 Vị trí: ${Math.round(playerX)}m (${currentSecLabel})`, hudX + 155, hudY + 45);
    }

    ctx.restore();
  }
}
