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
  return envSchema.parse(process.env);
}

// Helper function to validate Google Cloud credentials format
export function validateGoogleCredentials(credentials: {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}): boolean {
  try {
    // Check project ID format
    if (!/^[a-z0-9-]+$/.test(credentials.projectId)) {
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