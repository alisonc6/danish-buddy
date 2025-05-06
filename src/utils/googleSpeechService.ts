import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';
import { validateEnv } from './validateEnv';
import { SpeechConfig, SpeechRecognitionResponse } from '../types';
import debugLog from './debug';
import { protos as speechProtos } from '@google-cloud/speech';

type SynthesizeSpeechRequest = protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest;
type SynthesizeSpeechResponse = protos.google.cloud.texttospeech.v1.ISynthesizeSpeechResponse;
type RecognizeRequest = speechProtos.google.cloud.speech.v1.IRecognizeRequest;
type AudioEncoding = speechProtos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding;

export class GoogleSpeechService {
  private speechClient: SpeechClient;
  private ttsClient: TextToSpeechClient;
  private cache: Map<string, ArrayBuffer>;

  constructor() {
    try {
      // Validate environment variables first
      validateEnv();
      debugLog.transcription('Environment variables validated successfully');

      // Format the private key properly
      const privateKey = process.env.GOOGLE_PRIVATE_KEY!
        .replace(/\\n/g, '\n')
        .replace(/"/g, '')
        .trim();

      const credentials = {
        projectId: process.env.GOOGLE_PROJECT_ID,
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: privateKey,
        },
      };

      this.speechClient = new SpeechClient(credentials);
      this.ttsClient = new TextToSpeechClient(credentials);
      this.cache = new Map();
      debugLog.transcription('Google Cloud clients initialized successfully');
    } catch (error) {
      debugLog.error(error, 'Failed to initialize Google Cloud clients');
      throw new Error('Failed to initialize Google Cloud services');
    }
  }

  async transcribeSpeech(audioBuffer: Buffer, config: SpeechConfig): Promise<string> {
    try {
      debugLog.transcription('Starting transcription with config:', {
        encoding: config.encoding,
        sampleRateHertz: config.sampleRateHertz,
        languageCode: config.languageCode,
        enableAutomaticPunctuation: config.enableAutomaticPunctuation,
        model: config.model,
        useEnhanced: config.useEnhanced
      });

      const request: RecognizeRequest = {
        audio: {
          content: audioBuffer.toString('base64'),
        },
        config: {
          encoding: 'OGG_OPUS' as const,
          sampleRateHertz: 48000,
          languageCode: config.languageCode,
          enableAutomaticPunctuation: config.enableAutomaticPunctuation,
          model: config.model,
          useEnhanced: config.useEnhanced,
          audioChannelCount: 1,
          enableWordTimeOffsets: true
        },
      };

      debugLog.transcription('Sending request to Google Speech API');
      const [response] = await this.speechClient.recognize(request);
      debugLog.transcription('Received response from Google Speech API', { 
        response: JSON.stringify(response, null, 2) 
      });

      const transcript = (response as unknown as SpeechRecognitionResponse).results
        ?.map((result) => result.alternatives?.[0]?.transcript)
        .join(' ');

      if (!transcript) {
        debugLog.error('No transcription results found in response', 'Transcription Error');
        debugLog.transcription('Full API response:', { 
          response: JSON.stringify(response, null, 2) 
        });
        throw new Error('No transcription results found');
      }

      debugLog.transcription('Transcription successful', { transcript });
      return transcript;
    } catch (error) {
      debugLog.error(error, 'Error in transcribeSpeech');
      throw error;
    }
  }

  async synthesizeSpeech(text: string, cacheKey?: string): Promise<ArrayBuffer> {
    try {
      const key = cacheKey || text;
      if (this.cache.has(key)) {
        return this.cache.get(key)!;
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

      const [synthesisResponse] = await this.ttsClient.synthesizeSpeech(
        request
      ) as unknown as [SynthesizeSpeechResponse];
      
      if (!synthesisResponse.audioContent) {
        throw new Error('No audio content received from Text-to-Speech API');
      }

      const audioContent = Buffer.from(synthesisResponse.audioContent as Uint8Array);
      const arrayBuffer = audioContent.buffer.slice(
        audioContent.byteOffset,
        audioContent.byteOffset + audioContent.byteLength
      );

      this.cache.set(key, arrayBuffer);
      return arrayBuffer;

    } catch (error) {
      console.error('Speech synthesis failed:', error);
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
  }
}