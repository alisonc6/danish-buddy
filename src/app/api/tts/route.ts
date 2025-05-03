import { NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { handleApiError } from '../../../utils/errors';
import { validateEnv } from '../../../utils/validateEnv';
import { z } from 'zod';
import { TTSResponse } from '../../../types';

// Input validation schema
const ttsInputSchema = z.object({
  text: z.string().min(1).max(5000),
  languageCode: z.string().default('da-DK'),
});

// Validate environment variables
validateEnv();

const ttsClient = new TextToSpeechClient();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate input
    const validatedInput = ttsInputSchema.parse(body);
    const { text, languageCode } = validatedInput;

    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: { languageCode },
      audioConfig: { audioEncoding: 'MP3' },
    });

    if (!response.audioContent) {
      throw new Error('No audio content received from TTS service');
    }

    const ttsResponse: TTSResponse = {
      audioContent: response.audioContent
    };

    return new NextResponse(response.audioContent, {
      headers: {
        'Content-Type': 'audio/mp3',
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }
    return handleApiError(error);
  }
} 