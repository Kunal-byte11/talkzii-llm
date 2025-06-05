import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Add optimizations for faster routing
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  // Optimize page loading
  pageExtensions: ['tsx', 'ts'],
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  swcMinify: true,
  // Optimize file watching
  watchOptions: {
    // Files and directories to ignore for the Next.js file watcher.
    // This helps prevent unnecessary server restarts or build loops
    // caused by tools writing temporary files, logs, or cache files
    // into watched project directories.
    ignored: [
      // Common patterns
      '**/.DS_Store', // macOS specific
      '**/*.log',     // Log files
      '**/*.log.*',   // Rotated log files
      '**/logs/**',   // Log directories
      '**/temp/**',   // Temp directories
      '**/.tmp/**',   // Temp directories (dot-prefixed)
      '**/.cache/**', // Cache directories (dot-prefixed)
      
      // IDE/Editor specific (already commonly ignored by .gitignore, but can be explicit here)
      '**/.vscode/**',
      '**/.idea/**',

      // If you're running Genkit's watch mode (`genkit:watch`) or similar tools
      // that might output files into your `src` directory, you might need
      // to add more specific paths here, for example:
      // 'src/ai/.genkit_cache/**',
      // 'src/ai/generated/**'
    ],
  },
};

export default nextConfig;