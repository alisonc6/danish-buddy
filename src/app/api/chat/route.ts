import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpeechService } from '@/lib/googleSpeechService';
import { validateEnv } from '@/lib/env';
import { z } from 'zod';
import OpenAI from 'openai';
import { debugLog } from '@/utils/debug';

// Input validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  topic: z.string().min(1, 'Topic cannot be empty'),
  isPracticeMode: z.boolean().optional(),
});

// Validate environment variables at startup
try {
  validateEnv();
} catch (error) {
  console.warn('Environment validation warning:', error);
}

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const env = validateEnv();
    const speechService = new GoogleSpeechService();
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

    const { message, topic, isPracticeMode } = validationResult.data;

    // Log the incoming request
    debugLog.chat('Received chat request', { message, topic });

    // Prepare the system message based on topic
    const baseInstructions = `
      You can make up things that are family friendly and fun to keep the conversation interesting and moving. Always respond with a question to keep the conversation moving. 
      You are here to help the user learn Danish and have fun doing it. You are allowed to role play based on the topic you are discussing.
      If the user makes a mistake, gently provide a correction, but keep the conversation moving after you have given the correction.
      Remember the context of the conversation and refer back to previous exchanges when appropriate. This helps create a more natural and engaging conversation flow.`;

    const responseFormat = 'Respond in Danish and provide an English translation in parentheses. Keep responses family friendly and natural.';

    const practiceModeInstructions = isPracticeMode 
      ? 'Focus on pronunciation and common phrases. Provide phonetic guidance when introducing new words.'
      : '';

    const systemMessage = topic 
      ? `You are a Danish language tutor. The user wants to practice Danish conversation about ${topic}. ${responseFormat}${baseInstructions}${practiceModeInstructions}`
      : `You are a Danish language tutor. ${responseFormat}${baseInstructions}${practiceModeInstructions}`;

    // Make the API call to OpenAI with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 150
      }, { signal: controller.signal });

      clearTimeout(timeoutId);

      // Extract and validate the response
      const response = completion.choices[0]?.message?.content;
      if (!response) {
        debugLog.error(completion, 'Empty response from OpenAI');
        return NextResponse.json(
          { error: 'No response received from AI' },
          { status: 500 }
        );
      }

      // Log the raw response for debugging
      debugLog.chat('Raw AI response', { response });

      // Extract Danish text and English translation
      const danishResponse = response.split('(')[0].trim();
      const englishTranslation = response.includes('(') 
        ? response.split('(')[1].replace(')', '').trim()
        : '';

      if (!danishResponse) {
        debugLog.error('Invalid response format', 'Response Validation');
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

      // Generate audio for the response
      const audioBuffer = await speechService.synthesizeSpeech(danishResponse);
      
      // Convert audio buffer to base64
      const audioBase64 = audioBuffer.toString('base64');
      const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

      return NextResponse.json({
        danishResponse,
        englishTranslation,
        audioUrl,
      });
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
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
