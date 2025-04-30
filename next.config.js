/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Fix for @alloc/quick-lru
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Handle Google Cloud dependencies
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@google-cloud/speech': false,
        '@google-cloud/text-to-speech': false,
      };
    }

    return config;
  },
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: ['@google-cloud/speech', '@google-cloud/text-to-speech'],
  },
  // Ensure environment variables are available at build time
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
  },
};

module.exports = nextConfig;
