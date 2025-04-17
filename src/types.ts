export {};

declare global {
  interface Window {
    speechSynthesis: SpeechSynthesis;
  }
} 