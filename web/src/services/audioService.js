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
    try {
      const voices = window.speechSynthesis.getVoices() || [];
      if (voices.length > 0) {
        availableVoices = voices;
      }
    } catch (e) {}
  }
};

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
  if (availableVoices.length === 0) {
    const timer = setInterval(() => {
      loadVoices();
      if (availableVoices.length > 0) clearInterval(timer);
    }, 150);
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
 * Disqualifies outdated/robotic/novelty macOS & Windows voices
 * such as Alex, Fred, Victoria, Ralph, Zarvox, Trinoids, etc.
 */
const ROBOTIC_VOICE_REGEX = /alex|fred|victoria|ralph|zarvox|trinoids|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|junior|kathy|organ|princess|whisper|compact|espeak/i;

/**
 * Get the best matching natural/studio voice for the given accent
 */
const getVoiceForAccent = (targetLang) => {
  if (availableVoices.length === 0) {
    loadVoices();
  }

  const normalizedTarget = targetLang.replace('_', '-').toLowerCase();
  const isUK = normalizedTarget === 'en-gb';

  // High-fidelity natural voices
  const topTierRegex = isUK
    ? /google uk|daniel \(enhanced\)|oliver|serena|sonia|stephanie|kate|hazel|george|libby/i
    : /google us|samantha \(enhanced\)|ava \(premium\)|ava|jenny|aria|guy|allison|samantha|joanna|kendra|zoe|tom/i;

  const scoreVoice = (voice) => {
    const normalizedLang = String(voice.lang || '').replace('_', '-').toLowerCase();
    if (!normalizedLang.startsWith('en')) return -2000;
    
    const descriptor = `${voice.name || ''} ${voice.voiceURI || ''}`;
    
    // Penalize robotic/mechanical voices heavily
    if (ROBOTIC_VOICE_REGEX.test(descriptor)) return -1000;

    let score = 0;
    if (normalizedLang === normalizedTarget) score += 150;
    else if (normalizedLang.startsWith('en')) score += 30;

    if (topTierRegex.test(descriptor)) score += 100;
    if (/natural|premium|enhanced|neural/i.test(descriptor)) score += 80;
    if (/google/i.test(descriptor)) score += 60;
    if (voice.localService) score += 15;
    if (voice.default) score += 5;

    return score;
  };

  const englishVoices = availableVoices.filter((voice) =>
    String(voice.lang || '').toLowerCase().startsWith('en')
  );

  if (englishVoices.length === 0) return null;

  return englishVoices.sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
};

let globalPlaybackSessionId = 0;

const stopCurrentPlayback = () => {
  globalPlaybackSessionId++;
  if (currentActiveAudio) {
    try {
      currentActiveAudio.pause();
      currentActiveAudio.currentTime = 0;
      currentActiveAudio.src = '';
    } catch (e) {}
    currentActiveAudio = null;
  }
  currentSpeechUtterance = null;
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
};

const playHtmlAudio = (sourceUrl, rate, onFailure = null) => {
  const sessionId = globalPlaybackSessionId;
  let started = false;
  let failed = false;
  
  if (currentActiveAudio) {
    try {
      currentActiveAudio.pause();
      currentActiveAudio.src = '';
    } catch (e) {}
    currentActiveAudio = null;
  }

  const audio = new Audio();
  currentActiveAudio = audio;
  audio.preload = 'auto';
  audio.playbackRate = rate;

  const fail = () => {
    if (sessionId !== globalPlaybackSessionId) return;
    if (started || failed) return;
    failed = true;
    clearTimeout(startTimeout);
    try { audio.pause(); audio.src = ''; } catch (e) {}
    if (currentActiveAudio === audio) currentActiveAudio = null;
    if (onFailure) onFailure();
  };
  
  // 900ms max waiting for network stream
  const startTimeout = setTimeout(fail, 900);

  audio.onplaying = () => {
    if (sessionId !== globalPlaybackSessionId) {
      try { audio.pause(); audio.src = ''; } catch (e) {}
      return;
    }
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
  if (!text) return;
  const ttsUrl = `/api/audio/tts?text=${encodeURIComponent(text.substring(0, 350))}&lang=${encodeURIComponent(targetLang)}`;
  playHtmlAudio(ttsUrl, targetRate);
};

export const speakText = (text, lang = null, rate = null, onFailure = null) => {
  if (typeof window === 'undefined' || !window.speechSynthesis || !text) return false;

  const sessionId = globalPlaybackSessionId;
  const targetRate = rate !== null ? parseFloat(rate) : globalAudioSpeed;
  const safeRate = !isNaN(targetRate) ? Math.max(0.5, Math.min(1.8, targetRate)) : 1.0;
  const targetLang = lang || globalAudioAccent;
  const matchedVoice = getVoiceForAccent(targetLang);

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    currentSpeechUtterance = utterance;
    utterance.lang = targetLang;
    utterance.rate = safeRate;
    utterance.pitch = 1.0;
    
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    let started = false;
    utterance.onstart = () => {
      if (sessionId !== globalPlaybackSessionId) {
        window.speechSynthesis.cancel();
        return;
      }
      started = true;
    };
    utterance.onend = () => {
      if (currentSpeechUtterance === utterance) currentSpeechUtterance = null;
    };
    utterance.onerror = (e) => {
      if (currentSpeechUtterance !== utterance) return;
      currentSpeechUtterance = null;
      if (!started && onFailure && sessionId === globalPlaybackSessionId) {
        onFailure();
      }
    };

    window.speechSynthesis.speak(utterance);
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
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
  const cleanText = (text || '').trim();

  // Atomically cancel any active sound before starting the new one
  stopCurrentPlayback();
  const currentSession = globalPlaybackSessionId;

  // 1. Instant Natural Browser Speech Synthesis
  if (cleanText && typeof window !== 'undefined' && window.speechSynthesis) {
    const started = speakText(cleanText, targetLang, targetRate, () => {
      if (currentSession !== globalPlaybackSessionId) return;
      playFreeServerTts(cleanText, targetLang, targetRate);
    });
    if (started) return;
  }

  // 2. Fallback: Server HD Studio Audio
  if (cleanText) {
    playFreeServerTts(cleanText, targetLang, targetRate);
    return;
  }

  // 3. Fallback: Raw audioUrl if provided
  if (audioUrl && audioUrl.trim()) {
    playHtmlAudio(audioUrl, targetRate);
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
