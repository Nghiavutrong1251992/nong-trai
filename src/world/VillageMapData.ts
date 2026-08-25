/**
 * VillageMapData.ts
 * Dữ liệu bố cục & Quy chuẩn hệ thống 2.5D Làng Quê:
 * 1. Tọa độ neo bàn chân (Foot Anchor): (anchorX = width/2, anchorY = height)
 * 2. Perspective Scale theo độ sâu: scale = 0.82 + t * 0.18 (15-20% zoom nhẹ khi tiến lại gần)
 * 3. Chân Collider nhỏ gọn (Chỉ bao quanh phần chân/móng, không bao quanh toàn bộ sprite)
 * 4. Đa giác Walkable Polygon uốn lượn sát mép hiên nhà và bờ cỏ sát sông.
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface SceneryItem {
  id: string;
  x: number;       // Tâm X chân tiếp đất (Feet X)
  y: number;       // Vị trí bàn chân / Đáy tiếp đất (Feet Y)
  width: number;   // Chiều rộng render gốc
  height: number;  // Chiều cao render gốc
  imagePath: string;
  blocking?: boolean;
  /** Foot Collider chỉ bao quanh chân tường / móng nhà / gốc cây */
  collisionBox?: { offX: number; offY: number; w: number; h: number };
  depthY?: number;
  flipX?: boolean;
}

