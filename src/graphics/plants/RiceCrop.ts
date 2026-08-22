/**
 * RiceCrop.ts
 * Module chuyên trách vẽ Cánh Đồng Lúa Nước (Kích thước 1/4 gọn gàng: 660px)
 * & Hệ thống Trồng Lúa - Tưới Nước - Sinh Trưởng - Thu Hoạch Tương Tác 100%
 */

export type RiceGrowthStage = 'empty' | 'seedling' | 'tillering' | 'booting' | 'ripe';

export interface RicePlant {
  id: number;
  x: number;
  yOffset: number;
  stage: RiceGrowthStage;
  growthTimer: number; // Đếm thời gian tự động lớn
  watered: boolean;    // Được tưới nước giúp lớn nhanh gấp đôi
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
  private seedlingSprites: HTMLCanvasElement[] = [];
  private tilleringSprites: HTMLCanvasElement[] = [];
  private bootingSprites: HTMLCanvasElement[] = [];
  private ripeFrontSprites: HTMLCanvasElement[] = [];
  private ripeBackSprites: HTMLCanvasElement[] = [];

  private spriteW = 54;
  private spriteH = 64;

  public plants: RicePlant[] = [];
  public particles: FarmingParticle[] = [];

  public paddyStartX = 1440;
  public paddyEndX = 2100; // Chiều dài 660px (1/4 diện tích ban đầu)
  public harvestedGrains: number = 0; // Số thóc vàng đã thu hoạch

  constructor() {
    this.bakeAllSprites();
    this.initRiceField(this.paddyStartX, this.paddyEndX);
  }

  // ============================================================
  // PRE-RENDER 16 BIẾN THỂ SPRITE CÂY LÚA
  // ============================================================
  private bakeAllSprites(): void {
    for (let i = 0; i < 4; i++) {
      this.seedlingSprites.push(this.bakeSprite(ctx => this.drawSeedlingSprite(ctx, i)));
      this.tilleringSprites.push(this.bakeSprite(ctx => this.drawTilleringSprite(ctx, i)));
      this.bootingSprites.push(this.bakeSprite(ctx => this.drawBootingSprite(ctx, i)));
      this.ripeFrontSprites.push(this.bakeSprite(ctx => this.drawRipeSprite(ctx, i, 'front')));
      this.ripeBackSprites.push(this.bakeSprite(ctx => this.drawRipeSprite(ctx, i, 'back')));
    }
  }

  private bakeSprite(drawFn: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = this.spriteW * 2;
    c.height = this.spriteH * 2;
    const ctx = c.getContext('2d')!;
    ctx.scale(2, 2);
    drawFn(ctx);
    return c;
  }

