/**
 * SpriteSheetDuck.ts
 * VỊT TRẮNG BƠI SUỐI HOẠT HÌNH PIXEL ART 4-FRAME (Swim, Paddle & Splash)
 */

export class SpriteSheetDuck {
  private static image: HTMLImageElement | null = null;
  private static isLoaded = false;

  public static init(): void {
    if (this.image) return;
    this.image = new Image();
    this.image.src = '/assets/duck_swim.png';
    this.image.onload = () => {
      this.isLoaded = true;
    };
  }

  public static render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    animTimer: number,
    scale: number = 0.16
  ): void {
    if (!this.image || !this.isLoaded) {
      this.init();
      return;
    }

    const frameW = 344;
    const frameH = 260;
    const totalFrames = 4;

    // Chu kỳ bơi và vỗ cánh ~4fps
    const frameIndex = Math.floor(animTimer * 4) % totalFrames;

    const sx = frameIndex * frameW;
    const sy = 0;

    const bob = Math.sin(animTimer * 4) * 2.0;

    ctx.save();
    ctx.translate(x, y + bob);
    if (facing < 0) ctx.scale(-1, 1);
    ctx.scale(scale, scale);

    // Gợn sóng nước quanh thân vịt
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.ellipse(0, 0, 80 + Math.sin(animTimer * 6) * 10, 24, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.drawImage(
      this.image,
      sx, sy, frameW, frameH,
      -frameW / 2, -frameH + 15, frameW, frameH
    );

    ctx.restore();
  }
}
