/**
 * VillageMapData.ts
 * Dữ liệu bố cục & Quy chuẩn hệ thống 2.5D Làng Quê:
 * 1. Tọa độ neo bàn chân (Foot Anchor): (anchorX = width/2, anchorY = height)
 * 2. Perspective Scale theo độ sâu: scale = 0.82 + t * 0.18 (15-20% zoom nhẹ khi tiến lại gần)
 * 3. Chân Collider nhỏ gọn (Chỉ bao quanh phần chân/móng, không bao quanh toàn bộ sprite)
 * 4. Đa giác Walkable Polygon uốn lượn sát mép hiên nhà và bờ cỏ sát sông.
 */

import { WORLD_UNIT, ASSET_METRICS, calculateAssetScale, hToPx } from './WorldMetrics';

export interface Point2D {
  x: number;
  y: number;
}

export interface SceneryItem {
  id: string;
  x: number;       // Tâm X chân tiếp đất (Feet X - anchorX: 0.5)
  y: number;       // Vị trí bàn chân / Đáy tiếp đất (Feet Y - anchorY: 1.0)
  width: number;   // Chiều rộng render tính theo H
  height: number;  // Chiều cao render tính theo H
  imagePath: string;
  metricKey?: string;
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
  GROUND_BOTTOM: 665,

  RIVERBANK_TOP: 535,
  RIVERBANK_BOTTOM: 685,

  RIVER_TOP: 680,
  RIVER_BOTTOM: 900,
};

/**
 * Tính toán Perspective Scale dựa trên vị trí Y của bàn chân (feetY)
 * Tỷ lệ thu phóng nhẹ khoảng 18% (từ 0.82 sát mép nhà đến 1.0 sát mép sông)
 */
export function getPerspectiveScale(feetY: number): number {
  const minY = 370;
  const maxY = 648; // Giới hạn trước phần đất ẩm sát mép nước
  const t = Math.max(0, Math.min(1, (feetY - minY) / (maxY - minY)));
  return (0.76 + t * 0.24) * (WORLD_UNIT / 96);
}

// ============================================================
// WALKABLE POLYGON — ĐA GIÁC ĐƯỜNG LÀNG MỞ RỘNG TOÀN DIỆN (FULL MAP RA TÍT ĐẰNG SAU Y=370)
// ============================================================

export const WALKABLE_POLYGON: Point2D[] = [
  // --- Đường mép TRÊN (Mở rộng toàn diện ra tít đằng sau Y = 370 từ 0m -> 3200m) ---
  { x: 30, y: 370 },
  { x: 400, y: 370 },
  { x: 800, y: 370 },
  { x: 1200, y: 370 },
  { x: 1600, y: 370 },
  { x: 2000, y: 370 },
  { x: 2400, y: 370 },
  { x: 2800, y: 370 },
  { x: 3170, y: 370 },

  // --- Đường mép DƯỚI (Dừng trước phần đất ẩm mép sông 640px - 648px) ---
  { x: 3170, y: 645 },
  { x: 2950, y: 648 },
  { x: 2700, y: 642 },
  { x: 2450, y: 647 },
  { x: 2200, y: 644 },
  { x: 1950, y: 648 },
  { x: 1700, y: 643 },
  { x: 1450, y: 647 },
  { x: 1200, y: 645 },
  { x: 950, y: 642 },
  { x: 700, y: 647 },
  { x: 450, y: 644 },
  { x: 200, y: 648 },
  { x: 30, y: 645 },
];

// ============================================================
// SCENERY ITEMS — QUY CHUẨN TỶ LỆ THEO 1H = 76.8PX (NHỎ LẠI 20%)
// ============================================================

