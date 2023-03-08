module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  rules: {
    'prettier/prettier': 'error',
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
  },
  ignorePatterns: ['node_modules', 'lib', 'types'],
  settings: {
    react: {
      version: 'detect',
    },
  },
};
