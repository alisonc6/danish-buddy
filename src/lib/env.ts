import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // OpenAI
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  
  // Google Cloud
  GOOGLE_PROJECT_ID: z.string().min(1, 'Google Cloud project ID is required'),
  GOOGLE_CLIENT_EMAIL: z.string().min(1, 'Google Cloud client email is required'),
  GOOGLE_PRIVATE_KEY: z.string().min(1, 'Google Cloud private key is required'),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_DEBUG: z.string().optional(),
});

// Type for environment variables
export type Env = z.infer<typeof envSchema>;

// Validate environment variables
export function validateEnv() {
  const env = envSchema.parse(process.env);
  
  // Safe debug logging - only show if variables exist, not their values
  console.log('Environment variables status:', {
    OPENAI_API_KEY: env.OPENAI_API_KEY ? '✓ Set' : '✗ Missing',
    GOOGLE_PROJECT_ID: env.GOOGLE_PROJECT_ID ? '✓ Set' : '✗ Missing',
    GOOGLE_CLIENT_EMAIL: env.GOOGLE_CLIENT_EMAIL ? '✓ Set' : '✗ Missing',
    GOOGLE_PRIVATE_KEY: env.GOOGLE_PRIVATE_KEY ? '✓ Set' : '✗ Missing',
    NODE_ENV: env.NODE_ENV,
  });

  return env;
}

// Helper function to validate Google Cloud credentials format
export function validateGoogleCredentials(credentials: {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}): boolean {
  try {
    // Check project ID format
    if (!/^[a-z0-9-]+$/.test(credentials.projectId) && !/^\d+$/.test(credentials.projectId)) {
      throw new Error('Invalid Google Cloud project ID format');
    }

    // Check client email format
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(credentials.clientEmail)) {
      throw new Error('Invalid Google Cloud client email format');
    }

    // Check private key format
    if (!credentials.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Invalid Google Cloud private key format');
    }

    return true;
  } catch (error) {
    console.error('Google Cloud credentials validation failed:', error);
    return false;
  }
} 