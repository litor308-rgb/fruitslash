"use client";

class SoundManager {
  private audioContext: AudioContext | null = null;
  private enabled = true;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.15) {
    if (!this.enabled) return;

    try {
      const ctx = this.getContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch {
      // Audio not available
    }
  }

  slice() {
    this.playTone(800 + Math.random() * 400, 0.1, "sawtooth", 0.08);
    this.playTone(1200 + Math.random() * 300, 0.05, "sine", 0.05);
  }

  combo(level: number) {
    const base = 600 + level * 100;
    this.playTone(base, 0.15, "sine", 0.1);
    setTimeout(() => this.playTone(base * 1.25, 0.1, "sine", 0.08), 50);
  }

  bomb() {
    this.playTone(100, 0.4, "sawtooth", 0.2);
    this.playTone(60, 0.5, "square", 0.15);
  }

  powerUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, "sine", 0.1), i * 60);
    });
  }

  gameStart() {
    const notes = [392, 523, 659, 784];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, "sine", 0.12), i * 100);
    });
  }

  gameOver() {
    const notes = [440, 330, 262, 196];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.3, "sine", 0.1), i * 150);
    });
  }

  highScore() {
    const notes = [523, 659, 784, 1047, 784, 1047, 1319];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, "sine", 0.12), i * 80);
    });
  }

  tick() {
    this.playTone(1000, 0.05, "sine", 0.03);
  }
}

export const soundManager = new SoundManager();
