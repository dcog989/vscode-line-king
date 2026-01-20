/**
 * Bun build configuration for VS Code extension
 * Provides an alternative to esbuild with potentially faster build times
 *
 * Usage:
 *   bun bun.config.mjs
 *
 * This config is optimized for:
 *   - Fast build times
 *   - Minimal bundle size
 *   - Tree shaking
 *   - Code splitting
 */

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

export default {
    entrypoints: ['src/extension.ts'],
    target: 'node',
    format: 'esm',
    outfile: 'dist/extension.js',

    // Bundle settings
    bundle: true,
    splitting: production,
    minify: production,

    // External dependencies
    external: ['vscode'],

    // Optimization settings
    define: production ? {
        'process.env.NODE_ENV': '"production"',
    } : undefined,

    // Sourcemap - only in development
    sourcemap: !production ? 'inline' : false,

    // Tree shaking
    treeShaking: production,

    // Plugin settings
    plugins: [],
};
