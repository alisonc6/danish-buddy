import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpeechService } from '@/utils/googleSpeechService';
import { SpeechConfig } from '@/types';
import { validateEnv } from '@/utils/validateEnv';
import debugLog from '@/utils/debug';

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    validateEnv();
    const speechService = new GoogleSpeechService();

    // Parse the FormData
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const configStr = formData.get('config') as string;
    
    if (!audioFile || !configStr) {
      return NextResponse.json(
        { error: 'Missing audio or config data' },
        { status: 400 }
      );
    }

    // Parse the config
    const config = JSON.parse(configStr) as SpeechConfig;
    
    // Convert File to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Log the incoming request
    debugLog.transcription('Received transcription request', { 
      audioSize: audioBuffer.length,
      config 
    });

    // Validate audio data
    if (!audioBuffer || audioBuffer.length === 0) {
      debugLog.error('Empty audio data', 'Transcription Request');
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }

    // Perform transcription with the configured settings
    const text = await speechService.transcribeSpeech(audioBuffer, config);

    // Log the raw transcription result
    debugLog.transcription('Raw transcription result', { text });

    // Validate transcription result
    if (!text || text.trim().length === 0) {
      debugLog.error('Empty transcription result', 'Transcription Request');
      return NextResponse.json(
        { error: 'No speech detected in audio' },
        { status: 400 }
      );
    }

    // Clean and validate the transcription text
    const cleanedText = text.trim();
    if (cleanedText.length === 0) {
      debugLog.error('Empty transcription after cleaning', JSON.stringify({ originalText: text }));
      return NextResponse.json(
        { error: 'No speech detected in audio' },
        { status: 400 }
      );
    }

    // Log the successful response
    debugLog.transcription('Sending transcription response', { text: cleanedText });

    // Return the response
    return NextResponse.json({ 
      text: cleanedText,
      confidence: 1.0
    });

  } catch (error) {
    // Log the error with detailed information
    debugLog.error(error, 'Transcription API Error');
    
    // Return appropriate error response
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 