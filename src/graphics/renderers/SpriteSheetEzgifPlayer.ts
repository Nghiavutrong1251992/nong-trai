/**
 * SpriteSheetEzgifPlayer.ts
 * BỘ PHÁT HOẠT ẢNH MỚI TỪ BỘ FRAME CẮT CHUẨN CỦA BẠN
 * - Spritesheet: /assets/player_walk_8frames_user.png (2360x360px, 10 frames x 236x360px)
 * - Tách nền trong suốt 100%
 * - Căn chỉnh tâm trọng tâm tiếp đất vững vàng
 */

export class SpriteSheetEzgifPlayer {
  private static image: HTMLImageElement | null = null;
  private static isLoaded = false;
  private static numFrames = 10;
  private static frameW = 236;
  private static frameH = 360;

  public static init(): void {
    if (this.image) return;
    this.image = new Image();
    this.image.src = '/assets/player_walk_8frames_user.png?v=' + Date.now();
    this.image.onload = () => {
      this.isLoaded = true;
      console.log('🎬 SpriteSheetEzgifPlayer: Đã nạp thành công bộ hoạt ảnh frame mới của bạn!');
    };
  }

  public static render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number, // 1: phải, -1: trái
    state: 'idle' | 'walk' | 'jump' | 'hoe' | 'fish',
    animTimer: number,
    targetHeight: number = 310
  ): void {
    if (!this.image || !this.isLoaded) {
      this.init();
      return;
    }

    let frameIndex = 0;
    const isMoving = state === 'walk';
    const isJumping = state === 'jump';

    if (isMoving) {
      // 10 Frame phát với tốc độ 10.5 FPS cực kỳ dứt khoát và tự nhiên
      const fps = 10.5;
      frameIndex = Math.floor(animTimer * fps) % this.numFrames;
    } else if (isJumping) {
      frameIndex = 3; // Frame nhấc chân bay lên
    } else if (state === 'hoe' || state === 'fish') {
      frameIndex = 5;
    } else {
      // Idle: Đứng yên frame 0
      frameIndex = 0;
    }

    const scale = targetHeight / this.frameH;
    const renderW = this.frameW * scale;
    const renderH = targetHeight;

    ctx.save();
    ctx.translate(x, y);

    // 1. Bóng đổ tiếp xúc mặt đất
    ctx.fillStyle = 'rgba(28, 25, 23, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 2, (renderW * 0.35) * (isJumping ? 0.75 : 1), (renderH * 0.035) * (isJumping ? 0.6 : 1), 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Quay hướng nhân vật trái/phải
    if (facing < 0) {
      ctx.scale(-1, 1);
    }

    const sx = frameIndex * this.frameW;
    const sy = 0;

    // 3. Vẽ frame tương ứng lên Canvas
    ctx.drawImage(
      this.image,
      sx, sy, this.frameW, this.frameH,
      -renderW / 2, -renderH + 8, renderW, renderH
    );

    ctx.restore();
  }
}
