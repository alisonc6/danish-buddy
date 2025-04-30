declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GOOGLE_PROJECT_ID: string;
      GOOGLE_CLIENT_EMAIL: string;
      GOOGLE_PRIVATE_KEY: string;
      OPENAI_API_KEY: string;
    }
  }
}

export {}; 