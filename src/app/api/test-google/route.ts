import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';
import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    // Path to the credentials file
    const credentialsPath = path.join(process.cwd(), 'danish-buddy-tts-4bf73d2c32fa.json');
    
    // Check if the file exists
    if (!fs.existsSync(credentialsPath)) {
      return NextResponse.json({
        success: false,
        error: 'Credentials file not found',
        path: credentialsPath
      }, { status: 500 });
    }

    // Read and parse the credentials file
    const rawCredentials = fs.readFileSync(credentialsPath, 'utf8');
    console.log('Raw credentials length:', rawCredentials.length);
    
    const credentials = JSON.parse(rawCredentials);
    console.log('Parsed credentials keys:', Object.keys(credentials));

    if (!credentials.client_email || !credentials.private_key) {
      return NextResponse.json({
        success: false,
        error: 'Invalid credentials format',
        available_fields: Object.keys(credentials)
      }, { status: 500 });
    }

    // Create a simple test request
    const request: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
      input: { text: 'Hej' },
      voice: { languageCode: 'da-DK', ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    // Initialize client with explicit credentials
    const client = new TextToSpeechClient({
      credentials: credentials,
      projectId: credentials.project_id
    });

    // Try to synthesize speech
    const [response] = await client.synthesizeSpeech(request);

    return NextResponse.json({
      success: true,
      message: 'Successfully connected to Google Cloud services',
      audioContent: response.audioContent ? 'Audio content received' : 'No audio content'
    });
  } catch (error) {
    console.error('Error testing Google Cloud services:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined,
      type: error instanceof Error ? error.constructor.name : typeof error
    }, { status: 500 });
  }
}