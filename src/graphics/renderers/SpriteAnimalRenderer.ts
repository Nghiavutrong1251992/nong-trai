/**
 * SpriteAnimalRenderer.ts
 * HỆ THỐNG HOẠT HÌNH ĐỘNG VẬT ĐA KHUNG HÌNH (Multi-Frame Animated Sprites)
 * - Trâu cử động nhai cỏ, ngẩng đầu và bước đi
 * - Vịt vỗ cánh, dập dềnh bơi trên suối
 * - Gà cúi mổ thóc và ngẩng đầu lon ton
 */

export class SpriteAnimalRenderer {
  private static buffaloFrames: HTMLImageElement[] = [];
  private static duckFrames: HTMLImageElement[] = [];
  private static chickenFrames: HTMLImageElement[] = [];
  private static isLoaded = false;

  public static init(): void {
    if (this.isLoaded) return;

    const loadImg = (src: string) => {
      const img = new Image();
      img.src = src;
      return img;
    };

    this.buffaloFrames = [
      loadImg('/assets/buffalo_0.png'),
      loadImg('/assets/buffalo_1.png')
    ];

    this.duckFrames = [
      loadImg('/assets/duck_0.png'),
      loadImg('/assets/duck_1.png')
    ];

    this.chickenFrames = [
      loadImg('/assets/chicken_0.png'),
      loadImg('/assets/chicken_1.png')
    ];

    this.isLoaded = true;
  }

  // 1. Hoạt hình Trâu Nước cử động 60fps
  public static renderBuffalo(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    animTimer: number
  ): void {
    this.init();
    if (this.buffaloFrames.length === 0) return;

    // Chuyển động nhai cỏ và bước chân (2 khung hình luân chuyển)
    const frameIndex = Math.floor(animTimer * 2.5) % this.buffaloFrames.length;
    const img = this.buffaloFrames[frameIndex];
    if (!img || !img.complete) return;

    const bob = Math.sin(animTimer * 3) * 1.5;

    ctx.save();
    ctx.translate(x, y + bob);
    if (facing < 0) ctx.scale(-1, 1);

    // Bóng đổ dưới 4 chân trâu
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 36, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    const drawW = 80;
    const drawH = 55;
    ctx.drawImage(img, -drawW / 2, -drawH + 4, drawW, drawH);

    ctx.restore();
  }

  // 2. Hoạt hình Vịt vỗ cánh bơi suối
  public static renderDuck(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    animTimer: number
  ): void {
    this.init();
    if (this.duckFrames.length === 0) return;

    const frameIndex = Math.floor(animTimer * 4) % this.duckFrames.length;
    const img = this.duckFrames[frameIndex];
    if (!img || !img.complete) return;

    const bob = Math.sin(animTimer * 5) * 2;

    ctx.save();
    ctx.translate(x, y + bob);
    if (facing < 0) ctx.scale(-1, 1);

    // Sóng nước gợn quanh thân vịt
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20 + Math.sin(animTimer * 6) * 3, 7, 0, 0, Math.PI * 2);
    ctx.stroke();

    const drawW = 38;
    const drawH = 32;
    ctx.drawImage(img, -drawW / 2, -drawH + 4, drawW, drawH);

    ctx.restore();
  }

  // 3. Hoạt hình Gà mổ thóc lon ton
  public static renderChicken(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    animTimer: number
  ): void {
    this.init();
    if (this.chickenFrames.length === 0) return;

    // Gà cúi mổ thóc và ngẩng đầu
    const frameIndex = Math.floor(animTimer * 5) % this.chickenFrames.length;
    const img = this.chickenFrames[frameIndex];
    if (!img || !img.complete) return;

    const step = Math.sin(animTimer * 10) * 2.0;

    ctx.save();
    ctx.translate(x, y + step);
    if (facing < 0) ctx.scale(-1, 1);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const drawW = 34;
    const drawH = 30;
    ctx.drawImage(img, -drawW / 2, -drawH + 3, drawW, drawH);

    ctx.restore();
  }
}
