import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** @type {import('next').NextConfig} */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

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
};

export default nextConfig;
