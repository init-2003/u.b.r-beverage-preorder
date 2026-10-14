import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: [
    '100.87.160.27:3001',
    '100.87.160.27',
    '192.168.3.101:3001',
    '192.168.3.101',
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ubonrr.com',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/preorder',
        destination: '/checkout',
        permanent: false,
      },
      {
        source: '/orders',
        destination: '/orders/history',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
