/**
 * WorldMetrics.ts
 * HỆ THỐNG QUY CHUẨN ĐƠN VỊ TOÀN CẦU (H-Unit World Metric Architecture)
 * 
 * QUY TẮC CỐT LÕI:
 * - 1H = Chiều cao nhân vật tiêu chuẩn (từ đỉnh đầu/nón đến điểm chạm đất) = 96 pixels (ở zoom 100%).
 * - Toàn bộ công trình, cây cối, thú nuôi, hàng rào, sông ngòi đều được định nghĩa tỷ lệ theo H.
 * - Khi đổi độ phân giải hoặc zoom camera, chỉ thay đổi WORLD_UNIT.
 * - Điểm neo (Anchor/Pivot) thống nhất: Bottom-Center (anchorX = 0.5, anchorY = 1.0) tại điểm tiếp đất.
 */

export const WORLD_UNIT = 76.8; // 1H = 76.8px (Tất cả thu nhỏ 20% so với 96px gốc)

export type MeasureType =
  | 'doorHeight'       // Chiều cao khoảng mở của cửa (nhà cửa)
  | 'postHeight'       // Chiều cao cọc/cột (hàng rào, cổng)
  | 'fullHeight'       // Đỉnh ngọn tới chân (cây cối, hoa cỏ)
  | 'shoulderHeight'   // Mặt đất tới vai (trâu, lợn, thú nuôi)
  | 'fullLength'       // Chiều dài thân (thuyền nan, xe bò)
  | 'crownToFeet';     // Đỉnh đầu/nón tới chân (nhân vật)

export interface AssetMetric {
  measure: MeasureType;
  sourceMeasurePx: number;
  targetH: number;       // Tỷ lệ theo đơn vị H
  anchorX?: number;      // Mặc định 0.5 (giữa chân)
  anchorY?: number;      // Mặc định 1.0 (chạm đất)
  collision?: {
    widthH: number;      // Bề rộng collider theo H
    heightH: number;     // Chiều cao collider theo H
    offYH?: number;      // Độ lệch Y so với điểm chạm đất theo H
  };
}

/**
 * BẢNG METADATA QUY CHUẨN SCALE & COLLISION TOÀN BỘ ASSET TRONG GAME
 */
