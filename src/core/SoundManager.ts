/**
 * SoundManager.ts
 * Hệ Thống Âm Thanh & Nhạc Nền Đồng Quê Việt Nam Không Lời ("Hương Đồng Gió Nội")
 * Tổng hợp 100% bằng Web Audio API thuần túy: Sáo trúc, Đàn tranh ngũ cung, Tiếng chim hót & Gió thổi
 */

export class SoundManager {
  private ctx: AudioContext | null = null;
  private bgmPlaying: boolean = false;
  private bgmTimer: number | null = null;
  private masterMusicGain: GainNode | null = null;
  public isMuted: boolean = false;

  // Bản nhạc ngũ cung Việt Nam không lời (Điệu Hò Đồng Quê - D Pentatonic: D4, E4, G4, A4, B4, D5, E5, G5, A5)
  private melodyScore: Array<{ note: number; dur: number; type: 'flute' | 'zither' | 'chord' }> = [
    // Đoạn 1: Tiếng sáo trúc ngân nga đón gió chiều
    { note: 293.66, dur: 1.0, type: 'flute' }, // D4
    { note: 329.63, dur: 0.5, type: 'flute' }, // E4
    { note: 392.00, dur: 1.5, type: 'flute' }, // G4
    { note: 440.00, dur: 1.0, type: 'flute' }, // A4
    { note: 587.33, dur: 2.0, type: 'flute' }, // D5 (ngân dài)

    // Đoạn 2: Tiếng đàn tranh gảy từng nốt trong trẻo
    { note: 587.33, dur: 0.5, type: 'zither' }, // D5
    { note: 493.88, dur: 0.5, type: 'zither' }, // B4
    { note: 440.00, dur: 1.0, type: 'zither' }, // A4
    { note: 392.00, dur: 1.0, type: 'zither' }, // G4
    { note: 329.63, dur: 0.5, type: 'zither' }, // E4
    { note: 293.66, dur: 1.5, type: 'zither' }, // D4

    // Đoạn 3: Sáo vút cao trên đồng lúa chín
    { note: 440.00, dur: 0.8, type: 'flute' }, // A4
    { note: 587.33, dur: 0.8, type: 'flute' }, // D5
    { note: 659.25, dur: 1.2, type: 'flute' }, // E5
    { note: 783.99, dur: 2.0, type: 'flute' }, // G5 (cao vút)
    { note: 659.25, dur: 1.0, type: 'flute' }, // E5
    { note: 587.33, dur: 1.5, type: 'flute' }, // D5

    // Đoạn 4: Đàn rải nốt êm đềm kết thúc chu kỳ
    { note: 493.88, dur: 0.6, type: 'zither' }, // B4
    { note: 440.00, dur: 0.6, type: 'zither' }, // A4
    { note: 392.00, dur: 0.8, type: 'zither' }, // G4
    { note: 329.63, dur: 0.8, type: 'zither' }, // E4
    { note: 293.66, dur: 2.5, type: 'zither' }  // D4 (ngân sâu lắng)
  ];

  private currentNoteIndex: number = 0;

  constructor() {
    // Tự động kích hoạt khi người chơi bấm bất kỳ đâu trên màn hình
    const startAudio = () => {
      this.initCtx();
      this.startCountryBGM();
      window.removeEventListener('click', startAudio);
      window.removeEventListener('keydown', startAudio);
      window.removeEventListener('touchstart', startAudio);
      window.removeEventListener('pointerdown', startAudio);
    };
    window.addEventListener('click', startAudio);
    window.addEventListener('keydown', startAudio);
    window.addEventListener('touchstart', startAudio);
    window.addEventListener('pointerdown', startAudio);
  }

