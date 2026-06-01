'use client';

import { useCallback } from 'react';

export function useSpeech() {
  const speak = useCallback((text: string) => {
    try {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.warn('Speech synthesis not supported in this browser.');
        return;
      }

      // Cancel any ongoing speaking
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a premium English voice
      const voices = window.speechSynthesis.getVoices();
      const englishVoice =
        voices.find((v) => v.lang === 'en-US' && v.name.includes('Google')) ||
        voices.find((v) => v.lang.startsWith('en-US')) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];

      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      
      utterance.rate = 0.85; // Slightly slower speed for clearer language learning
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('SpeechSynthesis failed:', e);
    }
  }, []);

  return { speak };
}
