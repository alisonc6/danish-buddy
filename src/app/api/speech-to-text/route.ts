import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpeechService } from '@/utils/googleSpeechService';
import { validateEnv } from '@/utils/validateEnv';
import debugLog from '@/utils/debug';

export async function POST(request: NextRequest) {
  try {
    debugLog.transcription('Received speech-to-text request');
    
    // Validate environment variables
    validateEnv();
    const speechService = new GoogleSpeechService();

    // Parse FormData
    const formData = await request.formData();
    debugLog.transcription('FormData received', {
      hasAudio: formData.has('audio'),
      hasConfig: formData.has('config'),
      formDataKeys: Array.from(formData.keys())
    });
    
    const audioFile = formData.get('audio') as File;
    const configStr = formData.get('config') as string;
    
    debugLog.transcription('Parsed FormData', {
      audioFileSize: audioFile?.size,
      configStrLength: configStr?.length,
      configStr: configStr,
      configStrType: typeof configStr
    });

    if (!audioFile) {
      debugLog.error('Missing audio file', 'Validation Error');
      return NextResponse.json(
        { error: 'Missing audio file' },
        { status: 400 }
      );
    }

    if (!configStr || configStr.trim() === '') {
      debugLog.error('Missing or empty config data', 'Validation Error');
      return NextResponse.json(
        { error: 'Missing config data' },
        { status: 400 }
      );
    }

    // Parse config
    let config;
    try {
      config = JSON.parse(configStr.trim());
      debugLog.transcription('Parsed config', { 
        config,
        configType: typeof config,
        configKeys: Object.keys(config)
      });
    } catch (error) {
      debugLog.error('Invalid config format', 'Validation Error');
      return NextResponse.json(
        { error: 'Invalid config format' },
        { status: 400 }
      );
    }

    // Convert audio file to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);

    // Log the incoming request
    debugLog.transcription('Received transcription request', {
      audioSize: audioBuffer.length,
      config
    });

    // Validate audio data
    if (audioBuffer.length === 0) {
      debugLog.error('Empty audio data', 'Validation Error');
      return NextResponse.json(
        { error: 'Empty audio data' },
        { status: 400 }
      );
    }

    // Perform transcription
    const text = await speechService.transcribeSpeech(audioBuffer, config);

    // Log the transcription result
    debugLog.transcription('Transcription result', { text });

    // Validate transcription result
    if (!text || text.trim().length === 0) {
      debugLog.error('Empty transcription result', 'Transcription Error');
      return NextResponse.json(
        { error: 'No speech detected' },
        { status: 400 }
      );
    }

    // Clean and validate the text
    const cleanedText = text.trim();
    if (cleanedText.length === 0) {
      debugLog.error('Empty text after cleaning', 'Transcription Error');
      return NextResponse.json(
        { error: 'No valid speech detected' },
        { status: 400 }
      );
    }

    // Log the successful response
    debugLog.transcription('Sending transcription response', { text: cleanedText });

    return NextResponse.json({
      text: cleanedText,
      confidence: 1.0
    });
  } catch (error) {
    // Log the error
    debugLog.error(error, 'Speech-to-text API Error');
    
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