export const VILLAGE_SCENERY: SceneryItem[] = [
  // ---- Cây Đa Cổ Thụ Duy Nhất Tại Trung Tâm Làng (X=1600, Thân to cổ thụ rộng 250px) ----
  {
    id: 'cay_da_1',
    metricKey: 'cay_da_co_thu',
    x: 1600, y: 395,
    width: 480, height: 400,
    imagePath: '/assets/environment/village25d/scenery/cay_da_co_thu.png?v=5',
    blocking: true,
    collisionBox: { offX: -125, offY: -18, w: 250, h: 28 },
    depthY: 395,
  },

  // ---- Ngôi Nhà Tranh Vách Đất 1 (Thềm nhà Y=412, cả nhà rộng ~6.0H = 464px, cao ~3.1H = 238px) ----
  {
    id: 'nha_tranh_1',
    metricKey: 'nha_tranh',
    x: 520, y: 412,
    width: 464, height: 238,
    imagePath: '/assets/environment/village25d/scenery/nha_tranh.png',
    blocking: true,
    collisionBox: { offX: -184, offY: -26, w: 368, h: 26 },
    depthY: 412,
  },
  // ---- Hàng Rào Tre Trước Nhà 1 (Bên Trái - Chân rào Y=445, tạo sân trong Y=412..442 rộng rãi) ----
  {
    id: 'hang_rao_1_trai',
    metricKey: 'hang_rao_tre',
    x: 280, y: 445,
    width: 176, height: 31,
    imagePath: '/assets/environment/village25d/scenery/hang_rao_tre.png',
    blocking: true,
    collisionBox: { offX: -88, offY: -4, w: 176, h: 8 },
    depthY: 445,
  },
  // ---- Hàng Rào Tre Trước Nhà 1 (Bên Phải - Chân rào Y=445) ----
  {
    id: 'hang_rao_1_phai',
    metricKey: 'hang_rao_tre',
    x: 760, y: 445,
    width: 176, height: 31,
    imagePath: '/assets/environment/village25d/scenery/hang_rao_tre.png',
    blocking: true,
    collisionBox: { offX: -88, offY: -4, w: 176, h: 8 },
    depthY: 445,
  },

  // ---- Ngôi Nhà Tranh Vách Đất 2 (Phân đoạn 2) ----
  {
    id: 'nha_tranh_2',
    metricKey: 'nha_tranh',
    x: 2120, y: 412,
    width: 464, height: 238,
    imagePath: '/assets/environment/village25d/scenery/nha_tranh.png',
    blocking: true,
    collisionBox: { offX: -184, offY: -26, w: 368, h: 26 },
    depthY: 412,
  },
  // ---- Hàng Rào Tre Trước Nhà 2 (Bên Trái - Phân đoạn 2) ----
  {
    id: 'hang_rao_2_trai',
    metricKey: 'hang_rao_tre',
    x: 1880, y: 445,
    width: 176, height: 31,
    imagePath: '/assets/environment/village25d/scenery/hang_rao_tre.png',
    blocking: true,
    collisionBox: { offX: -88, offY: -4, w: 176, h: 8 },
    depthY: 445,
  },
  // ---- Hàng Rào Tre Trước Nhà 2 (Bên Phải - Phân đoạn 2) ----
  {
    id: 'hang_rao_2_phai',
    metricKey: 'hang_rao_tre',
    x: 2360, y: 445,
    width: 176, height: 31,
    imagePath: '/assets/environment/village25d/scenery/hang_rao_tre.png',
    blocking: true,
    collisionBox: { offX: -88, offY: -4, w: 176, h: 8 },
    depthY: 445,
  },

  // ---- Giếng nước cổ 1 (Cao 0.8H = 61.4px) ----
  {
    id: 'gieng_nuoc_1',
    metricKey: 'gieng_nuoc',
    x: 1000, y: 445,
    width: 61, height: 61,
    imagePath: '',
    blocking: true,
    collisionBox: { offX: -24, offY: -10, w: 48, h: 14 },
    depthY: 445,
  },
  // ---- Giếng nước cổ 2 (Phân đoạn 2) ----
  {
    id: 'gieng_nuoc_2',
    metricKey: 'gieng_nuoc',
    x: 2600, y: 445,
    width: 61, height: 61,
    imagePath: '',
    blocking: true,
    collisionBox: { offX: -24, offY: -10, w: 48, h: 14 },
    depthY: 445,
  },

  // ---- Bụi Chuối Chín 1 (Cao ~2.05H = 157px) ----
  {
    id: 'cay_chuoi_1',
    metricKey: 'banana_tree_fruit',
    x: 330, y: 412,
    width: 148, height: 157,
    imagePath: '/assets/props/banana_tree_fruit.png',
    blocking: true,
    collisionBox: { offX: -11, offY: -6, w: 22, h: 8 },
    depthY: 410,
  },

  // ---- Bụi Chuối Xanh 2 (Cao ~1.95H = 150px) ----
  {
    id: 'cay_chuoi_2',
    metricKey: 'banana_tree',
    x: 920, y: 418,
    width: 142, height: 150,
    imagePath: '/assets/props/banana_tree.png',
    blocking: true,
    collisionBox: { offX: -11, offY: -6, w: 22, h: 8 },
    depthY: 416,
  },

  // ---- Bụi Chuối Chín 3 ----
  {
    id: 'cay_chuoi_3',
    metricKey: 'banana_tree_fruit',
    x: 1350, y: 415,
    width: 148, height: 157,
    imagePath: '/assets/props/banana_tree_fruit.png',
    blocking: true,
    collisionBox: { offX: -11, offY: -6, w: 22, h: 8 },
    depthY: 413,
  },

  // ---- Bụi Chuối 4 (Phân đoạn 2) ----
  {
    id: 'cay_chuoi_4',
    metricKey: 'banana_tree_fruit',
    x: 1930, y: 412,
    width: 148, height: 157,
    imagePath: '/assets/props/banana_tree_fruit.png',
    blocking: true,
    collisionBox: { offX: -11, offY: -6, w: 22, h: 8 },
    depthY: 410,
  },

  // ---- Bụi Chuối 5 (Phân đoạn 2) ----
  {
    id: 'cay_chuoi_5',
    metricKey: 'banana_tree',
    x: 2520, y: 418,
    width: 142, height: 150,
    imagePath: '/assets/props/banana_tree.png',
    blocking: true,
    collisionBox: { offX: -11, offY: -6, w: 22, h: 8 },
    depthY: 416,
  },

  // ---- Bụi Chuối 6 (Phân đoạn 2) ----
  {
    id: 'cay_chuoi_6',
    metricKey: 'banana_tree_fruit',
    x: 2950, y: 415,
    width: 148, height: 157,
    imagePath: '/assets/props/banana_tree_fruit.png',
    blocking: true,
    collisionBox: { offX: -11, offY: -6, w: 22, h: 8 },
    depthY: 413,
  },

  // ---- Khóm Hoa Dại 1 (Cao 0.55H = 42.2px) ----
  {
    id: 'khom_hoa_1',
    metricKey: 'flower_clump',
    x: 280, y: 430,
    width: 49, height: 42,
    imagePath: '/assets/props/flower_clump.png',
    blocking: false,
    depthY: 428,
  },

  // ---- Khóm Hoa Dại 2 ----
  {
    id: 'khom_hoa_2',
    metricKey: 'flower_clump',
    x: 1050, y: 425,
    width: 49, height: 42,
    imagePath: '/assets/props/flower_clump.png',
    blocking: false,
    depthY: 423,
  },

  // ---- Khóm Hoa Dại 3 (Phân đoạn 2) ----
  {
    id: 'khom_hoa_3',
    metricKey: 'flower_clump',
    x: 1880, y: 430,
    width: 49, height: 42,
    imagePath: '/assets/props/flower_clump.png',
    blocking: false,
    depthY: 428,
  },

  // ---- Khóm Hoa Dại 4 (Phân đoạn 2) ----
  {
    id: 'khom_hoa_4',
    metricKey: 'flower_clump',
    x: 2650, y: 425,
    width: 49, height: 42,
    imagePath: '/assets/props/flower_clump.png',
    blocking: false,
    depthY: 423,
  },

  // ---- Bụi Cỏ 4 Lá 1 (Cao 0.35H = 26.9px) ----
  {
    id: 'bui_co_1',
    metricKey: 'clover_patch',
    x: 640, y: 455,
    width: 44, height: 27,
    imagePath: '/assets/props/clover_patch.png',
    blocking: false,
    depthY: 453,
  },

  // ---- Bụi Cỏ 4 Lá 2 ----
  {
    id: 'bui_co_2',
    metricKey: 'clover_patch',
    x: 770, y: 455,
    width: 44, height: 27,
    imagePath: '/assets/props/clover_patch.png',
    blocking: false,
    depthY: 453,
  },

  // ---- Bụi Cỏ 4 Lá 3 (Phân đoạn 2) ----
  {
    id: 'bui_co_3',
    metricKey: 'clover_patch',
    x: 2240, y: 455,
    width: 44, height: 27,
    imagePath: '/assets/props/clover_patch.png',
    blocking: false,
    depthY: 453,
  },

  // ---- Bụi Cỏ 4 Lá 4 (Phân đoạn 2) ----
  {
    id: 'bui_co_4',
    metricKey: 'clover_patch',
    x: 2370, y: 455,
    width: 44, height: 27,
    imagePath: '/assets/props/clover_patch.png',
    blocking: false,
    depthY: 453,
  },

  // ---- Thuyền nan trên sông 1 (Dài 2.4H = 184px) ----
  {
    id: 'thuyen_nan_1',
    metricKey: 'thuyen_nan',
    x: 1200, y: 740,
    width: 184, height: 48,
    imagePath: '',
    blocking: false,
    depthY: 740,
  },

  // ---- Thuyền nan trên sông 2 (Phân đoạn 2) ----
  {
    id: 'thuyen_nan_2',
    metricKey: 'thuyen_nan',
    x: 2800, y: 740,
    width: 184, height: 48,
    imagePath: '',
    blocking: false,
    depthY: 740,
  },
];

