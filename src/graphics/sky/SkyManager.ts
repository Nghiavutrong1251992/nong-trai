/**
 * SkyManager.ts
 * Hệ thống Bầu Trời Làng Quê Động Đa Dạng & Tuyệt Đẹp:
 * - 🌅 Bình Minh (Dawn / Sáng sớm)
 * - ☀️ Ban Ngày (Day / Buổi trưa)
 * - 🌇 Hoàng Hôn (Sunset / Chiều tà)
 * - 🌙 Đêm Có Trăng (Night with Moon)
 * - 🌌 Đêm Không Trăng (Dark Starry Night)
 * - ☁️ / ✨ Tùy chọn Có Mây hoặc Không Mây
 * - Mây đen giông bão: Đầu mây tiến từ Trái sang Phải, hết mưa thì đuôi mây cũng tiến từ Trái sang Phải trôi ra ngoài mép phải
 */

import { WeatherType } from './WeatherManager';

export type TimePeriod = 'dawn' | 'noon' | 'sunset' | 'night_moon' | 'night_dark';

export interface Star {
  x: number;
  y: number;
  size: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

export interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  life: number;
  maxLife: number;
}

export class SkyManager {
  public currentPeriod: TimePeriod = 'noon';
  public hasClouds: boolean = true;
  public autoCycle: boolean = false;
  public timeHour: number = 12.0;

  private stars: Star[] = [];
  private milkyWayStars: Star[] = [];
  private shootingStars: ShootingStar[] = [];
  private nextShootingStarTimer: number = 3.5;
  private animTimer: number = 0;

  constructor() {
    this.initStars();
  }

