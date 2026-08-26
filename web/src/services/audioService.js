/**
 * Smart Audio pronunciation service with Granular Speed Control (0.5x - 1.5x)
 * Supports Native MP3 + Web Speech Synthesis API (US / UK Accents)
 */

const AUDIO_SPEED_KEY = 'linguavault_audio_speed';
const AUDIO_ACCENT_KEY = 'linguavault_audio_accent';
const AUDIO_ENGINE_VERSION_KEY = 'linguavault_audio_engine_version';
const AUDIO_ENGINE_VERSION = 'natural-web-v2';

const storedAudioSpeed = parseFloat(localStorage.getItem(AUDIO_SPEED_KEY));
const storedEngineIsCurrent = localStorage.getItem(AUDIO_ENGINE_VERSION_KEY) === AUDIO_ENGINE_VERSION;
let globalAudioSpeed = storedEngineIsCurrent && !isNaN(storedAudioSpeed) ? storedAudioSpeed : 1.0;
let globalAudioAccent = localStorage.getItem(AUDIO_ACCENT_KEY) || 'en-US';

if (!storedEngineIsCurrent) {
  localStorage.setItem(AUDIO_SPEED_KEY, '1');
  localStorage.setItem(AUDIO_ENGINE_VERSION_KEY, AUDIO_ENGINE_VERSION);
}

let availableVoices = [];
let currentActiveAudio = null;
let currentSpeechUtterance = null;

// Preload and cache voices with continuous detection
const loadVoices = () => {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    const voices = window.speechSynthesis.getVoices() || [];
    if (voices.length > 0) {
      availableVoices = voices;
    }
  }
};

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
  // Retry periodically for browsers that load voices asynchronously
  if (availableVoices.length === 0) {
    const timer = setInterval(() => {
      loadVoices();
      if (availableVoices.length > 0) clearInterval(timer);
    }, 200);
    setTimeout(() => clearInterval(timer), 3000);
  }
}

export const setGlobalAudioSpeed = (speed) => {
  const num = parseFloat(speed);
  if (!isNaN(num) && num >= 0.4 && num <= 2.0) {
    globalAudioSpeed = Math.round(num * 100) / 100;
    localStorage.setItem(AUDIO_SPEED_KEY, globalAudioSpeed.toString());
    localStorage.setItem(AUDIO_ENGINE_VERSION_KEY, AUDIO_ENGINE_VERSION);
  }
  return globalAudioSpeed;
};

export const getGlobalAudioSpeed = () => globalAudioSpeed;

export const setGlobalAudioAccent = (accent) => {
  if (accent === 'en-US' || accent === 'en-GB') {
    globalAudioAccent = accent;
    localStorage.setItem(AUDIO_ACCENT_KEY, accent);
  }
  return globalAudioAccent;
};

export const getGlobalAudioAccent = () => globalAudioAccent;

/**
 * Get the best matching studio/natural voice for the given accent
 * Strictly filters to native English voices to prevent OS fallback to Vietnamese/robotic voices
 */
const getVoiceForAccent = (targetLang) => {
  if (availableVoices.length === 0) {
    loadVoices();
  }

  const normalizedTarget = targetLang.replace('_', '-').toLowerCase();
  const isUK = normalizedTarget === 'en-gb';
  const preferredNames = isUK
    ? /daniel|oliver|serena|arthur|george|kate|sonia|ryan|hazel/i
    : /samantha|ava|jenny|guy|aria|alex|allison|victoria|tom|joanna|kendra/i;

  const scoreVoice = (voice) => {
    const normalizedLang = String(voice.lang || '').replace('_', '-').toLowerCase();
    if (!normalizedLang.startsWith('en')) return -1000;
    const descriptor = `${voice.name || ''} ${voice.voiceURI || ''}`;
    let score = normalizedLang === normalizedTarget ? 120 : 20;
    if (/natural|premium|enhanced|neural/i.test(descriptor)) score += 80;
    if (preferredNames.test(descriptor)) score += 50;
    if (/google/i.test(descriptor)) score += 30;
    if (voice.localService) score += 25;
    if (voice.default) score += 5;
    if (/compact|espeak|novelty/i.test(descriptor)) score -= 60;
    return score;
  };

  return availableVoices
    .filter((voice) => String(voice.lang || '').toLowerCase().startsWith('en'))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
};

const stopCurrentPlayback = () => {
  if (currentActiveAudio) {
    try {
      currentActiveAudio.pause();
      currentActiveAudio.currentTime = 0;
    } catch (e) {}
    currentActiveAudio = null;
  }
  currentSpeechUtterance = null;
  try {
    window.speechSynthesis?.cancel();
  } catch (e) {}
};

