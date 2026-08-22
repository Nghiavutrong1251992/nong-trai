import { BananaInstance } from '../graphics/plants/BananaTree';
import { RicePlant } from '../graphics/plants/RiceCrop';

export interface GameSaveData {
  version: number;
  timestamp: number;
  player: {
    x: number;
    carriedBananas: BananaInstance[];
    coins: number;
  };
  bananas: BananaInstance[];
  riceCrop: {
    harvestedGrains: number;
    plants?: Array<{
      id: number;
      x: number;
      stage: string;
      growthTimer: number;
      watered: boolean;
      layer: 'back' | 'mid' | 'front';
    }>;
  };
}

const SAVE_KEY = 'lang_que_viet_game_save_v1';

export class SaveManager {
  private static saveTimeout: number | null = null;

  /**
   * Lưu toàn bộ dữ liệu thế giới vào localStorage
   */
  public static save(
    playerX: number,
    carriedBananas: BananaInstance[],
    playerCoins: number,
    bananaInstances: BananaInstance[],
    harvestedGrains: number,
    ricePlants?: RicePlant[]
  ): void {
    try {
      const data: GameSaveData = {
        version: 1,
        timestamp: Date.now(),
        player: {
          x: playerX,
          carriedBananas: carriedBananas.map(b => ({
            x: b.x,
            scale: b.scale,
            hasFruit: b.hasFruit,
            isFlipped: b.isFlipped,
            phase: b.phase
          })),
          coins: playerCoins
        },
        bananas: bananaInstances.map(b => ({
          x: b.x,
          scale: b.scale,
          hasFruit: b.hasFruit,
          isFlipped: b.isFlipped,
          phase: b.phase
        })),
        riceCrop: {
          harvestedGrains,
          plants: ricePlants?.map(p => ({
            id: p.id,
            x: p.x,
            stage: p.stage,
            growthTimer: p.growthTimer,
            watered: p.watered,
            layer: p.layer
          }))
        }
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Không thể lưu game vào localStorage:', e);
    }
  }

  /**
   * Lưu có debounce để tránh ghi disk liên tục mỗi frame
   */
  public static debouncedSave(
    playerX: number,
    carriedBananas: BananaInstance[],
    playerCoins: number,
    bananaInstances: BananaInstance[],
    harvestedGrains: number,
    ricePlants?: RicePlant[]
  ): void {
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = window.setTimeout(() => {
      this.save(playerX, carriedBananas, playerCoins, bananaInstances, harvestedGrains, ricePlants);
      this.saveTimeout = null;
    }, 500);
  }

  /**
   * Tải dữ liệu thế giới từ localStorage
   */
  public static load(): GameSaveData | null {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw) as GameSaveData;
      if (!data || !data.version) return null;
      return data;
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu save từ localStorage:', e);
      return null;
    }
  }

  /**
   * Xóa toàn bộ save để chơi lại từ đầu
   */
  public static clearSave(): void {
    localStorage.removeItem(SAVE_KEY);
  }
}
