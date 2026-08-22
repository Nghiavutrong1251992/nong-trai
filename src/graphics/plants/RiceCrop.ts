/**
 * RiceCrop.ts
 * Module chuyên trách vẽ Cánh Đồng Lúa Nước Làng Quê Đậm Nét Tranh Vẽ:
 * - Sử dụng Sprite Ảnh Vẽ Tay Nghệ Thuật (Hand-drawn Watercolor Rice Sprites)
 *   khớp 100% phong cách nhân vật & tranh truyện dân gian Việt Nam.
 * - Trình diễn đầy đủ 4 GIAI ĐOẠN SINH TRƯỞNG trên 4 PHÂN ĐOẠN 12, 13, 14, 15:
 *   + Đoạn 12 (1800m -> 2000m): 🌱 Mạ Non Mới Cấy (Seedling)
 *   + Đoạn 13 (2000m -> 2200m): 🌿 Lúa Đẻ Nhánh Xanh Tươi (Tillering)
 *   + Đoạn 14 (2200m -> 2400m): 🌾 Lúa Làm Đòng Trổ Bông Xanh (Booting)
 *   + Đoạn 15 (2400m -> 2600m): 🌾 Lúa Chín Vàng Trĩu Hạt (Ripe)
 */

export type RiceGrowthStage = 'empty' | 'seedling' | 'tillering' | 'booting' | 'ripe';

export interface RicePlant {
  id: number;
  x: number;
  yOffset: number;
  stage: RiceGrowthStage;
  growthTimer: number;
  watered: boolean;
  layer: 'back' | 'mid' | 'front';
  spriteIndex: number;
  scale: number;
  lean: number;
  isFlipped: boolean;
  phase: number;
  swaySens: number;
}

export interface FarmingParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
  text?: string;
}

export class RiceCrop {
  private ripeImg: HTMLImageElement | null = null;
  private greenImg: HTMLImageElement | null = null;
  private seedlingImg: HTMLImageElement | null = null;
  public imagesLoaded: boolean = false;

  public plants: RicePlant[] = [];
  public particles: FarmingParticle[] = [];

  public paddyStartX = 1800;
  public paddyEndX = 2600; // Chiều dài 800px (Đoạn 12, 13, 14, 15)
  public harvestedGrains: number = 0; // Số thóc vàng đã thu hoạch

  constructor() {
    this.loadArtSprites();
    this.initRiceField(this.paddyStartX, this.paddyEndX);
  }

