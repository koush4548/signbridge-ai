export interface TTSOptions {
  language?: string;
  lang?: string;
  voiceName?: string;
  rate?: number;
  pitch?: number;
}

export function playTTS(text: string, options?: TTSOptions): void {
  if (!text || typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const lang = options?.language || options?.lang || 'en-US';
    utterance.lang = lang;
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;

    const voices = window.speechSynthesis.getVoices();
    if (options?.voiceName) {
      const selectedVoice = voices.find((v) => v.name === options.voiceName);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
    } else {
      const matchedVoice = voices.find((v) => v.lang.startsWith(lang.slice(0, 2)));
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }
    }

    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('TTS playback error:', err);
  }
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices();
}
