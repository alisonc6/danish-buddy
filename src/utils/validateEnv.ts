export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export function validateEnv() {
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'GOOGLE_PROJECT_ID',
    'GOOGLE_CLIENT_EMAIL',
    'GOOGLE_PRIVATE_KEY'
  ];

  // Debug information
  console.log('Environment variables check:');
  requiredEnvVars.forEach(envVar => {
    console.log(`${envVar}: ${process.env[envVar] ? 'Present' : 'Missing'}`);
  });

  const missingVars = requiredEnvVars.filter(
    (envVar) => !process.env[envVar]
  );

  if (missingVars.length > 0) {
    throw new APIError(
      `Missing required environment variables: ${missingVars.join(', ')}`,
      500,
      { missingVars }
    );
  }

  // Validate Google Cloud credentials format
  if (!process.env.GOOGLE_PRIVATE_KEY?.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new APIError('Invalid Google Cloud private key format', 500, {
      privateKey: process.env.GOOGLE_PRIVATE_KEY ? 'Present but invalid format' : 'Missing'
    });
  }
} 