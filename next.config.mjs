/** @type {import('next').NextConfig} */
const brxMatchUrl = (process.env.BRX_MATCH_API_URL || 'http://15.160.8.178:8005').replace(
  /\/+$/,
  ''
);

const nextConfig = {
  reactStrictMode: true,
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
