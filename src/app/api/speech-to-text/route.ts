import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpeechService } from '@/utils/googleSpeechService';
import { SpeechConfig } from '@/types';
import { validateEnv } from '@/utils/validateEnv';
import debugLog from '@/utils/debug';

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

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    debugLog.transcription('Audio converted to buffer', { 
      bufferSize: audioBuffer.length 
    });
    
    const config: SpeechConfig = {
      encoding: 'LINEAR16',
      sampleRateHertz: 48000,
      languageCode: 'da-DK',
      enableAutomaticPunctuation: true,
      model: 'latest_long',
      useEnhanced: true
    };

    debugLog.transcription('Starting transcription with config:', { 
      encoding: config.encoding,
      sampleRateHertz: config.sampleRateHertz,
      languageCode: config.languageCode,
      enableAutomaticPunctuation: config.enableAutomaticPunctuation,
      model: config.model,
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
    return NextResponse.json({ transcript });
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