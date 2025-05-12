import { NextResponse } from 'next/server';
import { validateEnv } from '../../../utils/env';
import { z } from 'zod';
import OpenAI from 'openai';
import { debugLog } from '@/utils/debug';

// Input validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  topic: z.string().optional()
});

// Debug environment variables
console.log('Chat route environment check:');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
console.log('GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID ? 'Present' : 'Missing');
console.log('GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? 'Present' : 'Missing');
console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'Present' : 'Missing');

// Validate environment variables at startup (flexible validation)
try {
  validateEnv();
} catch (error) {
  console.warn('Environment validation warning:', error);
}

export async function POST(request: Request) {
  try {
    // Validate environment variables
    const env = validateEnv();
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    // Parse and validate request body
    const body = await request.json();
    const validationResult = chatRequestSchema.safeParse(body);
    
    if (!validationResult.success) {
      debugLog.error(validationResult.error, 'Invalid request body');
      return NextResponse.json(
        { error: 'Invalid request: ' + validationResult.error.message },
        { status: 400 }
      );
    }

    const { message, topic } = validationResult.data;

    // Log the incoming request
    debugLog.chat('Received chat request', { message, topic });

    // Prepare the system message based on topic
    const systemMessage = topic 
      ? `You are a Danish language tutor. The user wants to practice Danish conversation about ${topic}. Respond in Danish and provide an English translation. Keep responses concise and natural.`
      : 'You are a Danish language tutor. Respond in Danish and provide an English translation. Keep responses concise and natural.';

    // Make the API call to OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    // Extract and validate the response
    const response = completion.choices[0]?.message?.content;
    if (!response) {
      debugLog.error(completion, 'Empty response from OpenAI');
      return NextResponse.json(
        { error: 'No response received from AI' },
        { status: 500 }
      );
    }

    // Split the response into Danish and English parts
    const [danishResponse, englishTranslation] = response.split('\n').map(line => line.trim());
    
    if (!danishResponse || !englishTranslation) {
      debugLog.error('Invalid response format', response);
      return NextResponse.json(
        { error: 'Invalid response format from AI' },
        { status: 500 }
      );
    }

    // Log the successful response
    debugLog.chat('Sending chat response', { 
      danishResponse, 
      englishTranslation 
    });

    return NextResponse.json({
      danishResponse,
      englishTranslation
    });

  } catch (error) {
    // Log the error with detailed information
    debugLog.error(error, 'Chat API Error');
    
    // Return appropriate error response
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error: ' + error.message },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
