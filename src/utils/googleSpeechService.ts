import { SpeechClient } from '@google-cloud/speech';
import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';
type SynthesizeSpeechRequest = protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest;
type SynthesizeSpeechResponse = protos.google.cloud.texttospeech.v1.ISynthesizeSpeechResponse;

export class GoogleSpeechService {
  private speechClient: SpeechClient;
  private ttsClient: TextToSpeechClient;
  private cache: Map<string, ArrayBuffer>;

  constructor() {
    const credentials = {
      projectId: process.env.NEXT_PUBLIC_GOOGLE_PROJECT_ID,
      credentials: {
        client_email: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_EMAIL,
        private_key: process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
    };

    this.speechClient = new SpeechClient(credentials);
    this.ttsClient = new TextToSpeechClient(credentials);
    this.cache = new Map();
  }

  async transcribeSpeech(audioBuffer: ArrayBuffer): Promise<string> {
    try {
      const audio = {
        content: Buffer.from(audioBuffer).toString('base64'),
      };
      
      const config = {
        encoding: 'WEBM_OPUS',
        sampleRateHertz: 16000,
        languageCode: 'da-DK',
        model: 'latest_long',
      } as const;

      const [response] = await this.speechClient.recognize({
        audio,
        config,
      });

      return response.results
        ?.map(result => result.alternatives?.[0]?.transcript)
        .join(' ') || '';
    } catch (error) {
      console.error('Transcription failed:', error);
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