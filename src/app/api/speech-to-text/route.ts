import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpeechService } from '@/utils/googleSpeechService';
import { validateEnv } from '@/utils/validateEnv';
import debugLog from '@/utils/debug';

export async function POST(request: NextRequest) {
  try {
    debugLog.transcription('Received speech-to-text request');
    
    // Validate environment variables
    validateEnv();
    const speechService = new GoogleSpeechService();

    // Get the form data
    const formData = await request.formData();
    const audioData = formData.get('audio') as Blob | null;
    
    // Validate audio data
    if (!audioData || !(audioData as unknown instanceof Blob)) {
      console.error('Audio data validation failed:', {
        hasAudio: !!audioData,
        isBlob: audioData as unknown instanceof Blob,
        type: audioData ? typeof audioData : 'null'
      });
      debugLog.error('Missing or invalid audio data', 'Validation Error');
      return NextResponse.json(
        { error: 'Missing or invalid audio data' },
        { status: 400 }
      );
    }

    // Get the audio format from the request
    const audioFormat = formData.get('format') as string || 'audio/webm';
    debugLog.transcription(`Processing audio with format: ${audioFormat}`);

    // Convert audio to base64
    const arrayBuffer = await audioData.arrayBuffer();
    const audioBuffer = Buffer.from(arrayBuffer);
    debugLog.transcription('Audio converted to buffer');

    // Initialize speech service and transcribe
    const transcription = await speechService.transcribeSpeech(audioBuffer, {
      encoding: audioFormat === 'audio/webm' ? 'WEBM_OPUS' : 'LINEAR16',
      languageCode: 'da-DK',
      enableAutomaticPunctuation: true,
      useEnhanced: true,
      enableWordTimeOffsets: true,
      enableSpokenPunctuation: true
    });
    
    debugLog.transcription('Transcription completed');

    return NextResponse.json({ transcription });
  } catch (error) {
    console.error('Speech-to-text error:', error);
    debugLog.error(error, 'Speech-to-text processing failed');
    return NextResponse.json(
      { error: 'Failed to process speech-to-text' },
      { status: 500 }
    );
  }
} 