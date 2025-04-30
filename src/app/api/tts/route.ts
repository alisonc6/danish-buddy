import { NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { handleApiError } from '../../../utils/errors';
import { validateEnv } from '../../../utils/validateEnv';

// Validate environment variables
validateEnv();

const ttsClient = new TextToSpeechClient();

export async function POST(req: Request) {
  try {
    const { text, languageCode = 'da-DK' } = await req.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Text is required' },
        { status: 400 }
      );
    }

    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: { languageCode },
      audioConfig: { audioEncoding: 'MP3' },
    });

    if (!response.audioContent) {
      throw new Error('No audio content received from TTS service');
    }

    return new NextResponse(response.audioContent, {
      headers: {
        'Content-Type': 'audio/mp3',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
} 