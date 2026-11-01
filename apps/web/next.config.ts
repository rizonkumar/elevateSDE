import type { NextConfig } from 'next';

const adminAppUrl = process.env.ADMIN_APP_URL ?? 'http://localhost:3002';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: `${adminAppUrl}/admin/:path*`,
      },
    ];
  },
};

export default nextConfig;
