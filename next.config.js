/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        protocol: 'https',
        hostname: 'pbs.twimg.com',
      },
    ],
  },
  // Performance optimizations for faster dev compilation
  experimental: {
    // Use SWC for faster compilation
    swcMinify: true,
    // Optimize package imports
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons', 'framer-motion'],
  },
  // Speed up dev mode
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      // Faster rebuilds in development
      config.watchOptions = {
        poll: 1000, // Check for changes every second
        aggregateTimeout: 300, // Delay rebuild after change
      }
    }
    return config
  },
  // Enable faster server components
  serverComponentsExternalPackages: ['@google/generative-ai', 'twitter-api-v2'],
}

module.exports = nextConfig
