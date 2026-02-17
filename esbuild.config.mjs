import esbuild from 'esbuild';
import fs from 'node:fs';
import process from 'node:process';

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');
const testBuild = process.argv.includes('--test');

console.log(`[esbuild] Mode: ${production ? 'PRODUCTION' : 'DEVELOPMENT'}`);
console.log(`[esbuild] Watch: ${watch ? 'YES' : 'NO'}`);
console.log(`[esbuild] Test Build: ${testBuild ? 'YES' : 'NO'}`);

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
    name: 'esbuild-problem-matcher',

    setup(build) {
        build.onStart(() => {
            console.log('[watch] build started');
        });
        build.onEnd((result) => {
            result.errors.forEach(({ text, location }) => {
                console.error(`✘ [ERROR] ${text}`);
                console.error(`    ${location.file}:${location.line}:${location.column}:`);
            });
            console.log('[watch] build finished');
        });
    },
};

/**
 * Plugin to automatically externalize all Node.js built-in modules
 * This prevents bundling Node.js APIs that are already provided by the runtime
 *
 * @type {import('esbuild').Plugin}
 */
const externalizeNodeBuiltins = {
    name: 'externalize-node-builtins',
    setup(build) {
        // List of Node.js built-in module names
        const nodeBuiltins = new Set([
            'assert',
            'buffer',
            'child_process',
            'cluster',
            'crypto',
            'dgram',
            'dns',
            'events',
            'fs',
            'http',
            'http2',
            'https',
            'inspector',
            'module',
            'net',
            'os',
            'path',
            'perf_hooks',
            'process',
            'querystring',
            'readline',
            'repl',
            'stream',
            'string_decoder',
            'sys',
            'timers',
            'tls',
            'trace_events',
            'tty',
            'url',
            'util',
            'v8',
            'vm',
            'worker_threads',
            'zlib',
        ]);

        // Externalize both 'node:*' prefixed and non-prefixed imports
        build.onResolve({ filter: /.*/ }, (args) => {
            // Handle 'node:' prefixed imports (modern style)
            if (args.path.startsWith('node:')) {
                return { path: args.path, external: true };
            }

            // Handle non-prefixed Node.js built-ins (legacy style)
            if (nodeBuiltins.has(args.path)) {
                return { path: args.path, external: true };
            }

            // Also handle deep imports like 'fs/promises'
            const rootModule = args.path.split('/')[0];
            if (nodeBuiltins.has(rootModule)) {
                return { path: args.path, external: true };
            }

            // Let esbuild handle other modules normally
            return null;
        });
    },
};

/**
 * Plugin to enforce bundle size limits
 * Fails the build if bundle exceeds target size
 *
 * @param {number} maxSizeKB - Maximum bundle size in KB
 */
const bundleSizeLimitPlugin = (maxSizeKB) => ({
    name: 'bundle-size-limit',
    setup(build) {
        build.onEnd((result) => {
            const outputs = result.metafile?.outputs;
            if (!outputs) return;

            for (const [outputPath, meta] of Object.entries(outputs)) {
                const sizeKB = meta.bytes / 1024;
                if (sizeKB > maxSizeKB) {
                    console.error(`\n✘ [ERROR] Bundle size limit exceeded!`);
                    console.error(`   File: ${outputPath}`);
                    console.error(`   Size: ${sizeKB.toFixed(1)} KB`);
                    console.error(`   Limit: ${maxSizeKB} KB`);
                    console.error(`   Exceeded by: ${(sizeKB - maxSizeKB).toFixed(1)} KB\n`);
                    process.exit(1);
                }
            }
        });
    },
});

