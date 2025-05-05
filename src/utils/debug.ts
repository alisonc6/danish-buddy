const DEBUG_ENABLED = process.env.NEXT_PUBLIC_DEBUG_MODE === 'true';

interface DebugLog {
  transcription: (message: string, data?: Record<string, unknown>) => void;
  chat: (message: string, data?: Record<string, unknown>) => void;
  speech: (message: string, data?: Record<string, unknown>) => void;
  timing: (start: number, label: string) => void;
  error: (error: unknown, context: string) => void;
}

export const debugLog: DebugLog = {
  transcription: (message: string, data?: Record<string, unknown>) => {
    if (DEBUG_ENABLED) {
      console.group('🎤 Transcription Debug');
      console.log(`Time: ${new Date().toISOString()}`);
      console.log('Message:', message);
      if (data) console.log('Data:', data);
      console.groupEnd();
    }
  },
  
  chat: (message: string, data?: Record<string, unknown>) => {
    if (DEBUG_ENABLED) {
      console.group('💬 Chat Debug');
      console.log(`Time: ${new Date().toISOString()}`);
      console.log('Message:', message);
      if (data) console.log('Data:', data);
      console.groupEnd();
    }
  },

  speech: (message: string, data?: Record<string, unknown>) => {
    if (DEBUG_ENABLED) {
      console.group('🔊 Speech Debug');
      console.log(`Time: ${new Date().toISOString()}`);
      console.log('Message:', message);
      if (data) console.log('Data:', data);
      console.groupEnd();
    }
  },

  timing: (start: number, label: string) => {
    if (DEBUG_ENABLED) {
      const duration = Date.now() - start;
      console.log(`⏱️ ${label}: ${duration}ms`);
    }
  },

  error: (error: unknown, context: string) => {
    if (DEBUG_ENABLED) {
      console.group('❌ Error Debug');
      console.log(`Context: ${context}`);
      console.log('Time:', new Date().toISOString());
      console.error('Error:', error);
      console.groupEnd();
    }
  }
};

export default debugLog;