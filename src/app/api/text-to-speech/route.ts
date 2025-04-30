import { NextRequest, NextResponse } from 'next/server';
import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'No text provided' },
        { status: 400 }
      );
    }

    // Initialize Text-to-Speech client
    const credentials = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'danish-buddy-tts-4bf73d2c32fa.json'), 'utf8')
    );
    const client = new TextToSpeechClient({ credentials });

    // Perform text-to-speech conversion
    const [response] = await client.synthesizeSpeech({
      input: { text },
      voice: { languageCode: 'da-DK', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    });

    if (!response.audioContent) {
      return NextResponse.json(
        { error: 'No audio content generated' },
        { status: 500 }
      );
    }

    // Return the audio content as base64
    const audioContent = typeof response.audioContent === 'string'
      ? response.audioContent
      : Buffer.from(response.audioContent).toString('base64');

    return NextResponse.json({ audioContent });
  } catch (error) {
    console.error('Error processing text-to-speech:', error);
    return NextResponse.json(
      { error: 'Failed to process text-to-speech' },
      { status: 500 }
    );
  }
} 