async function main() {
    const isTestBuild = process.argv.includes('--test');

    const ctx = await esbuild.context({
        entryPoints: ['src/extension.ts'],
        bundle: true,
        format: 'cjs',
        platform: 'node',
        outdir: 'dist',

        /**
         * External modules that should NEVER be bundled
         */
        external: [
            'vscode', // VS Code API - always provided by host
        ],

        /**
         * Code splitting for better tree-shaking and caching
         * Enables separate chunks for dependencies
         */
        splitting: false,

        /**
         * CRITICAL: Only minify and remove sourcemaps in production
         */
        minify: production,
        sourcemap: production ? false : 'inline', // No sourcemap in production!

        /**
         * Aggressive minification settings for production
         */
        ...(production && {
            minifyWhitespace: true,
            minifyIdentifiers: true,
            minifySyntax: true,
            drop: ['console', 'debugger'], // Remove console.logs and debuggers
            pure: ['console.log', 'console.debug'], // Mark as side-effect free
            mangleProps: /^_/, // Mangle private properties (starting with _)
            mangleQuoted: true, // Mangle quoted properties
            reserveProps: /^vscode/, // Don't mangle VSCode API properties
            keepNames: false, // Remove function/variable names in production
            dropLabels: ['DEV', 'TEST'], // Remove labeled statements with DEV or TEST labels
        }),

        /**
         * Tree shaking - Remove unused code
         */
        treeShaking: true,

        /**
         * Target modern Node.js for smaller output
         */
        target: 'node22',

        /**
         * Remove legal comments in production (they add size)
         */
        legalComments: production ? 'none' : 'inline',

        /**
         * Charset - use utf8 for smaller output
         */
        charset: 'utf8',

        /**
         * Aggressive dependency optimizations
         */
        mainFields: ['module', 'main'],
        conditions: ['require', 'node'],

        /**
         * Inline all imports for smaller bundle size
         * Only disable if code splitting causes issues
         */
        logLevel: 'silent',

        plugins: [
            externalizeNodeBuiltins,
            esbuildProblemMatcherPlugin,
            // Only enforce bundle size limit in production
            ...(production ? [bundleSizeLimitPlugin(500)] : []),
        ],

        /**
         * Metafile for bundle analysis (production only)
         */
        metafile: production,
    });

    if (watch) {
        await ctx.watch();
    } else {
        await ctx.rebuild();

        // Output bundle analysis in production mode
        if (production && ctx.metafile) {
            const analysis = await esbuild.analyzeMetafile(ctx.metafile, {
                verbose: true,
            });
            console.log('\n📦 Bundle Analysis:\n');
            console.log(analysis);

            // Show largest dependencies
            const outputs = Object.values(ctx.metafile.outputs)[0];
            const inputs = outputs?.inputs || {};

            console.log('\n📊 Output file size:');
            const stats = fs.statSync('dist/extension.js');
            const sizeKB = (stats.size / 1024).toFixed(1);
            console.log(`   dist/extension.js: ${sizeKB} KB`);

            // Calculate bundle size score
            const sizeScore = parseFloat(sizeKB);
            if (sizeScore < 250) {
                console.log('   🟢 Excellent: Bundle size is optimized');
            } else if (sizeScore < 300) {
                console.log('   🟡 Good: Bundle size is acceptable');
            } else if (sizeScore < 500) {
                console.log('   🟠 Fair: Consider reducing bundle size');
            } else {
                console.log('   🔴 Poor: Bundle size should be reduced');
            }
        }

        await ctx.dispose();
    }

    // Build test files if requested
    if (testBuild) {
        console.log('[esbuild] Building test files...');

        // Build test runner files
        const testCtx = await esbuild.context({
            entryPoints: ['src/test/suite/benchmark.test.ts'],
            bundle: true,
            format: 'esm',
            platform: 'node',
            outdir: 'dist/test',
            sourcemap: 'inline',
            logLevel: 'silent',
            external: ['vscode', '@vscode/test-electron', 'mocha', 'glob', 'bun:test'],
            banner: {
                js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`,
            },
        });

        await testCtx.rebuild();
        await testCtx.dispose();
        console.log('[esbuild] Test files built successfully');
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
