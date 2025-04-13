import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { audio } = await req.json();
    
    // Convert base64 to buffer
    const buffer = Buffer.from(audio.split(',')[1], 'base64');
    
    const transcription = await openai.audio.transcriptions.create({
      file: buffer,
      model: "whisper-1",
      language: "da",
    });

    return NextResponse.json({ text: transcription.text });
  } catch (error) {
    console.error('Transcription Error:', error);
    return NextResponse.json(
      { error: 'Error transcribing audio' },
      { status: 500 }
    );
  }
} 