/**
 * GrassRenderer.ts
 * HỆ THỐNG MẶT ĐẤT & CÂY TRỒNG ĐỒNG BỘ 100% (Unified Ground & Layered Flora System)
 * 
 * NGUYÊN LÝ CHUẨN:
 * 1. Mặt đất (Ground Baseline) là DUY NHẤT và LIỀN MẠCH toàn bản đồ, không bị cắt khúc hay lệch độ cao.
 * 2. Cỏ, Hoa, Cây Lúa, Cây Cối là các SPRITE TỰ NHIÊN không dính đất nền (Pure Transparent Assets).
 * 3. Cây cắm rễ trực tiếp vào mặt đất, thân ngọn đung đưa tự do mà không bao giờ bị lộ khung hay vết cắt vuông!
 */

export interface GrassTuft {
  x: number;
  height: number;
  tilt: number;
  swaySpeed: number;
  swayPhase: number;
  color: string;
  hasFlower?: boolean;
  flowerColor?: string;
}

export interface RicePlant {
  id: number;
  x: number;
  type: number; // 0..3 (4 biến thể cây lúa khác nhau)
  stage: 'sprout' | 'growing' | 'ripe';
  scale: number;
  phase: number;
}

export class GrassRenderer {
  // 1. Mặt đất cỏ chuẩn
  private groundTileImg = new Image();
  private isGroundLoaded: boolean = false;

  // 2. Dải lúa thuần (không dính đất nền)
  private riceCanopyImg = new Image();
  private isCanopyLoaded: boolean = false;

  // 3. Các bụi lúa chi tiết độc lập
  private ricePlantImgs: HTMLImageElement[] = [];

  private grassTufts: GrassTuft[] = [];
  public ricePlants: RicePlant[] = [];

  constructor() {
    // Tải mặt đất nền cỏ thống nhất
    this.groundTileImg.src = '/assets/environment/ground_grass_seamless.png';
    this.groundTileImg.onload = () => {
      this.isGroundLoaded = true;
    };

    // Tải dải bông lúa thuần (chỉ gồm thân, lá, bông lúa chín)
    this.riceCanopyImg.src = '/assets/environment/rice_pure_canopy.png';
    this.riceCanopyImg.onload = () => {
      this.isCanopyLoaded = true;
    };

    // Tải 4 biến thể bụi lúa tự nhiên
    for (let i = 1; i <= 4; i++) {
      const img = new Image();
      img.src = `/assets/environment/rice_plant_${i}.png`;
      this.ricePlantImgs.push(img);
    }

    // Khởi tạo ngọn cỏ dại đung đưa
    this.initDynamicGrass(3600);

    // Khởi tạo các khóm lúa tự nhiên trên thửa ruộng
    this.initRiceField();
  }

  private initDynamicGrass(mapWidth: number): void {
    this.grassTufts = [];
    const colors = ['#84cc16', '#65a30d', '#4ade80', '#22c55e', '#a3e635'];
    const flowerColors = ['#fde047', '#f43f5e', '#a855f7', '#ffffff', '#fb923c'];

    for (let x = 20; x < mapWidth; x += 18 + Math.random() * 20) {
      const hasFlower = Math.random() < 0.25;
      this.grassTufts.push({
        x: x,
        height: 12 + Math.random() * 15,
        tilt: (Math.random() - 0.5) * 0.2,
        swaySpeed: 1.5 + Math.random() * 1.8,
        swayPhase: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        hasFlower: hasFlower,
        flowerColor: hasFlower ? flowerColors[Math.floor(Math.random() * flowerColors.length)] : undefined
      });
    }
  }

  private initRiceField(): void {
    this.ricePlants = [];
    // Tạo 10 khóm lúa tự nhiên mọc trên thửa ruộng bên phải (từ x=650 -> 1400)
    let currentX = 640;
    let id = 0;
    while (currentX < 1450) {
      this.ricePlants.push({
        id: id++,
        x: currentX,
        type: Math.floor(Math.random() * 4),
        stage: 'ripe',
        scale: 0.88 + Math.random() * 0.25, // Kích cỡ tự nhiên khác nhau đôi chút
        phase: Math.random() * Math.PI * 2
      });
      currentX += 55 + Math.random() * 30; // Khoảng cách ngẫu nhiên tự nhiên
    }
  }

