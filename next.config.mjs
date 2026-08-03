import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateProductionEnvironment } from './lib/build-environment.mjs';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const productionEnvironment = validateProductionEnvironment(process.env);
if (productionEnvironment) {
  // All NEXT_PUBLIC values are captured at build time: only canonical origins
  // validated against the exact hostname allowlist may reach the bundle.
  Object.assign(process.env, productionEnvironment.origins);
}

const securityHeaders = [
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), payment=(), usb=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: projectRoot,
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'di0y87a9s8da9.cloudfront.net',
        pathname: '/**',
      },
      { protocol: 'https', hostname: 'cards.scryfall.io', pathname: '/**' },
    ],
  },
};

export default nextConfig;
