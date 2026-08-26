/**
 * AssetLoader.ts
 * HỆ THỐNG QUẢN LÝ & TIỀN NẠP TÀI NGUYÊN TẬP TRUNG (Centralized Asset Loader & Cache)
 * 
 * TÍNH NĂNG CHÍNH:
 * 1. Phân chia 2 tầng tải:
 *    - Tầng Core (Bắt buộc cho Frame 0): Player idle/walk, Địa hình, Bầu trời, Nhà tranh, Trâu, Gà, Cây chuối, Bụi tre (~3MB).
 *    - Tầng Lazy (Tải ngầm sau khi vào game): Sprite nặng (Cuốc đất 6.4MB, Tưới nước 6.8MB, Thu hoạch 3.6MB, v.v.).
 * 2. Lưu trữ Cache RAM tập trung: Map<string, HTMLImageElement>.
 * 3. Hỗ trợ Versioning cố định để kích hoạt 100% Browser Disk/Memory Cache.
 * 4. Báo cáo tiến trình tải chi tiết (0% -> 100%) cho Preloader UI.
 */

export const ASSET_VERSION = 'v1.0.4';

export interface AssetDef {
  key: string;
  src: string;
  isCore?: boolean;
}

export class AssetLoader {
  private static cache: Map<string, HTMLImageElement> = new Map();
  private static loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();

