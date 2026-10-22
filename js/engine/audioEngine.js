/**
 * Hardware Diagnostic Decision Matrix & Flow Engine
 * Audio Engine (Web Audio API Synthesizer)
 * Compatible con ejecución directa local (file://) sin bloqueos CORS
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    try {
      this.isMuted = localStorage.getItem('diag_sound_muted') === 'true';
    } catch (e) {
      this.isMuted = false;
    }
  }

  _initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('diag_sound_muted', this.isMuted);
    } catch (e) {
      // Ignore storage error in restricted environments
    }
    return this.isMuted;
  }

  /**
   * Classic Multimeter Continuity Beep (High frequency continuous beep)
   */
  playContinuityBeep(duration = 0.28) {
    if (this.isMuted) return;
    try {
      this._initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2400, this.ctx.currentTime); // 2.4 kHz standard multimeter frequency

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }

  /**
   * Short Circuit / Danger Alarm (Sawtooth harsh alert)
   */
  playShortAlert() {
    if (this.isMuted) return;
    try {
      this._initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(420, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(320, this.ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }

  /**
   * Soft UI Interaction Click
   */
  playClick() {
    if (this.isMuted) return;
    try {
      this._initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }

  /**
   * Success / Diagnostic Verdict Reached Chord
   */
  playVerdictSound() {
    if (this.isMuted) return;
    try {
      this._initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 major chord
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);

        gain.gain.setValueAtTime(0.1, this.ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.06);
        osc.stop(this.ctx.currentTime + 0.6);
      });
    } catch (e) {
      console.warn('Audio synthesis failed:', e);
    }
  }
}

const audioEngine = new AudioEngine();
window.DiagApp = window.DiagApp || {};
window.DiagApp.AudioEngine = AudioEngine;
window.DiagApp.audioEngine = audioEngine;
