import { NextResponse } from 'next/server';
import { GoogleSpeechService } from '../../../utils/googleSpeechService';

const speechService = new GoogleSpeechService();

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      console.error('No audio file provided in request');
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('Audio file received:', {
      type: audioFile.type,
      size: audioFile.size
    });

    const arrayBuffer = await audioFile.arrayBuffer();
    console.log('Audio buffer size:', arrayBuffer.byteLength);

    try {
      const text = await speechService.transcribeSpeech(arrayBuffer);
      console.log('Transcription successful:', text);
      return NextResponse.json({ text });
    } catch (transcriptionError) {
      console.error('Transcription error:', transcriptionError);
      return NextResponse.json(
        { error: 'Error transcribing audio', details: transcriptionError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Speech-to-text error:', error);
    return NextResponse.json(
      { error: 'Error processing audio request', details: error.message },
      { status: 500 }
    );
  }
} 