  // DANH SÁCH ASSET TẦNG 1 (CORE ASSETS) - Tải trước khi vào Game
  public static readonly CORE_ASSETS: AssetDef[] = [
    // Nhân vật chính cơ bản
    { key: 'player_idle', src: '/assets/characters/player/idle.png', isCore: true },
    { key: 'player_walk', src: '/assets/characters/player/walk.png', isCore: true },
    { key: 'player_cam_cuoc', src: '/assets/characters/player/cam_cuoc.png', isCore: true },
    { key: 'player_cam_thung_nuoc', src: '/assets/characters/player/cam_thung_nuoc.png', isCore: true },
    { key: 'player_cam_liem', src: '/assets/characters/player/cam_liem.png', isCore: true },
    { key: 'kien_thin_run', src: '/assets/characters/kien_thin/kien_thin_run_sheet.png', isCore: true },
    { key: 'be_sinh_idle', src: '/assets/characters/be_sinh/be_sinh_idle_sheet.png', isCore: true },
    { key: 'be_sinh_walk', src: '/assets/characters/be_sinh/be_sinh_walk_sheet.png', isCore: true },
    { key: 'be_sinh_run', src: '/assets/characters/be_sinh/be_sinh_run_sheet.png', isCore: true },
    { key: 'be_sinh_school', src: '/assets/characters/be_sinh/be_sinh_school_sheet.png', isCore: true },

    // Bầu trời & Môi trường & Nhà cửa & Cây cổ thụ & Rễ buông
    { key: 'bg_sky', src: '/assets/environment/map1/bg_sky.jpg', isCore: true },
    { key: 'ground_tile', src: '/assets/environment/map1/ground_tile.png', isCore: true },
    { key: 'thatched_cottage', src: '/assets/environment/thatched_cottage.png', isCore: true },
    { key: 'nha_tranh_25d', src: '/assets/environment/village25d/scenery/nha_tranh.png', isCore: true },
    { key: 'hang_rao_tre_25d', src: '/assets/environment/village25d/scenery/hang_rao_tre.png', isCore: true },
    { key: 'cay_da_co_thu_25d', src: '/assets/environment/village25d/scenery/cay_da_co_thu.png', isCore: true },
    { key: 're_da_1', src: '/assets/environment/village25d/scenery/re_da_1.png', isCore: true },
    { key: 're_da_2', src: '/assets/environment/village25d/scenery/re_da_2.png', isCore: true },
    { key: 're_da_3', src: '/assets/environment/village25d/scenery/re_da_3.png', isCore: true },
    { key: 're_da_4', src: '/assets/environment/village25d/scenery/re_da_4.png', isCore: true },
    { key: 'cottage_haystack', src: '/assets/environment/map1/cottage_haystack.png', isCore: true },
    { key: 'gate', src: '/assets/environment/map1/gate.png', isCore: true },
    { key: 'bamboo_trees', src: '/assets/environment/map1/bamboo_trees.png', isCore: true },

    // Cây cỏ & Nông sản cốt lõi
    { key: 'banana_tree', src: '/assets/props/banana_tree.png', isCore: true },
    { key: 'banana_tree_fruit', src: '/assets/props/banana_tree_fruit.png', isCore: true },
    { key: 'bamboo_mature', src: '/assets/props/bamboo_mature.png', isCore: true },
    { key: 'bamboo_grove', src: '/assets/props/bamboo_grove.png', isCore: true },
    { key: 'grass_clump', src: '/assets/props/grass_clump.png', isCore: true },
    { key: 'clover_patch', src: '/assets/props/clover_patch.png', isCore: true },
    { key: 'flower_clump', src: '/assets/props/flower_clump.png', isCore: true },
    { key: 'single_grass_blade', src: '/assets/props/single_grass_blade.png', isCore: true },
    { key: 'soil_texture', src: '/assets/props/soil_texture.png', isCore: true },
    { key: 'village_ground_texture', src: '/assets/props/village_ground_texture.png', isCore: true },

    // Lúa các thời kỳ & Hoa dại đồng quê
    { key: 'rice_seedling', src: '/assets/props/rice_seedling.png', isCore: true },
    { key: 'rice_green', src: '/assets/props/rice_green.png', isCore: true },
    { key: 'rice_ripe', src: '/assets/props/rice_ripe.png', isCore: true },
    { key: 'rice_field_strip', src: '/assets/environment/rice_field_strip.png', isCore: true },
    { key: 'hoa_xuyen_chi', src: '/assets/props/flowers/hoa_xuyen_chi.png', isCore: true },
    { key: 'hoa_co_may', src: '/assets/props/flowers/hoa_co_may.png', isCore: true },
    { key: 'hoa_muoi_gio', src: '/assets/props/flowers/hoa_muoi_gio.png', isCore: true },
    { key: 'hoa_chua_me_dat', src: '/assets/props/flowers/hoa_chua_me_dat.png', isCore: true },
    { key: 'hoa_bim_bim', src: '/assets/props/flowers/hoa_bim_bim.png', isCore: true },
    { key: 'hoa_dam_but', src: '/assets/props/flowers/hoa_dam_but.png', isCore: true },
    { key: 'bui_cuc_dai', src: '/assets/props/flowers/bui_cuc_dai.png', isCore: true },
    { key: 'tham_co_hoa_dai', src: '/assets/props/flowers/tham_co_hoa_dai.png', isCore: true },
    { key: 'single_xuyen_chi', src: '/assets/props/flowers/single_xuyen_chi.png', isCore: true },
    { key: 'single_co_may', src: '/assets/props/flowers/single_co_may.png', isCore: true },
    { key: 'single_muoi_gio', src: '/assets/props/flowers/single_muoi_gio.png', isCore: true },
    { key: 'single_chua_me_dat', src: '/assets/props/flowers/single_chua_me_dat.png', isCore: true },
    { key: 'single_bim_bim', src: '/assets/props/flowers/single_bim_bim.png', isCore: true },
    { key: 'single_dam_but', src: '/assets/props/flowers/single_dam_but.png', isCore: true },
    { key: 'single_cuc_dai', src: '/assets/props/flowers/single_cuc_dai.png', isCore: true },
    { key: 'single_tham_co', src: '/assets/props/flowers/single_tham_co.png', isCore: true },

    // Thú nuôi cốt lõi gần người chơi
    { key: 'buffalo_walk', src: '/assets/characters/brown_buffalo/buffalo_walk_sheet.png', isCore: true },
    { key: 'buffalo_graze', src: '/assets/characters/brown_buffalo/buffalo_graze_sheet.png', isCore: true },
    { key: 'buffalo_idle', src: '/assets/characters/brown_buffalo/buffalo_idle_sheet.png', isCore: true },

    { key: 'hen_walk', src: '/assets/characters/hen_v2/hen_walk_sheet.png', isCore: true },
    { key: 'hen_eat', src: '/assets/characters/hen_v2/hen_eat_sheet.png', isCore: true },

    { key: 'rooster_walk', src: '/assets/characters/rooster/rooster_walk_sheet.png', isCore: true },
    { key: 'rooster_idle', src: '/assets/characters/rooster/rooster_idle_sheet.png', isCore: true },
    { key: 'rooster_eat', src: '/assets/characters/rooster/rooster_eat_sheet.png', isCore: true },

    { key: 'pig_idle', src: '/assets/characters/pig/pig_idle_sheet.png', isCore: true },
    { key: 'pig_walk', src: '/assets/characters/pig/pig_walk_sheet.png', isCore: true },
    { key: 'pig_eat', src: '/assets/characters/pig/pig_eat_sheet.png', isCore: true },

    // 6 Loài cá đồng quê Việt Nam
    { key: 'fish_chep', src: '/assets/props/fishes/ca_chep.png', isCore: true },
    { key: 'fish_tre',  src: '/assets/props/fishes/ca_tre.png', isCore: true },
    { key: 'fish_ro',   src: '/assets/props/fishes/ca_ro.png', isCore: true },
    { key: 'fish_me',   src: '/assets/props/fishes/ca_me.png', isCore: true },
    { key: 'fish_loc',  src: '/assets/props/fishes/ca_loc.png', isCore: true },
    { key: 'fish_vang', src: '/assets/props/fishes/ca_vang.png', isCore: true },

    // 6 Cây thủy sinh / Rong bèo ao cá
    { key: 'plant_rong_duoi_chon', src: '/assets/props/water_plants/rong_duoi_chon.png', isCore: true },
    { key: 'plant_beo_tam',        src: '/assets/props/water_plants/beo_tam.png', isCore: true },
    { key: 'plant_rong_la_dai',    src: '/assets/props/water_plants/rong_la_dai.png', isCore: true },
    { key: 'plant_co_toc_nuoc',    src: '/assets/props/water_plants/co_toc_nuoc.png', isCore: true },
    { key: 'plant_rong_xuong_ca',  src: '/assets/props/water_plants/rong_xuong_ca.png', isCore: true },
    { key: 'plant_rong_diep',      src: '/assets/props/water_plants/rong_diep.png', isCore: true },

    { key: 'stork_idle', src: '/assets/characters/stork/stork_idle_custom.png', isCore: true }
  ];

