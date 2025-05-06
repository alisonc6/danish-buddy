import { NextResponse } from 'next/server';
import { validateEnv, isDevelopment } from '../../../utils/env';
import { handleApiError } from '../../../utils/errors';
import { ChatResponse } from '../../../types';
import { z } from 'zod';
import OpenAI from 'openai';

// Input validation schema
const chatInputSchema = z.object({
  message: z.string().min(1).max(1000),
  topic: z.string().min(1),
});

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

    // Production mode: Use OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a Danish language tutor. The current topic is: ${topic}. 
          Respond in Danish first, then provide an English translation. 
          Keep responses concise and focused on the topic.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    // Split response into Danish and English parts
    const [danishResponse, englishTranslation] = response.split('\n').map(line => line.trim());

    return NextResponse.json({
      danishResponse,
      englishTranslation
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return handleApiError(error);
  }
}
