import os
import glob
from PIL import Image

def clean_bg_advanced(img):
    img = img.convert('RGBA')
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Lọc màu trắng / xám ngà / nền video
            if (r > 210 and g > 210 and b > 200 and abs(r - g) < 18 and abs(g - b) < 18):
                pixels[x, y] = (r, g, b, 0)
            elif (r > 195 and g > 195 and b > 190 and abs(r - g) < 14 and abs(g - b) < 14):
                avg = (r + g + b) / 3
                alpha = int(max(0, min(255, (212 - avg) * 17)))
                pixels[x, y] = (r, g, b, alpha)
    return img

def repack_all_master():
    # TỶ LỆ CƠ THỂ VÀNG ĐỒNG NHẤT 100%
    UNIFIED_SCALE = 340.0 / 612.0 # = 0.555555...
    TARGET_CANVAS_H = 380         # Chiều cao khung hình chung tuyệt đối cho TẤT CẢ 6 bộ hoạt ảnh
    GROUND_ANCHOR_Y = 365         # Vị trí đế chân tiếp xúc mặt đất chung tuyệt đối

    print("=" * 60)
    print("🚀 BẮT ĐẦU ĐỒNG BỘ TOÀN DIỆN 6 BỘ HOẠT ẢNH (CHUẨN 1:1 TUYỆT ĐỐI)")
    print(f"📏 Scale cơ thể: {UNIFIED_SCALE:.5f} | Chiều cao ô: {TARGET_CANVAS_H}px | Điểm tiếp đất: Y={GROUND_ANCHOR_Y}px")
    print("=" * 60)

    # Danh sách 6 hoạt ảnh cần chuẩn hóa
    tasks = [
        {
            "name": "walk",
            "files": sorted(glob.glob(r"C:\Users\Admin\Downloads\ezgif-85c9d9bcce821bf7-png-split\*.png"))[:10],
            "out": "public/assets/characters/player/walk.png",
            "extra_w": 50
        },
        {
            "name": "idle",
            "files": sorted(glob.glob(r"C:\Users\Admin\Downloads\ezgif-85c9d9bcce821bf7-png-split\nghi-ngoi\*.png"))[:24],
            "out": "public/assets/characters/player/idle.png",
            "extra_w": 50
        },
        {
            "name": "cam_cuoc",
            "files": sorted(glob.glob("cam-cuoc/*.png")),
            "out": "public/assets/characters/player/cam_cuoc.png",
            "extra_w": 50
        },
        {
            "name": "hoe",
            "files": sorted(glob.glob("cuoc-dat-lau-mo-hoi/*.png")),
            "out": "public/assets/characters/player/hoe.png",
            "extra_w": 60
        },
        {
            "name": "cam_thung_nuoc",
            "files": sorted(glob.glob("cam-cuoc/cầm thùng nước/*.png")),
            "out": "public/assets/characters/player/cam_thung_nuoc.png",
            "extra_w": 50
        },
        {
            "name": "water",
            "files": sorted(glob.glob("cam-cuoc/tưới nước/*.png")),
            "out": "public/assets/characters/player/water.png",
            "extra_w": 60
        }
    ]

    for task in tasks:
        files = [f for f in task["files"] if os.path.isfile(f)]
        num_frames = len(files)
        if num_frames == 0:
            print(f"⚠️ Bỏ qua {task['name']} (Không tìm thấy file)")
            continue

        cleaned_frames = []
        bboxes = []
        max_w = 0

        for fpath in files:
            raw = Image.open(fpath)
            clean = clean_bg_advanced(raw)
            bbox = clean.getbbox() or (0, 0, clean.width, clean.height)
            max_w = max(max_w, bbox[2] - bbox[0])
            cleaned_frames.append(clean)
            bboxes.append(bbox)

        target_w = int(max_w * UNIFIED_SCALE) + task["extra_w"]
        sheet = Image.new("RGBA", (target_w * num_frames, TARGET_CANVAS_H), (0, 0, 0, 0))

        for idx, (img, bbox) in enumerate(zip(cleaned_frames, bboxes)):
            char_crop = img.crop(bbox)
            nw = int(char_crop.width * UNIFIED_SCALE)
            nh = int(char_crop.height * UNIFIED_SCALE)
            resized = char_crop.resize((nw, nh), Image.Resampling.LANCZOS)

            frame_canvas = Image.new("RGBA", (target_w, TARGET_CANVAS_H), (0, 0, 0, 0))
            paste_x = max(0, target_w // 2 - nw // 2)
            paste_y = max(0, GROUND_ANCHOR_Y - nh)
            frame_canvas.paste(resized, (paste_x, paste_y), resized)
            sheet.paste(frame_canvas, (idx * target_w, 0), frame_canvas)

        os.makedirs(os.path.dirname(task["out"]), exist_ok=True)
        sheet.save(task["out"], "PNG")
        print(f"✅ {task['name']:<15}: {num_frames:>2} frames | Ô: {target_w:>3}x{TARGET_CANVAS_H}px -> {task['out']}")

    print("=" * 60)
    print("🎉 HOÀN TẤT ĐỒNG BỘ TOÀN DIỆN! 6 HOẠT ẢNH ĐÃ KHỚP NHAU TỪNG MILIMET!")

if __name__ == "__main__":
    repack_all_master()
