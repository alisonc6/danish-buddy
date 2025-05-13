import { NextResponse } from 'next/server';
import { debugLog } from '@/utils/debug';
import { validateEnv } from '@/utils/validateEnv';
import { GoogleSpeechService } from '@/utils/googleSpeechService';
import { z } from 'zod';
import { SpeechConfig } from '@/types';

// Input validation schema
const transcriptionRequestSchema = z.object({
  audio: z.instanceof(Buffer).or(z.instanceof(Uint8Array)),
  config: z.object({
    encoding: z.enum([
      'ENCODING_UNSPECIFIED',
      'LINEAR16',
      'FLAC',
      'MULAW',
      'AMR',
      'AMR_WB',
      'OGG_OPUS',
      'SPEEX_WITH_HEADER_BYTE',
      'WEBM_OPUS'
    ] as const),
    languageCode: z.string(),
    enableAutomaticPunctuation: z.boolean().optional(),
    model: z.string().optional(),
    useEnhanced: z.boolean().optional(),
    alternativeLanguageCodes: z.array(z.string()).optional()
  })
});

export async function POST(request: Request) {
  try {
    // Validate environment variables
    validateEnv();
    const speechService = new GoogleSpeechService();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = transcriptionRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      debugLog.error(validationResult.error, 'Invalid transcription request');
      return NextResponse.json(
        { error: 'Invalid request: ' + validationResult.error.message },
        { status: 400 }
      );
    }

    const { audio, config } = validationResult.data;

    // Log the incoming request
    debugLog.transcription('Received transcription request', { 
      audioSize: audio.length,
      config 
    });

    // Validate audio data
    if (!audio || audio.length === 0) {
      debugLog.error('Empty audio data', 'Transcription Request');
      return NextResponse.json(
        { error: 'No audio data provided' },
        { status: 400 }
      );
    }

    // Convert audio to Buffer if it's a Uint8Array
    const audioBuffer = Buffer.isBuffer(audio) ? audio : Buffer.from(audio);

    // Perform transcription
    const text = await speechService.transcribeSpeech(audioBuffer, config as SpeechConfig);

    // Validate transcription result
    if (!text || text.trim().length === 0) {
      debugLog.error('Empty transcription result', 'Transcription Request');
      return NextResponse.json(
        { error: 'No speech detected in audio' },
        { status: 400 }
      );
    }

    // Log the successful response
    debugLog.transcription('Sending transcription response', { text });

    return NextResponse.json({ text });

  } catch (error) {
    // Log the error with detailed information
    debugLog.error(error, 'Transcription API Error');
    
    // Return appropriate error response
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error: ' + error.message },
        { status: 400 }
      );
    }

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