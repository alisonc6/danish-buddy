import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpeechService } from '@/lib/googleSpeechService';
import { validateEnv } from '@/lib/env';

export async function POST(req: NextRequest) {
  try {
    validateEnv();
    // TODO: Parse audio from request and transcribe
    return NextResponse.json({ text: 'Transcribed text' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 