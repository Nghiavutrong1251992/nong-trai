/**
 * studio.ts
 * Entry point độc lập cho trang Studio Đo Hoạt Ảnh & Hiệu Chỉnh Khung Hình
 */

import { AssetLoader } from './core/AssetLoader';
import { StudioRenderer } from './graphics/StudioRenderer';

export class StudioApp {
  public canvas!: HTMLCanvasElement;
  public ctx!: CanvasRenderingContext2D;
  public studioRenderer: StudioRenderer;
  private lastTime: number = 0;
  private animTimer: number = 0;
  private dpr: number = 1;
  public width: number = window.innerWidth;
  public height: number = window.innerHeight;

  constructor() {
    this.studioRenderer = new StudioRenderer((msg) => this.showToast(msg));
  }

  public async start(): Promise<void> {
    this.canvas = document.getElementById('studioCanvas') as HTMLCanvasElement;
    if (!this.canvas) {
      console.error('Canvas #studioCanvas not found');
      return;
    }

    this.ctx = this.canvas.getContext('2d')!;

    window.addEventListener('resize', () => this.resizeCanvas());
    this.resizeCanvas();

    this.bindEvents();

    // 1. Preload Core Assets
    const preloaderEl = document.getElementById('studio-preloader');
    const barEl = document.getElementById('preloader-progress-bar');
    const pctEl = document.getElementById('preloader-pct');
    const statusEl = document.getElementById('preloader-status-text');

    await AssetLoader.loadCoreAssets((pct, loaded, total) => {
      if (barEl) barEl.style.width = `${pct}%`;
      if (pctEl) pctEl.textContent = `${pct}%`;
      if (statusEl) statusEl.textContent = `Đang nạp tài nguyên: ${loaded}/${total} (${pct}%)...`;
    });

    if (preloaderEl) {
      preloaderEl.classList.add('fade-out');
      setTimeout(() => {
        preloaderEl.style.display = 'none';
      }, 400);
    }

    // 2. Tải ngầm Lazy Assets
    AssetLoader.loadLazyAssets();

    // 3. Khởi chạy Render Loop
    requestAnimationFrame((t) => this.loop(t));
  }

  public showToast(msg: string): void {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.style.opacity = '1';
    setTimeout(() => {
      t.style.opacity = '0';
    }, 2400);
  }

  private resizeCanvas(): void {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 768;
    const maxDpr = isMobile ? 1.75 : 2.0;
    this.dpr = Math.min(window.devicePixelRatio || 1, maxDpr);

    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.canvas.width = Math.round(this.width * this.dpr);
    this.canvas.height = Math.round(this.height * this.dpr);
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  private bindEvents(): void {
    const canvas = this.canvas;
    const btnToggleGuides = document.getElementById('btn-toggle-guides');
    const btnResetGuides = document.getElementById('btn-reset-guides');

    const updateGuideButtonUI = () => {
      if (btnToggleGuides) {
        btnToggleGuides.classList.toggle('active', this.studioRenderer.showStudioGuides);
        btnToggleGuides.textContent = this.studioRenderer.showStudioGuides ? '📏 Thước Gióng: BẬT [H]' : '📏 Thước Gióng: TẮT [H]';
      }
    };

    const toggleGuides = () => {
      this.studioRenderer.showStudioGuides = !this.studioRenderer.showStudioGuides;
      this.showToast(this.studioRenderer.showStudioGuides ? '📏 Đã BẬT thước gióng chiều cao [H]' : '📏 Đã TẮT thước gióng chiều cao [H]');
      updateGuideButtonUI();
    };

    btnToggleGuides?.addEventListener('click', toggleGuides);

    const btnUndo = document.getElementById('btn-undo');
    const btnRedo = document.getElementById('btn-redo');

    btnUndo?.addEventListener('click', () => {
      this.studioRenderer.undo();
    });

    btnRedo?.addEventListener('click', () => {
      this.studioRenderer.redo();
    });

    btnResetGuides?.addEventListener('click', () => {
      this.studioRenderer.pushHistory();
      this.studioRenderer.guideLines = [
        { id: 'h_head', type: 'h', pos: 220, color: '#38bdf8', label: 'Đỉnh Đầu' },
        { id: 'h_waist', type: 'h', pos: 285, color: '#f59e0b', label: 'Thắt Lưng' },
        { id: 'h_ground', type: 'h', pos: 336, color: '#ef4444', label: 'Gốc Tiếp Đất' },
        { id: 'v_guide_1', type: 'v', pos: 312, color: '#c084fc', label: 'Thước Dọc 1' },
        { id: 'v_guide_2', type: 'v', pos: 362, color: '#c084fc', label: 'Thước Dọc 2' }
      ];
      this.studioRenderer.saveAdjustments();
      this.showToast('🔄 Đã đặt lại thước gióng về vị trí chuẩn!');
    });

    // Canvas click & drag
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      this.studioRenderer.handleClick(clickX, clickY);
    });

    canvas.addEventListener('mousedown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this.studioRenderer.handleMouseDown(mx, my);
    });

    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this.studioRenderer.handleMouseMove(mx, my, canvas);
    });

    window.addEventListener('mouseup', () => {
      this.studioRenderer.handleMouseUp();
    });

    canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      this.studioRenderer.handleWheel(mx, my, e.deltaY);
    }, { passive: false });

    // Keyboard Shortcuts
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (k === 'h') {
        toggleGuides();
      }
      if ((e.ctrlKey || e.metaKey) && k === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          this.studioRenderer.redo();
        } else {
          this.studioRenderer.undo();
        }
      }
      if ((e.ctrlKey || e.metaKey) && k === 'y') {
        e.preventDefault();
        this.studioRenderer.redo();
      }
    });

    updateGuideButtonUI();
  }

  private loop(timestamp: number): void {
    if (!this.lastTime) this.lastTime = timestamp;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;

    this.animTimer += dt;

    this.ctx.clearRect(0, 0, this.width, this.height);
    this.studioRenderer.render(this.ctx, this.width, this.height, this.animTimer);

    requestAnimationFrame((t) => this.loop(t));
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new StudioApp();
  app.start();
});
