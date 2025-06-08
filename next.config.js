/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@google-cloud/speech': false,
        '@google-cloud/text-to-speech': false,
      };
    }

    return config;
  },
  experimental: {
    optimizeCss: true,
    serverComponentsExternalPackages: ['@google-cloud/speech', '@google-cloud/text-to-speech'],
  },
  compiler: {
    styledComponents: true,
  },
  // Required environment variables for Vercel
  env: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    GOOGLE_PROJECT_ID: process.env.GOOGLE_PROJECT_ID,
    GOOGLE_CLIENT_EMAIL: process.env.GOOGLE_CLIENT_EMAIL,
    GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY,
  },
};

module.exports = nextConfig;
