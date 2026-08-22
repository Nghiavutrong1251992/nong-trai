/**
 * WeatherManager.ts
 * Hệ thống Thời Tiết Nông Thôn Việt Nam Động & Tự Động Xoay Vần Tự Nhiên:
 * - ☀️ Trời Trong Xanh (Clear / Nắng Đẹp 45s: Tuyệt đối không có mây đen)
 * - 🍃 Gió Đồng Lộng (Windy 18s: Gió thổi lá bay, mây đen cuộn dài từ mép trái tiến dần sang phải)
 * - 🌦️ Mưa Rào / Mưa Phùn (Light Rain 25s: Mây đen che phủ dày, mưa rơi rào rạt)
 * - ⛈️ Mưa Giông Bão (Thunderstorm 20s: Mây đen kịt bao phủ 100%, mưa to gió lớn, sấm sét)
 * - Mưa xong: Đuôi đám mây trôi hết sang mép phải, nắng vàng trong xanh trở lại trong 45s
 */

export type WeatherType = 'clear' | 'windy' | 'light_rain' | 'storm';

export interface Raindrop {
  worldX: number;
  y: number;
  speed: number;
  len: number;
  alpha: number;
  thickness: number;
}

export interface RainSplash {
  worldX: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface WindParticle {
  worldX: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  vRot: number;
  type: 'leaf' | 'petal' | 'yellow_leaf';
  color: string;
  swayFreq: number;
  swayAmp: number;
  timeOffset: number;
}

export class WeatherManager {
  public currentWeather: WeatherType = 'clear';
  
  // Tọa độ tiến trình của khối mây bão (Luôn tiến từ Trái sang Phải)
  public cloudFrontProgress: number = 0.0; // 0.0 -> 1.0: Mép đầu mây đi từ Trái sang Phải
  public cloudTailProgress: number = 0.0;  // 0.0 -> 1.0: Đuôi mây đi từ Trái sang Phải khi hết mưa
  public stormDarkness: number = 0.0;     // 0.0 -> 1.0: Độ tối tổng thể của bầu trời

  public windStrength: number = 1.0;
  public windAngle: number = 0.25;

  // Hạt mưa & Bọt nước
  private raindrops: Raindrop[] = [];
  private splashes: RainSplash[] = [];

  // Hạt gió & Lá bay (Lưu theo tọa độ thế giới)
  private windParticles: WindParticle[] = [];
  private maxWindParticles: number = 75;

  // Hiệu ứng Sấm Chớp
  public lightningAlpha: number = 0;
  private lightningTimer: number = 0;
  private nextLightningTime: number = 3.0;
  private lightningBranches: Array<{ x1: number; y1: number; x2: number; y2: number }> = [];

  public autoWeatherCycle: boolean = true; // Tự động xoay vần thời tiết tự nhiên
  private weatherTimer: number = 0;
  private weatherDuration: number = 45.0; // Nắng đẹp mặc định 45s

  // Callbacks
  public onWeatherChange?: (weather: WeatherType) => void;
  public onThunder?: () => void;

  private animTimer: number = 0;

  constructor() {
    this.initWindParticles();
  }

  private initWindParticles(): void {
    this.windParticles = [];
    const colors = ['#65a30d', '#16a34a', '#eab308', '#ea580c', '#f472b6'];
    for (let i = 0; i < this.maxWindParticles; i++) {
      this.windParticles.push({
        worldX: -300 + Math.random() * 3000,
        y: 20 + Math.random() * 420,
        vx: 180 + Math.random() * 140, // Luôn bay từ TRÁI sang PHẢI
        vy: 10 + Math.random() * 25,
        size: 3.5 + Math.random() * 4.5,
        angle: Math.random() * Math.PI * 2,
        vRot: 1.5 + Math.random() * 4.0,
        type: Math.random() > 0.4 ? 'leaf' : (Math.random() > 0.5 ? 'petal' : 'yellow_leaf'),
        color: colors[Math.floor(Math.random() * colors.length)],
        swayFreq: 2.5 + Math.random() * 2.5,
        swayAmp: 20 + Math.random() * 30,
        timeOffset: Math.random() * 10
      });
    }
  }

