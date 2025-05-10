import { NextResponse } from 'next/server';
import { GoogleSpeechService } from '../../../utils/googleSpeechService';
import { z } from 'zod';

// Input validation schema with better error messages
const ttsInputSchema = z.object({
  text: z.string()
    .min(1, 'Text cannot be empty')
    .max(5000, 'Text is too long (maximum 5000 characters)')
    .refine(text => text.trim().length > 0, 'Text cannot be just whitespace')
});

const speechService = new GoogleSpeechService();

export async function POST(req: Request) {
  try {
    console.log('TTS request received');
    const body = await req.json();
    console.log('Request body:', body);
    
    // Validate input with detailed error messages
    try {
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
    console.error('TTS Error:', error);
    return NextResponse.json(
      { error: 'Error synthesizing speech' },
      { status: 500 }
    );
  }
} 