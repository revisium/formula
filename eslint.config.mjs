// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import sonarjs from 'eslint-plugin-sonarjs';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'coverage/**', 'jest.config.js', 'tsup.config.ts', 'scripts/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  sonarjs.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'sonarjs/regex-complexity': ['error', { threshold: 25 }],
      'sonarjs/slow-regex': 'off',
    },
  },
  {
    files: ['**/__tests__/**/*.ts', '**/*.spec.ts'],
    rules: {
      'sonarjs/no-hardcoded-passwords': 'off',
      'sonarjs/no-clear-text-protocols': 'off',
      'sonarjs/no-nested-functions': 'off',
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  {
    // Ohm.js semantics use dynamic typing - these rules must be disabled
    files: ['**/ohm/semantics/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-base-to-string': 'off',
    },
  },
  {
    // Ohm.js parser uses dynamic calls
    files: ['**/ohm/core/parser.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
    },
  },
);
