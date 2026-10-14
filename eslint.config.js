// @ts-check
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

module.exports = tseslint.config(
  {
    ignores: ['dist/**', 'coverage/**', '.angular/**', 'out-tsc/**'],
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...tseslint.configs.stylistic,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: ['app', 'lib', 'noah'],
          style: 'camelCase',
        },
      ],
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          prefix: ['app', 'lib', 'noah'],
          style: 'kebab-case',
        },
      ],

      // This app is intentionally still NgModule-based, so `standalone: false` is
      // the deliberate choice on every decorator rather than something to migrate.
      '@angular-eslint/prefer-standalone': 'off',
      // Dependency injection is consistently constructor-based across the codebase.
      '@angular-eslint/prefer-inject': 'off',

      // Stylistic-only rules that would force a sweeping refactor of existing code.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-inferrable-types': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/prefer-for-of': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/consistent-generic-constructors': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',

      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // The codebase uses structural directives (*ngIf / *ngFor) consistently;
      // migrating to the @if/@for control-flow blocks is a separate change.
      '@angular-eslint/template/prefer-control-flow': 'off',

      // The project previously linted with TSLint, which has no template or
      // accessibility rules, so these were never enforced. The counts below are
      // the current known backlog from `ng lint` and are intentionally left for
      // a dedicated accessibility pass rather than folded into this upgrade:
      //   interactive-supports-focus        77
      //   click-events-have-key-events      62
      //   alt-text                         59
      //   eqeqeq                           45
      //   label-has-associated-control       9
      //   no-negated-async                  7
      //   elements-content                  1
      '@angular-eslint/template/interactive-supports-focus': 'off',
      '@angular-eslint/template/click-events-have-key-events': 'off',
      '@angular-eslint/template/alt-text': 'off',
      '@angular-eslint/template/eqeqeq': 'off',
      '@angular-eslint/template/label-has-associated-control': 'off',
      '@angular-eslint/template/no-negated-async': 'off',
      '@angular-eslint/template/elements-content': 'off',
    },
  }
);
