import nestConfig from '@elevatesde/eslint-config/nest';
import globals from 'globals';

export default [
  ...nestConfig,
  {
    ignores: ['dist/**', 'node_modules/**', 'eslint.config.mjs'],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