  // 1. Mạ non (14px)
  private drawSeedlingSprite(ctx: CanvasRenderingContext2D, varIdx: number): void {
    const cx = this.spriteW / 2;
    const cy = this.spriteH - 2;
    const h = 14 + (varIdx % 3);

    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - h);
    ctx.stroke();

    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx - 4, cy - h * 0.6, cx - 6, cy - h * 0.85);
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(cx + 4, cy - h * 0.6, cx + 6, cy - h * 0.85);
    ctx.stroke();
  }

  // 2. Lúa đẻ nhánh (22px)
  private drawTilleringSprite(ctx: CanvasRenderingContext2D, varIdx: number): void {
    const cx = this.spriteW / 2;
    const cy = this.spriteH - 2;
    const h = 22 + varIdx * 1.5;

    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - h);
    ctx.stroke();

    const culms = [
      { dx: -8, h: h * 0.85, col: '#16a34a' },
      { dx: -4, h: h * 0.95, col: '#22c55e' },
      { dx: 4,  h: h * 0.95, col: '#22c55e' },
      { dx: 8,  h: h * 0.85, col: '#16a34a' }
    ];

    culms.forEach(c => {
      ctx.strokeStyle = c.col;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + c.dx * 0.5, cy - c.h * 0.6, cx + c.dx, cy - c.h);
      ctx.stroke();
    });
  }

  // 3. Lúa làm đòng (34px)
  private drawBootingSprite(ctx: CanvasRenderingContext2D, varIdx: number): void {
    const cx = this.spriteW / 2;
    const cy = this.spriteH - 2;
    const h = 33 + varIdx * 2.0;

    ctx.strokeStyle = '#166534';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - h);
    ctx.stroke();

    const blades = [
      { dx: -12, h: h * 0.82, col: '#15803d' },
      { dx: -6,  h: h * 0.94, col: '#16a34a' },
      { dx: 6,   h: h * 0.94, col: '#16a34a' },
      { dx: 12,  h: h * 0.82, col: '#15803d' },
      { dx: -2,  h: h * 1.05, col: '#22c55e' }
    ];

    blades.forEach(b => {
      ctx.strokeStyle = b.col;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + b.dx * 0.45, cy - b.h * 0.55, cx + b.dx, cy - b.h);
      ctx.stroke();
    });
  }

  // 4. Lúa chín vàng rơm trĩu bông (56px)
  private drawRipeSprite(ctx: CanvasRenderingContext2D, varIdx: number, layer: 'front' | 'back'): void {
    const cx = this.spriteW / 2;
    const cy = this.spriteH - 2;
    const h = 55 + (varIdx % 3) * 2;
    const bendDir = varIdx % 2 === 0 ? 1 : -1;

    // Thân lúa vươn cao
    ctx.strokeStyle = layer === 'back' ? '#ca8a04' : '#eab308';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - h * 0.65);
    ctx.quadraticCurveTo(cx, cy - h * 0.85, cx + bendDir * 6, cy - h * 0.95);
    ctx.stroke();

    // Lá lúa
    const leaves = [
      { dx: -14 * bendDir, h: h * 0.72, col: '#ca8a04' },
      { dx: -8 * bendDir,  h: h * 0.84, col: '#eab308' },
      { dx: 8 * bendDir,   h: h * 0.78, col: '#eab308' },
      { dx: 14 * bendDir,  h: h * 0.68, col: '#ca8a04' }
    ];

    leaves.forEach(l => {
      ctx.strokeStyle = l.col;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + l.dx * 0.4, cy - l.h * 0.5, cx + l.dx, cy - l.h);
      ctx.stroke();
    });

    // Ngọn bông lúa vàng trĩu xuống
    const earStartX = cx + bendDir * 6;
    const earStartY = cy - h * 0.95;
    const earEndX = earStartX + bendDir * 15;
    const earEndY = earStartY + 17;
    const earCtrlX = earStartX + bendDir * 17;
    const earCtrlY = earStartY - 2;

    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(earStartX, earStartY);
    ctx.quadraticCurveTo(earCtrlX, earCtrlY, earEndX, earEndY);
    ctx.stroke();

    // Hạt thóc vàng rơm
    const grainCount = 11;
    const grainCols = ['#fef08a', '#fde047', '#facc15', '#fef9c3'];

    for (let g = 0; g < grainCount; g++) {
      const t = g / (grainCount - 1);
      const gx = (1 - t) * (1 - t) * earStartX + 2 * (1 - t) * t * earCtrlX + t * t * earEndX;
      const gy = (1 - t) * (1 - t) * earStartY + 2 * (1 - t) * t * earCtrlY + t * t * earEndY;

      const gSide = g % 2 === 0 ? 1 : -1;
      const gxOff = gx + gSide * 2.8;
      const gyOff = gy + (g % 3 === 0 ? 1 : -1) * 1.6;

      ctx.fillStyle = grainCols[(g + varIdx) % grainCols.length];
      ctx.beginPath();
      ctx.ellipse(gxOff, gyOff, 2.7, 1.4, t * 0.8 + 0.3 * bendDir, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 0.4;
      ctx.stroke();
    }
  }

  // ============================================================
  // KHỞI TẠO THỬA RUỘNG LÚA (660px)
  // ============================================================
  public initRiceField(startX: number = 1800, endX: number = 2600): void {
    this.paddyStartX = startX;
    this.paddyEndX = endX;
    this.plants = [];

    const spacing = 10.5; // Khoảng cách cấy khóm mạ chuẩn
    const totalW = endX - startX;
    const quarterW = totalW / 4;

    for (let x = startX + 10; x < endX - 10; x += spacing) {
      const relX = x - startX;
      let stage: RiceGrowthStage = 'seedling';
      if (relX < quarterW) {
        stage = 'seedling';   // Ô 1: Mạ non 14px
      } else if (relX < quarterW * 2) {
        stage = 'tillering';  // Ô 2: Lúa đẻ nhánh 22px
      } else if (relX < quarterW * 3) {
        stage = 'booting';    // Ô 3: Lúa làm đòng 34px
      } else {
        stage = 'ripe';       // Ô 4: Lúa chín vàng trĩu hạt 56px
      }


      const rLayer = Math.random();
      const layer: 'back' | 'mid' | 'front' = rLayer < 0.35 ? 'back' : rLayer < 0.70 ? 'mid' : 'front';

      this.plants.push({
        id: this.plants.length,
        x: x + (Math.random() - 0.5) * 3,
        yOffset: (Math.random() - 0.5) * 2,
        stage: stage,
        growthTimer: 0,
        watered: true,
        layer: layer,
        spriteIndex: Math.floor(Math.random() * 4),
        scale: 0.92 + Math.random() * 0.16,
        lean: (Math.random() - 0.5) * 0.07,
        isFlipped: Math.random() < 0.5,
        phase: Math.random() * Math.PI * 2,
        swaySens: 0.85 + Math.random() * 0.3
      });
    }
  }

  /**
   * Khôi phục trạng thái sinh trưởng của các bụi lúa từ Save Game
   */
  public loadSavedPlants(savedPlants: Array<{ id: number; x: number; stage: string; growthTimer: number; watered: boolean; layer: 'back' | 'mid' | 'front' }>): void {
    if (!savedPlants || savedPlants.length === 0) return;
    for (const sp of savedPlants) {
      const existing = this.plants.find(p => p.id === sp.id || Math.abs(p.x - sp.x) < 3);
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
    // 1. Cập nhật sinh trưởng tự nhiên của từng khóm lúa
    this.plants.forEach(plant => {
      if (plant.stage !== 'empty' && plant.stage !== 'ripe') {
        const speed = plant.watered ? 1.5 : 0.8;
        plant.growthTimer += dt * speed;

        // Mỗi 10 giây lúa lớn lên 1 giai đoạn
        if (plant.growthTimer >= 10.0) {
          plant.growthTimer = 0;
          if (plant.stage === 'seedling') plant.stage = 'tillering';
          else if (plant.stage === 'tillering') plant.stage = 'booting';
          else if (plant.stage === 'booting') plant.stage = 'ripe';
        }
      }
    });

    // 2. Cập nhật các hạt bay (hiệu ứng thu hoạch & tưới nước)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * 1.2;
      if (p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  // ============================================================
  // HỆ THỐNG TRỒNG LÚA - TƯỚI NƯỚC - GẶT LÚA
  // ============================================================

  /**
   * Cấy Mạ Non (Phím [E] hoặc Nút bấm)
   */
  public plantSeedling(playerX: number, groundY: number): boolean {
    if (playerX < this.paddyStartX - 10 || playerX > this.paddyEndX + 10) return false;

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
      // Cấy khóm mới ngay chân người chơi nếu chưa có
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

  /**
   * Tưới Nước / Chăm Sóc Lúa (Phím [Q])
   */
  public waterNearby(playerX: number): boolean {
    let watered = false;
    this.plants.forEach(p => {
      if (Math.abs(p.x - playerX) < 55) {
        p.watered = true;
        // Kích thích lớn thêm 3.5 giây ngay lập tức
        p.growthTimer += 3.5;
        if (p.growthTimer >= 10.0 && p.stage !== 'ripe' && p.stage !== 'empty') {
          p.growthTimer = 0;
          if (p.stage === 'seedling') p.stage = 'tillering';
          else if (p.stage === 'tillering') p.stage = 'booting';
          else if (p.stage === 'booting') p.stage = 'ripe';
        }
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
  public harvestNearby(playerX: number): { harvested: boolean; count: number } {
    let count = 0;
    this.plants.forEach(p => {
      if (Math.abs(p.x - playerX) < 50 && p.stage === 'ripe') {
        p.stage = 'empty'; // Thu hoạch xong để đất trống cấy vụ mới
        p.growthTimer = 0;
        count++;
        this.spawnHarvestParticles(p.x, 480);
      }
    });

    if (count > 0) {
      this.harvestedGrains += count * 10;
    }

    return { harvested: count > 0, count };
  }

  // ============================================================
  // HIỆU ỨNG HẠT VÀNG & GIỌT NƯỚC
  // ============================================================
  private spawnHarvestParticles(x: number, y: number): void {
    for (let i = 0; i < 12; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 16,
        y: y - 25 + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 60,
        vy: -50 - Math.random() * 60,
        alpha: 1.0,
        color: Math.random() < 0.6 ? '#facc15' : '#fef08a',
        size: 2.5 + Math.random() * 2.0
      });
    }
    // Chữ bay +10 Thóc
    this.particles.push({
      x: x - 15,
      y: y - 45,
      vx: 0,
      vy: -25,
      alpha: 1.0,
      color: '#facc15',
      size: 14,
      text: '+10 🌾'
    });
  }

  private spawnWaterParticles(x: number, startX: number): void {
    for (let i = 0; i < 8; i++) {
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
  // RENDER MẶT NƯỚC NÔNG & CÂY LÚA THEO PHÂN LỚP 2.5D
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
    const actualWaterY = groundY - 1; // Mặt nước nông xăm xắp (ngập 7px)
    const waterBottomY = groundY + 6;

    const minViewX = cameraX - 60;
    const maxViewX = cameraX + viewportW + 60;

    // A. VẼ MẶT NƯỚC NÔNG (Chính xác từ 1400m -> 2200m, không chòi ra ngoài)
    if (layerFilter === 'background' || layerFilter === 'all') {
      ctx.save();

      const waterGrad = ctx.createLinearGradient(0, actualWaterY, 0, waterBottomY);
      waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.85)');
      waterGrad.addColorStop(0.5, 'rgba(2, 132, 199, 0.90)');
      waterGrad.addColorStop(1, '#075985');
      ctx.fillStyle = waterGrad;

      // Mặt nước nằm CHÍNH XÁC trong lòng 4 đoạn 8, 9, 10, 11 (1400m -> 2200m)
      ctx.beginPath();
      ctx.moveTo(pStartX, actualWaterY);
      ctx.lineTo(pEndX, actualWaterY);
      ctx.lineTo(pEndX, waterBottomY);
      ctx.lineTo(pStartX, waterBottomY);
      ctx.closePath();
      ctx.fill();

      // Viền sáng lấp lánh trên bề mặt nước
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.0;
      ctx.beginPath();
      ctx.moveTo(pStartX, actualWaterY);
      ctx.lineTo(pEndX, actualWaterY);
      ctx.stroke();

      // Vệt sáng lấp lánh trên mặt nước
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let wx = pStartX + 10; wx <= pEndX - 45; wx += 65) {
        const shimmerW = 38;
        const shimmerY = actualWaterY + 1.5 + Math.sin(animTimer * 1.5 + wx * 0.05) * 1.0;
        ctx.fillRect(wx, shimmerY, shimmerW, 1.4);
      }

      // Gợn sóng nước li ti
      ctx.strokeStyle = 'rgba(224, 242, 254, 0.35)';
      ctx.lineWidth = 0.9;
      for (let rx = pStartX + 20; rx <= pEndX - 20; rx += 50) {
        const ripT = (animTimer * 1.5 + (rx * 0.1)) % (Math.PI * 2);
        const ripRadius = 4 + Math.sin(ripT) * 2.5;
        const ripAlpha = 0.35 * (1 - (ripRadius / 6.5));
        if (ripAlpha > 0.05) {
          ctx.strokeStyle = `rgba(224, 242, 254, ${ripAlpha})`;
          ctx.beginPath();
          ctx.ellipse(rx, actualWaterY + 2, ripRadius * 1.5, ripRadius * 0.35, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Sóng nước quanh chân người chơi (Chỉ kích hoạt khi ở trong thửa ruộng 1400m -> 2200m)
      if (playerX >= pStartX && playerX <= pEndX) {
        const pRip = (animTimer * 3.0) % (Math.PI * 2);
        const pRad = 8 + Math.sin(pRip) * 4;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(playerX, actualWaterY + 4, pRad * 1.5, pRad * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
        for (let s = 0; s < 3; s++) {
          const sx = playerX - 10 + s * 10 + Math.sin(animTimer * 10 + s) * 3;
          const sy = actualWaterY + 1 - Math.sin(animTimer * 8 + s) * 5;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    // B. VẼ CÂY LÚA THEO PHÂN LỚP
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

        let sway = Math.sin(animTimer * 2.0 + plant.phase) * 0.025 * plant.swaySens;
        if (dist < 36) {
          const dir = plant.x > playerX ? 1 : -1;
          sway += dir * (1 - dist / 36) * 0.12 * plant.swaySens;
        }

        ctx.save();
        ctx.translate(plant.x, plantRootY);
        ctx.rotate(sway + plant.lean);

        if (plant.isFlipped) {
          ctx.scale(-1, 1);
        }

        let sprite: HTMLCanvasElement | null = null;
        if (plant.stage === 'seedling') {
          sprite = this.seedlingSprites[plant.spriteIndex];
        } else if (plant.stage === 'tillering') {
          sprite = this.tilleringSprites[plant.spriteIndex];
        } else if (plant.stage === 'booting') {
          sprite = this.bootingSprites[plant.spriteIndex];
        } else if (plant.stage === 'ripe') {
          sprite = plant.layer === 'back'
            ? this.ripeBackSprites[plant.spriteIndex]
            : this.ripeFrontSprites[plant.spriteIndex];
        }

        if (sprite) {
          const w = this.spriteW * plant.scale;
          const h = this.spriteH * plant.scale;
          ctx.drawImage(sprite, -w / 2, -h + 2, w, h);
        }

        ctx.restore();
      }
    });

    // C. VẼ CÁC HẠT PARTICLES (Hiệu ứng thu hoạch, tưới nước, cấy mạ)
    if (layerFilter === 'foreground' || layerFilter === 'all') {
      ctx.save();
      this.particles.forEach(p => {
        ctx.globalAlpha = Math.max(0, p.alpha);
        if (p.text) {
          ctx.font = 'bold 13px Inter, sans-serif';
          ctx.fillStyle = p.color;
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 4;
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
