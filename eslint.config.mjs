import eslint from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
    ],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript files configuration
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
      globals: {
        ...globals.node,
        ...globals.es2021,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // TypeScript rules
      ...tseslint.configs.recommended.rules,

      // Disallow unused variables (warning level)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      // Disallow explicit any (warning level)
      '@typescript-eslint/no-explicit-any': 'warn',

      // Require explicit return types on functions
      '@typescript-eslint/explicit-function-return-type': 'off',

      // Allow empty functions
      '@typescript-eslint/no-empty-function': 'off',

      // Prefer const
      'prefer-const': 'error',

      // No console in production (warning)
      'no-console': 'warn',

      // Enforce consistent brace style
      curly: ['error', 'all'],

      // Enforce strict equality
      eqeqeq: ['error', 'always'],

      // Disallow var
      'no-var': 'error',
    },
  },

  // Test files configuration
  {
    files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.tsx', '**/*.test.tsx'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },

  // Prettier config (disables conflicting rules)
  eslintConfigPrettier,
];
