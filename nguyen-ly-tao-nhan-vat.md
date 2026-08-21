# 📖 CẨM NANG THIẾT KẾ & QUẢN LÝ HOẠT ẢNH 2D (ANIMATION BIBLE)

---

## 🌟 1. CÔNG THỨC VÀNG (GOLDEN RULE)
> **Thời lượng Video 1.2s – 1.5s + Cắt ở 8 FPS = 8 đến 10 Keyframes hoàn hảo, không giật, không trượt chân!**

---

## 📂 2. CẤU TRÚC QUẢN LÝ TÀI NGUYÊN (ASSET DIRECTORY)

Tất cả ảnh dải Sprite Sheet được tổ chức gọn gàng trong thư mục `public/assets/`:

```text
public/assets/
├── characters/                  📁 QUẢN LÝ TẤT CẢ NHÂN VẬT
│   ├── player/                  🧑 Nhân vật chính (Bé nông dân)
│   │   ├── walk.png             (10 frames - Bước đi)
│   │   ├── idle.png             (4-6 frames - Đứng thở nhẹ)
│   │   ├── jump.png             (3-4 frames - Nhảy cao)
│   │   ├── hoe.png              (4-5 frames - Cuốc đất)
│   │   ├── water.png            (4 frames - Tưới nước)
│   │   └── harvest.png          (3 frames - Thu hoạch)
│   ├── npcs/                    👴 Dân làng, thương nhân
│   └── animals/                 🐃 Động vật làng quê (Trâu, Vịt, Gà)
│       ├── buffalo/
│       ├── duck/
│       └── chicken/
│
├── environment/                 🌾 Môi trường, cây cối, nhà tranh, luống cày
├── items/                       🥕 Củ cải, dưa hấu, lúa, hạt giống, cuốc
└── audio/                       🎵 Hiệu ứng âm thanh, nhạc nền đồng quê
```

---

## ⚙️ 3. CÔNG CỤ TỰ ĐỘNG ĐÓNG GÓI SPRITESHEET (`tools/pack_spritesheet.py`)

Bất cứ khi nào bạn cắt xong ảnh frame mới từ video/ezgif, chỉ cần mở terminal và chạy 1 câu lệnh duy nhất:

```bash
# Đóng gói ảnh đứng yên (Idle):
python tools/pack_spritesheet.py --input "C:/path/to/folder_idle" --output "public/assets/characters/player/idle.png"

# Đóng gói ảnh cuốc đất (Hoe):
python tools/pack_spritesheet.py --input "C:/path/to/folder_hoe" --output "public/assets/characters/player/hoe.png"
```

*Công cụ sẽ tự động:*
1. Xóa sạch nền trắng $\rightarrow$ trong suốt 100%.
2. Căn chỉnh tâm trục cơ thể và điểm tiếp xúc đất đồng nhất để nhân vật không bị rung giật.
3. Xuất file dải ảnh PNG vào đúng thư mục game.

---

## 🎬 4. DANH SÁCH HOẠT ẢNH & MẪU PROMPT AI CHUẨN

| Tên Hoạt Ảnh | Thư mục lưu | Số Frame | Mẫu Prompt AI Chuẩn |
| :--- | :--- | :---: | :--- |
| **Walk (Bước đi)** | `characters/player/walk.png` | 8-10 | `2D character animation. The boy is walking in place in a steady 2D treadmill walk cycle, side view to the right, solid pure white background, seamless loop.` |
| **Idle (Đứng thở)** | `characters/player/idle.png` | 4-6 | `2D character animation. The boy is standing idle in a relaxed stance, breathing gently, subtle chest movement and blinking eyes, static camera, solid white background.` |
| **Jump (Nhảy lên)** | `characters/player/jump.png` | 3-4 | `2D character animation. The boy jumps straight up into the air with bent knees and lands softly back down, side view, solid white background.` |
| **Hoe (Cuốc đất)** | `characters/player/hoe.png` | 4-5 | `2D character animation. The boy swings a wooden farming hoe overhead and strikes down into the ground, side view, solid white background, seamless loop.` |
| **Harvest (Thu hoạch)** | `characters/player/harvest.png` | 3-4 | `2D character animation. The boy bends down to pick up crops and puts them into his side bamboo basket, side view, solid white background.` |