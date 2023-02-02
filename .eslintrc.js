module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'prettier'
  ],
  env: { node: true, es2022: true },
  plugins: ['@typescript-eslint', 'prettier'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    allowImportExportEverywhere: true,
    project: ['./tsconfig.json'],
    tsconfigRootDir: __dirname
  },
  rules: {
    'consistent-return': 0,
    'no-undef': ['error', { typeof: true }],
    '@typescript-eslint/restrict-template-expressions': 'off'
  },
  overrides: [
    {
      files: ['**/?(*.)+(test)?(s).[jt]s'],
      extends: ['plugin:jest/recommended', 'plugin:jest/style', 'prettier'],
      env: {
        jest: true
      },
      rules: {
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/unbound-method': 'off',
        'jest/unbound-method': 'error'
      }
    }
  ]
};
