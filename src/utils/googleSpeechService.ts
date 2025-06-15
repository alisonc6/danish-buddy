import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';
import { validateRuntimeEnv } from './env';
import { SpeechConfig } from '../types';
import debugLog from './debug';
import { protos as speechProtos } from '@google-cloud/speech';

type SynthesizeSpeechRequest = protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest;
type SynthesizeSpeechResponse = protos.google.cloud.texttospeech.v1.ISynthesizeSpeechResponse;

export class GoogleSpeechService {
  private speechClient: SpeechClient | null = null;
  private ttsClient: TextToSpeechClient | null = null;
  private cache: Map<string, ArrayBuffer>;

  constructor() {
    this.cache = new Map();
  }

  private initializeClients() {
    if (this.speechClient && this.ttsClient) {
      return;
    }

    try {
      // Validate runtime environment variables
      validateRuntimeEnv();
      debugLog.transcription('Environment variables validated successfully');

      // Format the private key properly for PEM format
      let privateKey = process.env.GOOGLE_PRIVATE_KEY!;
      
      // Remove any existing quotes
      privateKey = privateKey.replace(/"/g, '');
      
      // Ensure proper line endings
      privateKey = privateKey.replace(/\\n/g, '\n');
      
      // Remove any extra whitespace
      privateKey = privateKey.trim();
      
      // Ensure the key has proper PEM format
      if (!privateKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
        privateKey = '-----BEGIN PRIVATE KEY-----\n' + privateKey;
      }
      if (!privateKey.endsWith('-----END PRIVATE KEY-----')) {
        privateKey = privateKey + '\n-----END PRIVATE KEY-----';
      }
      
      // Ensure proper line breaks between markers and content
      privateKey = privateKey.replace(
        /-----BEGIN PRIVATE KEY-----(.*?)-----END PRIVATE KEY-----/,
        (_match, content) => {
          const cleanContent = content.trim().replace(/\n/g, '');
          return `-----BEGIN PRIVATE KEY-----\n${cleanContent}\n-----END PRIVATE KEY-----`;
        }
      );

      const credentials = {
        projectId: process.env.GOOGLE_PROJECT_ID,
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: privateKey,
        },
      };

      // Initialize clients with fallback to REST
      this.speechClient = new SpeechClient({
        ...credentials,
        fallback: true, // Force REST instead of gRPC
      });
      this.ttsClient = new TextToSpeechClient({
        ...credentials,
        fallback: true, // Force REST instead of gRPC
      });
      debugLog.transcription('Google Cloud clients initialized successfully');
    } catch (error) {
      debugLog.error(error, 'Failed to initialize Google Cloud clients');
      throw new Error('Failed to initialize Google Cloud services: ' + (error instanceof Error ? error.message : String(error)));
    }
  }

  async transcribeSpeech(audioBuffer: Buffer, config: SpeechConfig): Promise<string> {
    try {
      this.initializeClients();
      if (!this.speechClient) {
        throw new Error('Speech client not initialized');
      }

      // Log the incoming config
      console.log('GoogleSpeechService received config:', config);
      debugLog.transcription('GoogleSpeechService received config', {
        config,
        configType: typeof config,
        configKeys: Object.keys(config)
      });

      const request: speechProtos.google.cloud.speech.v1.IRecognizeRequest = {
        config: {
          encoding: speechProtos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding[config.encoding as keyof typeof speechProtos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding],
          sampleRateHertz: config.sampleRateHertz || 48000, // Default to 48kHz for WEBM OPUS
          languageCode: config.languageCode || 'da-DK',
          enableAutomaticPunctuation: config.enableAutomaticPunctuation ?? true,
          useEnhanced: config.useEnhanced ?? true,
          enableWordTimeOffsets: config.enableWordTimeOffsets ?? true,
          enableSpokenPunctuation: { value: config.enableSpokenPunctuation ?? true } as speechProtos.google.protobuf.BoolValue,
          enableSpokenEmojis: { value: config.enableSpokenEmojis ?? true } as speechProtos.google.protobuf.BoolValue
        },
        audio: {
          content: audioBuffer.toString('base64')
        }
      };

      // Log the request configuration
      const requestConfig = {
        ...request.config,
        enableAutomaticPunctuation: request.config?.enableAutomaticPunctuation,
        useEnhanced: request.config?.useEnhanced,
        enableWordTimeOffsets: request.config?.enableWordTimeOffsets,
        enableSpokenPunctuation: request.config?.enableSpokenPunctuation?.value,
        enableSpokenEmojis: request.config?.enableSpokenEmojis?.value
      };

      console.log('Speech-to-Text request config:', requestConfig);
      debugLog.transcription('Making request to Google Speech-to-Text', {
        config: requestConfig,
        audioSize: audioBuffer.length,
        languageCode: request.config?.languageCode,
        alternativeLanguages: request.config?.alternativeLanguageCodes
      });

      const [response] = await this.speechClient.recognize(request);
      
      console.log('Speech-to-Text response:', JSON.stringify(response, null, 2));
      debugLog.transcription('Received response from Google Speech-to-Text', {
        results: response.results,
        totalBilledTime: response.totalBilledTime,
        languageCode: response.results?.[0]?.languageCode,
        rawResponse: response
      });

      if (!response.results || response.results.length === 0) {
        console.error('No results in response:', response);
        throw new Error('No transcription results found in response');
      }

      const transcription = response.results
        .map(result => {
          console.log('Result:', JSON.stringify(result, null, 2));
          return result.alternatives?.[0]?.transcript;
        })
        .filter(Boolean)
        .join(' ');

      if (!transcription) {
        console.error('No transcription text found in results:', response.results);
        throw new Error('No transcription text found in results');
      }

      return transcription;
    } catch (error) {
      console.error('Speech-to-Text error:', error);
      debugLog.error(error, 'Speech-to-Text failed - ' + (error instanceof Error ? error.message : String(error)));
      throw error;
    }
  }

  async synthesizeSpeech(text: string, cacheKey?: string, format: string = 'mp3'): Promise<ArrayBuffer> {
    this.initializeClients();
    if (!this.ttsClient) {
      throw new Error('Text-to-Speech client not initialized');
    }
    const key = cacheKey || text;
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    let audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding = protos.google.cloud.texttospeech.v1.AudioEncoding.MP3;
    if (format.toLowerCase() === 'linear16') {
      audioEncoding = protos.google.cloud.texttospeech.v1.AudioEncoding.LINEAR16;
    }
    const request: SynthesizeSpeechRequest = {
      input: { text },
      voice: {
        languageCode: 'da-DK',
        name: 'da-DK-Neural2-D',
      },
      audioConfig: {
        audioEncoding,
        pitch: 0,
        speakingRate: 1.0,
      },
    };
    const [synthesisResponse] = await this.ttsClient.synthesizeSpeech(request) as unknown as [SynthesizeSpeechResponse];
    if (!synthesisResponse.audioContent) {
      throw new Error('No audio content received from Text-to-Speech API');
    }
    const audioContent = Buffer.from(synthesisResponse.audioContent as Uint8Array);
    const arrayBuffer = audioContent.buffer.slice(audioContent.byteOffset, audioContent.byteOffset + audioContent.byteLength);
    this.cache.set(key, arrayBuffer as ArrayBuffer);
    return arrayBuffer as ArrayBuffer;
  }

  clearCache() {
    this.cache.clear();
  }
}