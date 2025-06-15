import { SpeechConfig } from '@/types';
import { validateEnv } from './env';
import { TextToSpeechClient, protos as ttsProtos } from '@google-cloud/text-to-speech';
import { SpeechClient, protos as speechProtos } from '@google-cloud/speech';

export class GoogleSpeechService {
  private ttsClient: TextToSpeechClient;
  private sttClient: SpeechClient;

  constructor() {
    const env = validateEnv();
    
    // Format the private key properly for PEM format
    let privateKey = env.GOOGLE_PRIVATE_KEY;
    
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
      /-----BEGIN PRIVATE KEY-----(.*?)-----END PRIVATE KEY-----/s,
      (match, content) => {
        const cleanContent = content.trim().replace(/\n/g, '');
        return `-----BEGIN PRIVATE KEY-----\n${cleanContent}\n-----END PRIVATE KEY-----`;
      }
    );

    const credentials = {
      projectId: env.GOOGLE_PROJECT_ID,
      credentials: {
        client_email: env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
    };

    this.ttsClient = new TextToSpeechClient({
      ...credentials,
      fallback: true,
    });
    this.sttClient = new SpeechClient({
      ...credentials,
      fallback: true,
    });
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

  async synthesizeSpeech(text: string, languageCode = 'da-DK', format: string = 'mp3'): Promise<Buffer> {
    let audioEncoding;
    if (format.toLowerCase() === 'linear16') {
      audioEncoding = ttsProtos.google.cloud.texttospeech.v1.AudioEncoding.LINEAR16;
    } else {
      audioEncoding = ttsProtos.google.cloud.texttospeech.v1.AudioEncoding.MP3;
    }
    const request = {
      input: { text },
      voice: {
        languageCode,
        ssmlGender: ttsProtos.google.cloud.texttospeech.v1.SsmlVoiceGender.FEMALE,
      },
      audioConfig: {
        audioEncoding,
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