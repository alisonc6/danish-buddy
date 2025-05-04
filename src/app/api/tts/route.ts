import { NextResponse } from 'next/server';
import { GoogleSpeechService } from '../../../utils/googleSpeechService';
import { z } from 'zod';

// Input validation schema
const ttsInputSchema = z.object({
  text: z.string().min(1),
});

const speechService = new GoogleSpeechService();

export async function POST(req: Request) {
  try {
    console.log('TTS request received');
    const body = await req.json();
    console.log('Request body:', body);
    
    // Validate input
    const validatedInput = ttsInputSchema.parse(body);
    const { text } = validatedInput;
    console.log('Validated text:', text);
    
    // Synthesize speech
    console.log('Starting speech synthesis...');
    const audioContent = await speechService.synthesizeSpeech(text);
    console.log('Speech synthesis completed, audio size:', audioContent.byteLength, 'bytes');
    
    // Return the audio content
    return new NextResponse(audioContent, {
      headers: {
        'Content-Type': 'audio/mp3',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('TTS Error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error synthesizing speech' },
      { status: 500 }
    );
  }
} 