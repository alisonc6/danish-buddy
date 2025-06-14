import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpeechService } from '@/lib/googleSpeechService';
import { validateEnv } from '@/lib/env';
import { z } from 'zod';
import OpenAI from 'openai';
import { debugLog } from '@/utils/debug';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// In-memory cache for repeated prompts
const chatCache = new Map();

// Input validation schema
const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  topic: z.string().min(1, 'Topic cannot be empty'),
  isPracticeMode: z.boolean().optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
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

    const { message, topic, isPracticeMode, conversationHistory = [] } = validationResult.data;

    // Truncate conversation history to last 5 exchanges
    const MAX_HISTORY = 5;
    const truncatedHistory = conversationHistory.slice(-MAX_HISTORY);

    // Prepare the system message based on topic
    const baseInstructions = `
      You are a friendly and engaging Danish language tutor. Your goal is to help users learn Danish through natural conversation.
      
      Key guidelines:
      1. Always respond in Danish first, followed by an English translation in parentheses
      2. Keep responses concise (2-3 sentences) and natural
      3. Always end with a question to keep the conversation flowing
      4. If the user makes a mistake, gently correct them and provide the correct form
      5. Use simple, clear language appropriate for the user's level
      6. Include cultural context when relevant
      7. Be encouraging and positive
      
      Remember to:
      - Maintain a natural conversation flow
      - Reference previous exchanges when appropriate
      - Keep the conversation engaging and fun
      - Provide context for new words or phrases
      - Use appropriate formality level (du/De) based on the context`;

    const practiceModeInstructions = isPracticeMode 
      ? 'Focus on pronunciation and common phrases. Provide phonetic guidance when introducing new words. Correct any pronunciation or grammar mistakes gently.'
      : '';

    const systemMessage = `You are a Danish language tutor. The user wants to practice Danish conversation about ${topic}. ${baseInstructions}${practiceModeInstructions}`;

    // Prepare conversation history
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemMessage },
      ...truncatedHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })) as ChatCompletionMessageParam[],
      { role: "user", content: message }
    ];

    // Caching: Use a key based on topic, message, and truncated history
    const cacheKey = JSON.stringify({ topic, message, history: truncatedHistory });
    if (chatCache.has(cacheKey)) {
      return NextResponse.json(chatCache.get(cacheKey));
    }

    // Make the API call to OpenAI with timeout (using GPT-3.5-turbo)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages,
        temperature: 0.7,
        max_tokens: 200,
        presence_penalty: 0.6,
        frequency_penalty: 0.3
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

      // Generate audio for the response
      console.log('Synthesizing Danish response as MP3');
      const audioBuffer = await speechService.synthesizeSpeech(danishResponse, 'da-DK', 'mp3');
      const audioBase64 = audioBuffer.toString('base64');
      const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

      const result = {
        danishResponse,
        englishTranslation,
        audioUrl,
      };
      // Store in cache
      chatCache.set(cacheKey, result);

      return NextResponse.json(result);
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
