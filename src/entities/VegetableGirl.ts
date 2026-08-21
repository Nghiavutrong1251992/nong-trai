import { GroundPlatform } from '../graphics/plants/GroundPlatform';

export class VegetableGirl {
  public x: number;
  public y: number;
  public facing: number = -1; // Quay sang trái nhìn về phía người chơi
  public targetHeight: number = 108;

  private spriteSheet = new Image();
  private isLoaded: boolean = false;
  private totalFrames: number = 40;
  private fps: number = 7.5; // Tốc độ nhịp chuyển động chậm rãi, tự nhiên
  private animTimer: number = 0;

  // Dialog & Speech Bubble
  private dialogLines: string[] = [
    'Rau muống, bắp cải tươi xanh đây anh ơi! 🥬',
    'Cà rốt, cà chua vườn nhà em mới hái sáng nay nè! 🍅',
    'Anh làm đồng vất vả ghé mua mớ rau tươi nha! ✨',
    'Lúa đồng mình năm nay trĩu hạt được mùa quá anh! 🌾'
  ];
  private currentDialogIndex: number = 0;
  private dialogTimer: number = 0;

  constructor(x: number = 1050, y: number = 480) {
    this.x = x;
    this.y = y;
    this.spriteSheet.src = '/assets/characters/npc/vegetable_girl_40frames.png';
    this.spriteSheet.onload = () => {
      this.isLoaded = true;
    };
  }

  public update(dt: number, groundY: number, playerX: number): void {
    this.animTimer += dt;
    this.dialogTimer += dt;
    this.y = GroundPlatform.getGroundY(this.x, groundY);

    // Tự động xoay mặt hướng về phía nhân vật người chơi
    if (Math.abs(playerX - this.x) < 300) {
      this.facing = playerX < this.x ? -1 : 1;
    }

    // Đổi câu thoại mỗi 6 giây
    if (this.dialogTimer > 6.0) {
      this.dialogTimer = 0;
      this.currentDialogIndex = (this.currentDialogIndex + 1) % this.dialogLines.length;
    }
  }

  public render(ctx: CanvasRenderingContext2D, playerX: number): void {
    if (!this.isLoaded || !this.spriteSheet.complete || this.spriteSheet.naturalWidth === 0) return;

    const frameW = this.spriteSheet.naturalWidth / this.totalFrames;
    const frameH = this.spriteSheet.naturalHeight;

    const currentFrame = Math.floor(this.animTimer * this.fps) % this.totalFrames;

    const scale = this.targetHeight / frameH;
    const renderW = frameW * scale;
    const renderH = this.targetHeight;
    const feetYOffset = (218.0 / frameH) * renderH; // Căn chỉnh bàn chân tiếp đất chuẩn xác

    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y));

    // 1. Bóng đổ dưới chân cô bé
    ctx.fillStyle = 'rgba(28, 25, 23, 0.28)';
    ctx.beginPath();
    ctx.ellipse(0, 3, renderW * 0.32, renderH * 0.038, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Hướng nhìn trái / phải
    if (this.facing > 0) {
      ctx.scale(-1, 1);
    }

    // 3. Cắt và vẽ frame hiện tại
    const sx = Math.floor(currentFrame * frameW);
    ctx.drawImage(
      this.spriteSheet,
      sx, 0, frameW, frameH,
      -renderW / 2, -feetYOffset + 4, renderW, renderH
    );

    ctx.restore();

    // 4. Nhãn tên trên đầu Cô Bé Bán Rau
    ctx.save();
    ctx.translate(Math.round(this.x), Math.round(this.y - feetYOffset - 8));
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(-55, -10, 110, 20, 9);
    ctx.fill();
    ctx.strokeStyle = 'rgba(244, 114, 182, 0.7)';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    ctx.fillStyle = '#f472b6';
    ctx.font = 'bold 10px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🧺 Bé Miến (Bán Rau)', 0, 3.5);
    ctx.restore();

    // 5. Bong bóng thoại mời chào khi người chơi ở gần (< 110px)
    const dist = Math.abs(playerX - this.x);
    if (dist < 110) {
      const bubbleY = this.y - feetYOffset - 36;
      const text = this.dialogLines[this.currentDialogIndex];

      ctx.save();
      ctx.font = 'bold 10.5px Outfit, sans-serif';
      const textMetrics = ctx.measureText(text);
      const bubbleW = textMetrics.width + 24;
      const bubbleH = 26;

      ctx.translate(Math.round(this.x), Math.round(bubbleY));

      // Hộp thoại phong cách gấu bông / anime tươi sáng
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.roundRect(-bubbleW / 2, -bubbleH, bubbleW, bubbleH, 12);
      ctx.fill();

      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Mũi nhọn tam giác chỉ xuống đầu cô bé
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(0, 6);
      ctx.lineTo(5, 0);
      ctx.fill();

      // Chữ thoại
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(text, 0, -10);
      ctx.restore();
    }
  }
}
