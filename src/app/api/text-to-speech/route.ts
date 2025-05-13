import { NextResponse } from 'next/server';
import { debugLog } from '@/utils/debug';
import { validateEnv } from '@/utils/validateEnv';
import { GoogleSpeechService } from '@/utils/googleSpeechService';
import { z } from 'zod';

// Input validation schema
const ttsRequestSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty'),
  cacheKey: z.string().optional()
});

export async function POST(request: Request) {
  try {
    // Validate environment variables
    validateEnv();
    const speechService = new GoogleSpeechService();

    // Parse and validate request body
    const body = await request.json();
    const validationResult = ttsRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      debugLog.error(validationResult.error, 'Invalid text-to-speech request');
      return NextResponse.json(
        { error: 'Invalid request: ' + validationResult.error.message },
        { status: 400 }
      );
    }

    const { text, cacheKey } = validationResult.data;

    // Log the incoming request
    debugLog.speech('Received text-to-speech request', { 
      textLength: text.length,
      cacheKey 
    });

    // Validate text
    if (!text || text.trim().length === 0) {
      debugLog.error('Empty text', 'Text-to-Speech Request');
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Perform text-to-speech conversion
    const audioBuffer = await speechService.synthesizeSpeech(text, cacheKey);

    // Validate audio result
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      debugLog.error('Empty audio result', 'Text-to-Speech Request');
      return NextResponse.json(
        { error: 'No audio generated' },
        { status: 500 }
      );
    }

    // Log the successful response
    debugLog.speech('Sending text-to-speech response', { 
      audioSize: audioBuffer.byteLength 
    });

    // Convert ArrayBuffer to Base64
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return NextResponse.json({ 
      audioContent: base64Audio,
      format: 'audio/mp3'
    });

  } catch (error) {
    // Log the error with detailed information
    debugLog.error(error, 'Text-to-Speech API Error');
    
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