  public setWeather(weather: WeatherType, triggerCallback: boolean = true): void {
    this.currentWeather = weather;
    this.weatherTimer = 0;
    if (weather === 'clear') {
      this.windStrength = 1.0;
      this.weatherDuration = 45.0; // Nắng đẹp 45s
      // Không xóa hạt mưa đột ngột, để hạt mưa rơi nốt xuống đất và tạnh dần
    } else if (weather === 'windy') {
      this.windStrength = 3.8;
      this.weatherDuration = 18.0; // Gió lộng & mây đen kéo tới 18s
      this.cloudTailProgress = 0.0;
    } else if (weather === 'light_rain') {
      this.windStrength = 1.8;
      this.initRain(140);
      this.weatherDuration = 25.0; // Mưa rào 25s
      this.cloudTailProgress = 0.0;
    } else if (weather === 'storm') {
      this.windStrength = 6.0;
      this.initRain(360);
      this.weatherDuration = 20.0; // Mưa giông bão 20s
      this.cloudTailProgress = 0.0;
      this.lightningTimer = 0;
      this.nextLightningTime = 0.5;
    }

    if (triggerCallback && this.onWeatherChange) {
      this.onWeatherChange(weather);
    }
  }

  public cycleWeather(): string {
    if (this.currentWeather === 'clear') {
      this.setWeather('windy');
      return '🍃 Gió Đồng Lộng: Gió nổi lên, mây đen cuộn dài từ mép trái tiến dần sang phải';
    } else if (this.currentWeather === 'windy') {
      this.setWeather('light_rain');
      return '🌦️ Mưa Rào: Mây đen che phủ, mưa rơi rào rạt';
    } else if (this.currentWeather === 'light_rain') {
      this.setWeather('storm');
      return '⛈️ Mưa Giông Bão Lớn: Sấm chớp giật sáng, mưa như trút nước';
    } else {
      this.setWeather('clear');
      return '☀️ Mưa Tạnh Dần: Đuôi mây từ từ trôi sang mép phải, nắng ấm trở lại';
    }
  }

  private initRain(count: number): void {
    this.raindrops = [];
    for (let i = 0; i < count; i++) {
      this.raindrops.push({
        worldX: -400 + Math.random() * 3200,
        y: Math.random() * 500,
        speed: 700 + Math.random() * 500,
        len: 16 + Math.random() * 22,
        alpha: 0.35 + Math.random() * 0.45,
        thickness: 1.0 + Math.random() * 1.2
      });
    }
  }

