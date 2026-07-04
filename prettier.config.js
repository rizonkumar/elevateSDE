module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  plugins: ['prettier-plugin-tailwindcss'],
  overrides: [
    {
      files: ['apps/web/**'],
      options: { tailwindStylesheet: './apps/web/src/app/globals.css' },
    },
    {
      files: ['apps/admin/**'],
      options: { tailwindStylesheet: './apps/admin/src/app/globals.css' },
    },
    {
      files: ['packages/ui/**'],
      options: { tailwindStylesheet: './apps/web/src/app/globals.css' },
    },
  ],
};
