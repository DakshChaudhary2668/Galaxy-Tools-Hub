const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  reactStrictMode: true,
  transpilePackages: ['@galaxy/ui', '@galaxy/types', '@galaxy/utils', '@galaxy/constants', '@galaxy/config'],
  sassOptions: {
    includePaths: [path.join(__dirname, 'src/styles'), path.join(__dirname, 'src')],
    importers: [{
      findFileUrl(url) {
        if (url.startsWith('@/')) {
          return new URL('file://' + path.resolve(__dirname, 'src', url.slice(2)));
        }
        return null;
      }
    }]
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co'
      }
    ]
  }
};

module.exports = nextConfig;
