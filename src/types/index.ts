// Message types
export type Message = {
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
  translation?: string;
  timestamp?: string;
  error?: boolean;
  isProcessing?: boolean;
};

export interface Topic {
  id: string;
  title: string;
  icon: string;
  englishTitle: string;
  color: string;
}

export interface ChatResponse {
  danishResponse: string;
  englishTranslation: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface TTSResponse {
  audioContent: string | Uint8Array;
  error?: string;
}

export interface TranscriptionResponse {
  text: string;
  error?: string;
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

// Processing state types
export interface ProcessingState {
  transcribing: boolean;
  thinking: boolean;
  speaking: boolean;
}

// Performance metrics types
export interface PerformanceMetrics {
  recordingStart: number;
  transcriptionStart: number;
  chatStart: number;
  responseStart: number;
}

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
  enableWordTimeOffsets?: boolean;
  enableSpokenPunctuation?: boolean;
  enableSpokenEmojis?: boolean;
  maxAlternatives?: number;
}

export interface ChatProps {
  topic: string;
  isPracticeMode?: boolean;
  isMuted?: boolean;
} 