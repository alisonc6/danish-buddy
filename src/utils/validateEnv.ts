import { z } from 'zod';
import { debugLog } from './debug';

// Environment variable schemas
const requiredEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required'),
  GOOGLE_PROJECT_ID: z.string().min(1, 'Google Cloud project ID is required'),
  GOOGLE_CLIENT_EMAIL: z.string().min(1, 'Google Cloud client email is required'),
  GOOGLE_PRIVATE_KEY: z.string().min(1, 'Google Cloud private key is required')
});

const optionalEnvSchema = z.object({
  NEXT_PUBLIC_DEBUG_MODE: z.enum(['true', 'false']).optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional()
});

export function validateEnv() {
  try {
    // Validate required environment variables
    const requiredEnv = requiredEnvSchema.parse({
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
      GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
      GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY
    });

    // Validate optional environment variables
    const optionalEnv = optionalEnvSchema.parse({
      NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE,
      NODE_ENV: process.env.NODE_ENV
    });

    // Log successful validation
    debugLog.transcription('Environment variables validated successfully', {
      hasOpenAIKey: !!requiredEnv.OPENAI_API_KEY,
      hasGoogleCredentials: !!(
        requiredEnv.GOOGLE_PROJECT_ID &&
        requiredEnv.GOOGLE_CLIENT_EMAIL &&
        requiredEnv.GOOGLE_PRIVATE_KEY
      ),
      debugMode: optionalEnv.NEXT_PUBLIC_DEBUG_MODE === 'true',
      nodeEnv: optionalEnv.NODE_ENV
    });

    return {
      ...requiredEnv,
      ...optionalEnv
    };
  } catch (error) {
    // Log validation error
    debugLog.error(error, 'Environment validation failed');

    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => err.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }

    throw error;
  }
}

// Helper function to check if a specific environment variable is set
export function hasEnvVar(name: string): boolean {
  return !!process.env[name];
}

// Helper function to get an environment variable with a default value
export function getEnvVar(name: string, defaultValue: string): string {
  return process.env[name] || defaultValue;
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

    // Check private key format (should start with "-----BEGIN PRIVATE KEY-----")
    if (!credentials.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Invalid Google Cloud private key format');
    }

    return true;
  } catch (error) {
    debugLog.error(error, 'Google Cloud credentials validation failed');
    return false;
  }
} 