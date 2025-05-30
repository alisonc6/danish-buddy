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
    
    // Log all FormData entries with more detail
    const formDataDetails = {
      hasAudio: formData.has('audio'),
      hasConfig: formData.has('config'),
      formDataKeys: Array.from(formData.keys()),
      formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
        key,
        valueType: typeof value,
        value: value instanceof Blob ? `Blob(${value.size} bytes)` : value,
        valueString: value instanceof Blob ? undefined : String(value)
      }))
    };
    console.log('FormData received:', formDataDetails);
    
    // Get audio data
    const audioData = formData.get('audio');
    if (!audioData || !(audioData instanceof Blob)) {
      console.error('Audio data validation failed:', {
        hasAudio: !!audioData,
        isBlob: audioData ? audioData instanceof Blob : false,
        type: audioData ? typeof audioData : 'null'
      });
      debugLog.error('Missing or invalid audio data', 'Validation Error');
      return NextResponse.json(
        { error: 'Missing or invalid audio data' },
        { status: 400 }
      );
    }

    // Get config data
    const configData = formData.get('config');
    console.log('Raw config data:', {
      configData,
      type: typeof configData,
      isNull: configData === null,
      isUndefined: configData === undefined,
      isBlob: configData instanceof Blob,
      blobType: configData instanceof Blob ? configData.type : 'not a blob',
      stringValue: configData ? String(configData) : 'null'
    });

    if (!configData) {
      console.error('Config data is missing:', {
        formDataKeys: Array.from(formData.keys()),
        formDataEntries: Array.from(formData.entries()).map(([key]) => key)
      });
      debugLog.error('Missing config data', 'Validation Error');
      return NextResponse.json(
        { error: 'Missing config data' },
        { status: 400 }
      );
    }

    // Handle config data
    let configStr: string;
    if (configData instanceof Blob) {
      try {
        // Verify content type
        if (configData.type !== 'application/json') {
          console.error('Invalid config content type:', configData.type);
          debugLog.error('Invalid config content type', 'Validation Error');
          return NextResponse.json(
            { error: 'Config must be application/json' },
            { status: 400 }
          );
        }
        configStr = await configData.text();
      } catch (error) {
        console.error('Error reading config Blob:', error);
        debugLog.error('Error reading config Blob', 'Validation Error');
        return NextResponse.json(
          { error: 'Error reading config data' },
          { status: 400 }
        );
      }
    } else if (typeof configData === 'string') {
      configStr = configData;
    } else {
      console.error('Config data is neither string nor Blob:', {
        type: typeof configData,
        value: String(configData)
      });
      debugLog.error('Invalid config data type', 'Validation Error');
      return NextResponse.json(
        { error: 'Config data must be a string or Blob' },
        { status: 400 }
      );
    }

    // Parse config
    let config;
    try {
      config = JSON.parse(configStr.trim());
      console.log('Parsed config:', {
        config,
        configType: typeof config,
        configKeys: Object.keys(config)
      });

      // Validate required config fields
      if (!config.encoding || !config.languageCode) {
        console.error('Missing required config fields:', {
          hasEncoding: !!config.encoding,
          hasLanguageCode: !!config.languageCode,
          config
        });
        debugLog.error('Missing required config fields', 'Validation Error');
        return NextResponse.json(
          { error: 'Missing required config fields' },
          { status: 400 }
        );
      }

      // Ensure Danish is the primary language
      if (config.languageCode !== 'da-DK') {
        config.languageCode = 'da-DK';
        debugLog.transcription('Forced Danish language code', { config });
      }
    } catch (error) {
      console.error('Config parsing error:', {
        error,
        configStr,
        configStrLength: configStr.length,
        configStrTrimmed: configStr.trim().length
      });
      debugLog.error('Invalid config format', 'Validation Error');
      return NextResponse.json(
        { error: 'Invalid config format' },
        { status: 400 }
      );
    }

    // Convert audio blob to Buffer
    const arrayBuffer = await audioData.arrayBuffer();
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