  // DANH SÁCH ASSET TẦNG 2 (LAZY ASSETS) - Tải ngầm sau khi đã vào game
  public static readonly LAZY_ASSETS: AssetDef[] = [
    // Sprite hành động nặng
    { key: 'player_hoe', src: '/assets/characters/player/hoe.png', isCore: false },
    { key: 'player_water', src: '/assets/characters/player/water.png', isCore: false },
    { key: 'player_harvest', src: '/assets/characters/player/harvest.png', isCore: false },

    // Cò cất cánh, sà xuống, rình mồi & ăn cá
    { key: 'stork_takeoff', src: '/assets/characters/stork/stork_takeoff_custom.png', isCore: false },
    { key: 'stork_landing', src: '/assets/characters/stork/stork_landing_custom.png', isCore: false },
    { key: 'stork_stalk', src: '/assets/characters/stork/stork_stalk_custom.png', isCore: false },
    { key: 'stork_eat', src: '/assets/characters/stork/stork_eat_custom.png', isCore: false },

    // Bò & các đối tượng phụ
    { key: 'cow_walk', src: '/assets/characters/cow/cow_walk_custom.png', isCore: false },
    { key: 'cow_idle', src: '/assets/characters/cow/cow_idle_custom.png', isCore: false },
    { key: 'cow_graze', src: '/assets/characters/cow/cow_graze_custom.png', isCore: false }
  ];

