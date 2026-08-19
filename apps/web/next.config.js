const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, '../../'),
  reactStrictMode: true,
  transpilePackages: ['@galaxy/ui', '@galaxy/types', '@galaxy/utils', '@galaxy/constants', '@galaxy/config'],
  sassOptions: {
    includePaths: [path.join(__dirname, 'src/styles')],
    prependData: `@import "variables"; @import "mixins"; @import "breakpoints";`,
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
