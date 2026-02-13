import { runTests } from '@vscode/test-electron';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionDevelopmentPath = path.resolve(__dirname, '../../');
const userDataDir = path.join(tmpdir(), `vscode-benchmark-${Date.now()}`);

// Capture startup metrics
let metrics: Record<string, number> | null = null;

// eslint-disable-next-line no-console
const originalLog = console.log;
// eslint-disable-next-line no-console
console.log = (...args: unknown[]) => {
    const message = args.map((a) => String(a)).join(' ');

    // Check for startup metrics
    const match = message.match(/STARTUP_METRICS:\s*({.*})/);
    if (match && !metrics) {
        try {
            metrics = JSON.parse(match[1]);
            // eslint-disable-next-line no-console
            console.log('✅ Startup metrics captured');
        } catch {
            // Ignore parse errors
        }
    }

    originalLog(...args);
};

// Run minimal test - we don't actually need a test file
// Just activate the extension and capture metrics
try {
    await runTests({
        extensionDevelopmentPath,
        extensionTestsPath: path.resolve(__dirname, '../../dist/test/suite/placeholder.js'),
        version: '1.109.1',
        launchArgs: [
            `--user-data-dir=${userDataDir}`,
            '--disable-gpu',
            '--disable-updates',
            '--skip-welcome',
            '--skip-release-notes',
            '--disable-workspace-trust',
        ],
        extensionTestsEnv: {
            VSCODE_TEST_MODE: '1',
            VSCODE_BENCHMARK_MODE: '1',
        },
    });
} catch {
    // Expected to fail since we don't have a real test file
    // But we already captured the metrics
    // eslint-disable-next-line no-console
    console.log('Benchmark run completed (expected test failure, metrics already captured)');
}

// Restore console
// eslint-disable-next-line no-console
console.log = originalLog;

// Final output - write to file for parsing
if (metrics) {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const metricsPath = path.join(extensionDevelopmentPath, '.benchmark-metrics.json');
    try {
        fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2));
        // eslint-disable-next-line no-console
        console.log('Metrics saved to:', metricsPath);
        // eslint-disable-next-line no-console
        console.log('\n=== STARTUP METRICS ===');
        // eslint-disable-next-line no-console
        console.log(JSON.stringify(metrics, null, 2));
    } catch {
        // eslint-disable-next-line no-console
        console.error('Failed to save metrics');
    }
} else {
    // eslint-disable-next-line no-console
    console.error('❌ Failed to capture startup metrics');
    process.exit(1);
}
