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
};

module.exports = nextConfig;
