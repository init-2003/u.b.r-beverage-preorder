import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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
