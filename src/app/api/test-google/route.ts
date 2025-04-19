/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {},
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      "fs": false,
      "net": false,
      "tls": false,
      "child_process": false,
    };
    return config;
  },
}

module.exports = nextConfig

import { SecretManagerServiceClient, ClientOptions } from '@google-cloud/secret-manager';

export async function GET() {
  try {
    const clientConfig: ClientOptions = {
      projectId: process.env.NEXT_PUBLIC_GOOGLE_PROJECT_ID
    };

    const client = new SecretManagerServiceClient(clientConfig);
    const secretName = `projects/danish-buddy-tts/secrets/danish-buddy-private-key/versions/latest`;
    
    // Try to access the secret
    const [version] = await client.accessSecretVersion({ name: secretName });
    const payload = version.payload?.data?.toString() || '';
    
    // Parse the secret to verify it's valid JSON but don't send the actual content
    JSON.parse(payload);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Successfully accessed Google Cloud Secret'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error accessing secret:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}