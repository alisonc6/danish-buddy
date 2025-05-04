import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';
import { validateEnv } from './validateEnv';
import { SpeechConfig, SpeechRecognitionResponse } from '../types';

type SynthesizeSpeechRequest = protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest;
type SynthesizeSpeechResponse = protos.google.cloud.texttospeech.v1.ISynthesizeSpeechResponse;

export class GoogleSpeechService {
  private speechClient: SpeechClient;
  private ttsClient: TextToSpeechClient;
  private cache: Map<string, ArrayBuffer>;

  constructor() {
    // Validate environment variables first
    validateEnv();

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

    try {
      this.speechClient = new SpeechClient(credentials);
      this.ttsClient = new TextToSpeechClient(credentials);
      this.cache = new Map();
    } catch (error) {
      console.error('Failed to initialize Google Cloud clients:', error);
      throw new Error('Failed to initialize Google Cloud services');
    }
  }

  async transcribeSpeech(audioBuffer: Buffer, config: SpeechConfig): Promise<string> {
    try {
      const request = {
        audio: {
          content: audioBuffer.toString('base64'),
        },
        config: {
          encoding: config.encoding,
          sampleRateHertz: config.sampleRateHertz,
          languageCode: config.languageCode,
          enableAutomaticPunctuation: config.enableAutomaticPunctuation,
          model: config.model,
          useEnhanced: config.useEnhanced,
        },
      };

      const response = await this.speechClient.recognize(request);
      const transcript = response[0].results
        ?.map((result) => result.alternatives?.[0]?.transcript)
        .join(' ');

      if (!transcript) {
        throw new Error('No transcription results found');
      }

      return transcript;
    } catch (error) {
      console.error('Error transcribing speech:', error);
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