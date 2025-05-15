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
      formDataKeys: Array.from(formData.keys()),
      formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
        key,
        valueType: typeof value,
        value: value instanceof Blob ? `Blob(${value.size} bytes)` : value
      }))
    });
    
    const audioBlob = formData.get('audio');
    const configBlob = formData.get('config') as Blob;
    
    debugLog.transcription('Parsed FormData', {
      audioBlobSize: audioBlob instanceof Blob ? audioBlob.size : 'not a blob',
      configBlobSize: configBlob instanceof Blob ? configBlob.size : 'not a blob',
      configBlobType: configBlob instanceof Blob ? configBlob.type : typeof configBlob
    });

    if (!audioBlob || !(audioBlob instanceof Blob)) {
      debugLog.error('Missing or invalid audio data', 'Validation Error');
      return NextResponse.json(
        { error: 'Missing or invalid audio data' },
        { status: 400 }
      );
    }

    if (!configBlob || !(configBlob instanceof Blob)) {
      debugLog.error('Missing or invalid config data', 'Validation Error');
      return NextResponse.json(
        { error: 'Missing config data' },
        { status: 400 }
      );
    }

    // Parse config
    let config;
    try {
      const configStr = await configBlob.text();
      config = JSON.parse(configStr.trim());
      debugLog.transcription('Parsed config', { 
        config,
        configType: typeof config,
        configKeys: Object.keys(config)
      });

      // Validate required config fields
      if (!config.encoding || !config.languageCode) {
        debugLog.error('Missing required config fields', 'Validation Error');
        return NextResponse.json(
          { error: 'Missing required config fields' },
          { status: 400 }
        );
      }
    } catch (error) {
      debugLog.error('Invalid config format', 'Validation Error');
      return NextResponse.json(
        { error: 'Invalid config format' },
        { status: 400 }
      );
    }

    // Convert audio blob to Buffer
    const arrayBuffer = await audioBlob.arrayBuffer();
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