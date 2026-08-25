/**
 * ToolRack.ts
 * Module Giá Treo Khung Tre Nông Cụ Làng Quê 2D:
 * - 🎋 Khung tre đứng cố định 100% trên mặt đất, KHÔNG XOAY, KHÔNG RUNG
 * - 🌾 Toàn bộ các dụng cụ (Nón lá, Liềm, Nơm cá, Mẹt tre, Thúng rổ, Chổi rơm, Hót rác) là sprite thuần không dính cột tre
 * - 🍃 Khi người chơi đi ngang qua, CHỈ CÁC MÓN ĐỒ TREO ĐUNG ĐƯA LẮC LƯ quanh chốt móc trên sào
 * - ⚡ 60 FPS mượt mà, chân cột chạm đất hoàn hảo
 */

import { GroundPlatform } from '../plants/GroundPlatform';
import { AssetLoader } from '../../core/AssetLoader';

interface PureToolItem {
  id: string;
  imgSrc: string;
  relX: number;       // Vị trí X tương đối so với tâm giá (px)
  relY: number;       // Vị trí Y tương đối so với đáy giá (px)
  w: number;
  h: number;
  pivotY: number;     // Tọa độ chốt treo trên sào (px so với đáy giá)
  swayAngle: number;  // Góc lắc hiện tại (radian)
  swayVel: number;    // Vận tốc góc lắc
  stiffness: number;  // Độ nảy đàn hồi
  damping: number;    // Ma sát giảm chấn
  phaseOffset: number;// Độ lệch pha gió
  img?: HTMLImageElement;
}

export class ToolRack {
  // Tọa độ đặt giá treo tại sân cỏ Đoạn 11 - 12 (trước ngôi nhà tranh)
  public x: number = 1960;
  public w: number = 260;
  public h: number = 173;
  public yOffset: number = 6; // Chân 3 cột tre cắm sâu vào thảm cỏ vững chãi

  private rackFrameImg: HTMLImageElement;
  private isRackLoaded: boolean = false;

  private lastPlayerX: number = 0;

  // Danh sách các món nông cụ thuần (Pure isolated sprites) treo móc trên sào
  public tools: PureToolItem[] = [
    // 1. Chồng 3 Nón lá treo bên trái sào ngoài
    {
      id: 'non_la',
      imgSrc: '/assets/props/dung_cu/pure_non_la.png?v=' + Date.now(),
      relX: -98,
      relY: -92,
      w: 42,
      h: 90,
      pivotY: -137,
      swayAngle: 0,
      swayVel: 0,
      stiffness: 16.0,
      damping: 2.2,
      phaseOffset: 0.1
    },
    // 2. Chiếc liềm móc ở sào trên
    {
      id: 'liem',
      imgSrc: '/assets/props/dung_cu/pure_liem.png?v=' + Date.now(),
      relX: -50,
      relY: -128,
      w: 44,
      h: 43,
      pivotY: -146,
      swayAngle: 0,
      swayVel: 0,
      stiffness: 22.0,
      damping: 2.6,
      phaseOffset: 0.5
    },
    // 3. Nơm bắt cá tre treo chính diện
    {
      id: 'nom_ca',
      imgSrc: '/assets/props/dung_cu/04_nom_ca.png',
      relX: 0,
      relY: -118,
      w: 46,
      h: 58,
      pivotY: -144,
      swayAngle: 0,
      swayVel: 0,
      stiffness: 18.0,
      damping: 2.4,
      phaseOffset: 0.9
    },
    // 4. Mẹt tre phơi thóc treo ở sào giữa bên trái
    {
      id: 'nia_met',
      imgSrc: '/assets/props/dung_cu/01_nia_met.png',
      relX: -50,
      relY: -62,
      w: 72,
      h: 50,
      pivotY: -86,
      swayAngle: 0,
      swayVel: 0,
      stiffness: 24.0,
      damping: 3.0,
      phaseOffset: 1.3
    },
    // 5. Thúng rổ tre treo dây bên phải sào
    {
      id: 'thung_ro',
      imgSrc: '/assets/props/dung_cu/02_thung_ro.png',
      relX: 62,
      relY: -118,
      w: 66,
      h: 54,
      pivotY: -144,
      swayAngle: 0,
      swayVel: 0,
      stiffness: 15.0,
      damping: 2.0,
      phaseOffset: 1.7
    },
    // 6. Cái hót rác tre đặt gác dưới sàn tre
    {
      id: 'hot_rac',
      imgSrc: '/assets/props/dung_cu/07_hot_rac_tre.png',
      relX: -80,
      relY: -28,
      w: 50,
      h: 54,
      pivotY: -50,
      swayAngle: 0,
      swayVel: 0,
      stiffness: 30.0,
      damping: 3.5,
      phaseOffset: 2.1
    },
    // 7. Chổi rơm cán dài dựng nghiêng bên cột phải
    {
      id: 'choi_rom',
      imgSrc: '/assets/props/dung_cu/08_choi_rom_dai.png',
      relX: 92,
      relY: -38,
      w: 48,
      h: 76,
      pivotY: -74,
      swayAngle: 0,
      swayVel: 0,
      stiffness: 20.0,
      damping: 2.8,
      phaseOffset: 2.5
    }
  ];

