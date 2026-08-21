export type ItemType = 'milk' | 'egg' | 'gold' | 'rice';

export class Item {
  public x: number;
  public y: number;
  public type: ItemType;
  public life: number = 0;
  public maxLife: number = 14;
  public alpha: number = 1.0;
  public scale: number = 0.2;
  public bobPhase: number = Math.random() * Math.PI * 2;
  public alive: boolean = true;
  public value: number = 10;

  constructor(x: number, y: number, type: ItemType) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.value = type === 'milk' ? 25 : (type === 'egg' ? 15 : (type === 'gold' ? 50 : 10));
  }

  public update(dt: number, playerX: number, playerY: number, magnetRadius: number): boolean {
    this.life += dt;
    this.bobPhase += dt * 3;

    if (this.scale < 1.0) {
      this.scale = Math.min(1.0, this.scale + dt * 4);
    }

    // Magnet pulling towards player
    const dist = Math.hypot(this.x - playerX, this.y - playerY);
    if (dist < magnetRadius) {
      const speed = 260;
      const angle = Math.atan2(playerY - this.y, playerX - this.x);
      this.x += Math.cos(angle) * speed * dt;
      this.y += Math.sin(angle) * speed * dt;

      // Collect when close
      if (dist < 28) {
        this.alive = false;
        return true; // Collected!
      }
    }

    if (this.life > this.maxLife - 2) {
      this.alpha = Math.max(0, (this.maxLife - this.life) / 2);
    }
    if (this.life >= this.maxLife) {
      this.alive = false;
    }

    return false;
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.alive || this.alpha <= 0) return;
    ctx.save();
    const bob = Math.sin(this.bobPhase) * 3;
    ctx.translate(this.x, this.y + bob);
    ctx.scale(this.scale, this.scale);
    ctx.globalAlpha = this.alpha;

    // Glowing base aura
    ctx.fillStyle = this.type === 'gold'
      ? 'rgba(234, 179, 8, 0.4)'
      : (this.type === 'milk' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(251, 146, 60, 0.35)');
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();

    // Emoji icon
    ctx.font = '20px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const icon = this.type === 'milk' ? '🥛' : (this.type === 'egg' ? '🥚' : (this.type === 'gold' ? '🪙' : '🌾'));
    ctx.fillText(icon, 0, 0);

    ctx.restore();
  }
}
