import nextConfig from '@elevatesde/eslint-config/next';

export default [
  ...nextConfig,
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'next-env.d.ts'],
  },
];
