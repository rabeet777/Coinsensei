/** @type {import('next').NextConfig} */
const nextConfig = {
  // Suppress specific Next.js 15+ cookies warnings for Supabase auth helpers
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // External packages configuration moved from experimental
  serverExternalPackages: ['@supabase/auth-helpers-nextjs'],
  experimental: {
    // Other experimental features can go here
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'gmjqbhjsdmmpolocpgbs.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle Node.js modules that don't work in browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        encoding: false,
        stream: false,
        buffer: false,
        util: false,
        assert: false,
        http: false,
        https: false,
        os: false,
        url: false,
        zlib: false,
        path: false,
        crypto: false,
        'node-fetch': false,
        canvas: false,
        '@tensorflow/tfjs-node': false,
        '@tensorflow/tfjs-node-gpu': false,
      }
    }
    
    // Suppress Supabase + Next.js 15+ cookies warnings globally
    const originalConsoleError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      // Filter out specific cookies warnings with multiple patterns
      if (
        (message.includes('cookies().get') && message.includes('should be awaited')) ||
        (message.includes('Route "') && message.includes('used `cookies()')) ||
        message.includes('sb-gmjqbhjsdmmpolocpgbs-auth-token') ||
        message.includes('sync-dynamic-apis')
      ) {
        return; // Suppress these warnings
      }
      originalConsoleError.apply(console, args);
    };
    
    return config
  },
}

export default nextConfig 