  /**
   * RENDER TOÀN BỘ MẶT ĐẤT VÀ CÂY CỐI ĐỒNG BỘ
   */
  public renderGround(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    groundY: number,
    playerX: number,
    animTimer: number
  ): void {
    const tileH = 80;
    const groundTop = groundY - 26;
    const soilTop = groundTop + tileH - 12;

    // ------------------------------------------------------------
    // LỚP 1: NỀN ĐẤT THỊT SÂU LIỀN MẠCH TOÀN BẢN ĐỒ
    // ------------------------------------------------------------
    const soilGrad = ctx.createLinearGradient(0, soilTop, 0, height);
    soilGrad.addColorStop(0, '#543015');
    soilGrad.addColorStop(0.35, '#3e210c');
    soilGrad.addColorStop(1, '#241206');
    ctx.fillStyle = soilGrad;
    ctx.fillRect(0, soilTop, width, height - soilTop);

    // Hạt sỏi đất chìm
    ctx.save();
    ctx.fillStyle = 'rgba(28, 14, 5, 0.4)';
    for (let sx = 15; sx < width; sx += 65) {
      const sy = soilTop + 16 + (sx % 22);
      ctx.beginPath();
      ctx.ellipse(sx, sy, 7, 3.5, 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // ------------------------------------------------------------
    // LỚP 2: MẶT ĐẤT CỎ SEAMLESS DUY NHẤT CHẠY XUYÊN SUỐT (100% CÙNG ĐỘ CAO)
    // ------------------------------------------------------------
    if (this.isGroundLoaded && this.groundTileImg.naturalWidth > 0) {
      const origW = this.groundTileImg.naturalWidth;
      const origH = this.groundTileImg.naturalHeight;
      const renderTileW = (origW / origH) * tileH;

      for (let tx = 0; tx < width + renderTileW; tx += renderTileW - 1) {
        ctx.drawImage(this.groundTileImg, tx, groundTop, renderTileW, tileH);
      }
    }

    // ------------------------------------------------------------
    // LỚP 3: BÃI CỎ HOA ĐUNG ĐƯA (Phần đất bên trái: 0 -> 600px)
    // ------------------------------------------------------------
    this.renderDynamicGrass(ctx, 600, groundY, playerX, animTimer);

    // ------------------------------------------------------------
    // LỚP 4: CÁNH ĐỒNG LÚA CHÍN VÀNG (Phần đất bên phải: 600px -> hết)
    // Cây lúa thuần mọc trực tiếp từ mặt đất, đung đưa tự nhiên theo gió
    // ------------------------------------------------------------
    this.renderRiceCrops(ctx, groundY, playerX, animTimer);
  }

  /**
   * Vẽ ngọn cỏ động uốn lượn khi người chơi bước qua
   */
  private renderDynamicGrass(
    ctx: CanvasRenderingContext2D,
    maxX: number,
    groundY: number,
    playerX: number,
    animTimer: number
  ): void {
    ctx.save();
    this.grassTufts.forEach(tuft => {
      if (tuft.x > maxX) return;

      let sway = Math.sin(animTimer * tuft.swaySpeed + tuft.swayPhase) * 5;
      const distToPlayer = Math.abs(tuft.x - playerX);
      if (distToPlayer < 35) {
        const pushDir = tuft.x > playerX ? 1 : -1;
        sway += pushDir * (1 - distToPlayer / 35) * 10;
      }

      const baseX = tuft.x;
      const baseY = groundY - 14;
      const tipX = baseX + sway;
      const tipY = baseY - tuft.height;

      ctx.strokeStyle = tuft.color;
      ctx.lineWidth = 2.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(baseX, baseY);
      ctx.quadraticCurveTo(baseX, baseY - tuft.height * 0.5, tipX, tipY);
      ctx.stroke();

      if (tuft.hasFlower && tuft.flowerColor) {
        ctx.fillStyle = tuft.flowerColor;
        ctx.beginPath();
        ctx.arc(tipX, tipY - 2, 2.6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(tipX, tipY - 2, 1.0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  /**
   * Vẽ các bụi lúa tự nhiên không viền, gốc cắm sâu vào thảm cỏ
   */
  private renderRiceCrops(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    playerX: number,
    animTimer: number
  ): void {
    ctx.save();

    // 1. Vẽ các bụi lúa đơn lẻ cắm rễ vào mặt đất
    this.ricePlants.forEach(plant => {
      const img = this.ricePlantImgs[plant.type];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const dist = Math.abs(plant.x - playerX);
      // Gió thổi đung đưa nhẹ
      let swayAngle = Math.sin(animTimer * 2.2 + plant.phase) * 0.06;

      // Người chơi lội qua làm ngọn lúa nghiêng sang bên
      if (dist < 50) {
        const dir = plant.x > playerX ? 1 : -1;
        swayAngle += dir * (1 - dist / 50) * 0.22;
      }

      const baseH = 76 * plant.scale;
      const baseW = (img.naturalWidth / img.naturalHeight) * baseH;

      // Tọa độ gốc rễ tiếp đất (cắm sâu 6px vào cỏ)
      const rootX = plant.x;
      const rootY = groundY - 14;

      ctx.save();
      ctx.translate(rootX, rootY);
      ctx.rotate(swayAngle);

      if (plant.stage === 'sprout') {
        // Gốc mạ sau khi gặt
        ctx.fillStyle = '#86efac';
        for (let s = -10; s <= 10; s += 5) {
          ctx.fillRect(s, -12, 2.5, 12);
        }
      } else {
        // Vẽ bụi lúa thuần (không có nền đất xung quanh)
        ctx.drawImage(
          img,
          -baseW / 2,
          -baseH,
          baseW,
          baseH
        );
      }

      ctx.restore();
    });

    // 2. Bụi phấn hoa vàng óng bay nhẹ trên cánh đồng
    const pollenCount = 7;
    ctx.fillStyle = 'rgba(250, 204, 21, 0.8)';
    for (let i = 0; i < pollenCount; i++) {
      const px = 600 + ((animTimer * 30 + i * 140) % (ctx.canvas.width));
      const py = groundY - 50 + Math.sin(animTimer * 2.5 + i) * 16;
      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  /**
   * Thu hoạch lúa khi dùng Liềm
   */
  public harvestNearbyRice(playerX: number): { harvested: boolean; count: number } {
    let count = 0;
    this.ricePlants.forEach(plant => {
      if (Math.abs(plant.x - playerX) < 65 && plant.stage === 'ripe') {
        plant.stage = 'sprout';
        count++;
      }
    });
    return { harvested: count > 0, count };
  }
}
