import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { TranscriptionResponse } from '../../../types';
import { validateRuntimeEnv } from '../../../utils/env';

// Input validation schema with better error messages
const transcribeInputSchema = z.object({
  audio: z.string()
    .min(1, 'Audio data cannot be empty')
    .refine(audio => audio.startsWith('data:audio/'), 'Invalid audio format')
    .refine(audio => audio.includes(';base64,'), 'Invalid base64 encoding')
});

// Initialize OpenAI client inside the POST handler to avoid build-time errors
let openai: OpenAI | null = null;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input with detailed error messages
    try {
      const validatedInput = transcribeInputSchema.parse(body);
      const { audio } = validatedInput;

      // Validate runtime environment and initialize OpenAI client
      validateRuntimeEnv();
      if (!openai) {
        openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
      }
      
      // Convert base64 to buffer
      const buffer = Buffer.from(audio.split(',')[1], 'base64');

      // Create a File object that matches OpenAI's Uploadable type
      const audioFile = new File([buffer], 'audio.webm', { 
        type: 'audio/webm',
        lastModified: Date.now()
      });

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "da",
      });

      const response: TranscriptionResponse = {
        text: transcription.text
      };

      return NextResponse.json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return NextResponse.json({
          error: 'Invalid input data',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Transcription Error:', error);
    return NextResponse.json(
      { error: 'Error transcribing audio', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 