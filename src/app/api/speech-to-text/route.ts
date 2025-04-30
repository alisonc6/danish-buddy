import { NextRequest, NextResponse } from 'next/server';
import { SpeechClient } from '@google-cloud/speech';
import * as fs from 'fs';
import * as path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Initialize Speech client
    const credentials = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'danish-buddy-tts-4bf73d2c32fa.json'), 'utf8')
    );
    const client = new SpeechClient({ credentials });

    // Convert audio to base64
    const audioBytes = await audioFile.arrayBuffer();
    const audioContent = Buffer.from(audioBytes).toString('base64');

    // Perform speech recognition
    const [response] = await client.recognize({
      audio: {
        content: audioContent,
      },
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 16000,
        languageCode: 'da-DK',
        enableAutomaticPunctuation: true,
      },
    });

    const transcription = response.results
      ?.map(result => result.alternatives?.[0]?.transcript)
      .join('\n');

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('Error processing speech:', error);
    return NextResponse.json(
      { error: 'Failed to process speech' },
      { status: 500 }
    );
  }
} 