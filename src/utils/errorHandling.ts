export class DanishBuddyError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DanishBuddyError';
  }
}

export class AudioError extends DanishBuddyError {
  constructor(message: string) {
    super(message, 'AUDIO_ERROR');
  }
}

export class SearchError extends DanishBuddyError {
  constructor(message: string) {
    super(message, 'SEARCH_ERROR');
  }
}

export class PracticeModeError extends DanishBuddyError {
  constructor(message: string) {
    super(message, 'PRACTICE_MODE_ERROR');
  }
}

export const handleError = (error: unknown): string => {
  if (error instanceof DanishBuddyError) {
    return error.message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof Error) {
    return error.message.includes('network') || 
           error.message.includes('fetch') || 
           error.message.includes('connection');
  }
  return false;
};

export const isAudioError = (error: unknown): boolean => {
  return error instanceof AudioError;
};

export const isSearchError = (error: unknown): boolean => {
  return error instanceof SearchError;
};

export const isPracticeModeError = (error: unknown): boolean => {
  return error instanceof PracticeModeError;
}; 