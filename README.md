# Danish Buddy

A language learning assistant that helps you practice Danish through conversation.

## Features

- Interactive chat interface
- Voice input and output
- Real-time transcription
- Text-to-speech for Danish responses
- Error handling and user feedback

## Prerequisites

- Node.js 18+ and npm
- Google Cloud account with:
  - Text-to-Speech API enabled
  - Speech-to-Text API enabled
  - Service account with appropriate permissions
- OpenAI API key

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your credentials:
   ```
   GOOGLE_PROJECT_ID=your-project-id
   GOOGLE_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
   GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----"
   OPENAI_API_KEY=your-openai-api-key
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

## Deployment

### Vercel Deployment

1. Push your code to a GitHub repository
2. Create a new project in Vercel
3. Connect your GitHub repository
4. Add the following environment variables in Vercel:
   - `GOOGLE_PROJECT_ID`
   - `GOOGLE_CLIENT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `OPENAI_API_KEY`
5. Deploy!

### Environment Variables

For production deployment, ensure these environment variables are set:

- `GOOGLE_PROJECT_ID`: Your Google Cloud project ID
- `GOOGLE_CLIENT_EMAIL`: Your service account email
- `GOOGLE_PRIVATE_KEY`: Your service account private key (with newlines as \n)
- `OPENAI_API_KEY`: Your OpenAI API key

### Security Notes

- Never commit your credentials file to version control
- Use environment variables for all sensitive information
- Keep your API keys secure and rotate them regularly
- Monitor your API usage to prevent unexpected charges

## License

MIT
