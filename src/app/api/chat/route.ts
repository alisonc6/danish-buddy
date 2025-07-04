import { NextRequest, NextResponse } from 'next/server';
import { GoogleSpeechService } from '@/lib/googleSpeechService';
import { validateEnv } from '@/lib/env';
import { z } from 'zod';
import OpenAI from 'openai';
import { debugLog } from '@/utils/debug';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const chatCache = new Map();

const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
  topic: z.string().min(1, 'Topic cannot be empty'),
  isPracticeMode: z.boolean().optional(),
  languageAssumption: z.enum(['danish', 'detect', 'english']).optional().default('danish'),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string()
  })).optional(),
});

try {
  validateEnv();
} catch (error) {
  console.warn('Environment validation warning:', error);
}

export async function POST(request: NextRequest) {
  try {
    const env = validateEnv();
    const speechService = new GoogleSpeechService();
    const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

    const body = await request.json();
    const validationResult = chatRequestSchema.safeParse(body);

    if (!validationResult.success) {
      debugLog.error(validationResult.error, 'Invalid request body');
      return NextResponse.json(
        { error: 'Invalid request: ' + validationResult.error.message },
        { status: 400 }
      );
    }

    const { message, topic, isPracticeMode, languageAssumption, conversationHistory = [] } = validationResult.data;

    const MAX_HISTORY = 5;
    const truncatedHistory = conversationHistory.slice(-MAX_HISTORY);

    const baseInstructions = `
You are a friendly, encouraging, and engaging Danish language tutor. Your job is to help learners improve their Danish through natural conversation.

**Formatting Rules (strictly enforced):**
1. Respond using multiple Danish sentences first.
2. Put ALL Danish sentences together, then add the English translation at the very end.
3. Keep sentence order and count the same for both Danish and English.
4. NEVER mix Danish and English in a single sentence. Only include English inside one final set of parentheses at the end.
5. If you are unsure whether a word is English or Danish, assume it is Danish.
6. Only treat user input as English if the full sentence is clearly in English. In that case, translate it into Danish and respond in Danish with English in parentheses.
7. Format your response exactly like this:
   "Hvordan går det? Hvad laver du i dag? (How are you? What are you doing today?)"
8. Keep the entire reply as one paragraph unless you are explicitly asked to format it differently.
9. If you ever break these formatting rules, immediately reformat your last response correctly in your next message.

**Assumptions and Error Handling:**
- Your student is learning Danish. ALWAYS assume the user is trying to speak Danish — even if the input is broken, mispronounced, or contains errors — unless it is fluent, complete English with correct grammar and spelling.
- If unsure, default to interpreting the input as Danish, correct it gently, and continue the conversation in Danish.
- The user often makes mistakes or uses Danish that sounds strange or broken. Do NOT assume this is English. Instead, interpret it as Danish with errors and respond with the corrected version.
- NEVER translate the user's input into English unless the input is fluent, grammatically correct English.
- If the user is mixing languages or you are uncertain, assume Danish and gently correct.
- Continue speaking Danish even if the user mixes languages — your role is to help them stay immersed.

**Tone and Personality:**
- Be warm, helpful, and encouraging.
- Always end your reply with a question to keep the conversation going.
- If the user makes a mistake, gently correct them and show the correct form in the same Danish+English format.
- Use simple vocabulary and grammar appropriate to their level.
- When relevant, provide cultural context or pronunciation hints inside the parentheses.
- Use the informal "du" form unless the user switches to "De".

**Important:** The Danish portion is for speech/audio. Never speak the English part aloud.
`;

    const practiceModeInstructions = isPracticeMode
      ? 'Focus on pronunciation and common phrases. Provide phonetic guidance when introducing new words. Gently correct errors as they arise.'
      : '';

    const languageAssumptionInstructions = languageAssumption === 'danish' 
      ? ' Assume the user\'s input is Danish, even if malformed or strange. Always interpret as Danish with errors rather than English.'
      : languageAssumption === 'english'
      ? ' The user is speaking English. Translate their input to Danish and respond in Danish with English translation.'
      : '';

    const systemMessage = `You are a Danish language tutor. The user wants to practice Danish conversation about ${topic}. ${baseInstructions}${practiceModeInstructions}${languageAssumptionInstructions}`;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemMessage },
      ...truncatedHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      })) as ChatCompletionMessageParam[],
      { role: "user", content: message }
    ];

    const cacheKey = JSON.stringify({ topic, message, history: truncatedHistory });
    if (chatCache.has(cacheKey)) {
      return NextResponse.json(chatCache.get(cacheKey));
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

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

      const response = completion.choices[0]?.message?.content?.trim();
      if (!response) {
        debugLog.error(completion, 'Empty response from OpenAI');
        return NextResponse.json({ error: 'No response received from AI' }, { status: 500 });
      }

      // ✅ Improved parser that captures Danish and English together
      // Remove all parentheses and collect English text
      let danishOnly = response;
      let englishTranslation = '';
      
      // Find all parentheses with English text
      const parenthesesRegex = /\(([^)]+)\)/g;
      const matches = [];
      let match;
      
      while ((match = parenthesesRegex.exec(response)) !== null) {
        matches.push(match[1]);
      }
      
      if (matches.length === 0) {
        debugLog.error(response, 'Response did not match expected format');
        return NextResponse.json({ error: 'Invalid response format from AI' }, { status: 500 });
      }
      
      // Remove all parentheses and their content from Danish text
      danishOnly = response.replace(parenthesesRegex, '').trim();
      
      // Collect all English translations
      englishTranslation = matches.join(' ');

      // ✅ Only synthesize the Danish part
      const audioBuffer = await speechService.synthesizeSpeech(danishOnly, 'da-DK', 'mp3');
      const audioBase64 = audioBuffer.toString('base64');
      const audioUrl = `data:audio/mp3;base64,${audioBase64}`;

      const result = {
        danishResponse: danishOnly,
        englishTranslation,
        audioUrl,
      };

      chatCache.set(cacheKey, result);
      return NextResponse.json(result);
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  } catch (error) {
    debugLog.error(error, 'Chat API Error');
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error: ' + error.message }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}