  public update(dt: number, width: number, groundY: number, cameraX: number = 0): void {
    this.animTimer += dt;

    // 0. DI CHUYỂN KHỐI MÂY BÃO TỪ TRÁI SANG PHẢI (LEFT TO RIGHT CONTINUOUS FLOW)
    if (this.currentWeather === 'windy') {
      // Đầu mây tiến vào từ trái qua giữa màn hình
      this.cloudFrontProgress = Math.min(0.65, this.cloudFrontProgress + dt * 0.10);
      this.cloudTailProgress = 0.0;
      this.stormDarkness = Math.min(0.45, this.stormDarkness + dt * 0.10);
    } else if (this.currentWeather === 'light_rain') {
      // Đầu mây tiến tiếp sang phủ 88% màn hình
      this.cloudFrontProgress = Math.min(0.88, this.cloudFrontProgress + dt * 0.14);
      this.cloudTailProgress = 0.0;
      this.stormDarkness = Math.min(0.75, this.stormDarkness + dt * 0.14);
    } else if (this.currentWeather === 'storm') {
      // Đầu mây bao phủ 100% vòm trời
      this.cloudFrontProgress = 1.0;
      this.cloudTailProgress = 0.0;
      this.stormDarkness = Math.min(1.0, this.stormDarkness + dt * 0.20);
    } else {
      // HẾT MƯA (CLEAR): Đuôi mây từ từ trôi từ mép trái sang mép phải rất chậm rãi (~11 giây)
      if (this.cloudFrontProgress > 0) {
        if (this.cloudTailProgress < 1.0) {
          this.cloudTailProgress += dt * 0.09; // Kéo dài thời gian đuôi mây rút đi (~11s)
          this.stormDarkness = Math.max(0.0, 1.0 - this.cloudTailProgress);
        } else {
          // Đuôi mây đã trôi hết ra khỏi mép phải -> Reset sạch sẽ về 0
          this.cloudFrontProgress = 0.0;
          this.cloudTailProgress = 0.0;
          this.stormDarkness = 0.0;
        }
      } else {
        // Trời Nắng bình thường: 100% sạch bóng mây đen
        this.cloudFrontProgress = 0.0;
        this.cloudTailProgress = 0.0;
        this.stormDarkness = 0.0;
      }
    }


    // 1. CẬP NHẬT GIÓ & LÁ BAY THEO TỌA ĐỘ THẾ GIỚI
    const windMultiplier = this.currentWeather === 'storm' ? 3.2 : (this.currentWeather === 'windy' ? 2.4 : 0.9);
    const minWorldX = cameraX - 300;
    const maxWorldX = cameraX + width + 300;

    this.windParticles.forEach(p => {
      p.angle += p.vRot * dt;
      p.worldX += p.vx * windMultiplier * dt;
      p.y += (p.vy + Math.sin(this.animTimer * p.swayFreq + p.timeOffset) * p.swayAmp) * dt;

      if (p.worldX > maxWorldX) {
        p.worldX = minWorldX - Math.random() * 150;
        p.y = 20 + Math.random() * (groundY - 60);
      }
      if (p.y > groundY - 10) {
        p.y = 20 + Math.random() * 80;
      }
      if (p.y < 10) {
        p.y = groundY - 40;
      }
    });

    // 2. CẬP NHẬT HẠT MƯA THEO TỌA ĐỘ THẾ GIỚI
    const isRaining = this.currentWeather === 'light_rain' || this.currentWeather === 'storm';
    const targetRainCount = isRaining ? (this.currentWeather === 'storm' ? 380 : 150) : 0;
    const rainWind = (this.currentWeather === 'storm' ? 340 : 130);

    // Chỉ sinh thêm hạt mới khi trời vẫn đang mưa
    while (this.raindrops.length < targetRainCount) {
      this.raindrops.push({
        worldX: minWorldX + Math.random() * (maxWorldX - minWorldX),
        y: -20 - Math.random() * 100,
        speed: (this.currentWeather === 'storm' ? 1000 : 700) + Math.random() * 400,
        len: (this.currentWeather === 'storm' ? 26 : 15) + Math.random() * 18,
        alpha: 0.4 + Math.random() * 0.45,
        thickness: this.currentWeather === 'storm' ? 1.5 : 1.0
      });
    }

    for (let i = this.raindrops.length - 1; i >= 0; i--) {
      const r = this.raindrops[i];
      r.y += r.speed * dt;
      r.worldX += rainWind * dt;

      if (r.y >= groundY - 2) {
        if (isRaining) {
          const splashCount = this.currentWeather === 'storm' ? 3 : 2;
          for (let s = 0; s < splashCount; s++) {
            this.splashes.push({
              worldX: r.worldX,
              y: groundY - 2 + Math.random() * 6,
              vx: (Math.random() - 0.2) * 70,
              vy: -(35 + Math.random() * 55),
              radius: 1.2 + Math.random() * 1.5,
              alpha: 0.7,
              life: 0,
              maxLife: 0.16 + Math.random() * 0.14
            });
          }
          r.y = -20 - Math.random() * 50;
          r.worldX = minWorldX + Math.random() * (maxWorldX - minWorldX);
        } else {
          // Khi mưa tạnh: Hạt mưa chạm đất tạo bọt nhẹ rồi biến mất, mưa tạnh từ từ rất tự nhiên
          this.raindrops.splice(i, 1);
        }
      }
    }


    // 3. CẬP NHẬT BỌT NƯỚC (SPLASHES)
    for (let i = this.splashes.length - 1; i >= 0; i--) {
      const sp = this.splashes[i];
      sp.life += dt;
      sp.worldX += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy += 260 * dt;

      if (sp.life >= sp.maxLife) {
        this.splashes.splice(i, 1);
      }
    }

    // 4. CẬP NHẬT SẤM CHỚP (LIGHTNING)
    if (this.currentWeather === 'storm') {
      if (this.lightningAlpha > 0) {
        this.lightningAlpha = Math.max(0, this.lightningAlpha - dt * 4.5);
      }

      this.lightningTimer += dt;
      if (this.lightningTimer >= this.nextLightningTime) {
        this.triggerLightning(width, groundY);
        this.lightningTimer = 0;
        this.nextLightningTime = 3.2 + Math.random() * 5.5;
      }
    } else {
      this.lightningAlpha = 0;
    }

    // 5. TỰ ĐỘNG CHUYỂN ĐỔI CHU KỲ THỜI TIẾT (Nếu bật autoWeatherCycle)
    if (this.autoWeatherCycle) {
      this.weatherTimer += dt;
      if (this.weatherTimer >= this.weatherDuration) {
        this.cycleWeather();
      }
    }
  }

