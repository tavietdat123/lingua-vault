/**
 * Smart Audio pronunciation service with Granular Speed Control (0.5x - 1.5x)
 * Supports Native MP3 + Web Speech Synthesis API (US / UK Accents)
 */

let globalAudioSpeed = parseFloat(localStorage.getItem('linguavault_audio_speed')) || 0.9;
let globalAudioAccent = localStorage.getItem('linguavault_audio_accent') || 'en-US';

let availableVoices = [];

// Preload and cache voices
const loadVoices = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    availableVoices = window.speechSynthesis.getVoices() || [];
  }
};

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export const setGlobalAudioSpeed = (speed) => {
  const num = parseFloat(speed);
  if (!isNaN(num) && num >= 0.4 && num <= 2.0) {
    globalAudioSpeed = Math.round(num * 100) / 100;
    localStorage.setItem('linguavault_audio_speed', globalAudioSpeed.toString());
  }
  return globalAudioSpeed;
};

export const getGlobalAudioSpeed = () => globalAudioSpeed;

export const setGlobalAudioAccent = (accent) => {
  if (accent === 'en-US' || accent === 'en-GB') {
    globalAudioAccent = accent;
    localStorage.setItem('linguavault_audio_accent', accent);
  }
  return globalAudioAccent;
};

export const getGlobalAudioAccent = () => globalAudioAccent;

/**
 * Get the best matching voice for the given accent
 */
const getVoiceForAccent = (targetLang) => {
  if (availableVoices.length === 0) {
    loadVoices();
  }

  const isUK = targetLang === 'en-GB';

  if (isUK) {
    // 1. Look for British English voices (en-GB / en_GB)
    const ukVoice = availableVoices.find(v => 
      (v.lang === 'en-GB' || v.lang === 'en_GB') && 
      (v.name.includes('Daniel') || v.name.includes('Oliver') || v.name.includes('Stephanie') || v.name.includes('Google UK') || v.name.includes('Serena') || v.name.includes('Arthur') || v.name.includes('George') || v.name.includes('Kate'))
    ) || availableVoices.find(v => v.lang === 'en-GB' || v.lang === 'en_GB');

    if (ukVoice) return ukVoice;
  } else {
    // 2. Look for American English voices (en-US / en_US)
    const usVoice = availableVoices.find(v => 
      (v.lang === 'en-US' || v.lang === 'en_US') && 
      (v.name.includes('Samantha') || v.name.includes('Google US') || v.name.includes('Ava') || v.name.includes('Alex') || v.name.includes('Allison') || v.name.includes('Victoria') || v.name.includes('Tom'))
    ) || availableVoices.find(v => v.lang === 'en-US' || v.lang === 'en_US');

    if (usVoice) return usVoice;
  }

  // Fallback to any English voice
  return availableVoices.find(v => v.lang && v.lang.startsWith('en')) || null;
};

export const playAudio = (text, audioUrl = null, lang = null, rate = null) => {
  if (!text && !audioUrl) return;

  const targetRate = rate !== null ? parseFloat(rate) : globalAudioSpeed;
  const targetLang = lang || globalAudioAccent;
  const isUK = targetLang === 'en-GB';

  // 1. If direct MP3 audio URL exists
  if (audioUrl && audioUrl.trim()) {
    let matchedAudioUrl = audioUrl;

    if (isUK && audioUrl.includes('-us.mp3')) {
      matchedAudioUrl = audioUrl.replace('-us.mp3', '-uk.mp3');
    } else if (!isUK && audioUrl.includes('-uk.mp3')) {
      matchedAudioUrl = audioUrl.replace('-uk.mp3', '-us.mp3');
    }

    try {
      const audio = new Audio(matchedAudioUrl);
      audio.playbackRate = targetRate;
      audio.play().catch(() => {
        speakText(text, targetLang, targetRate);
      });
      return;
    } catch (e) {
      console.warn('Audio play error, falling back to Web Speech:', e);
    }
  }

  // 2. High-Definition Studio Audio Stream
  if (text && text.trim()) {
    try {
      const ttsUrl = `/api/audio/tts?text=${encodeURIComponent(text.substring(0, 350).trim())}&lang=${encodeURIComponent(targetLang)}`;
      const audio = new Audio(ttsUrl);
      audio.playbackRate = targetRate;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          speakText(text, targetLang, targetRate);
        });
      }
      return;
    } catch (e) {}
  }

  // 3. Fallback Web Speech Synthesis API
  speakText(text, targetLang, targetRate);
};

export const speakText = (text, lang = null, rate = null) => {
  if (!window.speechSynthesis) {
    console.warn('Web Speech API is not supported in this browser.');
    return;
  }

  const targetRate = rate !== null ? parseFloat(rate) : globalAudioSpeed;
  const targetLang = lang || globalAudioAccent;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = targetLang;
  utterance.rate = Math.max(0.4, Math.min(2.0, targetRate));
  utterance.pitch = 1.0;

  const matchedVoice = getVoiceForAccent(targetLang);
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  window.speechSynthesis.speak(utterance);
};

// ==========================================
// 🎮 Web Audio Synthesizer Sound Effects (Game & Quiz)
// ==========================================
let sfxAudioCtx = null;

const getSfxAudioContext = () => {
  if (typeof window === 'undefined') return null;
  if (!sfxAudioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      sfxAudioCtx = new AudioContext();
    }
  }
  if (sfxAudioCtx && sfxAudioCtx.state === 'suspended') {
    sfxAudioCtx.resume();
  }
  return sfxAudioCtx;
};

export const playTapSound = () => {
  try {
    const ctx = getSfxAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
  } catch (e) {}
};

export const playCorrectSound = () => {
  try {
    const ctx = getSfxAudioContext();
    if (!ctx) return;
    const notes = [523.25, 783.99, 1046.50]; // C5 -> G5 -> C6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.28, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.2);
        } catch (e) {}
      }, idx * 65);
    });
  } catch (e) {}
};

export const playWrongSound = () => {
  try {
    const ctx = getSfxAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
};

export const playStreakSound = (combo = 3) => {
  try {
    const ctx = getSfxAudioContext();
    if (!ctx) return;
    const baseNotes = [440, 554.37, 659.25, 880]; // A major arpeggio
    baseNotes.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.32, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.28);
        } catch (e) {}
      }, idx * 60);
    });
  } catch (e) {}
};

export const playVictorySound = () => {
  try {
    const ctx = getSfxAudioContext();
    if (!ctx) return;
    const fanfare = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    fanfare.forEach((freq, idx) => {
      setTimeout(() => {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0.35, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        } catch (e) {}
      }, idx * 100);
    });
  } catch (e) {}
};

export const audioService = {
  play: (text, audioUrl, lang, rate) => playAudio(text, audioUrl, lang, rate),
  speak: (text, lang, rate) => playAudio(text, null, lang, rate),
  playAudio,
  speakText,
  playTapSound,
  playCorrectSound,
  playWrongSound,
  playStreakSound,
  playVictorySound,
  setSpeed: setGlobalAudioSpeed,
  getSpeed: getGlobalAudioSpeed,
  setAccent: setGlobalAudioAccent,
  getAccent: getGlobalAudioAccent
};

export default audioService;