  // ============================================================
  // LOAD SPRITE ẢNH VẼ TAY NGHỆ THUẬT
  // ============================================================
  private loadArtSprites(): void {
    let loadedCount = 0;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= 3) {
        this.imagesLoaded = true;
      }
    };

    const v = Date.now();
    this.ripeImg = new Image();
    this.ripeImg.src = `/assets/props/rice_ripe.png?v=${v}`;
    this.ripeImg.onload = checkAllLoaded;

    this.greenImg = new Image();
    this.greenImg.src = `/assets/props/rice_green.png?v=${v}`;
    this.greenImg.onload = checkAllLoaded;

    this.seedlingImg = new Image();
    this.seedlingImg.src = `/assets/props/rice_seedling.png?v=${v}`;
    this.seedlingImg.onload = checkAllLoaded;

  }

  // ============================================================
  // KHỞI TẠO ĐỦ 4 GIAI ĐOẠN TỪ ĐOẠN 12 ĐẾN ĐOẠN 15
  // ============================================================
  public initRiceField(startX: number = 3200, endX: number = 4000): void {
    this.paddyStartX = startX;
    this.paddyEndX = endX;
    this.plants = [];

    const spacing = 11.5; // Khoảng cách cấy khóm mạ chuẩn dày dặn

    for (let x = startX + 10; x <= endX - 10; x += spacing) {
      let stage: RiceGrowthStage = 'seedling';

      // Phân chia chính xác 4 giai đoạn sinh trưởng vào đúng 4 Đoạn 19, 20, 21, 22:
      if (x < 3400) {
        // Đoạn 19 (3200m -> 3400m): 🌱 Mạ Non Mới Cấy
        stage = 'seedling';
      } else if (x < 3600) {
        // Đoạn 20 (3400m -> 3600m): 🌿 Lúa Đẻ Nhánh Xanh Tươi
        stage = 'tillering';
      } else if (x < 3800) {
        // Đoạn 21 (3600m -> 3800m): 🌾 Lúa Làm Đòng Trổ Bông Xanh
        stage = 'booting';
      } else {
        // Đoạn 22 (3800m -> 4000m): 🌾 Lúa Chín Vàng Trĩu Hạt
        stage = 'ripe';
      }


      const rLayer = Math.random();
      const layer: 'back' | 'mid' | 'front' = rLayer < 0.35 ? 'back' : rLayer < 0.70 ? 'mid' : 'front';

      this.plants.push({
        id: this.plants.length,
        x: x + (Math.random() - 0.5) * 4,
        yOffset: (Math.random() - 0.5) * 3,
        stage: stage,
        growthTimer: 0,
        watered: true,
        layer: layer,
        spriteIndex: Math.floor(Math.random() * 4),
        scale: 0.90 + Math.random() * 0.18,
        lean: (Math.random() - 0.5) * 0.08,
        isFlipped: Math.random() < 0.5,
        phase: Math.random() * Math.PI * 2,
        swaySens: 0.85 + Math.random() * 0.35
      });
    }
  }

  /**
   * Khôi phục trạng thái sinh trưởng của các bụi lúa từ Save Game
   */
  public loadSavedPlants(savedPlants: Array<{ id: number; x: number; stage: string; growthTimer: number; watered: boolean; layer: 'back' | 'mid' | 'front' }>): void {
    if (!savedPlants || savedPlants.length === 0) return;
    // Kiểm tra xem dữ liệu cũ có thuộc vùng 1800m - 2600m không
    const validPaddy = savedPlants.some(p => p.x >= 1800 && p.x <= 2600);
    if (!validPaddy) return;

    for (const sp of savedPlants) {
      const existing = this.plants.find(p => p.id === sp.id || Math.abs(p.x - sp.x) < 4);
      if (existing) {
        existing.stage = sp.stage as RiceGrowthStage;
        existing.growthTimer = sp.growthTimer;
        existing.watered = sp.watered;
      }
    }
  }

  // ============================================================
  // CẬP NHẬT SINH TRƯỞNG & HIỆU ỨNG HẠT VÀNG
  // ============================================================
  public update(dt: number): void {
    // Cập nhật các hạt bay (Particles)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.alpha -= dt * 1.2;

      if (pt.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // ============================================================
  // TƯƠNG TÁC: CẤY MẠ - TƯỚI NƯỚC - THU HOẠCH
  // ============================================================

  /**
   * Cấy Mạ Non (Phím [E] khi đứng ở ô đất trống)
   */
  public plantNearby(playerX: number, groundY: number = 480): boolean {
    if (playerX < this.paddyStartX || playerX > this.paddyEndX) return false;

    let planted = false;
    let closestEmpty: RicePlant | null = null;
    let minDist = 45;

    this.plants.forEach(p => {
      const dist = Math.abs(p.x - playerX);
      if (dist < minDist && p.stage === 'empty') {
        minDist = dist;
        closestEmpty = p;
      }
    });

    if (closestEmpty) {
      (closestEmpty as RicePlant).stage = 'seedling';
      (closestEmpty as RicePlant).growthTimer = 0;
      (closestEmpty as RicePlant).watered = true;
      planted = true;
      this.spawnSproutParticles((closestEmpty as RicePlant).x, groundY + 2);
    } else {
      const rLayer = Math.random();
      const layer: 'back' | 'mid' | 'front' = rLayer < 0.35 ? 'back' : rLayer < 0.70 ? 'mid' : 'front';
      this.plants.push({
        id: this.plants.length,
        x: playerX + (Math.random() - 0.5) * 6,
        yOffset: (Math.random() - 0.5) * 2,
        stage: 'seedling',
        growthTimer: 0,
        watered: true,
        layer: layer,
        spriteIndex: Math.floor(Math.random() * 4),
        scale: 0.95,
        lean: 0,
        isFlipped: Math.random() < 0.5,
        phase: Math.random() * Math.PI * 2,
        swaySens: 1.0
      });
      planted = true;
      this.spawnSproutParticles(playerX, groundY + 2);
    }

    return planted;
  }

  public plantSeedling(playerX: number, groundY: number = 480): boolean {
    return this.plantNearby(playerX, groundY);
  }

  /**
   * Tưới Nước / Chăm Sóc Lúa (Phím [Q])
   */
  public waterNearby(playerX: number): boolean {
    let watered = false;
    this.plants.forEach(p => {
      if (Math.abs(p.x - playerX) < 55) {
        p.watered = true;
        // Kích thích lớn sang giai đoạn tiếp theo khi tưới
        if (p.stage === 'seedling') p.stage = 'tillering';
        else if (p.stage === 'tillering') p.stage = 'booting';
        else if (p.stage === 'booting') p.stage = 'ripe';
        watered = true;
      }
    });

    if (watered) {
      this.spawnWaterParticles(playerX, this.paddyStartX);
    }

    return watered;
  }

  /**
   * Gặt Lúa Chín Vàng (Phím [E] khi đứng cạnh lúa chín)
   */
  public harvestNearby(playerX: number, groundY: number = 480): { harvested: boolean; count: number } {
    let totalHarvested = 0;

    this.plants.forEach(p => {
      if (p.stage === 'ripe' && Math.abs(p.x - playerX) < 45) {
        p.stage = 'empty';
        p.growthTimer = 0;
        p.watered = false;
        totalHarvested += 1;
        this.harvestedGrains += 1;

        // Sinh hạt thóc vàng tung tóe
        for (let k = 0; k < 12; k++) {
          this.particles.push({
            x: p.x + (Math.random() - 0.5) * 16,
            y: groundY - 15 - Math.random() * 20,
            vx: (Math.random() - 0.5) * 90,
            vy: -40 - Math.random() * 60,
            alpha: 1.0,
            color: '#facc15',
            size: 2.8
          });
        }
      }
    });

    if (totalHarvested > 0) {
      this.particles.push({
        x: playerX - 15,
        y: groundY - 45,
        vx: 0,
        vy: -25,
        alpha: 1.0,
        color: '#fde047',
        size: 14,
        text: `🌾 +${totalHarvested} Bó Lúa`
      });
    }

    return { harvested: totalHarvested > 0, count: totalHarvested };
  }

  public findNearbyRipe(playerX: number, maxDist: number = 45): RicePlant | null {
    let closest: RicePlant | null = null;
    let minDist = maxDist;
    this.plants.forEach(p => {
      if (p.stage === 'ripe') {
        const dist = Math.abs(p.x - playerX);
        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      }
    });
    return closest;
  }

  public findNearbyEmpty(playerX: number, maxDist: number = 45): RicePlant | null {
    let closest: RicePlant | null = null;
    let minDist = maxDist;
    this.plants.forEach(p => {
      if (p.stage === 'empty') {
        const dist = Math.abs(p.x - playerX);
        if (dist < minDist) {
          minDist = dist;
          closest = p;
        }
      }
    });
    return closest;
  }

  // ============================================================
  // HIỆU ỨNG HẠT PARTICLES
  // ============================================================
  private spawnWaterParticles(x: number, _paddyStartX: number): void {
    for (let i = 0; i < 14; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 35,
        y: 480 - 15 + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 30,
        vy: -25 - Math.random() * 30,
        alpha: 1.0,
        color: '#38bdf8',
        size: 2.2
      });
    }
  }

  private spawnSproutParticles(x: number, y: number): void {
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 12,
        y: y - 5,
        vx: (Math.random() - 0.5) * 25,
        vy: -30 - Math.random() * 30,
        alpha: 1.0,
        color: '#4ade80',
        size: 2.0
      });
    }
    this.particles.push({
      x: x - 18,
      y: y - 28,
      vx: 0,
      vy: -20,
      alpha: 1.0,
      color: '#4ade80',
      size: 13,
      text: '🌱 Cấy Mạ'
    });
  }

  // ============================================================
  // RENDER MẶT NƯỚC NÔNG & CÂY LÚA VẼ TAY THEO PHÂN LỚP 2.5D
  // ============================================================
  public render(
    ctx: CanvasRenderingContext2D,
    groundY: number,
    playerX: number,
    animTimer: number,
    cameraX: number = 0,
    viewportW: number = 1400,
    layerFilter: 'background' | 'foreground' | 'all' = 'all'
  ): void {
    const pStartX = this.paddyStartX;
    const pEndX = this.paddyEndX;
    const actualWaterY = groundY + 1; // Hạ thấp 1 nửa, mực nước cao ngang bằng bờ cỏ
    const waterBottomY = groundY + 8;

    const minViewX = cameraX - 80;
    const maxViewX = cameraX + viewportW + 80;

    // A. VẼ MẶT NƯỚC NỀN RUỘNG LÚA (LỚP ĐÁY BÙN & PHẢN CHIẾU HẬU CẢNH)
    if (layerFilter === 'background' || layerFilter === 'all') {
      ctx.save();

      const waterGrad = ctx.createLinearGradient(0, actualWaterY, 0, waterBottomY);
      waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)'); // Nước trong xanh phản chiếu trời
      waterGrad.addColorStop(0.4, 'rgba(14, 116, 144, 0.60)');
      waterGrad.addColorStop(1.0, 'rgba(4, 47, 46, 0.80)'); // Đáy bùn phù sa
      ctx.fillStyle = waterGrad;

      const slopeLeftX = pStartX - 18;
      const slopeRightX = pEndX + 32;

      ctx.beginPath();
      ctx.moveTo(slopeLeftX, actualWaterY);
      ctx.lineTo(slopeRightX, actualWaterY);
      // Vát thoải bờ phải lên bờ đê
      ctx.quadraticCurveTo(pEndX + 8, actualWaterY + 3, pEndX - 8, waterBottomY);
      ctx.lineTo(pStartX + 8, waterBottomY);
      // Vát thoải bờ trái lên sườn đồi
      ctx.quadraticCurveTo(pStartX - 6, actualWaterY + 3, slopeLeftX, actualWaterY);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }



    // B. VẼ CÂY LÚA NGHỆ THUẬT THEO PHÂN LỚP
    const baseRootY = groundY + 4;
    const targetLayers: Array<'back' | 'mid' | 'front'> =
      layerFilter === 'background' ? ['back', 'mid'] :
      layerFilter === 'foreground' ? ['front'] : ['back', 'mid', 'front'];

    targetLayers.forEach(layerName => {
      for (let i = 0; i < this.plants.length; i++) {
        const plant = this.plants[i];
        if (plant.stage === 'empty') continue;
        if (plant.layer !== layerName || plant.x < minViewX || plant.x > maxViewX) {
          continue;
        }

        const plantRootY = baseRootY + plant.yOffset;
        const dist = Math.abs(plant.x - playerX);

        // Gió thổi đung đưa nhịp nhàng
        let sway = Math.sin(animTimer * 2.2 + plant.phase) * 0.035 * plant.swaySens;
        // Rẽ lúa mềm mại khi người chơi bước qua
        if (dist < 38) {
          const dir = plant.x > playerX ? 1 : -1;
          sway += dir * (1 - dist / 38) * 0.14 * plant.swaySens;
        }

        ctx.save();
        ctx.translate(plant.x, plantRootY);
        ctx.rotate(sway + plant.lean);

        if (plant.isFlipped) {
          ctx.scale(-1, 1);
        }

        // Chọn hình ảnh sprite vẽ tay tương ứng với từng giai đoạn
        let img: HTMLImageElement | null = null;
        let baseW = 56;
        let baseH = 68;

        if (plant.stage === 'seedling') {
          // Giai đoạn 1: Mạ non mới cấy
          img = this.seedlingImg;
          baseW = 34;
          baseH = 42;
        } else if (plant.stage === 'tillering') {
          // Giai đoạn 2: Lúa đẻ nhánh
          img = this.seedlingImg;
          baseW = 46;
          baseH = 56;
        } else if (plant.stage === 'booting') {
          // Giai đoạn 3: Lúa làm đòng trổ bông xanh
          img = this.greenImg;
          baseW = 54;
          baseH = 66;
        } else if (plant.stage === 'ripe') {
          // Giai đoạn 4: Lúa chín vàng trĩu hạt
          img = this.ripeImg;
          baseW = 58;
          baseH = 72;
        }

        if (img && img.complete && img.naturalWidth > 0) {
          const w = baseW * plant.scale;
          const h = baseH * plant.scale;
          // Vẽ gốc lúa cắm dưới bùn nước, ngọn vươn lên
          ctx.drawImage(img, -w / 2, -h + 2, w, h);
        }

        ctx.restore();
      }
    });

    // C. VẼ LỚP NƯỚC TIỀN CẢNH CHE PHỦ GỐC LÚA & BÈO TẤM & SÓNG NƯỚC (FOREGROUND WATER OVERLAY)
    if (layerFilter === 'foreground' || layerFilter === 'all') {
      ctx.save();

      // Lớp nước trong suốt phủ ngang qua che chìm 8px - 10px gốc thân lúa
      const fgWaterGrad = ctx.createLinearGradient(0, actualWaterY, 0, waterBottomY);
      fgWaterGrad.addColorStop(0.0, 'rgba(56, 189, 248, 0.45)'); // Nước biếc trong xanh
      fgWaterGrad.addColorStop(0.5, 'rgba(14, 116, 144, 0.50)');
      fgWaterGrad.addColorStop(1.0, 'rgba(4, 47, 46, 0.65)');
      ctx.fillStyle = fgWaterGrad;

      const slopeLeftX = pStartX - 18;
      const slopeRightX = pEndX + 32;

      ctx.beginPath();
      ctx.moveTo(slopeLeftX, actualWaterY);
      ctx.lineTo(slopeRightX, actualWaterY);
      // Vát cong mềm mại ở mép bờ phải lên bờ đê
      ctx.quadraticCurveTo(pEndX + 8, actualWaterY + 3, pEndX - 8, waterBottomY);
      ctx.lineTo(pStartX + 8, waterBottomY);
      // Vát cong mềm mại ở mép bờ trái xuống lòng ruộng
      ctx.quadraticCurveTo(pStartX - 6, actualWaterY + 3, slopeLeftX, actualWaterY);
      ctx.closePath();
      ctx.fill();

      // Đường mép nước lấp lánh trên bề mặt (vát cong êm dịu)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(slopeLeftX, actualWaterY + 0.5);
      ctx.lineTo(slopeRightX, actualWaterY + 0.5);
      ctx.stroke();


      // Bèo tấm xanh non nổi dập dềnh quanh gốc lúa
      ctx.fillStyle = '#4ade80';
      for (let bx = pStartX + 12; bx <= pEndX - 12; bx += 24) {
        const by = actualWaterY + 1.2 + Math.sin(animTimer * 1.8 + bx * 0.08) * 0.6;
        ctx.beginPath();
        ctx.ellipse(bx, by, 2.2, 1.0, 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(bx + 2.5, by - 0.4, 1.8, 0.8, -0.3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Vệt sáng lấp lánh phản chiếu mặt trời
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let wx = pStartX + 18; wx <= pEndX - 18; wx += 40) {
        const shimmerW = 10 + ((wx * 7) % 14);
        const shimmerY = actualWaterY + 0.8 + Math.sin(animTimer * 2.0 + wx * 0.06) * 0.6;
        ctx.fillRect(wx, shimmerY, shimmerW, 1.0);
      }

      // Gợn sóng nước li ti
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.45)';
      ctx.lineWidth = 0.9;
      for (let rx = pStartX + 25; rx <= pEndX - 25; rx += 60) {
        const ripT = (animTimer * 1.5 + (rx * 0.1)) % (Math.PI * 2);
        const ripRadius = 3.5 + Math.sin(ripT) * 2.0;
        const ripAlpha = 0.40 * (1 - (ripRadius / 5.5));
        if (ripAlpha > 0.05) {
          ctx.strokeStyle = `rgba(224, 242, 254, ${ripAlpha})`;
          ctx.beginPath();
          ctx.ellipse(rx, actualWaterY + 1.5, ripRadius * 1.5, ripRadius * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Sóng nước rẽ quanh bước chân người chơi trong ruộng lúa
      if (playerX >= pStartX && playerX <= pEndX) {
        const pRip = (animTimer * 3.5) % (Math.PI * 2);
        const pRad = 7 + Math.sin(pRip) * 4;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(playerX, actualWaterY + 2.0, pRad * 1.5, pRad * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        for (let s = 0; s < 4; s++) {
          const sx = playerX - 12 + s * 8 + Math.sin(animTimer * 12 + s) * 3;
          const sy = actualWaterY + 0.5 - Math.sin(animTimer * 9 + s) * 3;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.0, 0, Math.PI * 2);
          ctx.fill();
        }
      }


      ctx.restore();
    }

    // D. VẼ CÁC HẠT PARTICLES (Hiệu ứng thu hoạch, tưới nước, cấy mạ)
    if (layerFilter === 'foreground' || layerFilter === 'all') {
      ctx.save();
      this.particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.alpha);
        if (p.text) {
          ctx.font = 'bold 13px "Segoe UI", sans-serif';
          ctx.fillStyle = p.color;
          ctx.fillText(p.text, p.x, p.y);
        } else {
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.restore();
    }

  }
}
