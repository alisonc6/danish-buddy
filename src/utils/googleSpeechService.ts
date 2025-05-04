import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';
import { validateEnv } from './validateEnv';

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

  async transcribeSpeech(audioBuffer: ArrayBuffer): Promise<string> {
    try {
      const audio = {
        content: Buffer.from(audioBuffer).toString('base64'),
      };
      
      // Try different configurations based on the audio format
      const configs = [
        {
          encoding: 'WEBM_OPUS',
          sampleRateHertz: 16000,
          languageCode: 'da-DK',
          model: 'latest_long',
        },
        {
          encoding: 'LINEAR16',
          sampleRateHertz: 16000,
          languageCode: 'da-DK',
          model: 'latest_long',
        },
        {
          encoding: 'MP3',
          sampleRateHertz: 16000,
          languageCode: 'da-DK',
          model: 'latest_long',
        }
      ];

      let lastError: Error | null = null;
      
      for (const config of configs) {
        try {
          console.log('Attempting transcription with config:', config);
          const response = await this.speechClient.recognize({
            audio,
            config,
          });

          const transcript = response[0].results
            ?.map(result => result.alternatives?.[0]?.transcript)
            .join(' ') || '';

          if (transcript) {
            console.log('Transcription successful with config:', config);
            return transcript;
          }
        } catch (error) {
          console.error(`Transcription failed with config ${config.encoding}:`, error);
          lastError = error as Error;
        }
      }

      throw lastError || new Error('All transcription attempts failed');
    } catch (error) {
      console.error('Transcription failed:', error);
      throw new Error(`Transcription failed: ${error.message}`);
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