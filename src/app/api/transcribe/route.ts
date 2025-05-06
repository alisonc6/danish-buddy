import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';
import { TranscriptionResponse } from '../../../types';

// Input validation schema
const transcribeInputSchema = z.object({
  audio: z.string().min(1),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedInput = transcribeInputSchema.parse(body);
    const { audio } = validatedInput;
    
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
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Transcription Error:', error);
    return NextResponse.json(
      { error: 'Error transcribing audio' },
      { status: 500 }
    );
  }
} 