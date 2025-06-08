import { NextRequest, NextResponse } from 'next/server';
import { validateEnv } from '@/lib/env';
import { GoogleSpeechService } from '@/lib/googleSpeechService';
import type { SpeechConfig } from '@/types';

export async function POST(req: NextRequest) {
  try {
    validateEnv();
    const speechService = new GoogleSpeechService();

    // Get the content type from the request headers
    const contentType = req.headers.get('content-type') || '';
    console.log('[Speech-to-Text] Content-Type:', contentType);
    
    // Handle different content types
    let audioBuffer: Buffer;
    if (contentType.includes('audio/webm')) {
      // For direct audio blob
      const arrayBuffer = await req.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes('multipart/form-data')) {
      // For form data
      const formData = await req.formData();
      const audioFile = formData.get('audio') as File;
      if (!audioFile) {
        return NextResponse.json(
          { error: 'No audio file found in request' },
          { status: 400 }
        );
      }
      const arrayBuffer = await audioFile.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 400 }
      );
    }

    console.log('[Speech-to-Text] Audio buffer length:', audioBuffer.length);

    // Use optimized config for Danish
    const config: SpeechConfig = {
      encoding: 'WEBM_OPUS',
      languageCode: 'da-DK',
      enableAutomaticPunctuation: true,
      model: 'default',
      useEnhanced: true,
      alternativeLanguageCodes: ['en-US'],
      sampleRateHertz: 16000,
      audioChannelCount: 1,
      enableSpokenPunctuation: true,
      enableSpokenEmojis: false,
      enableWordTimeOffsets: true,
    };

    console.log('[Speech-to-Text] SpeechConfig:', JSON.stringify(config));

    const text = await speechService.transcribeSpeech(audioBuffer, config);
    return NextResponse.json({ text });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 