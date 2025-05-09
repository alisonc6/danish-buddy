import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpeechService } from '@/utils/googleSpeechService';
import { SpeechConfig, SpeechEncoding } from '@/types';
import { validateEnv } from '@/utils/validateEnv';
import debugLog from '@/utils/debug';

function getSpeechConfig(audioType: string): SpeechConfig {
  // Default configuration
  const baseConfig: SpeechConfig = {
    encoding: 'WEBM_OPUS', // Default encoding
    languageCode: 'da-DK', // Default to Danish
    model: 'default',
    enableAutomaticPunctuation: true,
    useEnhanced: true,
    alternativeLanguageCodes: ['en-US'] // Add English as an alternative language
  };

  // Map MIME types to Google Speech encoding types
  const encodingMap: Record<string, SpeechEncoding> = {
    'audio/webm;codecs=opus': 'WEBM_OPUS',
    'audio/webm': 'WEBM_OPUS',
    'audio/wav': 'LINEAR16',
    'audio/x-wav': 'LINEAR16',
    'audio/flac': 'FLAC',
    'audio/ogg;codecs=opus': 'OGG_OPUS',
    'audio/ogg': 'OGG_OPUS'
  };

  // Get the encoding from the map, default to WEBM_OPUS if not found
  const encoding = encodingMap[audioType] || 'WEBM_OPUS';
  
  // Add encoding-specific configurations
  if (encoding === 'LINEAR16') {
    return {
      ...baseConfig,
      encoding,
      sampleRateHertz: 16000
    };
  }

  return {
    ...baseConfig,
    encoding
  };
}

export async function POST(request: NextRequest) {
  try {
    debugLog.transcription('Received speech-to-text request');
    
    // Validate environment variables first
    validateEnv();
    debugLog.transcription('Environment variables validated');

    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      debugLog.error('No audio file provided in request', 'Validation Error');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    debugLog.transcription('Audio file received', { 
      size: audioFile.size,
      type: audioFile.type 
    });

    // Validate audio file size
    if (audioFile.size < 1000) { // Less than 1KB
      debugLog.error('Audio file too small', 'Validation Error');
      return NextResponse.json(
        { error: 'Audio file too small' },
        { status: 400 }
      );
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    debugLog.transcription('Audio converted to buffer', { 
      bufferSize: audioBuffer.length,
      firstBytes: audioBuffer.slice(0, 4).toString('hex'),
      lastBytes: audioBuffer.slice(-4).toString('hex')
    });
    
    // Get appropriate configuration based on audio type
    const config = getSpeechConfig(audioFile.type);
    debugLog.transcription('Using speech config:', { 
      encoding: config.encoding,
      languageCode: config.languageCode,
      model: config.model,
      enableAutomaticPunctuation: config.enableAutomaticPunctuation,
      useEnhanced: config.useEnhanced
    });

    const speechService = new GoogleSpeechService();
    const transcript = await speechService.transcribeSpeech(audioBuffer, config);

    if (!transcript) {
      debugLog.error('No transcription results received', 'Transcription Error');
      return NextResponse.json(
        { error: 'No transcription results received' },
        { status: 500 }
      );
    }

    debugLog.transcription('Transcription successful', { transcript });
    return NextResponse.json({ text: transcript });
  } catch (error) {
    debugLog.error(error, 'Error processing speech');
    
    // Log the full error details
    if (error instanceof Error) {
      debugLog.error(`Error details: ${error.message}`, 'Speech Processing Error');
      debugLog.error(`Stack trace: ${error.stack}`, 'Speech Processing Error');
      
      return NextResponse.json(
        { 
          error: 'Failed to process speech',
          details: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        { status: 500 }
      );
    }

    debugLog.error('Unknown error occurred', 'Speech Processing Error');
    return NextResponse.json(
      { error: 'Failed to process speech' },
      { status: 500 }
    );
  }
} 