  private initCtx(): void {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterMusicGain = this.ctx.createGain();
      this.masterMusicGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      this.masterMusicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // ============================================================
  // HỆ THỐNG NHẠC NỀN KHÔNG LỜI LÀNG QUÊ (Web Audio BGM Synth)
  // ============================================================

  public startCountryBGM(): void {
    if (this.bgmPlaying) return;
    this.initCtx();
    this.bgmPlaying = true;
    this.currentNoteIndex = 0;
    this.scheduleNextNote();
    this.startAmbientNature();
  }

  public stopCountryBGM(): void {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterMusicGain && this.ctx) {
      this.masterMusicGain.gain.setValueAtTime(this.isMuted ? 0 : 0.18, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  private scheduleNextNote(): void {
    if (!this.bgmPlaying || !this.ctx || !this.masterMusicGain) return;

    const noteData = this.melodyScore[this.currentNoteIndex];
    if (noteData.type === 'flute') {
      this.playFluteNote(noteData.note, noteData.dur);
    } else {
      this.playZitherNote(noteData.note, noteData.dur);
    }

    // Đệm hợp âm thảm ấm áp ở đầu mỗi câu nhạc
    if (this.currentNoteIndex === 0 || this.currentNoteIndex === 11) {
      this.playPadChord(noteData.note * 0.5, 4.0);
    }

    this.currentNoteIndex = (this.currentNoteIndex + 1) % this.melodyScore.length;

    // Lên lịch cho nốt tiếp theo (chuyển đổi nhịp điệu mượt mà)
    const delayMs = noteData.dur * 750; // Tempo thong thả, yên ả (~80 BPM)
    this.bgmTimer = window.setTimeout(() => {
      this.scheduleNextNote();
    }, delayMs);
  }

  // 1. Tiếng Sáo Trúc (Bamboo Flute) - mộc mạc, ngân vang ấm áp với rung nhẹ (Vibrato)
  private playFluteNote(freq: number, duration: number): void {
    if (!this.ctx || !this.masterMusicGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Rung tần số tự nhiên (Vibrato LFO 5.5Hz)
    const vibrato = this.ctx.createOscillator();
    const vibratoGain = this.ctx.createGain();
    vibrato.frequency.setValueAtTime(5.5, t);
    vibratoGain.gain.setValueAtTime(freq * 0.015, t);
    vibrato.connect(osc.frequency);
    vibrato.start(t);
    vibrato.stop(t + duration * 0.9);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    // Lọc ấm áp
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, t);

    // Đường bao âm lượng (Attack êm, Decay ngân dài)
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.22, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.85);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterMusicGain);

    osc.start(t);
    osc.stop(t + duration * 0.9);
  }

  // 2. Tiếng Đàn Tranh / Đàn Kìm (Plucked Zither) - gảy nốt giòn tan, vang xa
  private playZitherNote(freq: number, duration: number): void {
    if (!this.ctx || !this.masterMusicGain) return;
    const t = this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, t);

    // Họa âm trong trẻo
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, t);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration * 0.95);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterMusicGain);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + duration);
    osc2.stop(t + duration);
  }

  // 3. Thảm Hợp Âm Trầm Êm Dịu (Warm Ambient Pad Drone)
  private playPadChord(baseFreq: number, duration: number): void {
    if (!this.ctx || !this.masterMusicGain) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(baseFreq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, t); // Cắt tần cao, chỉ giữ âm trầm êm ái

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterMusicGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  // 4. Tiếng chim hót ríu rít & Gió thổi đồng quê ngắt quãng
  private startAmbientNature(): void {
    const playRandomBird = () => {
      if (!this.bgmPlaying || !this.ctx || !this.masterMusicGain) return;
      if (!this.isMuted && Math.random() > 0.3) {
        this.playBirdChirp();
      }
      const nextTime = 4000 + Math.random() * 6000;
      setTimeout(playRandomBird, nextTime);
    };
    playRandomBird();
  }

  private playBirdChirp(): void {
    if (!this.ctx || !this.masterMusicGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 2200 + Math.random() * 800;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq + 600, t + 0.08);
    osc.frequency.exponentialRampToValueAtTime(startFreq - 200, t + 0.18);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.04, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterMusicGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // ============================================================
  // CÁC HIỆU ỨNG ÂM THANH GAMEPLAY (SFX)
  // ============================================================

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

  // Tiếng trâu kêu "Ùm bòoo"
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

  // Tiếng vịt "Cạp cạp"
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

  // Tiếng gà "Cục tác"
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

  // Tiếng nhặt tiền xu / thu hoạch lúa leng keng
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

  public playWhack(): void {
    const s = this.createOsc('sine', 160, 0.12, 0.35);
    if (!s) return;
    s.osc.frequency.setValueAtTime(240, s.t);
    s.osc.frequency.exponentialRampToValueAtTime(45, s.t + 0.1);
    s.gain.gain.exponentialRampToValueAtTime(0.001, s.t + 0.12);
    s.osc.start(s.t);
    s.osc.stop(s.t + 0.12);
  }

  public playFenceComplete(): void {
    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        const s = this.createOsc('triangle', freq, 0.3, 0.2);
        if (!s) return;
        s.gain.gain.setValueAtTime(0.2, s.t);
        s.gain.gain.exponentialRampToValueAtTime(0.001, s.t + 0.25);
        s.osc.start(s.t);
        s.osc.stop(s.t + 0.3);
      }, i * 100);
    });
  }

  public playStep(): void {
    const s = this.createOsc('sine', 110, 0.06, 0.08);
    if (!s) return;
    s.gain.gain.setValueAtTime(0.08, s.t);
    s.gain.gain.exponentialRampToValueAtTime(0.001, s.t + 0.05);
    s.osc.start(s.t);
    s.osc.stop(s.t + 0.06);
  }

  public playWaterSplash(): void {
    const s = this.createOsc('triangle', 240, 0.15, 0.12);
    if (!s) return;
    s.osc.frequency.exponentialRampToValueAtTime(120, s.t + 0.12);
    s.gain.gain.setValueAtTime(0.12, s.t);
    s.gain.gain.exponentialRampToValueAtTime(0.001, s.t + 0.14);
    s.osc.start(s.t);
    s.osc.stop(s.t + 0.15);
  }

  public playKiteFlute(): void {
    if (!this.ctx || this.isMuted) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, t); // D5 sáo trúc
    osc.frequency.exponentialRampToValueAtTime(659.25, t + 0.3); // E5
    osc.frequency.exponentialRampToValueAtTime(587.33, t + 0.6);
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.75);
  }

  // ============================================================
  // HỆ THỐNG ÂM THANH THỜI TIẾT (MƯA, GIÓ, SẤM SÉT, CHIM HÓT)
  // ============================================================
  private rainGainNode: GainNode | null = null;
  private windGainNode: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  private initAmbientNodes(): void {
    if (!this.ctx) return;

    if (!this.noiseBuffer) {
      // Tạo buffer 2 giây chứa White/Pink Noise dùng chung cho Mưa & Gió
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filter (1/f) tạo cảm giác mưa rào tự nhiên
        const pink = (lastOut * 0.95) + (white * 0.05);
        lastOut = pink;
        data[i] = pink * 2.5;
      }
    }

    if (!this.rainGainNode) {
      this.rainGainNode = this.ctx.createGain();
      this.rainGainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      const rainFilter = this.ctx.createBiquadFilter();
      rainFilter.type = 'lowpass';
      rainFilter.frequency.setValueAtTime(1400, this.ctx.currentTime); // Lọc bớt tần số chói

      const rainSource = this.ctx.createBufferSource();
      rainSource.buffer = this.noiseBuffer;
      rainSource.loop = true;
      rainSource.connect(rainFilter);
      rainFilter.connect(this.rainGainNode);
      this.rainGainNode.connect(this.ctx.destination);
      rainSource.start();
    }

    if (!this.windGainNode) {
      this.windGainNode = this.ctx.createGain();
      this.windGainNode.gain.setValueAtTime(0, this.ctx.currentTime);

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(320, this.ctx.currentTime); // Dải tần số gió u u
      windFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

      const windSource = this.ctx.createBufferSource();
      windSource.buffer = this.noiseBuffer;
      windSource.loop = true;
      windSource.connect(windFilter);
      windFilter.connect(this.windGainNode);
      this.windGainNode.connect(this.ctx.destination);
      windSource.start();
    }
  }

  /**
   * Đồng bộ âm lượng môi trường theo từng kiểu thời tiết (Chuyển biến nhỏ dần / to dần mượt mà 2s)
   */
  public setWeatherAmbient(weather: 'clear' | 'windy' | 'light_rain' | 'storm'): void {
    if (!this.ctx || this.isMuted) return;
    this.initAmbientNodes();
    if (!this.rainGainNode || !this.windGainNode) return;

    const t = this.ctx.currentTime;
    if (weather === 'clear') {
      this.rainGainNode.gain.setTargetAtTime(0, t, 1.8);
      this.windGainNode.gain.setTargetAtTime(0, t, 1.8);
    } else if (weather === 'windy') {
      this.rainGainNode.gain.setTargetAtTime(0, t, 1.6);
      this.windGainNode.gain.setTargetAtTime(0.20, t, 2.0);
    } else if (weather === 'light_rain') {
      this.rainGainNode.gain.setTargetAtTime(0.16, t, 2.0);
      this.windGainNode.gain.setTargetAtTime(0.03, t, 1.6);
    } else if (weather === 'storm') {
      this.rainGainNode.gain.setTargetAtTime(0.30, t, 1.8);
      this.windGainNode.gain.setTargetAtTime(0.25, t, 1.8);
    }
  }


  /**
   * Tiếng sấm rền vang (Thunder Rumble) chân thực nhiều tầng
   */
  public playThunder(): void {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    this.initAmbientNodes();

    const t = this.ctx.currentTime;

    // 1. Tiếng nổ sét rạch trời đanh thép (Initial Lightning Crack)
    if (this.noiseBuffer) {
      const crackSource = this.ctx.createBufferSource();
      crackSource.buffer = this.noiseBuffer;
      const crackFilter = this.ctx.createBiquadFilter();
      crackFilter.type = 'lowpass';
      crackFilter.frequency.setValueAtTime(650, t);
      crackFilter.frequency.exponentialRampToValueAtTime(60, t + 2.5);

      const crackGain = this.ctx.createGain();
      crackGain.gain.setValueAtTime(0.65, t);
      crackGain.gain.exponentialRampToValueAtTime(0.001, t + 2.6);

      crackSource.connect(crackFilter);
      crackFilter.connect(crackGain);
      crackGain.connect(this.ctx.destination);
      crackSource.start(t);
      crackSource.stop(t + 2.7);
    }

    // 2. Tiếng sấm rền siêu trầm chính (Main Deep Sub-Bass Rumble 52Hz -> 22Hz)
    const subOsc1 = this.ctx.createOscillator();
    const subGain1 = this.ctx.createGain();
    subOsc1.type = 'sawtooth';
    subOsc1.frequency.setValueAtTime(58, t);
    subOsc1.frequency.exponentialRampToValueAtTime(22, t + 2.8);

    const subFilter1 = this.ctx.createBiquadFilter();
    subFilter1.type = 'lowpass';
    subFilter1.frequency.setValueAtTime(110, t);

    subGain1.gain.setValueAtTime(0.55, t);
    subGain1.gain.exponentialRampToValueAtTime(0.001, t + 3.0);

    subOsc1.connect(subFilter1);
    subFilter1.connect(subGain1);
    subGain1.connect(this.ctx.destination);
    subOsc1.start(t);
    subOsc1.stop(t + 3.1);

    // 3. Tiếng sấm rền vọng tầng 2 sau 0.25s (Echo Rumble)
    const subOsc2 = this.ctx.createOscillator();
    const subGain2 = this.ctx.createGain();
    subOsc2.type = 'triangle';
    subOsc2.frequency.setValueAtTime(42, t + 0.25);
    subOsc2.frequency.exponentialRampToValueAtTime(18, t + 2.9);

    subGain2.gain.setValueAtTime(0.001, t);
    subGain2.gain.setValueAtTime(0.45, t + 0.25);
    subGain2.gain.exponentialRampToValueAtTime(0.001, t + 3.0);

    subOsc2.connect(subGain2);
    subGain2.connect(this.ctx.destination);
    subOsc2.start(t + 0.25);
    subOsc2.stop(t + 3.1);
  }


  public play(name: 'harvest' | 'water' | 'click' | 'step' | 'coin' | 'kite' | 'thunder' | string): void {
    if (name === 'harvest' || name === 'coin') {
      this.playCoin();
    } else if (name === 'water') {
      this.playWaterSplash();
    } else if (name === 'step') {
      this.playStep();
    } else if (name === 'click') {
      this.playWhack();
    } else if (name === 'kite') {
      this.playKiteFlute();
    } else if (name === 'thunder') {
      this.playThunder();
    }
  }
}

