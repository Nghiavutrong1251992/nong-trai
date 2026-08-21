/**
 * SpriteSheetBuffalo.ts
 * TRÂU NƯỚC HOẠT HÌNH 8 KHUNG HÌNH LIÊN TỤC (8-Frame Smooth Walk Cycle)
 * Sprite Sheet: buffalo_8frame_walk.png — 2752x213px (8 frames × 344x213px)
 */

export class SpriteSheetBuffalo {
  private static image: HTMLImageElement | null = null;
  private static isLoaded = false;

  public static init(): void {
    if (this.image) return;
    this.image = new Image();
    this.image.src = '/assets/buffalo_8frame_walk.png';
    this.image.onload = () => {
      this.isLoaded = true;
      console.log('🐃 8-Frame Smooth Buffalo sprite sheet loaded!');
    };
  }

  public static render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    animTimer: number,
    scale: number = 0.23
  ): void {
    if (!this.image || !this.isLoaded) {
      this.init();
      return;
    }

    const frameW = 344;
    const frameH = 213;
    const totalFrames = 8;

    // Phát mượt mà 8 khung hình liên tục ở tốc độ 8.5 fps
    const frameIndex = Math.floor(animTimer * 8.5) % totalFrames;

    const sx = frameIndex * frameW;
    const sy = 0;

    ctx.save();
    ctx.translate(x, y);

    // Sprite gốc quay mặt sang PHẢI. Khi facing < 0 (sang trái), lật ngược trục X
    if (facing < 0) {
      ctx.scale(-1, 1);
    }
    ctx.scale(scale, scale);

    // Bóng đổ dưới 4 chân trâu
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 70, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vẽ khung hình trâu từ sprite sheet 8 frame
    ctx.drawImage(
      this.image,
      sx, sy, frameW, frameH,
      -frameW / 2, -frameH + 10, frameW, frameH
    );

    ctx.restore();
  }
}