export interface AnimalObstacle {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

// ============================================================
// MAP CONSTANTS & PERSPECTIVE SCALING
// ============================================================

export const MAP_25D = {
  WORLD_W: 3200, // Nhân đôi chiều dài bản đồ 2.5D (3200px)
  WORLD_H: 900,

  SKY_HEIGHT: 200,

  HOUSE_ZONE_TOP: 200,
  HOUSE_ZONE_BOTTOM: 420,

  // Vùng di chuyển làng quê
  GROUND_TOP: 380,
  GROUND_BOTTOM: 620,

  RIVERBANK_TOP: 600,
  RIVERBANK_BOTTOM: 680,

  RIVER_TOP: 680,
  RIVER_BOTTOM: 900,
};

/**
 * Tính toán Perspective Scale dựa trên vị trí Y của bàn chân (feetY)
 * Tỷ lệ thu phóng nhẹ khoảng 18% (từ 0.82 sát mép nhà đến 1.0 sát mép sông)
 */
export function getPerspectiveScale(feetY: number): number {
  const minY = 410;
  const maxY = 596; // Mép cỏ sát bờ đá mới
  const t = Math.max(0, Math.min(1, (feetY - minY) / (maxY - minY)));
  return 0.82 + t * 0.18;
}

// ============================================================
// WALKABLE POLYGON — ĐA GIÁC ĐƯỜNG LÀNG UỐN LƯỢN (MỞ RỘNG 3200PX)
// ============================================================

export const WALKABLE_POLYGON: Point2D[] = [
  // --- Đường mép TRÊN (Phân đoạn 1: 0m -> 1600m) ---
  { x: 40, y: 425 },
  { x: 270, y: 418 },
  { x: 330, y: 435 },
  { x: 520, y: 412 },
  { x: 680, y: 460 },
  { x: 780, y: 460 },
  { x: 900, y: 435 },
  { x: 1320, y: 412 },
  { x: 1600, y: 425 },

  // --- Đường mép TRÊN (Phân đoạn 2 Nhân Đôi: 1600m -> 3200m) ---
  { x: 1870, y: 418 },
  { x: 1930, y: 435 },
  { x: 2120, y: 412 },
  { x: 2280, y: 460 },
  { x: 2380, y: 460 },
  { x: 2500, y: 435 },
  { x: 2920, y: 412 },
  { x: 3160, y: 428 },

  // --- Đường mép DƯỚI (Phân đoạn 2: Đường uốn lượn mềm mại sát thảm cỏ 588px - 592px) ---
  { x: 3160, y: 590 },
  { x: 2900, y: 592 },
  { x: 2620, y: 588 },
  { x: 2360, y: 592 },
  { x: 2050, y: 588 },
  { x: 1800, y: 592 },

  // --- Đường mép DƯỚI (Phân đoạn 1: Đường uốn lượn mềm mại sát thảm cỏ 588px - 592px) ---
  { x: 1600, y: 590 },
  { x: 1300, y: 592 },
  { x: 1020, y: 588 },
  { x: 760, y: 592 },
  { x: 450, y: 588 },
  { x: 200, y: 592 },
  { x: 40, y: 588 },
];

// ============================================================
// SCENERY ITEMS — PHÂN ĐOẠN 1 & PHÂN ĐOẠN 2 NHÂN ĐÔI
// ============================================================

export const VILLAGE_SCENERY: SceneryItem[] = [
  // ---- Giếng nước cổ 1 ----
  {
    id: 'gieng_nuoc_1',
    x: 700, y: 450,
    width: 70, height: 70,
    imagePath: '',
    blocking: true,
    collisionBox: { offX: -26, offY: -16, w: 52, h: 18 },
  },
  // ---- Giếng nước cổ 2 (Phân đoạn 2) ----
  {
    id: 'gieng_nuoc_2',
    x: 2300, y: 450,
    width: 70, height: 70,
    imagePath: '',
    blocking: true,
    collisionBox: { offX: -26, offY: -16, w: 52, h: 18 },
  },

  // ---- Bụi Chuối Chín 1 ----
  {
    id: 'cay_chuoi_1',
    x: 330, y: 412,
    width: 90, height: 0,
    imagePath: '/assets/props/banana_tree_fruit.png',
    blocking: true,
    collisionBox: { offX: -12, offY: -8, w: 24, h: 10 },
    depthY: 410,
  },

  // ---- Bụi Chuối Xanh 2 ----
  {
    id: 'cay_chuoi_2',
    x: 880, y: 418,
    width: 85, height: 0,
    imagePath: '/assets/props/banana_tree.png',
    blocking: true,
    collisionBox: { offX: -10, offY: -8, w: 20, h: 8 },
    depthY: 416,
  },

  // ---- Bụi Chuối Chín 3 ----
  {
    id: 'cay_chuoi_3',
    x: 1350, y: 415,
    width: 85, height: 0,
    imagePath: '/assets/props/banana_tree_fruit.png',
    blocking: true,
    collisionBox: { offX: -12, offY: -8, w: 24, h: 10 },
    depthY: 413,
  },

  // ---- Bụi Chuối 4 (Phân đoạn 2) ----
  {
    id: 'cay_chuoi_4',
    x: 1930, y: 412,
    width: 90, height: 0,
    imagePath: '/assets/props/banana_tree_fruit.png',
    blocking: true,
    collisionBox: { offX: -12, offY: -8, w: 24, h: 10 },
    depthY: 410,
  },

  // ---- Bụi Chuối 5 (Phân đoạn 2) ----
  {
    id: 'cay_chuoi_5',
    x: 2480, y: 418,
    width: 85, height: 0,
    imagePath: '/assets/props/banana_tree.png',
    blocking: true,
    collisionBox: { offX: -10, offY: -8, w: 20, h: 8 },
    depthY: 416,
  },

  // ---- Bụi Chuối 6 (Phân đoạn 2) ----
  {
    id: 'cay_chuoi_6',
    x: 2950, y: 415,
    width: 85, height: 0,
    imagePath: '/assets/props/banana_tree_fruit.png',
    blocking: true,
    collisionBox: { offX: -12, offY: -8, w: 24, h: 10 },
    depthY: 413,
  },

  // ---- Khóm Hoa Dại 1 ----
  {
    id: 'khom_hoa_1',
    x: 280, y: 430,
    width: 45, height: 0,
    imagePath: '/assets/props/flower_clump.png',
    blocking: false,
    depthY: 428,
  },

  // ---- Khóm Hoa Dại 2 ----
  {
    id: 'khom_hoa_2',
    x: 1050, y: 425,
    width: 45, height: 0,
    imagePath: '/assets/props/flower_clump.png',
    blocking: false,
    depthY: 423,
  },

  // ---- Khóm Hoa Dại 3 (Phân đoạn 2) ----
  {
    id: 'khom_hoa_3',
    x: 1880, y: 430,
    width: 45, height: 0,
    imagePath: '/assets/props/flower_clump.png',
    blocking: false,
    depthY: 428,
  },

  // ---- Khóm Hoa Dại 4 (Phân đoạn 2) ----
  {
    id: 'khom_hoa_4',
    x: 2650, y: 425,
    width: 45, height: 0,
    imagePath: '/assets/props/flower_clump.png',
    blocking: false,
    depthY: 423,
  },

  // ---- Bụi Cỏ 4 Lá 1 ----
  {
    id: 'bui_co_1',
    x: 640, y: 455,
    width: 55, height: 0,
    imagePath: '/assets/props/clover_patch.png',
    blocking: false,
    depthY: 453,
  },

  // ---- Bụi Cỏ 4 Lá 2 ----
  {
    id: 'bui_co_2',
    x: 770, y: 455,
    width: 55, height: 0,
    imagePath: '/assets/props/clover_patch.png',
    blocking: false,
    depthY: 453,
  },

  // ---- Bụi Cỏ 4 Lá 3 (Phân đoạn 2) ----
  {
    id: 'bui_co_3',
    x: 2240, y: 455,
    width: 55, height: 0,
    imagePath: '/assets/props/clover_patch.png',
    blocking: false,
    depthY: 453,
  },

  // ---- Bụi Cỏ 4 Lá 4 (Phân đoạn 2) ----
  {
    id: 'bui_co_4',
    x: 2370, y: 455,
    width: 55, height: 0,
    imagePath: '/assets/props/clover_patch.png',
    blocking: false,
    depthY: 453,
  },

  // ---- Thuyền nan trên sông 1 ----
  {
    id: 'thuyen_nan_1',
    x: 1200, y: 740,
    width: 140, height: 60,
    imagePath: '',
    blocking: false,
    depthY: 740,
  },

  // ---- Thuyền nan trên sông 2 (Phân đoạn 2) ----
  {
    id: 'thuyen_nan_2',
    x: 2800, y: 740,
    width: 140, height: 60,
    imagePath: '',
    blocking: false,
    depthY: 740,
  },
];

// ============================================================
// CHƯỚNG NGẠI VẬT FOOT COLLIDERS DÀNH CHO TẤT CẢ CON VẬT
// ============================================================

export const ANIMAL_OBSTACLES: AnimalObstacle[] = [
  { id: 'con_trau', x: 500, y: 520, w: 80, h: 22 },
  { id: 'con_heo', x: 650, y: 550, w: 48, h: 18 },
  { id: 'ga_trong', x: 960, y: 500, w: 26, h: 12 },
  { id: 'ga_mai', x: 900, y: 480, w: 24, h: 12 },
  { id: 'con_co', x: 1300, y: 470, w: 24, h: 12 },
  { id: 'be_sinh', x: 350, y: 530, w: 26, h: 14 },
];

export const GROUND_TEXTURE_PATH = '/assets/environment/village25d/dirt_road_clean.png';
export const RIVER_TEXTURE_PATH = '';
export const RIVERBANK_TEXTURE_PATH = '/assets/environment/village25d/riverbank_clean.png';
