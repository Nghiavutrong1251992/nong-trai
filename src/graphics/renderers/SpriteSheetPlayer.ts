/**
 * SpriteSheetPlayer.ts
 * NẠP VÀ PHÁT BỘ HOẠT ẢNH NHÂN VẬT CHÍNH TỪ 5 FILE ẢNH GỐC CỦA BẠN
 * File Sprite Sheet: /assets/vietnam_boy_sheet.png (2865x879px, 5 frame x 573x879px)
 * - Frame 0: image.png (Đứng yên / Idle)
 * - Frame 1: di chuyen 1.png (Bước 1)
 * - Frame 2: di chuyen 2.png (Bước 2)
 * - Frame 3: di chuyen 3.png (Bước 3)
 * - Frame 4: di chuyen 4.png (Bước 4)
 */

export class SpriteSheetPlayer {
  private static image: HTMLImageElement | null = null;
  private static isLoaded = false;

  public static init(): void {
    if (this.image) return;
    this.image = new Image();
    this.image.src = '/assets/vietnam_boy_sheet.png?v=' + Date.now();
    this.image.onload = () => {
      this.isLoaded = true;
      console.log('👦 Vietnam Boy Character SpriteSheet loaded successfully!');
    };
  }

  public static render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    state: 'idle' | 'walk' | 'jump' | 'hoe' | 'fish',
    animTimer: number,
    scale: number = 0.055
  ): void {
    if (!this.image || !this.isLoaded) {
      this.init();
      return;
    }

    const frameW = 573;
    const frameH = 879;

    let frameIndex = 0; // Frame 0: Đứng yên (image.png)

    if (state === 'walk') {
      // Chuỗi bước đi mượt mà lặp vòng luân chuyển: 1 -> 2 -> 3 -> 4 -> 3 -> 2
      const walkSequence = [1, 2, 3, 4, 3, 2];
      const cycle = Math.floor(animTimer * 9) % walkSequence.length;
      frameIndex = walkSequence[cycle];
    } else if (state === 'jump') {
      frameIndex = 2; // Nhảy co chân
    } else if (state === 'hoe' || state === 'fish') {
      frameIndex = 3;
    } else {
      frameIndex = 0; // Đứng yên
    }

    ctx.save();
    ctx.translate(x, y);

    // Ảnh gốc quay sang PHẢI. Khi di chuyển sang trái (facing < 0) -> lật ngược trục X
    if (facing < 0) {
      ctx.scale(-1, 1);
    }
    ctx.scale(scale, scale);

    // Bóng đổ dưới chân nhân vật
    ctx.fillStyle = 'rgba(0, 0, 0, 0.32)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 140, 36, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cắt và vẽ frame tương ứng từ sprite sheet
    const sx = frameIndex * frameW;
    const sy = 0;

    ctx.drawImage(
      this.image,
      sx, sy, frameW, frameH,
      -frameW / 2, -frameH + 15, frameW, frameH
    );

    ctx.restore();
  }
}
