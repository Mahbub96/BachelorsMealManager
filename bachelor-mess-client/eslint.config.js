// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      // Enforce app-wide use of showAppAlert; only AppAlertContext may use react-native Alert (via require fallback).
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-native',
              importNames: ['Alert'],
              message:
                "Use showAppAlert from '@/context/AppAlertContext' instead of Alert from 'react-native'.",
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'CallExpression[callee.object.name="Alert"][callee.property.name="alert"]',
          message:
            "Use showAppAlert from '@/context/AppAlertContext' instead of Alert.alert().",
        },
      ],
    },
  },
  {
    files: ['context/AppAlertContext.tsx'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]);
