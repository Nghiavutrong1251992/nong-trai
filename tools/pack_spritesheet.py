"""
tools/pack_spritesheet.py
CÔNG CỤ TỰ ĐỘNG KHỬ NỀN VÀ ĐÓNG GÓI SPRITESHEET CHUẨN ĐỒNG BỘ CHO GAME
"""

import os
import glob
import argparse
from PIL import Image

def make_transparent_advanced(img):
    img = img.convert("RGBA")
    width, height = img.size
    pixels = img.load()

    # Quét từng pixel và khử màu nền trắng / xám ngà
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            is_white = (r > 228 and g > 228 and b > 228 and abs(r - g) < 12 and abs(g - b) < 12)
            if is_white:
                pixels[x, y] = (r, g, b, 0)
            elif r > 215 and g > 215 and b > 215 and abs(r - g) < 10 and abs(g - b) < 10:
                avg = (r + g + b) / 3
                alpha = int(max(0, min(255, (232 - avg) * 15)))
                pixels[x, y] = (r, g, b, alpha)

    return img

def pack_folder(input_dir, output_path, target_h=360):
    frame_files = sorted(glob.glob(os.path.join(input_dir, "*.png")) + glob.glob(os.path.join(input_dir, "*.jpg")))
    num_frames = len(frame_files)
    if num_frames == 0:
        print(f"❌ Không tìm thấy ảnh nào trong: {input_dir}")
        return

    print(f"🔄 Đang xử lý {num_frames} frames từ: {input_dir}")

    cleaned_frames = []
    bboxes = []
    max_char_w = 0
    max_char_h = 0

    for fpath in frame_files:
        raw_img = Image.open(fpath)
        clean_img = make_transparent_advanced(raw_img)
        bbox = clean_img.getbbox()
        if not bbox:
            bbox = (0, 0, clean_img.width, clean_img.height)
        char_w = bbox[2] - bbox[0]
        char_h = bbox[3] - bbox[1]
        max_char_w = max(max_char_w, char_w)
        max_char_h = max(max_char_h, char_h)
        cleaned_frames.append(clean_img)
        bboxes.append(bbox)

    scale = (target_h - 20) / max_char_h
    target_w = int(max_char_w * scale) + 40

    spritesheet = Image.new("RGBA", (target_w * num_frames, target_h), (0, 0, 0, 0))
    ground_anchor_y = target_h - 10
    center_anchor_x = target_w // 2

    for idx, (img, bbox) in enumerate(zip(cleaned_frames, bboxes)):
        char_crop = img.crop(bbox)
        new_w = int(char_crop.width * scale)
        new_h = int(char_crop.height * scale)
        char_resized = char_crop.resize((new_w, new_h), Image.Resampling.LANCZOS)

        frame_canvas = Image.new("RGBA", (target_w, target_h), (0, 0, 0, 0))
        paste_x = center_anchor_x - new_w // 2
        paste_y = ground_anchor_y - new_h
        frame_canvas.paste(char_resized, (paste_x, paste_y), char_resized)
        spritesheet.paste(frame_canvas, (idx * target_w, 0), frame_canvas)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    spritesheet.save(output_path, "PNG")
    print(f"✅ ĐÃ ĐÓNG GÓI THÀNH CÔNG: {output_path} ({spritesheet.size})")
    print(f"ℹ️ Thông tin: {num_frames} frames, kích thước ô: {target_w}x{target_h}px")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Tự động khử nền và đóng gói Sprite Sheet")
    parser.add_argument("--input", required=True, help="Đường dẫn thư mục chứa ảnh frame")
    parser.add_argument("--output", required=True, help="Đường dẫn file PNG xuất ra")
    parser.add_argument("--height", type=int, default=360, help="Chiều cao chuẩn của frame (mặc định 360)")
    args = parser.parse_args()

    pack_folder(args.input, args.output, args.height)
