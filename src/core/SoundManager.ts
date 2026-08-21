/**
 * SoundManager.ts
 * Tổng hợp âm thanh đồng quê sinh động bằng Web Audio API thuần túy (Không cần tải file mp3)
 */

export class SoundManager {
  private ctx: AudioContext | null = null;

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private createOsc(type: OscillatorType, freq: number, duration: number, gainVal = 0.2) {
    this.initCtx();
    if (!this.ctx) return null;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    return { osc, gain, t };
  }

  // 1. Tiếng trâu kêu "Ùm bòoo"
  public playMoo(): void {
    const s = this.createOsc('sawtooth', 85, 0.8, 0.25);
    if (!s) return;
    s.osc.frequency.setValueAtTime(85, s.t);
    s.osc.frequency.exponentialRampToValueAtTime(115, s.t + 0.2);
    s.osc.frequency.exponentialRampToValueAtTime(65, s.t + 0.7);
    s.gain.gain.setValueAtTime(0.01, s.t);
    s.gain.gain.linearRampToValueAtTime(0.25, s.t + 0.1);
    s.gain.gain.exponentialRampToValueAtTime(0.001, s.t + 0.75);
    s.osc.start(s.t);
    s.osc.stop(s.t + 0.8);
  }

  // 2. Tiếng vịt "Cạp cạp"
  public playQuack(): void {
    const s = this.createOsc('sawtooth', 320, 0.2, 0.2);
    if (!s) return;
    s.osc.frequency.setValueAtTime(340, s.t);
    s.osc.frequency.linearRampToValueAtTime(220, s.t + 0.15);
    s.gain.gain.setValueAtTime(0.2, s.t);
    s.gain.gain.exponentialRampToValueAtTime(0.001, s.t + 0.18);
    s.osc.start(s.t);
    s.osc.stop(s.t + 0.2);
  }

  // 3. Tiếng gà "Cục tác"
  public playCluck(): void {
    const s = this.createOsc('sine', 480, 0.15, 0.2);
    if (!s) return;
    s.osc.frequency.setValueAtTime(520, s.t);
    s.osc.frequency.exponentialRampToValueAtTime(280, s.t + 0.12);
    s.gain.gain.setValueAtTime(0.2, s.t);
    s.gain.gain.exponentialRampToValueAtTime(0.001, s.t + 0.14);
    s.osc.start(s.t);
    s.osc.stop(s.t + 0.15);
  }

  // 4. Tiếng gõ gậy vung vụt
  public playWhack(): void {
    const s = this.createOsc('sine', 160, 0.12, 0.35);
    if (!s) return;
    s.osc.frequency.setValueAtTime(240, s.t);
    s.osc.frequency.exponentialRampToValueAtTime(45, s.t + 0.1);
    s.gain.gain.exponentialRampToValueAtTime(0.001, s.t + 0.12);
    s.osc.start(s.t);
    s.osc.stop(s.t + 0.12);
  }

  // 5. Tiếng nhặt tiền xu / nông sản leng keng
  public playCoin(): void {
    const s = this.createOsc('sine', 987, 0.18, 0.2);
    if (!s) return;
    s.osc.frequency.setValueAtTime(987, s.t);
    s.osc.frequency.setValueAtTime(1318, s.t + 0.06);
    s.gain.gain.setValueAtTime(0.2, s.t);
    s.gain.gain.exponentialRampToValueAtTime(0.001, s.t + 0.16);
    s.osc.start(s.t);
    s.osc.stop(s.t + 0.18);
  }

  // 6. Tiếng hoàn thành rào chuồng
  public playFenceComplete(): void {
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, i) => {
      const s = this.createOsc('triangle', freq, 0.25, 0.2);
      if (s) {
        const t = s.t + i * 0.08;
        s.gain.gain.setValueAtTime(0.001, t);
        s.gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
        s.gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        s.osc.start(t);
        s.osc.stop(t + 0.22);
      }
    });
  }
}
