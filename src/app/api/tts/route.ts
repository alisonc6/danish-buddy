import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/utils/errors';
import { validateEnv } from '@/utils/validateEnv';

// Validate environment variables
validateEnv();

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    
    if (!text) {
      return NextResponse.json({ 
        error: 'Text is required',
        code: 'MISSING_TEXT'
      }, { status: 400 });
    }

    const ttsClient = new TextToSpeechClient({
      projectId: process.env.GOOGLE_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    });

    const [response] = await ttsClient.synthesizeSpeech({
      input: { text },
      voice: {
        languageCode: 'da-DK',
        name: 'da-DK-Neural2-D',
      },
      audioConfig: {
        audioEncoding: 'MP3',
      },
    });

    if (!response.audioContent) {
      return NextResponse.json({ 
        error: 'No audio content received',
        code: 'NO_AUDIO_CONTENT'
      }, { status: 500 });
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
