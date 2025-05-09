export type SpeechEncoding =
  | 'ENCODING_UNSPECIFIED'
  | 'LINEAR16'
  | 'FLAC'
  | 'MULAW'
  | 'AMR'
  | 'AMR_WB'
  | 'OGG_OPUS'
  | 'SPEEX_WITH_HEADER_BYTE'
  | 'WEBM_OPUS';

export interface SpeechConfig {
  encoding: SpeechEncoding;
  sampleRateHertz?: number;
  languageCode: string;
  enableAutomaticPunctuation?: boolean;
  model?: string;
  useEnhanced?: boolean;
  alternativeLanguageCodes?: string[];
}

export interface SpeechRecognitionResult {
  alternatives: {
    transcript: string;
    confidence: number;
  }[];
  isFinal: boolean;
}

export interface SpeechRecognitionResponse {
  results: SpeechRecognitionResult[];
}

export interface Message {
  content: string;
  role: 'user' | 'assistant';
  translation?: string;
  timestamp?: string;
}

export interface ChatResponse {
  danishResponse: string;
  englishTranslation: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface TranscriptionResponse {
  text: string;
}

export interface Topic {
  id: string;
  title: string;
  icon: string;
  englishTitle: string;
  color: string;
}

export interface ProcessingState {
  transcribing: boolean;
  thinking: boolean;
  speaking: boolean;
}

export interface PerformanceMetrics {
  recordingStart: number;
  transcriptionStart: number;
  chatStart: number;
  responseStart: number;
} 