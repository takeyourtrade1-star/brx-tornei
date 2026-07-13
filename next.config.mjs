import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const brxMatchUrl = (process.env.BRX_MATCH_API_URL || 'http://15.160.8.178:8005').replace(
  /\/+$/,
  ''
);

const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: projectRoot,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.cloudfront.net' },
      { protocol: 'https', hostname: 'cards.scryfall.io', pathname: '/**' },
      { protocol: 'https', hostname: '*.scryfall.io', pathname: '/**' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/brx-match/:path*',
        destination: `${brxMatchUrl}/brx-match/:path*`,
      },
    ];
  },
};

export default nextConfig;
