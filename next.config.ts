import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
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
      {
        source: '/login',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
