import { NextResponse } from 'next/server';

export class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class SpeechServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'SpeechServiceError';
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof SpeechServiceError) {
    return NextResponse.json({
      error: error.message,
      code: error.code,
      details: error.details
    }, { status: 500 });
  }
  
  if (error instanceof Error) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json({
      error: error.message || 'Internal Server Error',
      code: error.name || 'INTERNAL_ERROR',
      details: isDevelopment ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    }, { status: 500 });
  }

  return NextResponse.json({
    error: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    details: process.env.NODE_ENV === 'development' ? String(error) : undefined
  }, { status: 500 });
} 