export const ASSET_METRICS: Record<string, AssetMetric> = {
  // === NHÂN VẬT CHÍNH ===
  player: {
    measure: 'crownToFeet',
    sourceMeasurePx: 110,
    targetH: 1.0,        // 1.0H = 96px
    anchorX: 0.5,
    anchorY: 1.0,
    collision: {
      widthH: 0.32,      // ~30.7px
      heightH: 0.12,     // ~11.5px
      offYH: -0.06
    }
  },

  // === CÔNG TRÌNH KIẾN TRÚC ===
  nha_tranh: {
    measure: 'doorHeight',
    sourceMeasurePx: 188, // Chiều cao khoảng mở cửa trong ảnh gốc nha_tranh.png (992x510)
    targetH: 1.15,       // Cửa cao 1.15H (~110px), cả nhà rộng ~6.0H (~580px), cao ~3.1H (~298px)
    anchorX: 0.5,
    anchorY: 1.0,
    collision: {
      widthH: 4.8,       // Vùng móng đá cản bước
      heightH: 0.28,
      offYH: -0.14
    }
  },

  hang_rao_tre: {
    measure: 'postHeight',
    sourceMeasurePx: 165, // Chiều cao cọc tre trong ảnh gốc hang_rao_tre.png (928x165)
    targetH: 0.58,       // Hàng rào cao 0.58H (~55.7px, ngang thắt lưng nhân vật)
    anchorX: 0.5,
    anchorY: 1.0,
    collision: {
      widthH: 3.1,
      heightH: 0.14,
      offYH: -0.07
    }
  },

  gieng_nuoc: {
    measure: 'fullHeight',
    sourceMeasurePx: 70,
    targetH: 0.80,       // Giếng nước cao 0.8H (~76.8px)
    anchorX: 0.5,
    anchorY: 1.0,
    collision: {
      widthH: 0.65,
      heightH: 0.22,
      offYH: -0.11
    }
  },

  thuyen_nan: {
    measure: 'fullLength',
    sourceMeasurePx: 140,
    targetH: 2.4,        // Thân thuyền dài 2.4H (~184px)
    anchorX: 0.5,
    anchorY: 1.0
  },

  // === CÂY ĐA CỔ THỤ LÀNG QUÊ ===
  cay_da_co_thu: {
    measure: 'fullHeight',
    sourceMeasurePx: 1101, // Chiều cao ảnh gốc cay_da_co_thu.png (1319x1101)
    targetH: 5.2,        // Chiều cao hiển thị 5.2H (~400px, tán rộng ~480px)
    anchorX: 0.5,
    anchorY: 1.0,
    collision: {
      widthH: 3.25,      // Vùng va chạm thân cổ thụ & gốc rễ xòe rộng ~3.25H (~250px)
      heightH: 0.36,     // Chiều cao collider gốc ~28px
      offYH: -0.18
    }
  },

  // === RỄ CÂY ĐA BUÔNG RỦ ===
  re_da_1: {
    measure: 'fullHeight',
    sourceMeasurePx: 1720,
    targetH: 2.8,        // Sợi rễ dài nhất ~215px
    anchorX: 0.5,
    anchorY: 0.0         // Neo tại điểm treo cành trên cùng
  },
  re_da_2: {
    measure: 'fullHeight',
    sourceMeasurePx: 1010,
    targetH: 1.8,        // Sợi rễ vừa ~138px
    anchorX: 0.5,
    anchorY: 0.0
  },
  re_da_3: {
    measure: 'fullHeight',
    sourceMeasurePx: 1517,
    targetH: 2.5,        // Sợi rễ dài thứ hai ~192px
    anchorX: 0.5,
    anchorY: 0.0
  },
  re_da_4: {
    measure: 'fullHeight',
    sourceMeasurePx: 678,
    targetH: 1.2,        // Sợi rễ ngắn ~92px
    anchorX: 0.5,
    anchorY: 0.0
  },

  // === CÂY CỐI & HOA CỎ ===
  banana_tree: {
    measure: 'fullHeight',
    sourceMeasurePx: 831,
    targetH: 1.95,       // Cây chuối cao 1.95H (~187px)
    anchorX: 0.5,
    anchorY: 1.0,
    collision: {
      widthH: 0.25,
      heightH: 0.10,
      offYH: -0.05
    }
  },

  banana_tree_fruit: {
    measure: 'fullHeight',
    sourceMeasurePx: 879,
    targetH: 2.05,       // Cây chuối có buồng chín cao 2.05H (~196px)
    anchorX: 0.5,
    anchorY: 1.0,
    collision: {
      widthH: 0.25,
      heightH: 0.10,
      offYH: -0.05
    }
  },

  flower_clump: {
    measure: 'fullHeight',
    sourceMeasurePx: 710,
    targetH: 0.55,       // Khóm hoa dại cao 0.55H (~52.8px)
    anchorX: 0.5,
    anchorY: 1.0
  },

  clover_patch: {
    measure: 'fullHeight',
    sourceMeasurePx: 200,
    targetH: 0.35,       // Thảm cỏ 4 lá cao 0.35H (~33.6px)
    anchorX: 0.5,
    anchorY: 1.0
  },

  // === THÚ NUÔI LÀNG QUÊ ===
  buffalo: {
    measure: 'shoulderHeight',
    sourceMeasurePx: 120,
    targetH: 0.95,       // Trâu cao tới vai ~0.95H (~91.2px)
    anchorX: 0.5,
    anchorY: 1.0,
    collision: {
      widthH: 0.95,
      heightH: 0.22,
      offYH: -0.11
    }
  },

  pig: {
    measure: 'shoulderHeight',
    sourceMeasurePx: 90,
    targetH: 0.55,       // Lợn cao ~0.55H (~52.8px)
    anchorX: 0.5,
    anchorY: 1.0,
    collision: {
      widthH: 0.55,
      heightH: 0.18,
      offYH: -0.09
    }
  },

  rooster: {
    measure: 'crownToFeet',
    sourceMeasurePx: 64,
    targetH: 0.36,       // Gà trống cao ~0.36H (~34.5px)
    anchorX: 0.5,
    anchorY: 1.0,
    collision: {
      widthH: 0.30,
      heightH: 0.12,
      offYH: -0.06
    }
  },

  hen: {
    measure: 'crownToFeet',
    sourceMeasurePx: 60,
    targetH: 0.32,       // Gà mái cao ~0.32H (~30.7px)
    anchorX: 0.5,
    anchorY: 1.0,
    collision: {
      widthH: 0.28,
      heightH: 0.12,
      offYH: -0.06
    }
  },

  stork: {
    measure: 'crownToFeet',
    sourceMeasurePx: 96,
    targetH: 0.75,       // Cò trắng đứng cao ~0.75H (~72px)
    anchorX: 0.5,
    anchorY: 1.0,
    collision: {
      widthH: 0.26,
      heightH: 0.12,
      offYH: -0.06
    }
  },

  be_sinh: {
    measure: 'crownToFeet',
    sourceMeasurePx: 96,
    targetH: 0.72,       // Bé Sinh cao ~0.72H (~69px, tỷ lệ trẻ em làng quê)
    anchorX: 0.5,
    anchorY: 1.0,
    collision: {
      widthH: 0.28,
      heightH: 0.12,
      offYH: -0.06
    }
  }
};

/**
 * Tính hệ số tỉ lệ scale đồng đều cho asset dựa trên WORLD_UNIT
 */
export function calculateAssetScale(metricKey: string, worldUnit: number = WORLD_UNIT): number {
  const metric = ASSET_METRICS[metricKey];
  if (!metric) return 1.0;
  return (metric.targetH * worldUnit) / metric.sourceMeasurePx;
}

/**
 * Chuyển đổi đơn vị H sang Pixel
 */
export function hToPx(hUnits: number, worldUnit: number = WORLD_UNIT): number {
  return hUnits * worldUnit;
}

/**
 * Chuyển đổi Pixel sang đơn vị H
 */
export function pxToH(pixels: number, worldUnit: number = WORLD_UNIT): number {
  return pixels / worldUnit;
}
