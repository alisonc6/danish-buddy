import { SpeechClient, protos as speechProtos } from '@google-cloud/speech';
import { TextToSpeechClient, protos as ttsProtos } from '@google-cloud/text-to-speech';
import { SpeechServiceError } from './errors';

type SynthesizeSpeechRequest = ttsProtos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest;
type SynthesizeSpeechResponse = ttsProtos.google.cloud.texttospeech.v1.ISynthesizeSpeechResponse;
type RecognizeResponse = speechProtos.google.cloud.speech.v1.IRecognizeResponse;

interface CacheEntry {
  timestamp: number;
  data: ArrayBuffer;
}

export class GoogleSpeechService {
  private speechClient: SpeechClient;
  private ttsClient: TextToSpeechClient;
  private cache: Map<string, CacheEntry>;
  private readonly MAX_CACHE_AGE = 1000 * 60 * 60; // 1 hour
  private readonly MAX_CACHE_SIZE = 100;
  private readonly REQUEST_TIMEOUT = 10000; // 10 seconds

  constructor() {
    if (!process.env.GOOGLE_PROJECT_ID || !process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      throw new SpeechServiceError(
        'Missing Google Cloud credentials',
        'INVALID_CREDENTIALS'
      );
    }

    const credentials = {
      projectId: process.env.GOOGLE_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    };

    this.speechClient = new SpeechClient(credentials);
    this.ttsClient = new TextToSpeechClient(credentials);
    this.cache = new Map();
  }

  private cleanCache() {
    const now = Date.now();
    let deleted = 0;
    
    // Remove old entries
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.MAX_CACHE_AGE) {
        this.cache.delete(key);
        deleted++;
      }
    }

    // If still too many entries, remove oldest
    if (this.cache.size - deleted > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);
      
      const toDelete = this.cache.size - this.MAX_CACHE_SIZE;
      entries.slice(0, toDelete).forEach(([key]) => this.cache.delete(key));
    }
  }

  async transcribeSpeech(audioBuffer: ArrayBuffer): Promise<string> {
    try {
      const audio = {
        content: Buffer.from(audioBuffer).toString('base64'),
      };
      
      const config = {
        encoding: 'WEBM_OPUS' as const,
        sampleRateHertz: 16000,
        languageCode: 'da-DK',
        model: 'latest_long',
      };

      const recognizePromise = this.speechClient.recognize({ audio, config })
        .then((response: [RecognizeResponse, speechProtos.google.cloud.speech.v1.IRecognizeRequest | undefined, {} | undefined]) => response[0]);

      const response = await Promise.race([
        recognizePromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.REQUEST_TIMEOUT)
        )
      ]);

      if (!response?.results?.length) {
        throw new SpeechServiceError(
          'No transcription results',
          'NO_RESULTS'
        );
      }

      return response.results
        .map((result: speechProtos.google.cloud.speech.v1.ISpeechRecognitionResult) => 
          result.alternatives?.[0]?.transcript
        )
        .filter((text): text is string => text !== undefined && text !== null)
        .join(' ');
    } catch (error) {
      if (error instanceof Error) {
        throw new SpeechServiceError(
          'Transcription failed',
          'TRANSCRIPTION_ERROR',
          error.message
        );
      }
      throw error;
    }
  }

  async synthesizeSpeech(text: string, cacheKey?: string): Promise<ArrayBuffer> {
    try {
      const key = cacheKey || text;
      const cached = this.cache.get(key);
      
      if (cached && Date.now() - cached.timestamp <= this.MAX_CACHE_AGE) {
        return cached.data;
      }

      const request: SynthesizeSpeechRequest = {
        input: { text },
        voice: {
          languageCode: 'da-DK',
          name: 'da-DK-Neural2-D',
        },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: 0,
          speakingRate: 1.0,
        },
      };

      const synthesizePromise = this.ttsClient.synthesizeSpeech(request)
        .then((response: [SynthesizeSpeechResponse, SynthesizeSpeechRequest | undefined, {} | undefined]) => response[0]);

      const synthesisResponse = await Promise.race([
        synthesizePromise,
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), this.REQUEST_TIMEOUT)
        )
      ]);
      
      if (!synthesisResponse.audioContent) {
        throw new SpeechServiceError(
          'No audio content received',
          'NO_AUDIO_CONTENT'
        );
      }

      const audioContent = Buffer.from(synthesisResponse.audioContent as Uint8Array);
      const arrayBuffer = audioContent.buffer.slice(
        audioContent.byteOffset,
        audioContent.byteOffset + audioContent.byteLength
      );

      this.cache.set(key, {
        timestamp: Date.now(),
        data: arrayBuffer
      });
      
      this.cleanCache();
      return arrayBuffer;

    } catch (error) {
      if (error instanceof Error) {
        throw new SpeechServiceError(
          'Speech synthesis failed',
          'SYNTHESIS_ERROR',
          error.message
        );
      }
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}