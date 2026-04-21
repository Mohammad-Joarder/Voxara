const { FlatCompat } = require('@eslint/eslintrc')
const compat = new FlatCompat({
  baseDirectory: __dirname
})

module.exports = [
  ...compat.extends('next/core-web-vitals'),
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-unused-vars': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  {
    ignores: ['.next/**', 'node_modules/**', 'dist/**', 'coverage/**']
  }
]
