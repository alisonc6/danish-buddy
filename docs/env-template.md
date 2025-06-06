# Environment Variables Template

This is a template for the required environment variables. Copy this to `.env.local` and fill in your values.

```env
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Google Cloud Configuration
GOOGLE_PROJECT_ID=your_google_cloud_project_id
GOOGLE_CLIENT_EMAIL=your_google_cloud_client_email
GOOGLE_PRIVATE_KEY=your_google_cloud_private_key

# Environment
NODE_ENV=development
NEXT_PUBLIC_DEBUG_MODE=false

# Optional: Add any additional environment variables below
```

## Important Notes

1. **NEVER commit this file with actual values**
2. **NEVER commit `.env` files to the repository**
3. Keep your API keys secure and rotate them if they are exposed
4. Use different keys for development and production environments

## Getting API Keys

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Navigate to API Keys
3. Create a new secret key
4. Copy the key and paste it as your `OPENAI_API_KEY`

### Google Cloud Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the Speech-to-Text and Text-to-Speech APIs
4. Create a service account
5. Generate a new private key
6. Use the project ID, client email, and private key in your environment variables

## Security Best Practices

1. Keep your `.env` files secure and never share them
2. Rotate your API keys regularly
3. Use environment-specific keys
4. Monitor your API usage for any suspicious activity
5. Set up proper error handling for API failures
6. Implement rate limiting to prevent abuse 