  private triggerLightning(width: number, groundY: number): void {
    this.lightningAlpha = 0.92;
    this.lightningBranches = [];

    if (this.onThunder) {
      this.onThunder();
    }

    const startX = (0.15 + Math.random() * 0.7) * width;
    let curX = startX;
    let curY = 0;
    const targetY = groundY * 0.7;

    while (curY < targetY) {
      const nextX = curX + (Math.random() - 0.5) * 55;
      const nextY = curY + 22 + Math.random() * 30;
      this.lightningBranches.push({ x1: curX, y1: curY, x2: nextX, y2: nextY });

      if (Math.random() > 0.55) {
        const branchX = curX + (Math.random() - 0.5) * 70;
        const branchY = curY + 25 + Math.random() * 25;
        this.lightningBranches.push({ x1: curX, y1: curY, x2: branchX, y2: branchY });
      }

      curX = nextX;
      curY = nextY;
    }
  }

  /**
   * Vẽ sấm chớp trên bầu trời
   */
  public renderLightning(ctx: CanvasRenderingContext2D, width: number, groundY: number): void {
    if (this.lightningAlpha <= 0) return;

    ctx.save();
    ctx.fillStyle = `rgba(240, 249, 255, ${this.lightningAlpha * 0.6})`;
    ctx.fillRect(0, 0, width, groundY);

    ctx.strokeStyle = `rgba(255, 255, 255, ${this.lightningAlpha * 0.98})`;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 18;
    ctx.lineWidth = 3.0;
    ctx.beginPath();
    this.lightningBranches.forEach(b => {
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
    });
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Vẽ các hiệu ứng thời tiết Tiền Cảnh theo Camera
   */
  public renderForegroundEffects(ctx: CanvasRenderingContext2D, width: number, groundY: number, cameraX: number = 0): void {
    ctx.save();

    // 1. VẼ HẠT MƯA RƠI (RAINDROPS)
    if (this.currentWeather === 'light_rain' || this.currentWeather === 'storm') {
      const isStorm = this.currentWeather === 'storm';
      const windAngle = isStorm ? 0.35 : 0.18;

      ctx.strokeStyle = isStorm ? 'rgba(224, 242, 254, 0.7)' : 'rgba(219, 234, 254, 0.5)';
      ctx.lineCap = 'round';

      this.raindrops.forEach(r => {
        const sx = r.worldX - cameraX;
        if (sx < -50 || sx > width + 50) return;

        const sy = r.y;
        ctx.lineWidth = r.thickness;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx - Math.sin(windAngle) * r.len, sy - Math.cos(windAngle) * r.len);
        ctx.stroke();
      });

      // 2. VẼ BỌT NƯỚC TIẾP ĐẤT (SPLASHES)
      this.splashes.forEach(sp => {
        const sx = sp.worldX - cameraX;
        if (sx < -20 || sx > width + 20) return;

        const p = sp.life / sp.maxLife;
        const a = (1.0 - p) * sp.alpha;
        ctx.fillStyle = `rgba(224, 242, 254, ${a})`;
        ctx.beginPath();
        ctx.arc(sx, sp.y, sp.radius * (1.0 + p * 0.5), 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // 3. VẼ LÁ CÂY & HOA CỎ BAY THEO GIÓ (WIND PARTICLES)
    if (this.currentWeather === 'windy' || this.currentWeather === 'storm' || this.currentWeather === 'clear') {
      this.windParticles.forEach(p => {
        const sx = p.worldX - cameraX;
        if (sx < -40 || sx > width + 40) return;

        const sy = p.y;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(p.angle);
        ctx.fillStyle = p.color;

        if (p.type === 'leaf') {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.6, p.size * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'yellow_leaf') {
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 1.4, p.size * 0.9, 0.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });
    }

    ctx.restore();
  }
}
