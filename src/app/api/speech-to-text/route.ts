import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpeechService } from '@/utils/googleSpeechService';
import { validateEnv } from '@/utils/validateEnv';
import debugLog from '@/utils/debug';
import { SpeechConfig, SpeechEncoding } from '@/types';

export async function POST(request: NextRequest) {
  try {
    debugLog.transcription('Received speech-to-text request');
    
    // Validate environment variables
    validateEnv();
    const speechService = new GoogleSpeechService();

    // Get the form data
    const formData = await request.formData();
    const audioData = formData.get('audio') as Blob | null;
    const configData = formData.get('config') as Blob | null;
    
    // Validate audio data
    if (!audioData || !(audioData as unknown instanceof Blob)) {
      console.error('Audio data validation failed:', {
        hasAudio: !!audioData,
        isBlob: audioData as unknown instanceof Blob,
        type: audioData ? typeof audioData : 'null'
      });
      debugLog.error('Missing or invalid audio data', 'Validation Error');
      return NextResponse.json(
        { error: 'Missing or invalid audio data' },
        { status: 400 }
      );
    }

    // Parse config if provided
    const defaultConfig: SpeechConfig = {
      encoding: 'WEBM_OPUS' as SpeechEncoding,
      languageCode: 'da-DK',
      sampleRateHertz: 48000,
      enableAutomaticPunctuation: true,
      useEnhanced: true,
      enableWordTimeOffsets: true,
      enableSpokenPunctuation: true
    };

    let config: SpeechConfig = defaultConfig;

    if (configData) {
      try {
        const configText = await configData.text();
        const parsedConfig = JSON.parse(configText);
        // Ensure the encoding is a valid SpeechEncoding
        if (parsedConfig.encoding && typeof parsedConfig.encoding === 'string') {
          parsedConfig.encoding = parsedConfig.encoding as SpeechEncoding;
        }
        // Merge with default config, ensuring all required fields are present
        config = {
          ...defaultConfig,
          ...parsedConfig,
          encoding: parsedConfig.encoding || defaultConfig.encoding,
          languageCode: parsedConfig.languageCode || defaultConfig.languageCode,
          sampleRateHertz: parsedConfig.sampleRateHertz || defaultConfig.sampleRateHertz,
          enableAutomaticPunctuation: parsedConfig.enableAutomaticPunctuation ?? defaultConfig.enableAutomaticPunctuation,
          useEnhanced: parsedConfig.useEnhanced ?? defaultConfig.useEnhanced,
          enableWordTimeOffsets: parsedConfig.enableWordTimeOffsets ?? defaultConfig.enableWordTimeOffsets,
          enableSpokenPunctuation: parsedConfig.enableSpokenPunctuation ?? defaultConfig.enableSpokenPunctuation
        };
      } catch (error) {
        console.error('Error parsing config:', error);
        debugLog.error(error, 'Failed to parse config');
      }
    }

    debugLog.transcription('Using config:', config);

    // Convert audio to base64
    const arrayBuffer = await audioData.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    debugLog.transcription('Audio converted to buffer');

    // Initialize speech service and transcribe
    const transcription = await speechService.transcribeSpeech(audioBuffer, config);
    
    debugLog.transcription('Transcription completed');

    return NextResponse.json({ text: transcription });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    debugLog.error(error, 'Speech-to-text processing failed');
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process speech-to-text' },
      { status: 500 }
    );
  }
} 