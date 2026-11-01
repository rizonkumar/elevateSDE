import type { NextConfig } from 'next';
import { buildSecurityHeaders } from '@elevatesde/next-security';

const adminAppUrl = process.env.ADMIN_APP_URL ?? 'http://localhost:3002';

const securityHeaders = buildSecurityHeaders({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  isDev: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
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
