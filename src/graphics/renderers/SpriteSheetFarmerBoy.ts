/**
 * SpriteSheetFarmerBoy.ts
 * NẠP & PHÁT HOẠT ẢNH BƯỚC ĐI TỪ BỘ SPRITE SHEET ĐÃ ĐƯỢC TẠO TỪ TRANH GỐC
 * - File: /assets/farmer_boy_walk_sheet.png (2760x460px, 6 Frame x 460x460px)
 * - Frame 0: Idle (Đứng yên tự nhiên, thở nhẹ)
 * - Frame 1: Walk 1 (Chân trái bước tới, chân phải lùi, giỏ nhấp nhô)
 * - Frame 2: Walk 2 (Chân trái chạm đất, người nhún xuống)
 * - Frame 3: Walk 3 (Chuyển trọng tâm, người nâng lên)
 * - Frame 4: Walk 4 (Chân phải bước tới, chân trái lùi)
 * - Frame 5: Walk 5 (Chân phải chạm đất, người nhún xuống)
 */

export class SpriteSheetFarmerBoy {
  private static image: HTMLImageElement | null = null;
  private static isLoaded = false;

  public static init(): void {
    if (this.image) return;
    this.image = new Image();
    this.image.src = '/assets/farmer_boy_walk_sheet.png?v=' + Date.now();
    this.image.onload = () => {
      this.isLoaded = true;
      console.log('🌾 SpriteSheetFarmerBoy: Đã nạp thành công bộ hoạt ảnh 6-Frame bước đi!');
    };
  }

  public static render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number,
    state: 'idle' | 'walk' | 'jump' | 'hoe' | 'fish',
    animTimer: number,
    targetHeight: number = 320
  ): void {
    if (!this.image || !this.isLoaded) {
      this.init();
      return;
    }

    const frameW = 460;
    const frameH = 460;
    let frameIndex = 0;

    if (state === 'walk') {
      // Chuỗi bước đi mượt mà: 1 -> 2 -> 3 -> 4 -> 5 -> 3
      const walkSequence = [1, 2, 3, 4, 5, 3];
      const fps = 8.5; // Tốc độ bước chân tự nhiên
      const cycle = Math.floor(animTimer * fps) % walkSequence.length;
      frameIndex = walkSequence[cycle];
    } else if (state === 'jump') {
      frameIndex = 3; // Co gối nhảy lên
    } else if (state === 'hoe' || state === 'fish') {
      frameIndex = 2; // Nhún người thao tác
    } else {
      frameIndex = 0; // Đứng yên
    }

    // Tỉ lệ scale hiển thị
    const scale = targetHeight / frameH;
    const renderW = frameW * scale;
    const renderH = targetHeight;

    ctx.save();
    ctx.translate(x, y);

    // Lật hướng nhìn khi quay trái/phải
    if (facing < 0) {
      ctx.scale(-1, 1);
    }

    const sx = frameIndex * frameW;
    const sy = 0;

    // Cắt và vẽ frame tương ứng từ SpriteSheet
    ctx.drawImage(
      this.image,
      sx, sy, frameW, frameH,
      -renderW / 2, -renderH + 25, renderW, renderH
    );

    ctx.restore();
  }
}