const playHtmlAudio = (sourceUrl, rate, onFailure = null) => {
  let started = false;
  let failed = false;
  const audio = new Audio();
  currentActiveAudio = audio;
  audio.preload = 'auto';
  audio.playbackRate = rate;

  const fail = () => {
    if (started || failed) return;
    failed = true;
    clearTimeout(startTimeout);
    try { audio.pause(); } catch (e) {}
    if (currentActiveAudio === audio) currentActiveAudio = null;
    if (onFailure) onFailure();
  };
  const startTimeout = setTimeout(fail, 900);

  // `playing` fires when audio data is actually flowing. `play` can fire while
  // the element is still buffering, which caused the old false-success delay.
  audio.onplaying = () => {
    started = true;
    clearTimeout(startTimeout);
  };
  audio.onerror = fail;
  audio.onended = () => {
    clearTimeout(startTimeout);
    if (currentActiveAudio === audio) currentActiveAudio = null;
  };
  audio.src = sourceUrl;
  audio.play().catch(fail);
};

const playFreeServerTts = (text, targetLang, targetRate) => {
  const ttsUrl = `/api/audio/tts?text=${encodeURIComponent(text.substring(0, 350))}&lang=${encodeURIComponent(targetLang)}`;
  playHtmlAudio(ttsUrl, targetRate);
};

export const speakText = (text, lang = null, rate = null, onFailure = null) => {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return false;

  const targetRate = rate !== null ? parseFloat(rate) : globalAudioSpeed;
  const safeRate = !isNaN(targetRate) ? Math.max(0.5, Math.min(1.8, targetRate)) : 1.0;
  const targetLang = lang || globalAudioAccent;
  const matchedVoice = getVoiceForAccent(targetLang);
  if (!matchedVoice) return false;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    currentSpeechUtterance = utterance;
    utterance.lang = targetLang;
    utterance.rate = safeRate;
    utterance.pitch = 1.0;
    utterance.voice = matchedVoice;

    let started = false;
    const startTimeout = setTimeout(() => {
      if (started || currentSpeechUtterance !== utterance) return;
      currentSpeechUtterance = null;
      window.speechSynthesis.cancel();
      if (onFailure) onFailure();
    }, 900);

    utterance.onstart = () => {
      started = true;
      clearTimeout(startTimeout);
    };
    utterance.onend = () => {
      clearTimeout(startTimeout);
      if (currentSpeechUtterance === utterance) currentSpeechUtterance = null;
    };
    utterance.onerror = () => {
      clearTimeout(startTimeout);
      if (currentSpeechUtterance !== utterance) return;
      currentSpeechUtterance = null;
      if (!started && onFailure) onFailure();
    };

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (error) {
    currentSpeechUtterance = null;
    return false;
  }
};

export const playAudio = (text, audioUrl = null, lang = null, rate = null) => {
  if (!text && !audioUrl) return;

  const parsedRate = rate !== null ? parseFloat(rate) : globalAudioSpeed;
  const targetRate = !isNaN(parsedRate) ? Math.max(0.5, Math.min(1.8, parsedRate)) : 1.0;
  const targetLang = lang || globalAudioAccent;
  const isUK = targetLang === 'en-GB';
  const cleanText = (text || '').trim();

  stopCurrentPlayback();

  // Real dictionary recordings are the most accurate source when available.
  if (audioUrl && audioUrl.trim()) {
    let matchedAudioUrl = audioUrl;
    if (isUK && audioUrl.includes('-us.mp3')) {
      matchedAudioUrl = audioUrl.replace('-us.mp3', '-uk.mp3');
    } else if (!isUK && audioUrl.includes('-uk.mp3')) {
      matchedAudioUrl = audioUrl.replace('-uk.mp3', '-us.mp3');
    }

    playHtmlAudio(matchedAudioUrl, targetRate, () => {
      const speaking = speakText(cleanText, targetLang, targetRate, () => playFreeServerTts(cleanText, targetLang, targetRate));
      if (!speaking) playFreeServerTts(cleanText, targetLang, targetRate);
    });
    return;
  }

  // Browser Natural/Enhanced voices start immediately and avoid server delay.
  if (cleanText) {
    const speaking = speakText(cleanText, targetLang, targetRate, () => playFreeServerTts(cleanText, targetLang, targetRate));
    if (!speaking) playFreeServerTts(cleanText, targetLang, targetRate);
    return;
  }
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
