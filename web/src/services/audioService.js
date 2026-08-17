/**
 * Smart Audio pronunciation service with Granular Speed Control (0.5x - 1.5x)
 * Supports Native MP3 + Web Speech Synthesis API (US / UK Accents)
 */

let globalAudioSpeed = parseFloat(localStorage.getItem('linguavault_audio_speed')) || 0.9;
let globalAudioAccent = localStorage.getItem('linguavault_audio_accent') || 'en-US';

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

export const playAudio = (text, audioUrl = null, lang = null, rate = null) => {
  if (!text && !audioUrl) return;

  const targetRate = rate !== null ? parseFloat(rate) : globalAudioSpeed;
  const targetLang = lang || globalAudioAccent;

  // 1. If direct MP3 audio URL exists, play it with exact playbackRate
  if (audioUrl && audioUrl.trim()) {
    try {
      const audio = new Audio(audioUrl);
      audio.playbackRate = targetRate;
      audio.play().catch(() => {
        // Fallback to speech synthesis if audio playback fails
        speakText(text, targetLang, targetRate);
      });
      return;
    } catch (e) {
      console.warn('Audio play error, falling back to Web Speech:', e);
    }
  }

  // 2. Web Speech Synthesis API (100% Free, Built-in browser)
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

  // Find natural English voice matching target accent
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => {
    const isLang = targetLang === 'en-GB' ? (v.lang === 'en-GB' || v.lang === 'en_GB') : v.lang.startsWith('en');
    return isLang && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Arthur'));
  }) || voices.find(v => v.lang.startsWith('en'));

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  window.speechSynthesis.speak(utterance);
};

export const audioService = {
  play: (text, audioUrl, lang, rate) => playAudio(text, audioUrl, lang, rate),
  speak: (text, lang, rate) => playAudio(text, null, lang, rate),
  playAudio,
  speakText,
  setSpeed: setGlobalAudioSpeed,
  getSpeed: getGlobalAudioSpeed,
  setAccent: setGlobalAudioAccent,
  getAccent: getGlobalAudioAccent
};

export default audioService;

