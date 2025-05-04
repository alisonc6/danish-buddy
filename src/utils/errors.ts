import { NextResponse } from 'next/server';

export class APIError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: any
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
  if (error instanceof SpeechServiceError) {
    return NextResponse.json({
      error: error.message,
      code: error.code
    }, { status: 500 });
  }
  
  if (error instanceof Error) {
    return NextResponse.json({
      error: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }

  return NextResponse.json({
    error: 'Unknown Error',
    code: 'UNKNOWN_ERROR'
  }, { status: 500 });
} 