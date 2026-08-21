import { Player } from '../entities/Player';
import { Animal } from '../entities/Animal';
import { AnimalType } from '../constants';

export class HUD {
  public static render(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    player: Player,
    animals: Animal[],
    currentType: AnimalType
  ): void {
    ctx.save();

    // 1. TOP-LEFT: Coin Counter & Score (Glassmorphism Pill)
    const pillW = 160;
    const pillH = 46;
    const pillX = 16;
    const pillY = 16;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 14);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px Outfit, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`🪙 ${player.coins} Xu`, pillX + 14, pillY + 28);

    // 2. TOP-CENTER: Animal Herding Count Pill
    const countW = 180;
    const countH = 46;
    const countX = w / 2 - countW / 2;
    const countY = 16;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.roundRect(countX, countY, countW, countH, 14);
    ctx.fill();
    ctx.stroke();

    const animalEmoji = currentType === 'buffalo' ? '🐃 Trâu' : (currentType === 'duck' ? '🦆 Vịt' : '🐥 Gà');
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${animalEmoji}: ${animals.length} con`, w / 2, countY + 28);

    // 3. BOTTOM-CENTER: Gameplay Instruction Pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(w / 2 - 190, h - 38, 380, 26, 13);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 12px Outfit, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🌾 Vuốt vẽ vòng rào quây chuồng · Di chuyển Cậu Bé để lùa đàn', w / 2, h - 21);

    ctx.restore();
  }
}
