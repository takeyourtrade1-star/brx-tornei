/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // CDN Ebartex (CloudFront) per logo e immagini UI condivise
      { protocol: 'https', hostname: '*.cloudfront.net' },
    ],
  },
};

export default nextConfig;
