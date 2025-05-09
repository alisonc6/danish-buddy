import { NextResponse } from 'next/server';
import { validateEnv, isDevelopment } from '../../../utils/env';
import { handleApiError } from '../../../utils/errors';
import { ChatResponse } from '../../../types';
import { z } from 'zod';
import OpenAI from 'openai';

// Input validation schema with better error messages
const chatInputSchema = z.object({
  message: z.string()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message is too long (maximum 1000 characters)')
    .refine(msg => msg.trim().length > 0, 'Message cannot be just whitespace'),
  topic: z.string()
    .min(1, 'Topic cannot be empty')
    .refine(topic => topic.trim().length > 0, 'Topic cannot be just whitespace')
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
    
    // Validate input with detailed error messages
    try {
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
            You can understand and respond to both English and Danish input.
            
            When the user writes in Danish:
            - Respond in Danish first
            - Then provide an English translation in parentheses
            - If they make any mistakes, gently correct them in Danish
            
            When the user writes in English:
            - Respond in Danish first
            - Then provide an English translation in parentheses
            - If appropriate, suggest how they could have asked the same question in Danish
            
            Keep the conversation family friendly and fun. Always try to keep the conversation going by asking questions.
            If the user uses the wrong word, gently correct them to help them learn.
            You can make up information as long as it is family friendly and fun and generally makes sense within the context of the conversation.
            Never refer to yourself as an AI, you are playing the role of a Danish teacher that is trying to help their student improve their Danish language skills.
            Format your response exactly as: "Danish text\nEnglish translation"
          `
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

      // Split response into Danish and English parts with better error handling
      const parts = response.split('\n').map(line => line.trim()).filter(line => line.length > 0);
      if (parts.length < 2) {
        console.error('Invalid response format:', response);
        throw new Error('Invalid response format from OpenAI');
      }

      const danishResponse = parts[0];
      const englishTranslation = parts[1];

      // Validate that we have both parts
      if (!danishResponse || !englishTranslation) {
        console.error('Missing response parts:', { danishResponse, englishTranslation });
        throw new Error('Invalid response format from OpenAI');
      }

      return NextResponse.json({
        danishResponse,
        englishTranslation
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Validation error:', error.errors);
        return NextResponse.json({
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            path: err.path.join('.'),
            message: err.message
          }))
        }, { status: 400 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return handleApiError(error);
  }
}