  /**
   * Nạp một hình ảnh (có cache & versioning)
   */
  public static loadSingleImage(src: string): Promise<HTMLImageElement> {
    const cleanSrc = src.split('?')[0];
    
    // Đã có trong cache RAM
    if (this.cache.has(cleanSrc)) {
      return Promise.resolve(this.cache.get(cleanSrc)!);
    }

    // Đang trong quá trình tải
    if (this.loadingPromises.has(cleanSrc)) {
      return this.loadingPromises.get(cleanSrc)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `${cleanSrc}?v=${ASSET_VERSION}`;

      img.onload = () => {
        this.cache.set(cleanSrc, img);
        this.loadingPromises.delete(cleanSrc);
        resolve(img);
      };

      img.onerror = (err) => {
        console.warn(`[AssetLoader] Lỗi tải ảnh: ${cleanSrc}`, err);
        // Tránh làm crash game, fallback ảnh trống
        this.cache.set(cleanSrc, img);
        this.loadingPromises.delete(cleanSrc);
        resolve(img);
      };
    });

    this.loadingPromises.set(cleanSrc, promise);
    return promise;
  }

  /**
   * Tải toàn bộ Core Assets trước khi vào Game (Báo tiến trình cho UI)
   */
  public static async loadCoreAssets(onProgress?: (progress: number, loadedCount: number, totalCount: number) => void): Promise<void> {
    const total = this.CORE_ASSETS.length;
    let loaded = 0;

    const promises = this.CORE_ASSETS.map(async (asset) => {
      try {
        await this.loadSingleImage(asset.src);
      } catch (e) {
        console.warn(`Không thể nạp asset: ${asset.key}`, e);
      } finally {
        loaded++;
        if (onProgress) {
          const pct = Math.min(100, Math.round((loaded / total) * 100));
          onProgress(pct, loaded, total);
        }
      }
    });

    await Promise.all(promises);
  }

  /**
   * Tải ngầm tầng Lazy Assets (Chạy nền không gây lag)
   */
  public static loadLazyAssets(): void {
    let index = 0;
    const loadNext = () => {
      if (index >= this.LAZY_ASSETS.length) return;
      const asset = this.LAZY_ASSETS[index++];
      
      // Sử dụng requestIdleCallback hoặc setTimeout để nạp ngầm
      const idleCallback = window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 50));
      idleCallback(() => {
        this.loadSingleImage(asset.src).then(() => {
          loadNext();
        });
      });
    };

    // Bắt đầu nạp ngầm sau khi game đã chạy ổn định 500ms
    setTimeout(() => {
      loadNext();
    }, 500);
  }

  /**
   * Lấy nhanh một hình ảnh từ Cache (trả về Image nếu đã sẵn sàng hoặc tạo nạp ngầm)
   */
  public static getImage(src: string): HTMLImageElement {
    const cleanSrc = src.split('?')[0];
    if (this.cache.has(cleanSrc)) {
      return this.cache.get(cleanSrc)!;
    }

    // Nếu chưa có trong cache, nạp tức thì và trả về Image instance
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `${cleanSrc}?v=${ASSET_VERSION}`;
    this.cache.set(cleanSrc, img);
    return img;
  }

  /**
   * Kiểm tra ảnh đã tải xong và sẵn sàng vẽ chưa
   */
  public static isReady(src: string): boolean {
    const cleanSrc = src.split('?')[0];
    const img = this.cache.get(cleanSrc);
    return !!(img && img.complete && img.naturalWidth > 0);
  }
}
