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
  [key: string]: unknown;
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
  role: 'user' | 'assistant';
  content: string;
  audioUrl?: string;
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
  englishTitle: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  icon: string;
  color: string;
  commonPhrases?: string[];
  culturalNotes?: string[];
}

export interface Category {
  id: string;
  title: string;
  description: string;
  topics: Topic[];
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

export interface Conversation {
  messages: Message[];
  topic: Topic;
  isPracticeMode: boolean;
  isMuted: boolean;
  isBookmarked: boolean;
} 