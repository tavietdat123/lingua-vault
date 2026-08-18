/**
 * Web Audio API Alarm Clock & Sound Synthesizer
 * Generates loud digital alarm clock beeps, siren loops, and feedback sounds without external files
 */

class AlarmAudioService {
  constructor() {
    this.audioCtx = null;
    this.isPlaying = false;
    this.intervalId = null;
  }

  init() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play a single electronic alarm beep
  playBeep(freq = 880, duration = 0.1, type = 'square') {
    this.init();
    if (!this.audioCtx) return;

    try {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  // Start continuous digital alarm clock pattern (BEEP-BEEP-BEEP-BEEP ... pause ... repeat)
  startAlarmSound() {
    if (this.isPlaying) return;
    this.init();
    this.isPlaying = true;

    const playPattern = () => {
      if (!this.isPlaying) return;
      
      // Fast 4-beep digital clock burst
      setTimeout(() => this.playBeep(980, 0.08, 'sawtooth'), 0);
      setTimeout(() => this.playBeep(980, 0.08, 'sawtooth'), 120);
      setTimeout(() => this.playBeep(980, 0.08, 'sawtooth'), 240);
      setTimeout(() => this.playBeep(1200, 0.12, 'sawtooth'), 360);
    };

    playPattern();
    this.intervalId = setInterval(playPattern, 1000);
  }

  // Stop continuous alarm sound
  stopAlarmSound() {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  // Play celebratory chime when quiz is solved
  playSuccessSound() {
    this.init();
    if (!this.audioCtx) return;

    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playBeep(freq, 0.25, 'sine');
      }, idx * 100);
    });
  }

  // Play error buzz when wrong option selected
  playErrorSound() {
    this.init();
    if (!this.audioCtx) return;

    this.playBeep(220, 0.2, 'sawtooth');
    setTimeout(() => this.playBeep(180, 0.3, 'sawtooth'), 120);
  }
}

export const alarmAudio = new AlarmAudioService();
