export {};

declare global {
  interface Window {
    readonly speechSynthesis: SpeechSynthesis;
  }
} 