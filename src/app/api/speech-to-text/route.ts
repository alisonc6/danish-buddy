import { NextRequest, NextResponse } from 'next/server';
import { validateEnv } from '@/lib/env';
import { GoogleSpeechService } from '@/lib/googleSpeechService';
import type { SpeechConfig } from '@/types';

export async function POST(req: NextRequest) {
  try {
    validateEnv();
    const speechService = new GoogleSpeechService();
    // Read the audio blob from the request body
    const arrayBuffer = await req.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    // Use default config for Danish
    const config: SpeechConfig = {
      encoding: 'WEBM_OPUS',
      languageCode: 'da-DK',
      enableAutomaticPunctuation: true,
      model: 'default',
      useEnhanced: true,
      alternativeLanguageCodes: ['en-US'],
    };
    const text = await speechService.transcribeSpeech(audioBuffer, config);
    return NextResponse.json({ text });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 