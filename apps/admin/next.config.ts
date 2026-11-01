import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

function originOf(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_URL) || 'http://localhost:4400';
const GOOGLE_IDENTITY = 'https://accounts.google.com';
const MONACO_CDN = 'https://cdn.jsdelivr.net';

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''} ${GOOGLE_IDENTITY} ${MONACO_CDN}`,
  `style-src 'self' 'unsafe-inline' ${GOOGLE_IDENTITY} ${MONACO_CDN}`,
  "img-src 'self' blob: data: https:",
  `font-src 'self' data: ${MONACO_CDN}`,
  `connect-src 'self' ${apiOrigin} ${GOOGLE_IDENTITY}${isDev ? ' ws: http://localhost:*' : ''}`,
  `frame-src ${GOOGLE_IDENTITY}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ['upgrade-insecure-requests']),
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=(), payment=()' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  ...(isDev
    ? []
    : [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]),
];

const nextConfig: NextConfig = {
  basePath: '/admin',
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
