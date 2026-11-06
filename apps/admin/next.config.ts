import type { NextConfig } from 'next';
import { buildSecurityHeaders } from '@elevatesde/next-security';

const securityHeaders = buildSecurityHeaders({
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  isDev: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  basePath: '/admin',
  poweredByHeader: false,
  headers() {
    return Promise.resolve([{ source: '/:path*', headers: securityHeaders }]);
  },
};

export default nextConfig;
