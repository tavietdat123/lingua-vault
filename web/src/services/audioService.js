/**
 * Audio pronunciation service using Native MP3 or Web Speech Synthesis API
 */

export const playAudio = (text, audioUrl = null, lang = 'en-US') => {
  if (!text && !audioUrl) return;

  // 1. If direct MP3 audio URL exists, play it
  if (audioUrl && audioUrl.trim()) {
    try {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => {
        // Fallback to speech synthesis if audio fails
        speakText(text, lang);
      });
      return;
    } catch (e) {
      console.warn('Audio play error, falling back to Web Speech:', e);
    }
  }

  // 2. Web Speech Synthesis API (100% Free, Built-in browser)
  speakText(text, lang);
};

export const speakText = (text, lang = 'en-US') => {
  if (!window.speechSynthesis) {
    console.warn('Web Speech API is not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.rate = 0.9; // Slightly slower for better learning clarity
  utterance.pitch = 1.0;

  // Find English voice
  const voices = window.speechSynthesis.getVoices();
  const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')));
  if (englishVoice) {
    utterance.voice = englishVoice;
  }

  window.speechSynthesis.speak(utterance);
};
