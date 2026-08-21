import os
import glob
from PIL import Image

def clean_frame_perfect(img):
    w, h = img.size
    # 1. Cắt 2 vạch đen ở rìa ngoài 1280x720 (từ x=270 đến x=1010)
    cropped = img.crop((270, 0, 1010, h)).convert('RGBA')
    cw, ch = cropped.size
    pixels = cropped.load()

    # 2. CHỈ LỌC NỀN TRẮNG XÁM NGÀ (TUYỆT ĐỐI KHÔNG XÓA TÓC ĐEN, MẮT, QUẦN ÁO)
    for y in range(ch):
        for x in range(cw):
            r, g, b, a = pixels[x, y]
            if (r > 220 and g > 220 and b > 210 and abs(r - g) < 14 and abs(g - b) < 14):
                pixels[x, y] = (r, g, b, 0)
            elif (r > 208 and g > 208 and b > 200 and abs(r - g) < 12 and abs(g - b) < 12):
                avg = (r + g + b) / 3
                alpha = int(max(0, min(255, (222 - avg) * 18)))
                pixels[x, y] = (r, g, b, alpha)
    return cropped

def pack_user_sickle_frames():
    src_dir = r"C:\Users\Admin\Downloads\ezgif-85c9d9bcce821bf7-png-split\cầm liếm"
    files = sorted(glob.glob(os.path.join(src_dir, "*.png")))
    num_frames = len(files)
    print(f"🎬 Đang đóng gói {num_frames} frames từ thư mục: {src_dir}")

    UNIFIED_SCALE = 340.0 / 612.0
    TARGET_CANVAS_H = 380
    GROUND_ANCHOR_Y = 365

    cleaned_frames = []
    bboxes = []
    max_w = 0

    for fpath in files:
        raw = Image.open(fpath)
        clean = clean_frame_perfect(raw)
        bbox = clean.getbbox() or (0, 0, clean.width, clean.height)
        max_w = max(max_w, bbox[2] - bbox[0])
        cleaned_frames.append(clean)
        bboxes.append(bbox)

    target_w = int(max_w * UNIFIED_SCALE) + 60
    spritesheet = Image.new("RGBA", (target_w * num_frames, TARGET_CANVAS_H), (0, 0, 0, 0))

    for idx, (img, bbox) in enumerate(zip(cleaned_frames, bboxes)):
        char_crop = img.crop(bbox)
        nw = int(char_crop.width * UNIFIED_SCALE)
        nh = int(char_crop.height * UNIFIED_SCALE)
        resized = char_crop.resize((nw, nh), Image.Resampling.LANCZOS)

        frame_canvas = Image.new("RGBA", (target_w, TARGET_CANVAS_H), (0, 0, 0, 0))
        paste_x = max(0, target_w // 2 - nw // 2)
        paste_y = max(0, GROUND_ANCHOR_Y - nh)
        frame_canvas.paste(resized, (paste_x, paste_y), resized)
        spritesheet.paste(frame_canvas, (idx * target_w, 0), frame_canvas)

    out_path = "public/assets/characters/player/cam_liem.png"
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    spritesheet.save(out_path, "PNG")
    print(f"🎉 ĐÃ XUẤT SPRITESHEET CHUẨN XÁC: {out_path} ({spritesheet.size})")
    print(f"ℹ️ Thông số: {num_frames} frames, mỗi frame: {target_w}x{TARGET_CANVAS_H}px (Scale 1:1, tóc đen nguyên bản)")

if __name__ == "__main__":
    pack_user_sickle_frames()
