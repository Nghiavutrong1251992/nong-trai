import { WildFloraRenderer } from '../graphics/plants/WildFloraRenderer';
import { LotusRenderer } from '../graphics/plants/LotusRenderer';

export type FloraType = 'grass' | 'lotus' | 'flower';

export class Flora {
  public x: number;
  public y: number;
  public type: FloraType;
  public scale: number = 0.1;
  public targetScale: number;
  public growth: number = 0.1;
  public rotation: number;
  public swayPhase: number;
  public alive: boolean = true;
  public alpha: number = 0.2;

  constructor(x: number, y: number, type: FloraType = 'grass') {
    this.x = x;
    this.y = y;
    this.type = type;
    this.targetScale = 0.7 + Math.random() * 0.4;
    this.rotation = (Math.random() - 0.5) * 0.5;
    this.swayPhase = Math.random() * Math.PI * 2;
  }

  public update(dt: number): void {
    this.swayPhase += dt * 2.5;

    if (this.growth < 1.0) {
      this.growth = Math.min(1.0, this.growth + dt * 1.5);
      this.scale = this.targetScale * this.growth;
      this.alpha = Math.min(1.0, this.growth * 1.2);
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (!this.alive || this.alpha <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.globalAlpha = this.alpha;

    const sway = Math.sin(this.swayPhase);
    ctx.rotate(this.rotation);

    if (this.type === 'grass') {
      WildFloraRenderer.renderGrass(ctx, sway);
    } else if (this.type === 'lotus') {
      LotusRenderer.render(ctx, 0, 0);
    } else {
      WildFloraRenderer.renderWildflower(ctx, sway);
    }

    ctx.restore();
  }
}
