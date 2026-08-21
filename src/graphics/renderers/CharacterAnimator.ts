/**
 * CharacterAnimator.ts
 * HỆ THỐNG MÁY TRẠNG THÁI HOẠT ẢNH NHÂN VẬT ĐA NĂNG (Character Animation State Machine)
 * Quản lý tự động mọi hành động: Idle, Walk, Jump, Hoe, Water, Harvest...
 * Tự động tính toán kích thước khung hình từ ảnh thực tế để không bao giờ bị lệch hay chồng lấn!
 */

export interface AnimationClip {
  src: string;
  frames: number;
  fps: number;
  frameW?: number;
  frameH?: number;
  scaleMultiplier?: number; // Hệ số tùy chỉnh tỷ lệ (ví dụ: 1.05 cho cao thêm 5%)
  anchorOffsetX?: number; // Độ dịch chuyển pixel để căn chỉnh đúng trọng tâm chân nhân vật (tránh nhảy hình)
  anchorOffsetY?: number;
  loopMode?: 'loop' | 'pingpong';
  loopRange?: [number, number]; // [startLoopIndex, endLoopIndex] ví dụ [7, 11] cho frame 008 đến 012
  image?: HTMLImageElement;
  isLoaded?: boolean;
}

export class CharacterAnimator {
  private clips: Record<string, AnimationClip> = {};
  private targetHeight: number;

  constructor(targetHeight: number = 310) {
    this.targetHeight = targetHeight;
  }

  /**
   * Đăng ký một hành động hoạt ảnh vào hệ thống
   */
  public registerClip(name: string, clip: AnimationClip): void {
    const img = new Image();
    img.src = clip.src + '?v=' + Date.now();
    clip.image = img;
    clip.isLoaded = false;
    img.onload = () => {
      clip.isLoaded = true;
      clip.frameW = img.naturalWidth / clip.frames;
      clip.frameH = img.naturalHeight;
    };
    this.clips[name] = clip;
  }

  /**
   * Vẽ frame hiện tại của hành động lên Canvas
   */
  public render(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    facing: number, // 1: phải, -1: trái
    state: string,
    animTimer: number
  ): void {
    // Nếu chưa có clip cho state hiện tại thì dùng fallback sang idle hoặc walk
    const clip = this.clips[state] || this.clips['idle'] || this.clips['walk'];
    if (!clip || !clip.image || !clip.isLoaded || !clip.image.complete) return;

    // Tự động tính toán kích thước ô chính xác 100% từ ảnh gốc
    const frameW = clip.image.naturalWidth / clip.frames;
    const frameH = clip.image.naturalHeight;

    // Tính toán frame hiện tại
    let frameIndex = 0;
    if (state === 'jump') {
      frameIndex = Math.min(clip.frames - 1, Math.floor(clip.frames * 0.4));
    } else if (clip.loopRange && clip.loopRange.length === 2) {
      // Chế độ Intro -> Giữ tư thế Loop (Ví dụ: Chạy 001->012 rồi lặp 012<->008)
      const [startLoop, endLoop] = clip.loopRange;
      const introFrames = endLoop + 1;
      const tIntro = introFrames / clip.fps;

      if (animTimer < tIntro) {
        frameIndex = Math.min(endLoop, Math.floor(animTimer * clip.fps));
      } else {
        const elapsedInLoop = animTimer - tIntro;
        const loopLength = Math.max(1, endLoop - startLoop);
        const cycleFrames = loopLength * 2;
        const loopStep = Math.floor(elapsedInLoop * clip.fps) % cycleFrames;

        if (loopStep <= loopLength) {
          frameIndex = endLoop - loopStep; // 12 -> 11 -> 10 -> 9 -> 8
        } else {
          frameIndex = startLoop + (loopStep - loopLength); // 8 -> 9 -> 10 -> 11 -> 12
        }
      }
    } else if (clip.loopMode === 'pingpong' && clip.frames > 1) {
      const cycleFrames = (clip.frames - 1) * 2;
      const rawIdx = Math.floor(animTimer * clip.fps) % cycleFrames;
      frameIndex = rawIdx < clip.frames ? rawIdx : cycleFrames - rawIdx;
    } else {
      frameIndex = Math.floor(animTimer * clip.fps) % clip.frames;
    }

    const mult = clip.scaleMultiplier || 1.0;
    const scale = (this.targetHeight / frameH) * mult;
    const renderW = frameW * scale;
    const renderH = this.targetHeight * mult;

    const offsetX = (clip.anchorOffsetX || 0) * scale;
    const offsetY = (clip.anchorOffsetY || 0) * scale;

    ctx.save();
    ctx.translate(Math.round(x), Math.round(y));

    // 1. Bóng đổ tiếp xúc mặt đất cố định theo kích thước cơ thể nhân vật (không bị phình to khi vung cuốc/tưới nước)
    const isJumping = state === 'jump';
    const shadowRx = (this.targetHeight * 0.16) * (isJumping ? 0.75 : 1);
    const shadowRy = (this.targetHeight * 0.038) * (isJumping ? 0.6 : 1);
    ctx.fillStyle = 'rgba(28, 25, 23, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 2, shadowRx, shadowRy, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Quay hướng trái / phải
    if (facing < 0) {
      ctx.scale(-1, 1);
    }

    // Tọa độ cắt frame chính xác tuyệt đối
    const sx = Math.floor(frameIndex * frameW);
    const sy = 0;

    // 3. Vẽ frame lên Canvas với căn chỉnh tâm trọng tâm cơ thể tuyệt đối
    ctx.drawImage(
      clip.image,
      sx, sy, frameW, frameH,
      -renderW / 2 + offsetX, -renderH + 8 + offsetY, renderW, renderH
    );

    ctx.restore();
  }
}
