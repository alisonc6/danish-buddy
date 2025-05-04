import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpeechService } from '@/utils/googleSpeechService';
import { SpeechConfig } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    
    const config: SpeechConfig = {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 16000,
      languageCode: 'da-DK',
      enableAutomaticPunctuation: true,
      model: 'latest_long',
      useEnhanced: true
    };

    const speechService = new GoogleSpeechService();
    const transcript = await speechService.transcribeSpeech(audioBuffer, config);

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error('Error processing speech:', error);
    return NextResponse.json(
      { error: 'Failed to process speech' },
      { status: 500 }
    );
  }
} 