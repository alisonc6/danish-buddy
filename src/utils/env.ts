import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // OpenAI
  OPENAI_API_KEY: z.string().min(1),
  
  // Google Cloud
  GOOGLE_PROJECT_ID: z.string().min(1),
  GOOGLE_CLIENT_EMAIL: z.string().min(1),
  GOOGLE_PRIVATE_KEY: z.string().min(1),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_DEBUG: z.string().optional(),
});

// Type for environment variables
export type Env = z.infer<typeof envSchema>;

// Validate environment variables
export function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:', error.errors);
      throw new Error('Invalid environment variables');
    }
    throw error;
  }
}

// Get environment variables with type safety
export function getEnv(): Env {
  return validateEnv();
}

// Check if we're in development mode
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

// Check if we're in production mode
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

// Check if debug mode is enabled
export function isDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_DEBUG === 'true' && isDevelopment();
} 