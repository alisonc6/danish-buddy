import { NextResponse } from 'next/server';
import { GoogleSpeechService } from '../../../utils/googleSpeechService';
import { z } from 'zod';

// Only allow MP3 or LINEAR16 output to avoid unsupported codec errors on Vercel
const ALLOWED_FORMATS = ['mp3', 'linear16'];

// Input validation schema with better error messages
const ttsInputSchema = z.object({
  text: z.string()
    .min(1, 'Text cannot be empty')
    .max(5000, 'Text is too long (maximum 5000 characters)')
    .refine(text => text.trim().length > 0, 'Text cannot be just whitespace'),
  format: z.string().optional()
});

const speechService = new GoogleSpeechService();

export async function POST(req: Request) {
  try {
    console.log('TTS request received');
    const body = await req.json();
    console.log('Request body:', body);
    const { format = 'mp3' } = body;
    if (!ALLOWED_FORMATS.includes(format.toLowerCase())) {
      console.error('Unsupported format requested:', format);
      return NextResponse.json({ error: 'Only mp3 or linear16 formats are supported.' }, { status: 400 });
    }
    // Validate input with detailed error messages
    try {
      const validatedInput = ttsInputSchema.parse(body);
      const { text } = validatedInput;
      console.log('Validated text:', text);
      // Synthesize speech
      console.log('Starting speech synthesis with format:', format);
      const audioContent = await speechService.synthesizeSpeech(text, undefined, format);
      console.log('Speech synthesis completed, audio size:', audioContent.byteLength, 'bytes');
      // Return the audio content
      return new NextResponse(audioContent, {
        headers: {
          'Content-Type': format === 'linear16' ? 'audio/wav' : 'audio/mp3',
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