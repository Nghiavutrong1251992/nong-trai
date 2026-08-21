/**
 * SpriteSheetChicken.ts
 * GÀ TRỐNG VÀNG HOẠT HÌNH PIXEL ART 4-FRAME (Walk & Peck Cycle)
 */

export class SpriteSheetChicken {
  private static image: HTMLImageElement | null = null;
  private static isLoaded = false;

  public static init(): void {
    if (this.image) return;
    this.image = new Image();
    this.image.src = '/assets/chicken_walk.png';
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

    const frameW = 293;
    const frameH = 312;
    const totalFrames = 4;

    // Chu kỳ bước và mổ thóc ~5fps
    const frameIndex = Math.floor(animTimer * 5) % totalFrames;

    const sx = frameIndex * frameW;
    const sy = 0;

    ctx.save();
    ctx.translate(x, y);
    if (facing < 0) ctx.scale(-1, 1);
    ctx.scale(scale, scale);

    // Bóng đổ dưới chân gà
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 40, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.drawImage(
      this.image,
      sx, sy, frameW, frameH,
      -frameW / 2, -frameH + 10, frameW, frameH
    );

    ctx.restore();
  }
}