  private initStars(): void {
    this.stars = [];
    const starColors = ['#ffffff', '#fef08a', '#93c5fd', '#fbcfe8', '#fed7aa'];
    for (let i = 0; i < 160; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random() * 0.72,
        size: 0.8 + Math.random() * 1.8,
        alpha: 0.35 + Math.random() * 0.65,
        twinkleSpeed: 1.5 + Math.random() * 3.5,
        twinklePhase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      });
    }

    this.milkyWayStars = [];
    for (let i = 0; i < 90; i++) {
      const t = Math.random();
      const spread = (Math.random() - 0.5) * 0.18;
      this.milkyWayStars.push({
        x: t,
        y: Math.max(0.02, Math.min(0.65, 0.55 - t * 0.45 + spread)),
        size: 0.6 + Math.random() * 1.4,
        alpha: 0.4 + Math.random() * 0.6,
        twinkleSpeed: 2.0 + Math.random() * 4.0,
        twinklePhase: Math.random() * Math.PI * 2,
        color: starColors[Math.floor(Math.random() * starColors.length)]
      });
    }
  }

  public update(dt: number): void {
    this.animTimer += dt;

    if (this.autoCycle) {
      this.timeHour = (this.timeHour + (dt / 180.0) * 24.0) % 24.0;
      if (this.timeHour >= 5.0 && this.timeHour < 8.0) this.currentPeriod = 'dawn';
      else if (this.timeHour >= 8.0 && this.timeHour < 16.5) this.currentPeriod = 'noon';
      else if (this.timeHour >= 16.5 && this.timeHour < 19.0) this.currentPeriod = 'sunset';
      else if (this.timeHour >= 19.0 && this.timeHour < 23.5) this.currentPeriod = 'night_moon';
      else this.currentPeriod = 'night_dark';
    }

    if (this.currentPeriod === 'night_moon' || this.currentPeriod === 'night_dark') {
      this.nextShootingStarTimer -= dt;
      if (this.nextShootingStarTimer <= 0) {
        this.nextShootingStarTimer = 3.0 + Math.random() * 5.0;
        this.shootingStars.push({
          x: 0.15 + Math.random() * 0.75,
          y: 0.05 + Math.random() * 0.25,
          vx: 200 + Math.random() * 140,
          vy: 85 + Math.random() * 75,
          len: 48 + Math.random() * 38,
          life: 0,
          maxLife: 0.6 + Math.random() * 0.35
        });
      }

      for (let i = this.shootingStars.length - 1; i >= 0; i--) {
        const s = this.shootingStars[i];
        s.life += dt;
        if (s.life >= s.maxLife) {
          this.shootingStars.splice(i, 1);
        }
      }
    } else {
      this.shootingStars = [];
    }
  }

  public toggleClouds(): boolean {
    this.hasClouds = !this.hasClouds;
    return this.hasClouds;
  }

  public setTimePeriod(period: TimePeriod): void {
    this.currentPeriod = period;
    if (period === 'dawn') this.timeHour = 6.0;
    else if (period === 'noon') this.timeHour = 12.0;
    else if (period === 'sunset') this.timeHour = 17.5;
    else if (period === 'night_moon') this.timeHour = 21.0;
    else this.timeHour = 1.0;
  }

  /**
   * Render toàn bộ bầu trời
   */
  public renderSky(
    ctx: CanvasRenderingContext2D,
    width: number,
    groundY: number,
    weather: WeatherType = 'clear',
    cloudFrontProgress: number = 0.0,
    cloudTailProgress: number = 0.0,
    stormDarkness: number = 0.0
  ): void {
    ctx.save();

    // 1. NỀN GRADIENT BẦU TRỜI CHÍNH
    const skyGrad = ctx.createLinearGradient(0, 0, 0, groundY);

    if (this.currentPeriod === 'dawn') {
      skyGrad.addColorStop(0, '#e879f9');
      skyGrad.addColorStop(0.30, '#fb7185');
      skyGrad.addColorStop(0.65, '#fb923c');
      skyGrad.addColorStop(1, '#fef08a');
    } else if (this.currentPeriod === 'noon') {
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.35, '#38bdf8');
      skyGrad.addColorStop(0.75, '#bae6fd');
      skyGrad.addColorStop(1, '#fef9c3');
    } else if (this.currentPeriod === 'sunset') {
      skyGrad.addColorStop(0, '#4c1d95');
      skyGrad.addColorStop(0.30, '#9f1239');
      skyGrad.addColorStop(0.65, '#ea580c');
      skyGrad.addColorStop(1, '#fde047');
    } else if (this.currentPeriod === 'night_moon') {
      skyGrad.addColorStop(0, '#030712');
      skyGrad.addColorStop(0.40, '#0b132b');
      skyGrad.addColorStop(0.80, '#1e1b4b');
      skyGrad.addColorStop(1, '#0c4a6e');
    } else {
      skyGrad.addColorStop(0, '#000000');
      skyGrad.addColorStop(0.40, '#030712');
      skyGrad.addColorStop(0.75, '#0b0f19');
      skyGrad.addColorStop(1, '#0f172a');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, groundY);

    // 2. PHỦ TẦNG BẦU TRỜI SẪM TỐI TIẾN TỪ TRÁI SANG PHẢI
    if (stormDarkness > 0.01) {
      const frontX = -200 + cloudFrontProgress * (width + 400);
      const tailX = -200 + cloudTailProgress * (width + 400);

      const stormGrad = ctx.createLinearGradient(Math.max(0, tailX), 0, Math.min(width, frontX), 0);
      stormGrad.addColorStop(0, `rgba(2, 6, 23, ${stormDarkness * 0.94})`);
      stormGrad.addColorStop(0.5, `rgba(15, 23, 42, ${stormDarkness * 0.88})`);
      stormGrad.addColorStop(1, `rgba(30, 41, 59, ${stormDarkness * 0.7})`);
      ctx.fillStyle = stormGrad;
      ctx.fillRect(0, 0, width, groundY);
    }

    // 3. THIÊN THỂ (MẶT TRỜI / MẶT TRĂNG / DẢI NGÂN HÀ / SAO)
    const sunVisibility = Math.max(0, 1.0 - stormDarkness * 1.5);
    if (sunVisibility > 0.01) {
      ctx.save();
      ctx.globalAlpha = sunVisibility;
      if (this.currentPeriod === 'night_moon' || this.currentPeriod === 'night_dark') {
        this.renderNightSky(ctx, width, groundY);
      } else {
        this.renderSunAndAura(ctx, width, groundY);
      }
      ctx.restore();
    }

    // 4. CÁC TẦNG MÂY TRONG LÀNH (Khi bật Có Mây)
    if (this.hasClouds && stormDarkness < 0.8) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1.0 - stormDarkness * 1.2);
      this.renderClearClouds(ctx, width, groundY);
      ctx.restore();
    }

    // 5. CÁC DẢI MÂY ĐEN CUỘN DÀI (ĐẦU MÂY TIẾN VÀO TỪ TRÁI, ĐUÔI MÂY TRÔI RA Ở PHẢI)
    if (cloudFrontProgress > 0.02 && stormDarkness > 0.02) {
      this.renderContinuousStormCloudBands(ctx, width, groundY, cloudFrontProgress, cloudTailProgress, stormDarkness);
    }


    ctx.restore();
  }

  private renderSunAndAura(ctx: CanvasRenderingContext2D, width: number, groundY: number): void {
    ctx.save();

    let sunX = width * 0.72;
    let sunY = groundY * 0.32;
    let sunRadius = 32;
    let sunColor = '#fef08a';
    let haloColor = 'rgba(254, 240, 138, 0.25)';

    if (this.currentPeriod === 'dawn') {
      sunX = width * 0.20;
      sunY = groundY * 0.52;
      sunRadius = 38;
      sunColor = '#fed7aa';
      haloColor = 'rgba(251, 146, 60, 0.42)';
    } else if (this.currentPeriod === 'sunset') {
      sunX = width * 0.82;
      sunY = groundY * 0.55;
      sunRadius = 45;
      sunColor = '#fca5a5';
      haloColor = 'rgba(239, 68, 68, 0.48)';
    }

    const haloGrad = ctx.createRadialGradient(sunX, sunY, sunRadius * 0.5, sunX, sunY, sunRadius * 4.8);
    haloGrad.addColorStop(0, haloColor);
    haloGrad.addColorStop(0.5, haloColor.replace(/[\d\.]+\)$/, '0.14)'));
    haloGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = haloGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 4.8, 0, Math.PI * 2);
    ctx.fill();

    if (this.currentPeriod === 'dawn' || this.currentPeriod === 'noon' || this.currentPeriod === 'sunset') {
      ctx.save();
      ctx.strokeStyle = this.currentPeriod === 'dawn' ? 'rgba(254, 215, 170, 0.25)' : (this.currentPeriod === 'sunset' ? 'rgba(252, 165, 165, 0.25)' : 'rgba(255, 255, 255, 0.22)');
      ctx.lineWidth = 2.5;
      const rayCount = 10;
      for (let r = 0; r < rayCount; r++) {
        const angle = (r * (Math.PI * 2 / rayCount)) + (this.animTimer * 0.04);
        ctx.beginPath();
        ctx.moveTo(sunX + Math.cos(angle) * (sunRadius + 8), sunY + Math.sin(angle) * (sunRadius + 8));
        ctx.lineTo(sunX + Math.cos(angle) * (sunRadius + 50), sunY + Math.sin(angle) * (sunRadius + 50));
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.fillStyle = sunColor;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderNightSky(ctx: CanvasRenderingContext2D, width: number, groundY: number): void {
    ctx.save();

    const isMoonless = this.currentPeriod === 'night_dark';

    if (isMoonless) {
      const mwGrad = ctx.createLinearGradient(0, groundY * 0.65, width, 0);
      mwGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      mwGrad.addColorStop(0.35, 'rgba(168, 85, 247, 0.08)');
      mwGrad.addColorStop(0.50, 'rgba(236, 72, 153, 0.12)');
      mwGrad.addColorStop(0.65, 'rgba(56, 189, 248, 0.09)');
      mwGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');

      ctx.fillStyle = mwGrad;
      ctx.beginPath();
      ctx.moveTo(0, groundY * 0.7);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, groundY * 0.25);
      ctx.lineTo(0, groundY * 0.95);
      ctx.closePath();
      ctx.fill();

      this.milkyWayStars.forEach(star => {
        const sx = star.x * width;
        const sy = star.y * groundY;
        const twinkle = 0.6 + 0.4 * Math.sin(this.animTimer * star.twinkleSpeed + star.twinklePhase);
        ctx.fillStyle = star.color;
        ctx.globalAlpha = star.alpha * twinkle;
        ctx.beginPath();
        ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;
    }

    const starBoost = isMoonless ? 1.25 : 1.0;
    this.stars.forEach(star => {
      const sx = star.x * width;
      const sy = star.y * groundY;
      const twinkle = 0.5 + 0.5 * Math.sin(this.animTimer * star.twinkleSpeed + star.twinklePhase);
      const alpha = Math.min(1.0, star.alpha * twinkle * starBoost);

      ctx.fillStyle = star.color;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size * (isMoonless ? 1.15 : 1.0), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    this.shootingStars.forEach(s => {
      const sx = s.x * width + s.vx * s.life;
      const sy = s.y * groundY + s.vy * s.life;
      const p = s.life / s.maxLife;
      const alpha = Math.sin(p * Math.PI);

      const grad = ctx.createLinearGradient(sx, sy, sx - s.vx * 0.15, sy - s.vy * 0.15);
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      grad.addColorStop(0.4, `rgba(147, 197, 253, ${alpha * 0.8})`);
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - s.vx * 0.22, sy - s.vy * 0.22);
      ctx.stroke();
    });

    if (this.currentPeriod === 'night_moon') {
      const moonX = width * 0.76;
      const moonY = groundY * 0.28;
      const moonRadius = 26;

      const moonAura = ctx.createRadialGradient(moonX, moonY, moonRadius * 0.5, moonX, moonY, moonRadius * 3.5);
      moonAura.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
      moonAura.addColorStop(0.5, 'rgba(147, 197, 253, 0.15)');
      moonAura.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = moonAura;
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius * 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(moonX, moonY, moonRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#0b132b';
      ctx.beginPath();
      ctx.arc(moonX - moonRadius * 0.5, moonY - moonRadius * 0.2, moonRadius * 0.95, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private renderClearClouds(ctx: CanvasRenderingContext2D, width: number, groundY: number): void {
    let cloudColor = 'rgba(255, 255, 255, 0.55)';
    let cloudShadow = 'rgba(219, 234, 254, 0.35)';

    if (this.currentPeriod === 'dawn') {
      cloudColor = 'rgba(254, 215, 170, 0.65)';
      cloudShadow = 'rgba(244, 114, 182, 0.35)';
    } else if (this.currentPeriod === 'sunset') {
      cloudColor = 'rgba(253, 224, 71, 0.65)';
      cloudShadow = 'rgba(190, 18, 60, 0.45)';
    } else if (this.currentPeriod === 'night_moon' || this.currentPeriod === 'night_dark') {
      cloudColor = 'rgba(30, 41, 59, 0.45)';
      cloudShadow = 'rgba(15, 23, 42, 0.6)';
    }

    const cloudLayers = [
      { xOffset: 30, y: groundY * 0.14, scale: 1.4, speed: 6 },
      { xOffset: 550, y: groundY * 0.12, scale: 1.6, speed: 8 },
      { xOffset: 1100, y: groundY * 0.16, scale: 1.3, speed: 7 },
      { xOffset: 200, y: groundY * 0.30, scale: 0.95, speed: 12 },
      { xOffset: 750, y: groundY * 0.34, scale: 1.1, speed: 14 },
      { xOffset: 1350, y: groundY * 0.28, scale: 1.0, speed: 11 }
    ];

    cloudLayers.forEach(c => {
      const cx = ((c.xOffset + this.animTimer * c.speed) % (width + 600)) - 300;
      const cy = c.y;

      ctx.fillStyle = cloudShadow;
      ctx.beginPath();
      ctx.arc(cx, cy + 6, 32 * c.scale, 0, Math.PI * 2);
      ctx.arc(cx + 30 * c.scale, cy - 8 * c.scale, 42 * c.scale, 0, Math.PI * 2);
      ctx.arc(cx + 70 * c.scale, cy - 2 * c.scale, 32 * c.scale, 0, Math.PI * 2);
      ctx.arc(cx + 100 * c.scale, cy + 6, 24 * c.scale, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = cloudColor;
      ctx.beginPath();
      ctx.arc(cx, cy, 32 * c.scale, 0, Math.PI * 2);
      ctx.arc(cx + 30 * c.scale, cy - 12 * c.scale, 42 * c.scale, 0, Math.PI * 2);
      ctx.arc(cx + 70 * c.scale, cy - 6 * c.scale, 32 * c.scale, 0, Math.PI * 2);
      ctx.arc(cx + 100 * c.scale, cy, 24 * c.scale, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * CÁC DẢI MÂY ĐEN CUỘN DÀI NỐI LIỀN NHAU (LUÔN TRÔI XUÔI 1 CHIỀU TỪ TRÁI SANG PHẢI)
   * - Bắt đầu mưa: Đầu mây đi từ Trái sang Phải
   * - Hết mưa: Đuôi mây đi từ Trái sang Phải và đẩy hết khối mây ra mép phải
   */
  private renderContinuousStormCloudBands(
    ctx: CanvasRenderingContext2D,
    width: number,
    groundY: number,
    cloudFrontProgress: number,
    cloudTailProgress: number,
    stormDarkness: number
  ): void {
    ctx.save();
    ctx.globalAlpha = Math.min(1.0, stormDarkness * 1.15);

    // Mép đầu và mép đuôi của khối mây (Tính theo pixel)
    const frontX = -250 + cloudFrontProgress * (width + 500);
    const tailX = -250 + cloudTailProgress * (width + 500);

    const startX = Math.max(-250, tailX);
    const endX = Math.min(width + 250, frontX);
    if (startX >= endX) {
      ctx.restore();
      return;
    }

    // 3 Tầng Dải Mây Đen Cuộn Dài Nối Liền Nhau
    const bands = [
      // Tầng 1: Đỉnh vòm trời (Dày kịt, xám đen thẳm)
      {
        yBase: groundY * 0.04,
        speed: 22,
        xOffset: 0,
        waveFreq: 0.008,
        lobeRadius: 85,
        color: `rgba(15, 23, 42, ${0.82 + stormDarkness * 0.16})`,
        shadow: `rgba(2, 6, 23, ${0.92 + stormDarkness * 0.08})`
      },
      // Tầng 2: Giữa bầu trời (Cuộn dồn dập, gợn sóng nhấp nhô liên hoàn)
      {
        yBase: groundY * 0.18,
        speed: 28,
        xOffset: 250,
        waveFreq: 0.006,
        lobeRadius: 75,
        color: `rgba(30, 41, 59, ${0.75 + stormDarkness * 0.22})`,
        shadow: `rgba(15, 23, 42, ${0.85 + stormDarkness * 0.14})`
      },
      // Tầng 3: Chân mây xà thấp (Cuộn tơi xốp, trôi nhanh)
      {
        yBase: groundY * 0.32,
        speed: 34,
        xOffset: 520,
        waveFreq: 0.005,
        lobeRadius: 60,
        color: `rgba(51, 65, 85, ${0.68 + stormDarkness * 0.28})`,
        shadow: `rgba(30, 41, 59, ${0.78 + stormDarkness * 0.20})`
      }
    ];

    bands.forEach(b => {
      const step = 45;
      // Trôi liên tục từ TRÁI SANG PHẢI
      const drift = (this.animTimer * b.speed + b.xOffset) % (step * 8);

      // 1. Vẽ bóng đáy cuộn mây
      ctx.fillStyle = b.shadow;
      ctx.beginPath();
      for (let x = startX - step; x <= endX + step * 2; x += step) {
        const curX = x + drift;
        const wave = Math.sin(curX * b.waveFreq + this.animTimer * 0.8) * 18;
        const curY = b.yBase + wave + 10;
        ctx.arc(curX, curY, b.lobeRadius * 1.05, 0, Math.PI * 2);
      }
      ctx.fill();

      // 2. Vẽ thân cuộn mây chính
      ctx.fillStyle = b.color;
      ctx.beginPath();
      for (let x = startX - step; x <= endX + step * 2; x += step) {
        const curX = x + drift;
        const wave = Math.sin(curX * b.waveFreq + this.animTimer * 0.8) * 18;
        const curY = b.yBase + wave;
        ctx.arc(curX, curY, b.lobeRadius, 0, Math.PI * 2);
      }
      ctx.fill();
    });

    ctx.restore();
  }
}
