import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { validateEnv, isDevelopment } from '../../../utils/env';
import { handleApiError } from '../../../utils/errors';
import { Message, ChatResponse } from '../../../types';
import { z } from 'zod';

// Input validation schema
const chatInputSchema = z.object({
  message: z.string().min(1).max(1000),
  topic: z.string().min(1),
});

// Debug environment variables
console.log('Chat route environment check:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
console.log('GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID ? 'Present' : 'Missing');
console.log('GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? 'Present' : 'Missing');
console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'Present' : 'Missing');

// Validate environment variables at startup
try {
  validateEnv();
} catch (error) {
  console.error('Environment validation failed:', error);
  throw error;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    // Validate environment variables
    validateEnv();

    const body = await request.json();
    
    // Validate input
    const validatedInput = chatInputSchema.parse(body);
    const { message, topic } = validatedInput;

    if (isDevelopment()) {
      // Development mode: Return mock response
      const response: ChatResponse = {
        danishResponse: `Hej! Dette er en testbesked om ${topic}.`,
        englishTranslation: `Hi! This is a test message about ${topic}.`
      };
      return NextResponse.json(response);
    }

    // Production mode: Implement actual chat logic with OpenAI
    // TODO: Add OpenAI integration
    const response: ChatResponse = {
      danishResponse: `Hej! Dette er en testbesked om ${topic}.`,
      englishTranslation: `Hi! This is a test message about ${topic}.`
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorResponse: ChatResponse = {
        danishResponse: '',
        englishTranslation: '',
        error: 'Invalid input data',
        details: error.errors
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }
    
    console.error('Error in chat API:', error);
    const errorResponse: ChatResponse = {
      danishResponse: '',
      englishTranslation: '',
      error: 'Internal server error'
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
