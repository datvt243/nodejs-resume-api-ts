// ESLint 9 flat config. Replaces the legacy `.eslintrc.cjs` (a Babel-parser
// "sample" config that predates this project's move to TypeScript and had
// no type-aware rules at all).
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['dist/**', 'node_modules/**', 'src/public/**', 'coverage/**', 'agent-hub/**']),
  {
    // Only `src/**/*.ts` is covered by tsconfig.json's own `include` — type-
    // aware linting needs every linted file to belong to a TS program, so
    // root-level config files (this one included) and non-TS assets are
    // left unlinted here rather than fighting the project-service resolver
    // over files tsc itself never compiles.
    files: ['src/**/*.ts'],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      // Express handler types don't care about a return value; an async
      // handler returns Promise<void>, which this rule otherwise flags as
      // misuse whether passed as an argument (every route file) or returned
      // from a factory (rateLimit.middleware.ts). Other checksVoidReturn
      // categories stay at their default (no current hits to silence).
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { arguments: false, returns: false } }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Locked decision (tracking issue #177): tests rely heavily on Jest
    // mock casts (`(Model.method as jest.Mock)`, `jest.mock(...)` factory
    // shapes) that don't carry real static types — holding them to the
    // same any/unsafe-* bar as production code would just force noisy
    // casts back in through a different door. Every other rule (unused
    // vars, floating promises, etc.) still applies to tests.
    files: ['src/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
);
