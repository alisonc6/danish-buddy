import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { message, topic } = await req.json();

    const systemMessage = `You are a friendly Danish language learning assistant. 
    Communicate primarily in Danish, providing English translations in parentheses. 
    Current conversation topic: ${topic}. 
    If the user makes language mistakes, correct them gently in Danish. 
    Keep responses natural and conversational.`;

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
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: 'Error processing chat request' },
      { status: 500 }
    );
  }
}
