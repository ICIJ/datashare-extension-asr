import globals from 'globals'
import icijeslint from '@icij/eslint-config'

export default [
  {
    ignores: [
      'dist',
      'coverage',
      '**/*.md',
      '**/*.json',
      '**/*.yml',
      '**/*.yaml',
      '**/*.html',
      '**/*.scss',
      '**/*.css',
      '**/*.svg',
      '**/*.png',
    ]
  },

  ...icijeslint.configs.all,

  {
    files: ['*.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      }
    }
  },

  {
    files: [
      '*.js',
      'components/**/*.{js,vue}',
      'composables/**/*.js',
      'stores/**/*.js',
      'tests/**/*.js',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
      }
    }
  },
]
