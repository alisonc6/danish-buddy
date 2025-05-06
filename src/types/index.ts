// Message types
export interface Message {
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
  timestamp?: string;
}

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

// Speech configuration types
export interface SpeechConfig {
  encoding: 'LINEAR16' | 'OGG_OPUS' | 'WEBM_OPUS';
  sampleRateHertz?: number;
  languageCode: string;
  enableAutomaticPunctuation?: boolean;
  model?: string;
  useEnhanced?: boolean;
} 