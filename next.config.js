/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // Enable optimizations for performance
  swcMinify: true,
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  // Enable compression
  compress: true,
  // Optimize bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Enable tree shaking
      config.optimization.usedExports = true;
    }
    return config;
  },
}

module.exports = nextConfig