  constructor() {
    this.rackFrameImg = AssetLoader.getImage('/assets/props/dung_cu/gia_treo_khung_tre_trong.png');
    this.rackFrameImg.onload = () => {
      this.isRackLoaded = true;
    };
    if (this.rackFrameImg.complete && this.rackFrameImg.naturalWidth > 0) {
      this.isRackLoaded = true;
    }

    // Nạp toàn bộ ảnh dụng cụ thuần
    this.tools.forEach(tool => {
      tool.img = AssetLoader.getImage(tool.imgSrc);
    });
  }

  /**
   * Cập nhật dao động lắc lư của TỪNG MÓN ĐỒ khi người chơi đi ngang qua
   */
  public update(dt: number, playerX?: number, playerVx: number = 0): void {
    if (playerX !== undefined) {
      const pMovement = playerVx !== 0 ? playerVx : (playerX - this.lastPlayerX) / Math.max(dt, 0.016);
      const isMoving = Math.abs(pMovement) > 6;

      // Kiểm tra va chạm tương tác với từng món đồ
      this.tools.forEach(t => {
        const itemWorldX = this.x + t.relX;
        const dist = playerX - itemWorldX;
        const hitRadius = t.w * 0.75 + 20;

        // Khi người chơi chạm/lướt qua món đồ
        if (Math.abs(dist) < hitRadius && isMoving) {
          const dir = Math.sign(pMovement);
          const intensity = Math.min(2.0, Math.max(0.7, Math.abs(pMovement) / 110));
          const pushImpulse = 0.18 * dir * intensity * dt * 9;
          t.swayVel += pushImpulse;
        }
      });

      this.lastPlayerX = playerX;
    }

    // Cập nhật dao động lò xo con lắc riêng cho từng dụng cụ
    this.tools.forEach(t => {
      const springForce = -t.stiffness * t.swayAngle;
      const dampingForce = -t.damping * t.swayVel;

      t.swayVel += (springForce + dampingForce) * dt;
      t.swayAngle += t.swayVel * dt;

      const maxLimit = 0.28; // ~16 độ lắc rõ rệt
      if (t.swayAngle > maxLimit) t.swayAngle = maxLimit;
      if (t.swayAngle < -maxLimit) t.swayAngle = -maxLimit;
    });
  }

  public render(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    animTimer: number = 0,
    cameraX: number = 0,
    viewportW: number = 1400
  ): void {
    const minViewX = cameraX - 300;
    const maxViewX = cameraX + viewportW + 300;

    if (this.x + this.w / 2 < minViewX || this.x - this.w / 2 > maxViewX) {
      return;
    }

    const currentGroundY = GroundPlatform.getGroundY(this.x, groundY);
    const px = this.x;
    const py = currentGroundY;

    ctx.save();

    // 1. Bóng đổ tiếp đất 2D dưới chân 3 cột tre (CỐ ĐỊNH 100%)
    const sRx = this.w * 0.46;
    const sRy = 8;
    const shadowGrad = ctx.createRadialGradient(px, py + 2, 4, px, py + 2, sRx);
    shadowGrad.addColorStop(0, 'rgba(15, 23, 42, 0.45)');
    shadowGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.15)');
    shadowGrad.addColorStop(1, 'transparent');

    ctx.fillStyle = shadowGrad;
    ctx.beginPath();
    ctx.ellipse(px, py + 2, sRx, sRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Vẽ KHUNG TRE ĐỨNG CỐ ĐỊNH 100% (Hoàn toàn không xoay, không rung, đứng vững trên đất)
    if (this.isRackLoaded || (this.rackFrameImg.complete && this.rackFrameImg.naturalWidth > 0)) {
      ctx.drawImage(this.rackFrameImg, px - this.w / 2, py + this.yOffset - this.h, this.w, this.h);
    }

    // 3. Vẽ TỪNG MÓN NÔNG CỤ ĐUNG ĐƯA LẮC LƯ QUANH CHỐT MÓC TREO TRÊN SÀO
    this.tools.forEach(tool => {
      if (!tool.img || !tool.img.complete || tool.img.naturalWidth <= 0) return;

      const itemCenterX = px + tool.relX;
      const itemCenterY = py + this.yOffset + tool.relY;
      const pivotY = py + this.yOffset + tool.pivotY;

      // Dao động lắc lư = Va chạm khi người chơi đi qua + Gió nhẹ
      const ambientSway = Math.sin(animTimer * 1.8 + tool.phaseOffset) * 0.008;
      const totalSway = tool.swayAngle + ambientSway;

      ctx.save();
      // Chốt xoay đúng tại điểm treo trên sào tre
      ctx.translate(itemCenterX, pivotY);
      ctx.rotate(totalSway);

      // Vẽ hình ảnh dụng cụ buông thõng từ chốt treo
      ctx.drawImage(
        tool.img,
        -tool.w / 2,
        itemCenterY - tool.h / 2 - pivotY,
        tool.w,
        tool.h
      );

      ctx.restore();
    });

    ctx.restore();
  }
}
