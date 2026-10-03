import js from '@eslint/js';
import ts from 'typescript-eslint';
export default ts.config(
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['public/*.js'],
    languageOptions: { globals: { localStorage: 'readonly', document: 'readonly' } },
  },
  {
    files: ['**/*.{ts,tsx}'],
    rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] },
  },
);
