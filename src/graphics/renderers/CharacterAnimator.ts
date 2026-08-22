/**
 * CharacterAnimator.ts
 * HỆ THỐNG MÁY TRẠNG THÁI HOẠT ẢNH NHÂN VẬT ĐA NĂNG (Character Animation State Machine)
 * Quản lý tự động mọi hành động: Idle, Walk, Jump, Hoe, Water, Harvest, Cam Dieu...
 * Hỗ trợ tự động tách nền trong suốt và xử lý sprite sheet nhiều hàng.
 */

export interface AnimationClip {
  src: string;
  frames: number;
  fps: number;
  frameW?: number;
  frameH?: number;
  rows?: number; // Số hàng trong sprite sheet (mặc định 1)
  removeBg?: boolean; // Tự động tách nền trắng thành trong suốt
  scaleMultiplier?: number;
  anchorOffsetX?: number;
  anchorOffsetY?: number;
  loopMode?: 'loop' | 'pingpong';
  loopRange?: [number, number];
  image?: HTMLImageElement | HTMLCanvasElement;
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
    clip.isLoaded = false;

    img.onload = () => {
      const rows = clip.rows || 1;
      const cols = Math.round(clip.frames / rows);
      const frameW = img.naturalWidth / cols;
      const frameH = img.naturalHeight / rows;
      clip.frameW = frameW;
      clip.frameH = frameH;

      if (clip.removeBg) {
        try {
          const offCanvas = document.createElement('canvas');
          offCanvas.width = img.naturalWidth;
          offCanvas.height = img.naturalHeight;
          const octx = offCanvas.getContext('2d');
          if (octx) {
            octx.drawImage(img, 0, 0);
            const imgData = octx.getImageData(0, 0, offCanvas.width, offCanvas.height);
            const d = imgData.data;
            for (let i = 0; i < d.length; i += 4) {
              const r = d[i];
              const g = d[i + 1];
              const b = d[i + 2];
              if (r > 230 && g > 230 && b > 230) {
                d[i + 3] = 0;
              } else if (r > 205 && g > 205 && b > 205) {
                const alpha = Math.min(255, Math.max(0, 255 - ((r + g + b) / 3 - 205) * 10.2));
                d[i + 3] = Math.round(alpha);
              }
            }
            octx.putImageData(imgData, 0, 0);
            clip.image = offCanvas;
            clip.isLoaded = true;
            return;
          }
        } catch {
          // Fallback
        }
      }

      clip.image = img;
      clip.isLoaded = true;
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
    const clip = this.clips[state] || this.clips['idle'] || this.clips['walk'];
    if (!clip || !clip.image || !clip.isLoaded) return;
    if (clip.image instanceof HTMLImageElement && !clip.image.complete) return;

    const rows = clip.rows || 1;
    const cols = Math.round(clip.frames / rows);
    const frameW = clip.frameW || (clip.image.width / cols);
    const frameH = clip.frameH || (clip.image.height / rows);

    // Tính toán frame hiện tại
    let frameIndex = 0;
    if (state === 'jump') {
      frameIndex = Math.min(clip.frames - 1, Math.floor(clip.frames * 0.4));
    } else if (clip.loopRange && clip.loopRange.length === 2) {
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
          frameIndex = endLoop - loopStep;
        } else {
          frameIndex = startLoop + (loopStep - loopLength);
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

    // 1. Bóng đổ tiếp xúc mặt đất cố định
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

    // Tọa độ cắt frame chính xác từ hàng và cột
    const colIndex = frameIndex % cols;
    const rowIndex = Math.floor(frameIndex / cols);
    const sx = Math.floor(colIndex * frameW);
    const sy = Math.floor(rowIndex * frameH);

    // 3. Vẽ frame lên Canvas với căn chỉnh tâm
    ctx.drawImage(
      clip.image,
      sx, sy, frameW, frameH,
      -renderW / 2 + offsetX, -renderH + 8 + offsetY, renderW, renderH
    );

    ctx.restore();
  }
}
