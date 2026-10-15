/**
 * Procedural Audio Synthesizer
 * Generates all sci-fi gravitational audio directly without external media files.
 */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Atmospheric drone of the non-Euclidean chamber
  startChamberAmbience() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(42, this.ctx.currentTime); // Low fundamental C1 drone

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
  }

  // Kinetic Pulse Fire
  playPulseSound() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    const now = this.ctx.currentTime;
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Time-Dilation / Stasis Lock Sound
  playStasisSound(isFreezing) {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    if (isFreezing) {
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
    } else {
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.35);
    }

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  }

  // Crystalline Shatter Sound
  playShatterSound() {
    this.init();
    const now = this.ctx.currentTime;

    // High frequency crystal bursts
    for (let i = 0; i < 4; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const freq = 1800 + (Math.random() * 2400);
      osc.frequency.setValueAtTime(freq, now + (i * 0.03));
      osc.frequency.exponentialRampToValueAtTime(300, now + (i * 0.03) + 0.15);

      gain.gain.setValueAtTime(0.2, now + (i * 0.03));
      gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.03) + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + (i * 0.03));
      osc.stop(now + (i * 0.03) + 0.25);
    }
  }
}

export const SoundFX = new SoundEngine();