// ============================================================
// CHƯỚNG NGẠI VẬT FOOT COLLIDERS DÀNH CHO TẤT CẢ CON VẬT (CHUẨN THEO H)
// ============================================================

export const ANIMAL_OBSTACLES: AnimalObstacle[] = [
  { id: 'con_trau', x: 500, y: 520, w: Math.round(hToPx(0.95)), h: Math.round(hToPx(0.22)) },
  { id: 'con_heo', x: 650, y: 550, w: Math.round(hToPx(0.55)), h: Math.round(hToPx(0.18)) },
  { id: 'ga_trong', x: 960, y: 500, w: Math.round(hToPx(0.30)), h: Math.round(hToPx(0.12)) },
  { id: 'ga_mai', x: 900, y: 480, w: Math.round(hToPx(0.28)), h: Math.round(hToPx(0.12)) },
  { id: 'con_co', x: 1300, y: 470, w: Math.round(hToPx(0.26)), h: Math.round(hToPx(0.12)) },
  { id: 'be_sinh', x: 350, y: 530, w: Math.round(hToPx(0.28)), h: Math.round(hToPx(0.12)) },
];

export const GROUND_TEXTURE_PATH = '/assets/environment/village25d/unified_road_shore.png';
export const RIVER_TEXTURE_PATH = '';
export const RIVERBANK_TEXTURE_PATH = '';

