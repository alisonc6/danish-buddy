import { NextResponse } from 'next/server';
import { validateEnv } from '@/lib/env';
import OpenAI from 'openai';
import { GoogleSpeechService } from '@/lib/googleSpeechService';

export async function GET() {
  try {
    // Log environment variables
    console.log('Environment variables:', {
      TEST_VAR: process.env.TEST_VAR,
      NODE_ENV: process.env.NODE_ENV,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'exists' : 'missing',
      GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID ? 'exists' : 'missing',
      GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL ? 'exists' : 'missing',
      GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? 'exists' : 'missing',
    });

    // Test environment variables
    const env = validateEnv();
    
    // Test OpenAI credentials
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
    const openaiTest = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Say 'test successful' in Danish" }],
      max_tokens: 10
    });

    // Test Google Speech credentials
    const speechService = new GoogleSpeechService();
    const testText = "Test successful";
    const audioBuffer = await speechService.synthesizeSpeech(testText, 'en-US');
    
    return NextResponse.json({
      status: 'success',
      openai: {
        status: 'connected',
        response: openaiTest.choices[0]?.message?.content
      },
      googleSpeech: {
        status: 'connected',
        audioGenerated: audioBuffer.length > 0
      }
    });
  } catch (error) {
    console.error('Credential test failed:', error);
    return NextResponse.json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      details: error
    }, { status: 500 });
  }
} 