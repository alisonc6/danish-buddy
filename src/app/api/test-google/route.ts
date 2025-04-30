import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { validateEnv } from '../../../utils/validateEnv';

export async function GET() {
  try {
    // Validate environment variables first
    validateEnv();

    // Format the private key properly
    const privateKey = process.env.GOOGLE_PRIVATE_KEY!
      .replace(/\\n/g, '\n')
      .replace(/"/g, '')
      .trim();

    // Initialize the Text-to-Speech client with credentials
    const ttsClient = new TextToSpeechClient({
      projectId: process.env.GOOGLE_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
    });

    // Create a simple test request
    const request = {
      input: { text: 'Hej' },
      voice: { languageCode: 'da-DK' },
      audioConfig: { audioEncoding: 'MP3' as const },
    };

    // Try to synthesize speech
    const [response] = await ttsClient.synthesizeSpeech(request);

    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully connected to Google Cloud Text-to-Speech',
      audioContent: response.audioContent ? 'Received' : 'Not received'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error testing Google Cloud services:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}