// Message types
export type MessageRole = 'user' | 'assistant';

export interface Message {
  role: MessageRole;
  content: string;
  translation?: string;
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