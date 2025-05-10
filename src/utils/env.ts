import { z } from 'zod';

// Environment variable schema
const envSchema = z.object({
  // OpenAI
  OPENAI_API_KEY: z.string().min(1).optional(),
  
  // Google Cloud
  GOOGLE_PROJECT_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_EMAIL: z.string().min(1).optional(),
  GOOGLE_PRIVATE_KEY: z.string().min(1).optional(),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_DEBUG: z.string().optional(),
});

// Runtime environment schema (stricter, used when actually making API calls)
const runtimeEnvSchema = z.object({
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
export type Env = z.infer<typeof runtimeEnvSchema>;

// Validate environment variables - flexible version for build time
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

// Validate environment variables - strict version for runtime
export function validateRuntimeEnv() {
  try {
    return runtimeEnvSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid runtime environment variables:', error.errors);
      throw new Error('Missing required environment variables for this operation');
    }
    throw error;
  }
}

// Get environment variables with type safety
export function getEnv(): Partial<Env> {
  return validateEnv();
}

// Get runtime environment variables with type safety
export function getRuntimeEnv(): Env {
  return validateRuntimeEnv();
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