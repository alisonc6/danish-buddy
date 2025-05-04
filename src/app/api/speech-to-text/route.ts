import { NextResponse } from 'next/server';
import { GoogleSpeechService } from '../../../utils/googleSpeechService';

const speechService = new GoogleSpeechService();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const text = await speechService.transcribeSpeech(arrayBuffer);
    
    return NextResponse.json({ text });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json(
      { error: 'Error transcribing audio' },
      { status: 500 }
    );
  }
} 