import os
import glob
import subprocess
from PIL import Image

def clean_sickle_frame(img):
    w, h = img.size
    # 1. Cắt 2 vạch đen pillarbox ở 2 bên ngoài khung hình 1920x1080
    cropped = img.crop((420, 0, 1500, h)).convert('RGBA')
    cw, ch = cropped.size
    pixels = cropped.load()

    # 2. CHỈ KHỬ NỀN TRẮNG XÁM NGÀ (TUYỆT ĐỐI GIỮ NGUYÊN TÓC ĐEN, MẮT, QUẦN ÁO)
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

def build_all_sickle():
    video_path = r"C:\Users\Admin\Downloads\1789933d-bb25-47f9-a2fe-2ea70c63b316.mp4"
    temp_dir = "temp_sickle_extract"
    os.makedirs(temp_dir, exist_ok=True)

    # Trích xuất toàn bộ chu kỳ 10 FPS (khoảng 60 - 80 frames đầy đủ từ video)
    print(f"🎬 Đang trích xuất toàn bộ khung hình từ video: {video_path}...")
    subprocess.run([
        "ffmpeg", "-y", "-i", video_path,
        "-vf", "fps=10",
        os.path.join(temp_dir, "frame_%03d.png")
    ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    files = sorted(glob.glob(os.path.join(temp_dir, "*.png")))
    num_frames = len(files)
    print(f"📦 Tổng số khung hình trích xuất đầy đủ: {num_frames} frames")

    # Tỷ lệ đồng bộ chuẩn 380px toàn game
    UNIFIED_SCALE = 340.0 / 925.0
    TARGET_CANVAS_H = 380
    GROUND_ANCHOR_Y = 365

    cleaned_frames = []
    bboxes = []
    max_w = 0

    for fpath in files:
        raw = Image.open(fpath)
        clean = clean_sickle_frame(raw)
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
    spritesheet.save(out_path, "PNG")
    print(f"🎉 ĐÃ XUẤT ĐẦY ĐỦ TOÀN BỘ {num_frames} FRAMES CẦM LIỀM: {out_path} ({spritesheet.size})")

    # Xóa thư mục tạm
    for f in files:
        os.remove(f)
    os.rmdir(temp_dir)
    print("🧹 Đã dọn sạch thư mục tạm!")

if __name__ == "__main__":
    build_all_sickle()
