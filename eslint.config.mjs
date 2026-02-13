import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import typescriptEslint from 'typescript-eslint';

export default [
    // Ignore patterns
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'out/**',
            'coverage/**',
            '.vscode-test/**',
            'scripts/**',
            'esbuild.config.mjs',
        ],
    },
    // Base config for JavaScript
    js.configs.recommended,
    // TypeScript config
    ...typescriptEslint.configs.recommended,
    // Prettier integration
    prettierConfig,
    // Custom rules
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.vscode,
            },
            ecmaVersion: 2024,
            sourceType: 'module',
        },
        rules: {
            // TypeScript specific rules
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                },
            ],

            // Performance rules
            'no-console': 'error',
            'no-debugger': 'error',

            // Code quality rules
            'no-var': 'error',
            'prefer-const': 'error',
            'prefer-arrow-callback': 'warn',
            'prefer-template': 'warn',

            // Security rules
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-new-func': 'error',
        },
    },
];
