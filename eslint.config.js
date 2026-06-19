const { defineConfig, globalIgnores } = require('eslint/config');

const globals = require('globals');
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const prettier = require('eslint-plugin-prettier');
const tsParser = require('@typescript-eslint/parser');
const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

const { FlatCompat } = require('@eslint/eslintrc');

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all
});

module.exports = defineConfig([
  {
    extends: compat.extends(
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'plugin:@typescript-eslint/recommended-requiring-type-checking',
      'prettier'
    ),

    languageOptions: {
      globals: {
        ...globals.node
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        allowImportExportEverywhere: true,
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname
      }
    },

    plugins: {
      '@typescript-eslint': typescriptEslint,
      prettier
    },

    rules: {
      'consistent-return': 0,

      'no-undef': [
        'error',
        {
          typeof: true
        }
      ],

      '@typescript-eslint/restrict-template-expressions': 'off'
    }
  },
  {
    files: ['**/?(*.)+(test)?(s).[jt]s'],
    extends: compat.extends('plugin:jest/recommended', 'plugin:jest/style', 'prettier'),

    languageOptions: {
      globals: {
        ...globals.jest
      }
    },

    rules: {
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/unbound-method': 'off',
      'jest/unbound-method': 'error'
    }
  },
  {
    files: ['**/*.js'],
    extends: [tseslint.configs.disableTypeChecked]
  },
  globalIgnores(['**/dist', '**/.eslintrc.js', '**/eslint.config.js', '**/babel.config.js'])
]);
