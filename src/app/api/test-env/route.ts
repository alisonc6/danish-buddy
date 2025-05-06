import { NextResponse } from 'next/server';

export async function GET() {
  console.log('Environment Variables Test:');
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
  console.log('GOOGLE_PROJECT_ID:', process.env.GOOGLE_PROJECT_ID ? 'Present' : 'Missing');
  console.log('GOOGLE_CLIENT_EMAIL:', process.env.GOOGLE_CLIENT_EMAIL ? 'Present' : 'Missing');
  console.log('GOOGLE_PRIVATE_KEY:', process.env.GOOGLE_PRIVATE_KEY ? 'Present' : 'Missing');

  return NextResponse.json({
    status: 'success',
    message: 'Environment variables checked',
    envVars: {
      openaiKey: process.env.OPENAI_API_KEY ? 'Present' : 'Missing',
      googleProjectId: process.env.GOOGLE_PROJECT_ID ? 'Present' : 'Missing',
      googleClientEmail: process.env.GOOGLE_CLIENT_EMAIL ? 'Present' : 'Missing',
      googlePrivateKey: process.env.GOOGLE_PRIVATE_KEY ? 'Present' : 'Missing'
    }
  });
} 