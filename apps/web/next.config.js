/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@galaxy/ui', '@galaxy/types', '@galaxy/utils', '@galaxy/constants', '@galaxy/config'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co'
      }
    ]
  }
};

module.exports = nextConfig;
