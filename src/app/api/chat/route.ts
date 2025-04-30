import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { validateEnv } from '../../../utils/validateEnv';
import { handleApiError } from '../../../utils/errors';

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

export async function POST(req: Request) {
  try {
    const { message, topic } = await req.json();

    const systemMessage = `You are a friendly Danish acquaintance named Danish Buddy who helps users learn Danish. 
You communicate primarily in Danish, and you always include English translations in parentheses. 
Current conversation topic: ${topic}. 
You have casual, personal opinions on this topic—just like a real person would. 
If the user makes language mistakes, correct them gently in Danish without breaking the conversational flow. 
Never say that you are an AI or language model. 
Keep your responses natural, polite, and conversational, and stay politically correct.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: message }
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    
    let danish = response;
    let english = '';
    
    if (response?.includes('(') && response?.includes(')')) {
      danish = response.split('(')[0].trim();
      english = response.match(/\((.*?)\)/)?.[1] || '';
    }

    return NextResponse.json({
      message: {
        role: 'assistant',
        content: danish,
        translation: english
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}
