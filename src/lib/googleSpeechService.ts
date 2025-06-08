import { SpeechConfig } from '@/types';
import { validateEnv } from './env';
import { TextToSpeechClient, protos as ttsProtos } from '@google-cloud/text-to-speech';
import { SpeechClient, protos as speechProtos } from '@google-cloud/speech';

export class GoogleSpeechService {
  private ttsClient: TextToSpeechClient;
  private sttClient: SpeechClient;

  constructor() {
    const env = validateEnv();
    const credentials = {
      projectId: env.GOOGLE_PROJECT_ID,
      credentials: {
        client_email: env.GOOGLE_CLIENT_EMAIL,
        private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    };
    this.ttsClient = new TextToSpeechClient(credentials);
    this.sttClient = new SpeechClient(credentials);
  }

  async transcribeSpeech(audioBuffer: Buffer, config: SpeechConfig): Promise<string> {
    const audio = {
      content: audioBuffer.toString('base64'),
    };
    const recognitionConfig: speechProtos.google.cloud.speech.v1.IRecognitionConfig = {
      encoding: speechProtos.google.cloud.speech.v1.RecognitionConfig.AudioEncoding.WEBM_OPUS,
      sampleRateHertz: 48000,
      languageCode: config.languageCode || 'da-DK',
      enableAutomaticPunctuation: true,
      model: 'default',
      useEnhanced: true,
      alternativeLanguageCodes: ['en-US'],
    };
    const request: speechProtos.google.cloud.speech.v1.IRecognizeRequest = {
      audio,
      config: recognitionConfig,
    };
    const [response] = await this.sttClient.recognize(request);
    if (!response.results || response.results.length === 0) {
      throw new Error('No transcription results found in response');
    }
    return response.results.map(r => r.alternatives?.[0]?.transcript || '').join(' ').trim();
  }

  async synthesizeSpeech(text: string, languageCode = 'da-DK'): Promise<Buffer> {
    const request = {
      input: { text },
      voice: {
        languageCode,
        ssmlGender: ttsProtos.google.cloud.texttospeech.v1.SsmlVoiceGender.FEMALE,
      },
      audioConfig: {
        audioEncoding: ttsProtos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
        speakingRate: 1.0,
      },
    };
    console.log('[TTS] synthesizeSpeech request:', JSON.stringify(request));
    const [response] = await this.ttsClient.synthesizeSpeech(request);
    if (!response.audioContent) {
      throw new Error('No audio content received from TTS');
    }
    return Buffer.from(response.audioContent as Uint8Array);
  }
} 